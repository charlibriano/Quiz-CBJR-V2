/* =========================================================
   CBJR FIREBASE PROGRESS CORE V1
   Núcleo único para progresso por conta Google.
   Fase 1: cria uma camada central segura sem alterar as telas.
   Fonte principal: Firestore
   Cache local: localStorage
   Projeto: ranking-cbjr
   ========================================================= */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCT1btbLIMehCj3xldw5LOB-snjyF4SKhw',
  authDomain: 'ranking-cbjr.firebaseapp.com',
  databaseURL: 'https://ranking-cbjr-default-rtdb.firebaseio.com',
  projectId: 'ranking-cbjr',
  storageBucket: 'ranking-cbjr.firebasestorage.app',
  messagingSenderId: '681180179118',
  appId: '1:681180179118:web:fe10833848e8bb8194db3f',
  measurementId: 'G-QK5QE2Y1CC'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const VERSION = 'cbjr-firebase-progress-core-v1.1-firestore-oficial';
const PAGE_NAME = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

const STORAGE_KEYS = {
  radioUnlocked: 'radioCBJRUnlockedAlbumIndex_v2',
  radioMode: 'radioCBJRMode',
  radioAchievements: 'radioCBJR_achievements_v1',
  letrasCompleted: 'cbjr_letters_completed',
  letrasPlayerName: 'lettersCBJR_playerName',
  quizAchievements: 'cobjr_quiz_achievements',
  cbjrXp: 'cbjr_xp_total',
  cbjrTitle: 'cbjr_public_title',
  cbjrMedals: 'cbjr_medals_v1',
  cbjrAutoAchievements: 'cbjr_auto_achievements_v1',
  cbjrLastActivity: 'cbjr_last_activity_v1',
  cbjrHistory: 'cbjr_history_v1'
};

const SYNC_KEYS = Object.values(STORAGE_KEYS);


const AUTO_ACHIEVEMENTS = [
  { id: 'first_login', title: 'Primeiro login', icon: '🔐', xp: 50, unlocked: (ctx) => !!ctx.userLogged },
  { id: 'radio_first_cd', title: 'Primeiro CD liberado', icon: '📻', xp: 120, unlocked: (ctx) => ctx.radioLiberados >= 2 },
  { id: 'radio_three_cds', title: '3 CDs na Rádio', icon: '💿', xp: 180, unlocked: (ctx) => ctx.radioLiberados >= 3 },
  { id: 'radio_half', title: 'Metade da Rádio', icon: '🎧', xp: 300, unlocked: (ctx) => ctx.radioLiberados >= 7 },
  { id: 'radio_hard', title: 'Modo Hard ativado', icon: '🔥', xp: 150, unlocked: (ctx) => ctx.radioMode === 'hard' },
  { id: 'letras_first_album', title: 'Primeiro álbum Letras', icon: '✍️', xp: 120, unlocked: (ctx) => ctx.letrasCount >= 1 },
  { id: 'letras_three_albums', title: '3 álbuns Letras', icon: '📖', xp: 220, unlocked: (ctx) => ctx.letrasCount >= 3 },
  { id: 'letras_half', title: 'Metade das Letras', icon: '🎼', xp: 320, unlocked: (ctx) => ctx.letrasCount >= 7 },
  { id: 'quiz_primeira_medalha', title: 'Medalha no Quiz', icon: '🏅', xp: 120, unlocked: (ctx) => ctx.quizAch > 0 },
  { id: 'familia_013', title: 'Família 013', icon: '013', xp: 500, unlocked: (ctx) => ctx.radioLiberados >= 13 && ctx.letrasCount >= 13 }
];

let currentUser = null;
let ready = false;
let syncing = false;
let saveTimer = null;
let lastSnapshot = {};

function safeParse(value, fallback) {
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function uniqueArray(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function readLocal() {
  const data = {};
  for (const key of SYNC_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return data;
}

function writeLocal(data = {}) {
  syncing = true;
  try {
    for (const [key, value] of Object.entries(data)) {
      if (SYNC_KEYS.includes(key) && value !== undefined && value !== null) {
        localStorage.setItem(key, String(value));
      }
    }
  } finally {
    syncing = false;
  }
}

function mergeObjectString(localValue, remoteValue) {
  const localObj = safeParse(localValue || '{}', {});
  const remoteObj = safeParse(remoteValue || '{}', {});
  return JSON.stringify({ ...remoteObj, ...localObj });
}

function mergeArrayString(localValue, remoteValue) {
  const localArr = safeParse(localValue || '[]', []);
  const remoteArr = safeParse(remoteValue || '[]', []);
  return JSON.stringify(uniqueArray([...(Array.isArray(remoteArr) ? remoteArr : []), ...(Array.isArray(localArr) ? localArr : [])]));
}

function mergeHistoryString(localValue, remoteValue) {
  const localArr = safeParse(localValue || '[]', []);
  const remoteArr = safeParse(remoteValue || '[]', []);
  const merged = [...(Array.isArray(remoteArr) ? remoteArr : []), ...(Array.isArray(localArr) ? localArr : [])]
    .filter(Boolean)
    .sort((a, b) => Number(b.at || b.timestamp || 0) - Number(a.at || a.timestamp || 0));
  const seen = new Set();
  return JSON.stringify(merged.filter(item => {
    const id = `${item.type || ''}-${item.id || item.name || ''}-${item.at || item.timestamp || ''}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, 80));
}

function mergeProgress(localData = {}, remoteData = {}, user = null) {
  const merged = { ...remoteData, ...localData };

  const localRadio = Number(localData[STORAGE_KEYS.radioUnlocked] ?? 0);
  const remoteRadio = Number(remoteData[STORAGE_KEYS.radioUnlocked] ?? 0);
  merged[STORAGE_KEYS.radioUnlocked] = String(Math.max(
    Number.isFinite(localRadio) ? localRadio : 0,
    Number.isFinite(remoteRadio) ? remoteRadio : 0
  ));

  merged[STORAGE_KEYS.radioAchievements] = mergeObjectString(localData[STORAGE_KEYS.radioAchievements], remoteData[STORAGE_KEYS.radioAchievements]);
  merged[STORAGE_KEYS.quizAchievements] = mergeObjectString(localData[STORAGE_KEYS.quizAchievements], remoteData[STORAGE_KEYS.quizAchievements]);
  merged[STORAGE_KEYS.cbjrAutoAchievements] = mergeObjectString(localData[STORAGE_KEYS.cbjrAutoAchievements], remoteData[STORAGE_KEYS.cbjrAutoAchievements]);
  merged[STORAGE_KEYS.letrasCompleted] = mergeArrayString(localData[STORAGE_KEYS.letrasCompleted], remoteData[STORAGE_KEYS.letrasCompleted]);
  merged[STORAGE_KEYS.cbjrMedals] = mergeArrayString(localData[STORAGE_KEYS.cbjrMedals], remoteData[STORAGE_KEYS.cbjrMedals]);
  merged[STORAGE_KEYS.cbjrHistory] = mergeHistoryString(localData[STORAGE_KEYS.cbjrHistory], remoteData[STORAGE_KEYS.cbjrHistory]);

  if (!merged[STORAGE_KEYS.radioMode]) merged[STORAGE_KEYS.radioMode] = 'normal';
  if (!merged[STORAGE_KEYS.letrasPlayerName] && user?.displayName) merged[STORAGE_KEYS.letrasPlayerName] = user.displayName.split(' ')[0] || user.displayName;

  const stats = calculateStats(merged);
  const localXp = Number(localData[STORAGE_KEYS.cbjrXp] || 0);
  const remoteXp = Number(remoteData[STORAGE_KEYS.cbjrXp] || 0);
  merged[STORAGE_KEYS.cbjrXp] = String(Math.max(
    Number.isFinite(localXp) ? localXp : 0,
    Number.isFinite(remoteXp) ? remoteXp : 0,
    Number(stats.xp || 0)
  ));
  merged[STORAGE_KEYS.cbjrTitle] = getTitleByXp(Number(merged[STORAGE_KEYS.cbjrXp] || 0));

  return merged;
}

function getTitleByXp(xp = 0) {
  const value = Number(xp) || 0;
  if (value >= 7000) return '👑 Lenda CBJR';
  if (value >= 5000) return '👑 Família 013';
  if (value >= 3500) return '🔥 Maníaco CBJR';
  if (value >= 2000) return '📀 Colecionador CBJR';
  if (value >= 1000) return '🎸 Charlibriano';
  if (value >= 500) return '🛹 Skatista Urbano';
  return '🎧 Fã Iniciante';
}

function getAutoAchievementsFromData(data = {}, userLogged = false) {
  const radioIndex = Number(data[STORAGE_KEYS.radioUnlocked] || 0) || 0;
  const radioLiberados = Math.min(13, Math.max(0, radioIndex) + 1);
  const radioMode = String(data[STORAGE_KEYS.radioMode] || 'normal').toLowerCase();
  const letras = safeParse(data[STORAGE_KEYS.letrasCompleted] || '[]', []);
  const letrasCount = Array.isArray(letras) ? letras.length : 0;
  const radioAchievements = safeParse(data[STORAGE_KEYS.radioAchievements] || '{}', {});
  const quizAchievements = safeParse(data[STORAGE_KEYS.quizAchievements] || '{}', {});
  const radioAch = Object.keys(radioAchievements || {}).filter(k => radioAchievements[k]).length;
  const quizAch = Object.keys(quizAchievements || {}).filter(k => quizAchievements[k]).length;
  const baseConquistas = radioAch + quizAch + letrasCount;
  const ctx = { userLogged, radioLiberados, radioMode, letrasCount, radioAch, quizAch, baseConquistas };
  const saved = safeParse(data[STORAGE_KEYS.cbjrAutoAchievements] || '{}', {});
  const unlocked = {};
  AUTO_ACHIEVEMENTS.forEach(item => {
    if (item.unlocked(ctx)) unlocked[item.id] = saved[item.id] || { id: item.id, title: item.title, xp: item.xp, unlockedAt: Date.now() };
  });
  const finalSaved = { ...saved, ...unlocked };
  return AUTO_ACHIEVEMENTS.map(item => ({ ...item, unlocked: !!finalSaved[item.id], unlockedAt: finalSaved[item.id]?.unlockedAt || 0 }));
}
function calculateStats(data = readLocal()) {
  const radioIndex = Number(data[STORAGE_KEYS.radioUnlocked] || 0) || 0;
  const radioAlbums = Math.min(13, Math.max(0, radioIndex) + 1);
  const radioMode = String(data[STORAGE_KEYS.radioMode] || 'normal').toLowerCase();
  const letras = safeParse(data[STORAGE_KEYS.letrasCompleted] || '[]', []);
  const letrasAlbums = Array.isArray(letras) ? letras.length : 0;
  const radioAchievements = safeParse(data[STORAGE_KEYS.radioAchievements] || '{}', {});
  const quizAchievements = safeParse(data[STORAGE_KEYS.quizAchievements] || '{}', {});
  const medals = safeParse(data[STORAGE_KEYS.cbjrMedals] || '[]', []);
  const autoAchievements = getAutoAchievementsFromData(data, !!currentUser);
  const autoAchievementsCount = autoAchievements.filter(a => a.unlocked).length;
  const radioAchievementsCount = Object.keys(radioAchievements || {}).filter(k => radioAchievements[k]).length;
  const quizAchievementsCount = Object.keys(quizAchievements || {}).filter(k => quizAchievements[k]).length;
  const baseConquistas = radioAchievementsCount + quizAchievementsCount + letrasAlbums;
  const conquistas = baseConquistas + autoAchievementsCount;
  const xpBaseRadio = Math.max(0, radioAlbums - 1) * 250;
  const xpBaseLetras = letrasAlbums * 220;
  const xpConquistas = baseConquistas * 90;
  const xpAuto = autoAchievements.filter(a => a.unlocked).reduce((s, a) => s + Number(a.xp || 0), 0);
  const xpHard = radioMode === 'hard' ? 250 : 0;
  const derivedXp = xpBaseRadio + xpBaseLetras + xpConquistas + xpAuto + xpHard;
  const storedXp = Number(data[STORAGE_KEYS.cbjrXp] || 0) || 0;
  const xp = Math.max(storedXp, derivedXp);
  const title = getTitleByXp(xp);
  return {
    xp,
    title,
    radioAlbums,
    letrasAlbums,
    radioMode,
    radioAchievementsCount,
    quizAchievementsCount,
    autoAchievementsCount,
    conquistas,
    medalsCount: Array.isArray(medals) ? medals.length : 0,
    medals: Array.isArray(medals) ? medals : [],
    progressPercent: Math.round(((radioAlbums / 13) + (letrasAlbums / 13) + (conquistas / 50)) / 3 * 100)
  };
}


function userDoc(user = currentUser) {
  if (!user) return null;
  return doc(db, 'usuarios', user.uid);
}

function progressDoc(user = currentUser) {
  if (!user) return null;
  return doc(db, 'usuarios', user.uid, 'progresso', 'geral');
}

async function saveProfile(user = currentUser, data = readLocal()) {
  if (!user) return;
  const stats = calculateStats(data);
  await setDoc(userDoc(user), {
    uid: user.uid,
    nome: user.displayName || 'Fã CBJR',
    email: user.email || '',
    foto: user.photoURL || '',
    titulo: stats.title,
    xp: stats.xp,
    medalhas: stats.medalsCount,
    radioAlbums: stats.radioAlbums,
    letrasAlbums: stats.letrasAlbums,
    updatedAt: serverTimestamp(),
    ultimoLogin: serverTimestamp(),
    origem: PAGE_NAME,
    coreVersion: VERSION
  }, { merge: true });
}

async function saveNow(extra = {}) {
  if (!currentUser || syncing) return;
  const payload = readLocal();
  const stats = calculateStats(payload);
  try {
    await setDoc(progressDoc(currentUser), {
      ...payload,
      ...extra,
      stats,
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: currentUser.displayName || '',
      photoURL: currentUser.photoURL || '',
      updatedAt: serverTimestamp(),
      origem: PAGE_NAME,
      coreVersion: VERSION
    }, { merge: true });
    await saveProfile(currentUser, payload);
    lastSnapshot = payload;
    window.dispatchEvent(new CustomEvent('cbjr-progress-saved', { detail: { user: currentUser, data: payload, stats } }));
  } catch (error) {
    console.warn('CBJR Firebase Core: não foi possível salvar agora.', error);
  }
}

function scheduleSave() {
  if (!ready || !currentUser || syncing) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveNow(), 500);
}

async function load(user) {
  currentUser = user || null;
  if (!user) {
    ready = false;
    return null;
  }

  try {
    const snap = await getDoc(progressDoc(user));
    const remoteData = snap.exists() ? (snap.data() || {}) : {};
    const localData = readLocal();
    const merged = mergeProgress(localData, remoteData, user);
    writeLocal(merged);
    ready = true;
    lastSnapshot = merged;
    await saveNow({ primeiroSync: snap.exists() ? false : true });
    const stats = calculateStats(merged);
    window.dispatchEvent(new CustomEvent('cbjr-progress-loaded', { detail: { user, data: merged, stats } }));
    return merged;
  } catch (error) {
    ready = true;
    console.warn('CBJR Firebase Core: falha ao carregar progresso remoto.', error);
    return readLocal();
  }
}

function addHistory(item = {}) {
  const current = safeParse(localStorage.getItem(STORAGE_KEYS.cbjrHistory) || '[]', []);
  current.unshift({ ...item, at: Date.now(), page: PAGE_NAME });
  localStorage.setItem(STORAGE_KEYS.cbjrHistory, JSON.stringify(current.slice(0, 80)));
  scheduleSave();
}

function addXp(amount = 0, reason = 'XP CBJR') {
  const current = Number(localStorage.getItem(STORAGE_KEYS.cbjrXp) || 0);
  const next = Math.max(0, current + (Number(amount) || 0));
  localStorage.setItem(STORAGE_KEYS.cbjrXp, String(next));
  localStorage.setItem(STORAGE_KEYS.cbjrTitle, getTitleByXp(next));
  addHistory({ type: 'xp', name: reason, value: Number(amount) || 0 });
  scheduleSave();
  return next;
}

function unlockMedal(id, label = id, xp = 0) {
  const medals = safeParse(localStorage.getItem(STORAGE_KEYS.cbjrMedals) || '[]', []);
  if (!medals.includes(id)) {
    medals.push(id);
    localStorage.setItem(STORAGE_KEYS.cbjrMedals, JSON.stringify(medals));
    if (xp) addXp(xp, `Medalha: ${label}`);
    addHistory({ type: 'medal', id, name: label, xp });
    window.dispatchEvent(new CustomEvent('cbjr-medal-unlocked', { detail: { id, label, xp } }));
    scheduleSave();
    return true;
  }
  return false;
}

function unlockAchievement(key, id, label = id, xp = 0) {
  if (!SYNC_KEYS.includes(key)) return false;
  const obj = safeParse(localStorage.getItem(key) || '{}', {});
  if (!obj[id]) {
    obj[id] = { unlockedAt: Date.now(), label, xp };
    localStorage.setItem(key, JSON.stringify(obj));
    if (xp) addXp(xp, `Conquista: ${label}`);
    addHistory({ type: 'achievement', id, name: label, xp });
    window.dispatchEvent(new CustomEvent('cbjr-achievement-unlocked', { detail: { key, id, label, xp } }));
    scheduleSave();
    return true;
  }
  return false;
}

function setLastActivity(activity = {}) {
  localStorage.setItem(STORAGE_KEYS.cbjrLastActivity, JSON.stringify({ ...activity, at: Date.now(), page: PAGE_NAME }));
  addHistory({ type: 'activity', ...activity });
  scheduleSave();
}

if (!window.__CBJR_FIREBASE_PROGRESS_PATCHED__) {
  window.__CBJR_FIREBASE_PROGRESS_PATCHED__ = true;
  const nativeSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function patchedSetItem(key, value) {
    nativeSetItem(key, value);
    if (SYNC_KEYS.includes(key)) scheduleSave();
  };
}

window.CBJRProgress = {
  version: VERSION,
  keys: STORAGE_KEYS,
  syncKeys: SYNC_KEYS,
  get user() { return currentUser; },
  get ready() { return ready; },
  readLocal,
  writeLocal,
  calculateStats,
  getTitleByXp,
  load,
  save: saveNow,
  addXp,
  unlockMedal,
  unlockAchievement,
  setLastActivity,
  addHistory,
  lastSnapshot: () => ({ ...lastSnapshot })
};

onAuthStateChanged(auth, user => {
  currentUser = user || null;
  if (user) load(user);
});

window.addEventListener('beforeunload', () => {
  if (currentUser && ready) saveNow({ unloadAtMs: Date.now() });
});
