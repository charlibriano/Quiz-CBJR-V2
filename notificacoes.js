/**
 * notificacoes.js — Notificações em tempo real entre páginas CBJR
 *
 * Como funciona:
 *   1. Aguarda o sistema de conquistas já existente detectar um unlock
 *   2. Publica em `notifications/feed` no Realtime Database
 *   3. Todos os usuários online recebem e veem o toast em tempo real
 *
 * Uso: <script type="module" src="./notificacoes.js"></script>
 * (Coloque APÓS o firebase-progress.js ou qualquer outro script de Auth)
 */

import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase, ref, push, set, onChildAdded, serverTimestamp, query, limitToLast }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

// ── Config (mesmo projeto já usado em todos os arquivos) ──
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyCT1btbLIMehCj3xldw5LOB-snjyF4SKhw',
  authDomain:        'ranking-cbjr.firebaseapp.com',
  databaseURL:       'https://ranking-cbjr-default-rtdb.firebaseio.com',
  projectId:         'ranking-cbjr',
  storageBucket:     'ranking-cbjr.firebasestorage.app',
  messagingSenderId: '681180179118',
  appId:             '1:681180179118:web:fe10833848e8bb8194db3f'
};

const NOTIF_PATH    = 'notifications/feed';
const MAX_LISTEN    = 30;    // escuta só as últimas 30 notificações
const NOTIF_TTL_MS  = 8000;  // ms que o toast fica visível
const MY_SESSION_ID = Math.random().toString(36).slice(2); // id único desta aba
const PAGE_KEY = (()=>{
  const p = location.pathname.split('/').pop().replace('.html','');
  return { radio: 'Rádio CBJR', quiz: 'Quiz CBJR', letras: 'Modo Letras',
           fans: 'Comunidade', ranking: 'Ranking', perfil: 'Perfil',
           conquistas: 'Conquistas', index: 'Início' }[p] || 'CBJR';
})();

// ── Firebase ──
const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
const db  = getDatabase(app);

// ── Nome do jogador atual ──
function getPlayerName() {
  return window.CBJR_AUTH_USER?.displayName
    || localStorage.getItem('radioCBJR_playerName')
    || localStorage.getItem('lettersCBJR_playerName')
    || localStorage.getItem('cbjr_fan_name')
    || 'Um fã';
}

function getPlayerPhoto() {
  return window.CBJR_AUTH_USER?.photoURL
    || localStorage.getItem('cbjr_fan_photo')
    || '';
}

// ── Catálogo de conquistas para montar mensagem legível ──
const CATALOG = {
  // Rádio
  first_cd:               { label: 'Primeiro CD', emoji: '💿' },
  unlocked_next:          { label: 'Novo no ar', emoji: '🔓' },
  no_miss:                { label: 'Sem vacilo', emoji: '🎯' },
  ninety:                 { label: 'Frango da Malásia', emoji: '🔥' },
  perfect:                { label: 'Lenda CBJR', emoji: '👑' },
  hard:                   { label: 'Modo Hard', emoji: '☠️' },
  three_cds:              { label: 'Sintonia firme', emoji: '📻' },
  half_radio:             { label: 'Meia rádio', emoji: '⚡' },
  bonus_music_master:     { label: 'Rei da Rádio', emoji: '📡' },
  bonus_album_perfectionist:{ label: 'Perfeição no Disco', emoji: '💚' },
  bonus_hard_album_completed:{ label: 'Modo Hard Dominado', emoji: '⚡' },
  bonus_fast_guess:       { label: 'Orelha Absoluta', emoji: '⏱️' },
  // Quiz
  first_level_completed:  { label: 'Primeiro nível', emoji: '💿' },
  combo_3x:               { label: 'Combo 3x', emoji: '🔥' },
  combo_5x:               { label: 'Combo 5x', emoji: '🛡️' },
  combo_7x:               { label: 'Combo 7x', emoji: '📣' },
  combo_10x:              { label: 'Camisa 10', emoji: '⚽' },
  new_high_score:         { label: 'Novo recorde', emoji: '📈' },
  all_levels_completed:   { label: 'Acústico MTV', emoji: '🎸' },
  secret_level_completed: { label: 'La Família 013', emoji: '🔒' },
  // Letras
  tcp:      { label: 'TCP no Modo Letras', emoji: '✍️' },
  pcpl:     { label: 'Preço Curto no Letras', emoji: '✍️' },
  nadando:  { label: 'Nadando no Letras', emoji: '🌊' },
  cbjr100:  { label: '100% no Letras', emoji: '🏭' },
  bocas:    { label: 'Bocas no Letras', emoji: '🛹' },
  atividade:{ label: 'Atividade no Letras', emoji: '📣' },
  imunidade:{ label: 'Imunidade no Letras', emoji: '🛡️' },
  ritmo:    { label: 'Ritual no Letras', emoji: '⚡' },
  camisa10: { label: 'Camisa 10 no Letras', emoji: '⚽' },
  lafamilia013:{ label: 'La Família 013', emoji: '🔒' },
};

function resolveLabel(achievementId) {
  const entry = CATALOG[achievementId];
  if (entry) return `${entry.emoji} ${entry.label}`;
  // Formata o id como fallback legível
  return '🏆 ' + achievementId.replace(/_/g, ' ');
}

// ── Publica uma notificação no Firebase ──
async function publish(type, payload) {
  try {
    const notifRef = push(ref(db, NOTIF_PATH));
    await set(notifRef, {
      type,           // 'achievement' | 'high_score' | 'album_completed'
      sessionId: MY_SESSION_ID,
      playerName: getPlayerName(),
      playerPhoto: getPlayerPhoto(),
      page: PAGE_KEY,
      ts: Date.now(),
      ...payload
    });
    // Auto-limpa entradas antigas (mantém só últimas 200)
    // O Firebase não tem TTL nativo, limpamos no listener
  } catch (e) {
    // Silencioso — notificações não podem quebrar o jogo
  }
}

// ── Engancha no sistema de conquistas já existente em cada página ──
function hookAchievementPopup() {
  let showHooked = false;

  // Hook 1: intercepta CBJRAchievementPopup.show
  function tryHookShow() {
    if (showHooked) return;
    const popup = window.CBJRAchievementPopup;
    if (!popup || typeof popup.show !== 'function') return;
    showHooked = true;
    const original = popup.show.bind(popup);
    popup.show = function(item) {
      original(item);
      publish('achievement', {
        achievementId:   item.id    || '',
        achievementName: item.name  || resolveLabel(item.id || ''),
        achievementIcon: item.icon  || '🏆',
        source:          item.source || 'cbjr',
      });
    };
  }

  // Hook 2: observa mudanças no localStorage SEM tocar no watcher existente
  // Guarda snapshot e compara a cada 500ms — simples e não quebra nada
  const WATCH_KEYS = ['radioCBJR_achievements_v1', 'cobjr_quiz_achievements', 'cbjr_letters_completed'];
  const SOURCE_MAP = { radioCBJR_achievements_v1:'radio', cobjr_quiz_achievements:'quiz', cbjr_letters_completed:'letras' };

  function safeJson(v, fb) { try { return JSON.parse(v||''); } catch(_) { return fb; } }

  function findNewIds(key, oldVal, newVal) {
    if (key === 'cbjr_letters_completed') {
      const oldArr = new Set(safeJson(oldVal, []));
      return safeJson(newVal, []).filter(id => !oldArr.has(id));
    }
    const oldObj = safeJson(oldVal, {});
    const newObj = safeJson(newVal, {});
    return Object.keys(newObj).filter(id => newObj[id] && !oldObj[id]);
  }

  // Snapshot inicial
  const prev = {};
  WATCH_KEYS.forEach(k => { prev[k] = localStorage.getItem(k); });

  // Polling leve — compara a cada 600ms, só publica se houve mudança real
  setInterval(() => {
    WATCH_KEYS.forEach(key => {
      const current = localStorage.getItem(key);
      if (current === prev[key]) return;
      const newIds = findNewIds(key, prev[key], current);
      prev[key] = current;
      newIds.forEach(id => {
        publish('achievement', {
          achievementId:   id,
          achievementName: resolveLabel(id),
          achievementIcon: CATALOG[id]?.emoji || '🏆',
          source:          SOURCE_MAP[key] || 'cbjr',
        });
      });
    });
  }, 600);

  // Polling para o hook do .show
  tryHookShow();
  const interval = setInterval(() => {
    tryHookShow();
    if (showHooked) clearInterval(interval);
  }, 200);
  setTimeout(() => clearInterval(interval), 12000);
}

// ── Escuta notificações de outros usuários ──

// Injeta o CSS do toast de notificação social
function injectStyles() {
  if (document.getElementById('cbjr-notif-style')) return;
  const style = document.createElement('style');
  style.id = 'cbjr-notif-style';
  style.textContent = `
    #cbjrNotifStack {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: min(380px, calc(100vw - 28px));
    }

    .cbjr-notif {
      display: flex;
      align-items: center;
      gap: 11px;
      width: 100%;
      padding: 11px 14px;
      border-radius: 18px;
      border: 1px solid rgba(241,196,15,.45);
      background: rgba(2,2,2,.96);
      box-shadow: 0 14px 44px rgba(0,0,0,.72), 0 0 22px rgba(241,196,15,.08),
                  inset 0 1px 0 rgba(255,255,255,.07);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      color: #fff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: .82rem;
      font-weight: 800;
      pointer-events: auto;
      cursor: default;
      animation: cbjrNotifIn .32s cubic-bezier(.2,.85,.25,1.15) both;
      position: relative;
      overflow: hidden;
    }

    .cbjr-notif.leaving {
      animation: cbjrNotifOut .28s ease forwards;
    }

    @keyframes cbjrNotifIn {
      from { transform: translateX(32px) scale(.94); opacity: 0; }
      to   { transform: translateX(0) scale(1); opacity: 1; }
    }
    @keyframes cbjrNotifOut {
      to { transform: translateX(32px) scale(.94); opacity: 0; }
    }

    .cbjr-notif-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 1.5px solid rgba(241,196,15,.55);
      overflow: hidden;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, rgba(241,196,15,.9), rgba(0,0,0,.8));
      font-weight: 1000;
      font-size: .72rem;
      color: #000;
      flex: 0 0 auto;
    }
    .cbjr-notif-avatar img {
      width: 100%; height: 100%; object-fit: cover;
    }

    .cbjr-notif-body { min-width: 0; flex: 1; }

    .cbjr-notif-line1 {
      color: rgba(255,255,255,.55);
      font-size: .68rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .07em;
      margin-bottom: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cbjr-notif-line2 {
      color: #fff;
      font-weight: 1000;
      font-size: .84rem;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cbjr-notif-progress {
      position: absolute;
      bottom: 0; left: 0;
      height: 2px;
      border-radius: 0 0 18px 18px;
      background: linear-gradient(90deg, #f1c40f, transparent);
      animation: cbjrProgress linear forwards;
    }

    @keyframes cbjrProgress {
      from { width: 100%; }
      to   { width: 0%; }
    }

    /* Mobile: estilos do card quando em tela pequena */
    @media (max-width: 600px) {
      .cbjr-notif {
        border-radius: 16px;
        padding: 10px 13px;
      }
      .cbjr-notif-line1 { font-size: .65rem; }
      .cbjr-notif-line2 { font-size: .80rem; }
    }
  `;
  document.head.appendChild(style);
}

// Cria (ou retorna) o container de notificações
function getStack() {
  let stack = document.getElementById('cbjrNotifStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'cbjrNotifStack';
    // Detecta mobile via largura real da tela
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      stack.style.cssText = 'position:fixed;bottom:80px;left:12px;right:12px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    } else {
      stack.style.cssText = 'position:fixed;top:18px;right:18px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:380px;';
    }
    document.body.appendChild(stack);
  }
  return stack;
}

function initials(name) {
  return String(name || 'CB').trim().split(/\s+/).filter(Boolean)
    .slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'CB';
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g,
    m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m]));
}

function showNotif({ playerName, playerPhoto, achievementName, achievementIcon, page }) {
  injectStyles();
  const stack = getStack();

  // Máx 3 visíveis ao mesmo tempo
  const existing = stack.querySelectorAll('.cbjr-notif:not(.leaving)');
  if (existing.length >= 3) {
    existing[0].classList.add('leaving');
    existing[0].addEventListener('animationend', () => existing[0].remove(), { once: true });
  }

  const avatar = playerPhoto
    ? `<img src="${esc(playerPhoto)}" alt="" onerror="this.style.display='none'">`
    : esc(initials(playerName));

  const notif = document.createElement('div');
  notif.className = 'cbjr-notif';
  notif.style.position = 'relative';
  notif.style.overflow = 'hidden';
  notif.innerHTML = `
    <div class="cbjr-notif-avatar">${avatar}</div>
    <div class="cbjr-notif-body">
      <div class="cbjr-notif-line1">${esc(playerName)} · ${esc(page)}</div>
      <div class="cbjr-notif-line2">${esc(achievementIcon)} Desbloqueou: ${esc(achievementName)}</div>
    </div>
    <div class="cbjr-notif-progress" style="animation-duration:${NOTIF_TTL_MS}ms"></div>
  `;

  stack.appendChild(notif);

  // Remove após TTL
  const timer = setTimeout(() => {
    notif.classList.add('leaving');
    notif.addEventListener('animationend', () => notif.remove(), { once: true });
  }, NOTIF_TTL_MS);

  notif.addEventListener('click', () => {
    clearTimeout(timer);
    notif.classList.add('leaving');
    notif.addEventListener('animationend', () => notif.remove(), { once: true });
  });
}

// ── Escuta o feed de notificações ──
function startListening() {
  const feedQuery = query(ref(db, NOTIF_PATH), limitToLast(MAX_LISTEN));

  onChildAdded(feedQuery, snap => {
    const n = snap.val();
    if (!n) return;
    // Ignora própria sessão
    if (n.sessionId === MY_SESSION_ID) return;
    // Ignora notificações com mais de 30 segundos (evita flood de notificações antigas ao carregar)
    if (Date.now() - (n.ts || 0) > 30000) return;

    if (n.type === 'achievement') {
      showNotif({
        playerName:      n.playerName     || 'Um fã',
        playerPhoto:     n.playerPhoto    || '',
        achievementName: n.achievementName || resolveLabel(n.achievementId || ''),
        achievementIcon: n.achievementIcon || '🏆',
        page:            n.page           || 'CBJR',
      });
    }
  });
}

// ── Init ──
// Espera o DOM estar pronto antes de injetar no body
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  hookAchievementPopup();
  startListening();
}
