/**
 * desafio.js — Desafio Diário CBJR
 *
 * Alterna entre 3 modos por dia da semana:
 *   Dom/Qua/Sáb → Rádio 📻
 *   Seg/Qui     → Letras ✍️
 *   Ter/Sex     → Quiz 🎸
 *
 * No index.html:  <script src="./desafio.js" defer></script>
 * No radio.html:  <script src="./desafio.js" defer></script>
 * No letras.html: <script src="./desafio.js" defer></script>
 * No quiz.html:   <script src="./desafio.js" defer></script>
 */

(function() {
  'use strict';

  // ── Dados dos 13 álbuns ──────────────────────────────────────
  const ALBUMS = [
    { name: 'Transpiração Contínua Prolongada', year: 1997, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%201.jpeg' },
    { name: 'Preço Curto Prazo Longo',          year: 1999, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%202.jpeg' },
    { name: 'Nadando com os Tubarões',           year: 2000, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%203.jpeg' },
    { name: '100% Charlie Brown Jr.',            year: 2001, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%204.jpeg' },
    { name: 'Bocas Ordinárias',                  year: 2002, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%205.jpeg' },
    { name: 'Acústico MTV',                      year: 2003, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%206.jpeg' },
    { name: 'Tamo Aí na Atividade',              year: 2004, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%207.jpeg' },
    { name: 'Imunidade Musical',                 year: 2005, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%208.jpeg' },
    { name: 'Ritmo, Ritual e Responsa',          year: 2007, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%209.jpeg' },
    { name: 'Vanessa da Mata & Chorão',          year: 2008, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%2010.jpeg' },
    { name: 'Camisa 10 Joga Bola Até na Chuva', year: 2009, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%2011.jpeg' },
    { name: 'Música Popular Caiçara',            year: 2012, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%2012.jpeg' },
    { name: 'La Família 013',                    year: 2013, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%2013.jpeg' },
  ];

  // ── Modos por dia da semana (0=Dom … 6=Sáb) ─────────────────
  //   Dom=0 Seg=1 Ter=2 Qua=3 Qui=4 Sex=5 Sáb=6
  const DAY_MODE = ['radio', 'letras', 'quiz', 'radio', 'letras', 'quiz', 'radio'];

  const MODE_META = {
    radio:  { label: 'Rádio',  icon: '📻', page: 'radio.html',  color: 'rgba(241,196,15,1)',   glow: 'rgba(241,196,15,.12)', border: 'rgba(241,196,15,.45)' },
    letras: { label: 'Letras', icon: '✍️',  page: 'letras.html', color: 'rgba(30,215,96,1)',    glow: 'rgba(30,215,96,.12)',  border: 'rgba(30,215,96,.45)'  },
    quiz:   { label: 'Quiz',   icon: '🎸',  page: 'quiz.html',   color: 'rgba(100,149,237,1)', glow: 'rgba(100,149,237,.12)', border: 'rgba(100,149,237,.45)' },
  };

  const DAILY_KEY        = 'cbjr_daily_done_v1';
  const DAILY_STREAK_KEY = 'cbjr_daily_streak_v1';
  const UNLOCK_KEY       = 'radioCBJRUnlockedAlbumIndex_v2';
  const PAGE             = location.pathname.split('/').pop().replace('.html','') || 'index';

  const XP_DAILY    = 150;   // XP por completar o desafio do dia
  const XP_STREAK_7 = 500;   // XP bônus por 7 dias seguidos

  // ── Helpers de data ──────────────────────────────────────────
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function todayMode() {
    return DAY_MODE[new Date().getDay()];
  }

  // Sorteio determinístico por data para o álbum (Rádio/Letras)
  function getDailyIndex() {
    const key = todayStr();
    let h = 0;
    for (let i = 0; i < key.length; i++) { h = Math.imul(31, h) + key.charCodeAt(i) | 0; }
    const seed = Math.abs(h);
    const unlockedCount = getUnlockedIndex() + 1;
    return seed % unlockedCount;
  }

  // Sorteio determinístico de nível do Quiz por data
  function getDailyQuizLevel(difficulty) {
    const key = todayStr() + 'quiz' + difficulty;
    let h = 0;
    for (let i = 0; i < key.length; i++) { h = Math.imul(31, h) + key.charCodeAt(i) | 0; }
    const seed = Math.abs(h);
    // Lê o nível mais alto atingido na dificuldade
    try {
      const progress = JSON.parse(localStorage.getItem('cobjr_quiz_progress_v1') || '{}');
      const highest = Number(progress[`highestLevel_${difficulty}`] || 0); // base 1
      const maxLevel = Math.max(1, highest); // pelo menos nível 1
      return seed % maxLevel; // retorna index base 0
    } catch(_) { return 0; }
  }

  // Dificuldade mais jogada pelo usuário
  function getPreferredDifficulty() {
    try {
      const progress = JSON.parse(localStorage.getItem('cobjr_quiz_progress_v1') || '{}');
      return progress.lastDifficulty || 'normal';
    } catch(_) { return 'normal'; }
  }

  function isDone() {
    try {
      const s = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null');
      return s && s.date === todayStr() && s.done;
    } catch(_) { return false; }
  }

  // ── STREAK DO DESAFIO ─────────────────────────────────────
  function getDailyStreak() {
    try { return JSON.parse(localStorage.getItem(DAILY_STREAK_KEY) || '{}'); } catch(_) { return {}; }
  }

  function updateDailyStreak() {
    const today     = todayStr();
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    })();

    const data    = getDailyStreak();
    const current = data.lastDay === yesterday ? (data.current || 0) + 1 : 1;
    const best    = Math.max(current, data.best || 0);
    const updated = { current, best, lastDay: today };
    try { localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(updated)); } catch(_) {}
    return updated;
  }

  function markDone() {
    try { localStorage.setItem(DAILY_KEY, JSON.stringify({ date: todayStr(), done: true, mode: todayMode() })); } catch(_) {}

    // Atualiza streak do desafio
    const streak = updateDailyStreak();

    // Concede XP pelo desafio
    let totalXp   = XP_DAILY;
    let streakBonus = false;

    if (streak.current > 0 && streak.current % 7 === 0) {
      totalXp += XP_STREAK_7;
      streakBonus = true;
    }

    // Adiciona XP via CBJRProgress se disponível
    if (window.CBJRProgress?.addXp) {
      window.CBJRProgress.addXp(totalXp, `Desafio do dia (${todayStr()})`);
    } else {
      // Fallback: adiciona direto no localStorage
      try {
        const key = 'cbjr_xp_total';
        const curr = Number(localStorage.getItem(key) || 0);
        localStorage.setItem(key, String(curr + totalXp));
      } catch(_) {}
    }

    // Mostra popup de recompensa
    showXpRewardPopup(totalXp, streak.current, streakBonus);
  }
  // ── FIM STREAK DO DESAFIO ─────────────────────────────────

  function getUnlockedIndex() {
    return Math.max(0, Number(localStorage.getItem(UNLOCK_KEY) || 0));
  }

  // ── POPUP DE RECOMPENSA XP ────────────────────────────────
  function showXpRewardPopup(xp, streakDays, isStreakBonus) {
    // Evita duplicatas
    if (document.getElementById('cbjrXpRewardPopup')) return;

    const popup = document.createElement('div');
    popup.id = 'cbjrXpRewardPopup';

    const streakHtml = streakDays > 1 ? `
      <div class="cbjr-xp-streak">
        🔥 ${streakDays} dias seguidos de desafio!
      </div>
    ` : '';

    const bonusHtml = isStreakBonus ? `
      <div class="cbjr-xp-bonus">
        👑 Bônus de 7 dias: <strong>+${XP_STREAK_7} XP</strong>
      </div>
    ` : '';

    popup.innerHTML = `
      <div class="cbjr-xp-box">
        <div class="cbjr-xp-icon">⭐</div>
        <div class="cbjr-xp-label">Desafio concluído!</div>
        <div class="cbjr-xp-amount">+${xp} XP</div>
        ${streakHtml}
        ${bonusHtml}
        <button class="cbjr-xp-close" onclick="document.getElementById('cbjrXpRewardPopup').remove()">Continuar →</button>
      </div>
    `;

    // Estilos do popup
    const style = document.createElement('style');
    style.textContent = `
      #cbjrXpRewardPopup {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        padding: 18px;
        background: rgba(0,0,0,.82);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        animation: cbjrXpFadeIn .25s ease;
      }
      @keyframes cbjrXpFadeIn { from { opacity: 0; } to { opacity: 1; } }

      .cbjr-xp-box {
        width: min(380px, 100%);
        border: 1px solid rgba(241,196,15,.55);
        border-radius: 28px;
        background:
          radial-gradient(circle at 50% 0%, rgba(241,196,15,.22), transparent 52%),
          rgba(5,5,5,.97);
        box-shadow: 0 0 60px rgba(241,196,15,.18), 0 30px 80px rgba(0,0,0,.8);
        padding: clamp(24px, 4vw, 36px);
        text-align: center;
        font-family: Inter, Arial, sans-serif;
        color: #fff;
        animation: cbjrXpSlideUp .3s ease;
      }
      @keyframes cbjrXpSlideUp {
        from { transform: translateY(24px) scale(.96); opacity: 0; }
        to   { transform: translateY(0)    scale(1);   opacity: 1; }
      }

      .cbjr-xp-icon {
        font-size: 3rem; margin-bottom: 8px;
        animation: cbjrXpSpin 1s ease;
      }
      @keyframes cbjrXpSpin {
        0%   { transform: scale(0) rotate(-180deg); }
        70%  { transform: scale(1.2) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); }
      }

      .cbjr-xp-label {
        font-size: .82rem; font-weight: 950;
        text-transform: uppercase; letter-spacing: .12em;
        color: rgba(255,255,255,.6); margin-bottom: 6px;
      }

      .cbjr-xp-amount {
        font-family: 'Elektrix', Arial, sans-serif;
        font-size: clamp(3rem, 10vw, 4.5rem);
        color: #f1c40f; line-height: .9;
        text-shadow: 0 0 30px rgba(241,196,15,.6), 3px 4px 0 rgba(0,0,0,.6);
        margin-bottom: 12px;
        animation: cbjrXpCount .6s ease .2s both;
      }
      @keyframes cbjrXpCount {
        from { transform: scale(.7); opacity: 0; }
        to   { transform: scale(1);  opacity: 1; }
      }

      .cbjr-xp-streak {
        display: inline-flex; align-items: center; gap: 6px;
        border: 1px solid rgba(255,140,0,.45);
        border-radius: 999px;
        background: rgba(255,140,0,.10);
        color: #ff8c00; font-size: .8rem; font-weight: 950;
        padding: 6px 14px; margin-bottom: 8px;
      }

      .cbjr-xp-bonus {
        display: inline-flex; align-items: center; gap: 6px;
        border: 1px solid rgba(241,196,15,.45);
        border-radius: 999px;
        background: rgba(241,196,15,.10);
        color: #f1c40f; font-size: .82rem; font-weight: 950;
        padding: 6px 14px; margin-bottom: 12px;
      }
      .cbjr-xp-bonus strong { color: #fff; }

      .cbjr-xp-close {
        display: block; width: 100%; min-height: 48px;
        border-radius: 14px; border: 0; margin-top: 14px;
        background: linear-gradient(90deg, #f1c40f, #e6b800);
        color: #050505; font-weight: 950; font-size: .96rem;
        cursor: pointer; font-family: inherit;
        box-shadow: 0 10px 28px rgba(241,196,15,.28);
        transition: .18s ease;
      }
      .cbjr-xp-close:hover { transform: translateY(-2px); filter: brightness(1.08); }
    `;

    document.head.appendChild(style);
    document.body.appendChild(popup);

    // Fecha ao clicar fora
    popup.addEventListener('click', (e) => {
      if (e.target === popup) popup.remove();
    });
  }
  // ── FIM POPUP DE RECOMPENSA ───────────────────────────────

  // ── CSS injetado uma única vez ───────────────────────────────
  function injectCSS() {
    if (document.getElementById('cbjr-desafio-style')) return;
    const s = document.createElement('style');
    s.id = 'cbjr-desafio-style';
    s.textContent = `
      .cbjr-daily-banner {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 16px;
        align-items: center;
        padding: 16px 18px;
        margin-bottom: 18px;
        border-radius: 22px;
        border: 1px solid var(--cbjr-daily-border, rgba(241,196,15,.45));
        background: radial-gradient(circle at 0% 50%, var(--cbjr-daily-glow, rgba(241,196,15,.12)), transparent 55%),
                    linear-gradient(135deg, rgba(0,0,0,.82), rgba(0,0,0,.94));
        box-shadow: 0 0 32px var(--cbjr-daily-glow, rgba(241,196,15,.08)),
                    0 18px 48px rgba(0,0,0,.48),
                    inset 0 1px 0 rgba(255,255,255,.06);
        position: relative;
        overflow: hidden;
        font-family: Inter, Arial, sans-serif;
        color: #fff;
        transition: border-color .3s ease;
      }
      .cbjr-daily-banner::after {
        content: attr(data-icon);
        position: absolute;
        right: -10px; top: -14px;
        font-size: 7rem;
        opacity: .06;
        pointer-events: none;
      }
      .cbjr-daily-kicker {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--cbjr-daily-border, rgba(241,196,15,.42));
        border-radius: 999px;
        background: rgba(255,255,255,.06);
        color: var(--cbjr-daily-color, #f1c40f);
        padding: 5px 10px;
        font-size: .65rem;
        font-weight: 900;
        letter-spacing: .10em;
        text-transform: uppercase;
        margin-bottom: 8px;
        width: fit-content;
      }
      .cbjr-daily-title {
        font-size: clamp(1.1rem, 3vw, 1.8rem);
        font-weight: 900;
        color: var(--cbjr-daily-color, #f1c40f);
        margin: 0 0 4px;
        line-height: 1;
        text-shadow: 0 0 20px rgba(255,255,255,.15);
      }
      .cbjr-daily-sub {
        color: rgba(255,255,255,.58);
        font-size: .76rem;
        font-weight: 800;
        margin: 0;
      }
      .cbjr-daily-right {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
      }
      .cbjr-daily-cover {
        width: 72px; height: 72px;
        border-radius: 12px; object-fit: cover;
        border: 2px solid var(--cbjr-daily-border, rgba(241,196,15,.45));
        box-shadow: 0 0 18px var(--cbjr-daily-glow, rgba(241,196,15,.18));
        background: #111;
      }
      .cbjr-daily-mode-icon {
        width: 72px; height: 72px;
        border-radius: 12px;
        border: 2px solid var(--cbjr-daily-border, rgba(241,196,15,.45));
        box-shadow: 0 0 18px var(--cbjr-daily-glow, rgba(241,196,15,.18));
        background: rgba(255,255,255,.05);
        display: grid; place-items: center;
        font-size: 2.2rem;
      }
      .cbjr-daily-timer-wrap { text-align: center; }
      .cbjr-daily-timer-label {
        display: block;
        font-size: .58rem; font-weight: 900;
        text-transform: uppercase; letter-spacing: .08em;
        color: rgba(255,255,255,.45); margin-bottom: 1px;
      }
      .cbjr-daily-timer {
        display: block; font-size: 1rem; font-weight: 900;
        color: var(--cbjr-daily-color, #f1c40f);
        letter-spacing: .06em; font-variant-numeric: tabular-nums;
      }
      .cbjr-daily-btn {
        display: inline-flex; align-items: center; justify-content: center;
        padding: 8px 14px; border-radius: 999px;
        background: linear-gradient(90deg, var(--cbjr-daily-color, #f1c40f), rgba(0,0,0,.2));
        color: #050505; font-weight: 900; font-size: .76rem;
        text-decoration: none; white-space: nowrap;
        transition: .15s ease;
        box-shadow: 0 0 18px var(--cbjr-daily-glow, rgba(241,196,15,.22));
        cursor: pointer; border: none;
      }
      .cbjr-daily-btn.letras-btn, .cbjr-daily-btn.quiz-btn { color: #050505; }
      .cbjr-daily-btn:hover { filter: brightness(1.1); transform: scale(1.03); }
      .cbjr-daily-btn.done {
        background: rgba(30,215,96,.15);
        border: 1px solid rgba(30,215,96,.45);
        color: #1ed760; box-shadow: none;
      }
      .cbjr-daily-btn.done:hover { transform: none; filter: none; }

      /* Badge na Rádio e Letras */
      .album-option .cbjr-daily-badge,
      .album-card .cbjr-daily-badge {
        position: absolute;
        bottom: 9px; right: 9px; z-index: 4;
        border: 1px solid var(--cbjr-daily-border, rgba(241,196,15,.80));
        background: rgba(0,0,0,.65);
        color: var(--cbjr-daily-color, #f1c40f);
        border-radius: 999px; padding: 4px 8px;
        font-size: .62rem; font-weight: 900;
        letter-spacing: .06em; text-transform: uppercase;
        pointer-events: none;
        animation: cbjrDailyPulse 2s ease-in-out infinite;
      }
      @keyframes cbjrDailyPulse {
        0%,100% { box-shadow: 0 0 8px rgba(255,255,255,.1); }
        50%      { box-shadow: 0 0 20px rgba(255,255,255,.3); }
      }

      @media (max-width: 560px) {
        .cbjr-daily-banner { grid-template-columns: 1fr; gap: 12px; }
        .cbjr-daily-right { flex-direction: row; justify-content: space-between; }
        .cbjr-daily-cover, .cbjr-daily-mode-icon { width: 52px; height: 52px; font-size: 1.6rem; }
      }
    `;
    document.head.appendChild(s);
  }

  // ── Timer countdown ──────────────────────────────────────────
  function startTimer(el) {
    function tick() {
      const now = new Date();
      const midnight = new Date(now); midnight.setHours(24,0,0,0);
      const diff = midnight - now;
      const h = String(Math.floor(diff / 3600000)).padStart(2,'0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
      const sc = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
      if (el) el.textContent = h + ':' + m + ':' + sc;
    }
    tick();
    setInterval(tick, 1000);
  }

  // ── Banner no index.html ─────────────────────────────────────
  function injectIndexBanner() {
    const anchors = document.querySelectorAll('.console-head h2, .console h2');
    let anchor = null;
    for (const el of anchors) {
      if (el.textContent.trim().toLowerCase().includes('mesa')) {
        anchor = el.closest('section, .console') || el.parentElement;
        break;
      }
    }
    if (!anchor) return;

    const mode     = todayMode();
    const meta     = MODE_META[mode];
    const done     = isDone();
    const idx      = getDailyIndex();
    const album    = ALBUMS[idx];
    const unlocked = getUnlockedIndex();
    const canPlay  = idx <= unlocked;

    // Streak do desafio
    const dailyStreak = getDailyStreak();
    const streakDays  = dailyStreak.current || 0;
    const streakHtml  = streakDays > 1
      ? `<span style="display:inline-flex;align-items:center;gap:5px;margin-top:5px;font-size:.7rem;font-weight:950;color:#ff8c00;letter-spacing:.04em;">🔥 ${streakDays} dias seguidos · +${XP_DAILY} XP ao concluir${streakDays % 7 === 6 ? ` · amanhã +${XP_STREAK_7} XP bônus!` : ''}</span>`
      : `<span style="display:inline-flex;align-items:center;gap:5px;margin-top:5px;font-size:.7rem;font-weight:950;color:rgba(255,255,255,.45);">⭐ +${XP_DAILY} XP ao concluir</span>`;

    // Monta o conteúdo do lado direito dependendo do modo
    let rightVisual, subText, btnHtml, titleText;

    if (mode === 'radio') {
      rightVisual = `<img class="cbjr-daily-cover" src="${album.cover}" alt="${album.name}">`;
      titleText   = album.name;
      subText     = `${album.year} · CD ${idx + 1} de 13 · Modo Rádio`;
      btnHtml     = done
        ? `<span class="cbjr-daily-btn done">✓ Concluído hoje</span>`
        : canPlay
          ? `<a class="cbjr-daily-btn" href="radio.html?desafio=1&album=${idx}">Jogar agora →</a>`
          : `<a class="cbjr-daily-btn" href="radio.html" style="opacity:.7">Desbloquear →</a>`;
    } else if (mode === 'letras') {
      rightVisual = `<img class="cbjr-daily-cover" src="${album.cover}" alt="${album.name}">`;
      titleText   = album.name;
      subText     = `${album.year} · CD ${idx + 1} de 13 · Modo Letras`;
      btnHtml     = done
        ? `<span class="cbjr-daily-btn done">✓ Concluído hoje</span>`
        : canPlay
          ? `<a class="cbjr-daily-btn letras-btn" href="letras.html?desafio=1&album=${idx}">Jogar agora →</a>`
          : `<a class="cbjr-daily-btn letras-btn" href="letras.html" style="opacity:.7">Desbloquear →</a>`;
    } else {
      // quiz
      const prefDiff   = getPreferredDifficulty();
      const quizLevel  = getDailyQuizLevel(prefDiff);
      const diffLabels = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' };
      rightVisual = `<div class="cbjr-daily-mode-icon">🎸</div>`;
      titleText   = `Quiz — Nível ${quizLevel + 1}`;
      subText     = `Dificuldade ${diffLabels[prefDiff] || 'Normal'} · Modo Quiz`;
      btnHtml     = done
        ? `<span class="cbjr-daily-btn done">✓ Concluído hoje</span>`
        : `<a class="cbjr-daily-btn quiz-btn" href="quiz.html?desafio=1&diff=${prefDiff}&level=${quizLevel}">Jogar agora →</a>`;
    }

    const banner = document.createElement('div');
    banner.className = 'cbjr-daily-banner';
    banner.setAttribute('data-icon', meta.icon);
    banner.style.setProperty('--cbjr-daily-color',  meta.color);
    banner.style.setProperty('--cbjr-daily-glow',   meta.glow);
    banner.style.setProperty('--cbjr-daily-border', meta.border);
    banner.innerHTML = `
      <div>
        <div class="cbjr-daily-kicker">${meta.icon} Desafio do dia · ${meta.label}</div>
        <h3 class="cbjr-daily-title">${titleText}</h3>
        <p class="cbjr-daily-sub">${subText}</p>
        ${streakHtml}
      </div>
      <div class="cbjr-daily-right">
        ${rightVisual}
        <div class="cbjr-daily-timer-wrap">
          <span class="cbjr-daily-timer-label">Renova em</span>
          <span class="cbjr-daily-timer" id="cbjrDailyTimer">--:--:--</span>
        </div>
        ${btnHtml}
      </div>
    `;

    anchor.insertAdjacentElement('beforebegin', banner);
    startTimer(document.getElementById('cbjrDailyTimer'));
  }

  // ── Destaque na Rádio ────────────────────────────────────────
  function highlightRadioAlbum() {
    if (todayMode() !== 'radio') return; // só destaca se hoje for dia de rádio

    const params     = new URLSearchParams(location.search);
    const isDesafio  = params.get('desafio') === '1';
    const albumParam = Number(params.get('album'));
    const idx        = Number.isFinite(albumParam) && albumParam >= 0 && albumParam < ALBUMS.length
                       ? albumParam : getDailyIndex();
    const meta       = MODE_META['radio'];

    let attempts = 0;
    const check = setInterval(() => {
      const cards = document.querySelectorAll('.album-option');
      if (!cards.length) { if (++attempts > 40) clearInterval(check); return; }
      clearInterval(check);

      const target = cards[idx];
      if (!target || target.disabled) return;

      target.style.borderColor = meta.border.replace('.45', '.70');
      target.style.boxShadow   = `0 0 28px ${meta.glow}`;

      if (!target.querySelector('.cbjr-daily-badge')) {
        const badge = document.createElement('span');
        badge.className = 'cbjr-daily-badge';
        badge.style.setProperty('--cbjr-daily-color',  meta.color);
        badge.style.setProperty('--cbjr-daily-border', meta.border);
        badge.textContent = `${meta.icon} Desafio do dia`;
        target.appendChild(badge);
      }

      if (isDesafio) setTimeout(() => target.click(), 700);
    }, 250);

    const obs = new MutationObserver(() => {
      const overlay = document.getElementById('finishOverlay');
      if (overlay?.classList.contains('show')) {
        if (window.currentAlbumIndex === idx || isDesafio) markDone();
      }
    });
    const overlayEl = document.getElementById('finishOverlay');
    if (overlayEl) obs.observe(overlayEl, { attributes: true, attributeFilter: ['class'] });
  }

  // ── Destaque no Letras ───────────────────────────────────────
  function highlightLetrasAlbum() {
    if (todayMode() !== 'letras') return;

    const params     = new URLSearchParams(location.search);
    const isDesafio  = params.get('desafio') === '1';
    const albumParam = Number(params.get('album'));
    const idx        = Number.isFinite(albumParam) && albumParam >= 0 && albumParam < ALBUMS.length
                       ? albumParam : getDailyIndex();
    const meta       = MODE_META['letras'];

    let attempts = 0;
    const check = setInterval(() => {
      const cards = document.querySelectorAll('.album-card');
      if (!cards.length) { if (++attempts > 40) clearInterval(check); return; }
      clearInterval(check);

      const target = cards[idx];
      if (!target || target.classList.contains('locked')) return;

      target.style.borderColor = meta.border.replace('.45', '.70');
      target.style.boxShadow   = `0 0 28px ${meta.glow}`;
      target.style.position    = 'relative';

      if (!target.querySelector('.cbjr-daily-badge')) {
        const badge = document.createElement('span');
        badge.className = 'cbjr-daily-badge';
        badge.style.setProperty('--cbjr-daily-color',  meta.color);
        badge.style.setProperty('--cbjr-daily-border', meta.border);
        badge.textContent = `${meta.icon} Desafio do dia`;
        target.appendChild(badge);
      }

      if (isDesafio) setTimeout(() => target.click(), 700);
    }, 250);

    // Detecta conclusão do álbum
    const obs = new MutationObserver(() => {
      const overlay = document.querySelector('.finish-overlay.show, #letrasFinish.show, .letters-finish.show');
      if (overlay) markDone();
    });
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  // ── Destaque no Quiz ─────────────────────────────────────────
  function highlightQuiz() {
    if (todayMode() !== 'quiz') return;

    const params    = new URLSearchParams(location.search);
    const isDesafio = params.get('desafio') === '1';
    const meta      = MODE_META['quiz'];

    if (!isDesafio) return;

    const difficulty = params.get('diff') || getPreferredDifficulty();
    const levelIndex = Number(params.get('level') || 0);

    // Aguarda o quiz carregar e chama startQuizAtLevel diretamente
    let attempts = 0;
    const check = setInterval(() => {
      if (typeof window.startQuizAtLevel !== 'function') {
        if (++attempts > 40) clearInterval(check);
        return;
      }
      clearInterval(check);

      // Pequeno delay para o quiz terminar de inicializar
      setTimeout(() => {
        window.startQuizAtLevel(difficulty, levelIndex);
        markDone();
      }, 800);
    }, 250);
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    injectCSS();
    if (PAGE === 'index' || PAGE === '') {
      injectIndexBanner();
    } else if (PAGE === 'radio') {
      highlightRadioAlbum();
    } else if (PAGE === 'letras') {
      highlightLetrasAlbum();
    } else if (PAGE === 'quiz') {
      highlightQuiz();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
