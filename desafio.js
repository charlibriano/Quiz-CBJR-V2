/**
 * desafio.js — Desafio Diário CBJR
 *
 * Funciona em qualquer página. Injeta o banner/badge automaticamente.
 * Não mexe em nenhuma função existente.
 *
 * No index.html:  <script src="./desafio.js" defer></script>
 * No radio.html:  <script src="./desafio.js" defer></script>
 */

(function() {
  'use strict';

  // ── Dados dos 13 álbuns (mesma ordem do RADIO_ALBUMS) ──
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
    { name: 'Vanessa da Mata Chorão',            year: 2008, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%2010.jpeg' },
    { name: 'Camisa 10 Joga Bola Até na Chuva', year: 2009, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%2011.jpeg' },
    { name: 'Música Popular Caiçara',            year: 2012, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%2012.jpeg' },
    { name: 'La Família 013',                    year: 2013, cover: 'https://charlibriano.github.io/Quiz-CBJR-V2/CD%2013.jpeg' },
  ];

  const DAILY_KEY    = 'cbjr_daily_done_v1';
  const UNLOCK_KEY   = 'radioCBJRUnlockedAlbumIndex_v2';
  const PAGE         = location.pathname.split('/').pop().replace('.html','');

  // ── Sorteio determinístico por data ──
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function getDailyIndex() {
    const key = todayStr();
    let h = 0;
    for (let i = 0; i < key.length; i++) { h = Math.imul(31, h) + key.charCodeAt(i) | 0; }
    const seed = Math.abs(h);

    // Limita ao range de CDs desbloqueados pelo jogador
    const unlockedCount = getUnlockedIndex() + 1; // +1 porque index é base 0
    return seed % unlockedCount;
  }

  function isDone() {
    try {
      const s = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null');
      return s && s.date === todayStr() && s.done;
    } catch(_) { return false; }
  }

  function markDone() {
    try { localStorage.setItem(DAILY_KEY, JSON.stringify({ date: todayStr(), done: true })); } catch(_) {}
  }

  function getUnlockedIndex() {
    return Math.max(0, Number(localStorage.getItem(UNLOCK_KEY) || 0));
  }

  // ── CSS injetado uma única vez ──
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
        border: 1px solid rgba(241,196,15,.45);
        background: radial-gradient(circle at 0% 50%, rgba(241,196,15,.12), transparent 55%),
                    linear-gradient(135deg, rgba(0,0,0,.82), rgba(0,0,0,.94));
        box-shadow: 0 0 32px rgba(241,196,15,.08), 0 18px 48px rgba(0,0,0,.48),
                    inset 0 1px 0 rgba(255,255,255,.06);
        position: relative;
        overflow: hidden;
        font-family: Inter, Arial, sans-serif;
        color: #fff;
      }
      .cbjr-daily-banner::after {
        content: "🔥";
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
        border: 1px solid rgba(241,196,15,.42);
        border-radius: 999px;
        background: rgba(241,196,15,.10);
        color: #f1c40f;
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
        color: #f1c40f;
        margin: 0 0 4px;
        line-height: 1;
        text-shadow: 0 0 20px rgba(241,196,15,.28);
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
        width: 72px;
        height: 72px;
        border-radius: 12px;
        object-fit: cover;
        border: 2px solid rgba(241,196,15,.45);
        box-shadow: 0 0 18px rgba(241,196,15,.18);
        background: #111;
      }
      .cbjr-daily-timer-wrap { text-align: center; }
      .cbjr-daily-timer-label {
        display: block;
        font-size: .58rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .08em;
        color: rgba(255,255,255,.45);
        margin-bottom: 1px;
      }
      .cbjr-daily-timer {
        display: block;
        font-size: 1rem;
        font-weight: 900;
        color: #f1c40f;
        letter-spacing: .06em;
        font-variant-numeric: tabular-nums;
      }
      .cbjr-daily-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 14px;
        border-radius: 999px;
        background: linear-gradient(90deg, #f1c40f, #e6a817);
        color: #050505;
        font-weight: 900;
        font-size: .76rem;
        text-decoration: none;
        white-space: nowrap;
        transition: .15s ease;
        box-shadow: 0 0 18px rgba(241,196,15,.22);
        cursor: pointer;
        border: none;
      }
      .cbjr-daily-btn:hover { filter: brightness(1.1); transform: scale(1.03); }
      .cbjr-daily-btn.done {
        background: rgba(30,215,96,.15);
        border: 1px solid rgba(30,215,96,.45);
        color: #1ed760;
        box-shadow: none;
      }
      .cbjr-daily-btn.done:hover { transform: none; filter: none; }

      /* Badge no card da Rádio */
      .album-option .cbjr-daily-badge {
        position: absolute;
        bottom: 9px; right: 9px;
        z-index: 4;
        border: 1px solid rgba(241,196,15,.80);
        background: rgba(241,196,15,.14);
        color: #f1c40f;
        border-radius: 999px;
        padding: 4px 8px;
        font-size: .62rem;
        font-weight: 900;
        letter-spacing: .06em;
        text-transform: uppercase;
        pointer-events: none;
        animation: cbjrDailyPulse 2s ease-in-out infinite;
      }
      @keyframes cbjrDailyPulse {
        0%,100% { box-shadow: 0 0 8px rgba(241,196,15,.18); }
        50%      { box-shadow: 0 0 20px rgba(241,196,15,.45); }
      }

      @media (max-width: 560px) {
        .cbjr-daily-banner { grid-template-columns: 1fr; gap: 12px; }
        .cbjr-daily-right { flex-direction: row; justify-content: space-between; }
        .cbjr-daily-cover { width: 52px; height: 52px; }
      }
    `;
    document.head.appendChild(s);
  }

  // ── Timer ──
  let timerInterval = null;
  function startTimer(el) {
    function tick() {
      const now = new Date();
      const midnight = new Date(now); midnight.setHours(24,0,0,0);
      const diff = midnight - now;
      const h = String(Math.floor(diff / 3600000)).padStart(2,'0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
      if (el) el.textContent = h + ':' + m + ':' + s;
    }
    tick();
    timerInterval = setInterval(tick, 1000);
  }

  // ── Banner para o index.html ──
  function injectIndexBanner() {
    // Procura a seção "Mesa de controle" como âncora
    const anchors = document.querySelectorAll('.console-head h2, .console h2');
    let anchor = null;
    for (const el of anchors) {
      if (el.textContent.trim().toLowerCase().includes('mesa')) {
        anchor = el.closest('section, .console') || el.parentElement;
        break;
      }
    }
    if (!anchor) return;

    const idx     = getDailyIndex();
    const album   = ALBUMS[idx];
    const done    = isDone();
    const unlocked = getUnlockedIndex();
    const canPlay  = idx <= unlocked;

    const banner = document.createElement('div');
    banner.className = 'cbjr-daily-banner';
    banner.innerHTML = `
      <div>
        <div class="cbjr-daily-kicker">🔥 Desafio do dia</div>
        <h3 class="cbjr-daily-title">${album.name}</h3>
        <p class="cbjr-daily-sub">${album.year} · CD ${idx + 1} de 13</p>
      </div>
      <div class="cbjr-daily-right">
        <img class="cbjr-daily-cover" src="${album.cover}" alt="${album.name}">
        <div class="cbjr-daily-timer-wrap">
          <span class="cbjr-daily-timer-label">Renova em</span>
          <span class="cbjr-daily-timer" id="cbjrDailyTimer">--:--:--</span>
        </div>
        ${done
          ? `<span class="cbjr-daily-btn done">✓ Concluído hoje</span>`
          : canPlay
            ? `<a class="cbjr-daily-btn" href="radio.html?desafio=1&album=${idx}">Jogar agora →</a>`
            : `<a class="cbjr-daily-btn" href="radio.html" style="opacity:.7">Desbloquear →</a>`
        }
      </div>
    `;

    anchor.insertAdjacentElement('beforebegin', banner);
    startTimer(document.getElementById('cbjrDailyTimer'));
  }

  // ── Destaque na Rádio ──
  function highlightRadioAlbum() {
    const params  = new URLSearchParams(location.search);
    const isDesafio = params.get('desafio') === '1';
    const albumParam = Number(params.get('album'));
    const idx     = Number.isFinite(albumParam) && albumParam >= 0 && albumParam < ALBUMS.length
                    ? albumParam
                    : getDailyIndex();

    // Observa o DOM para quando os cards forem criados
    let attempts = 0;
    const check = setInterval(() => {
      const cards = document.querySelectorAll('.album-option');
      if (!cards.length) { if (++attempts > 40) clearInterval(check); return; }
      clearInterval(check);

      const target = cards[idx];
      if (!target || target.disabled) return;

      // Adiciona borda amarela
      target.style.borderColor = 'rgba(241,196,15,.70)';
      target.style.boxShadow   = '0 0 28px rgba(241,196,15,.18)';

      // Adiciona badge
      if (!target.querySelector('.cbjr-daily-badge')) {
        const badge = document.createElement('span');
        badge.className = 'cbjr-daily-badge';
        badge.textContent = '🔥 Desafio do dia';
        target.appendChild(badge);
      }

      // Se veio de ?desafio=1, abre direto
      if (isDesafio) {
        setTimeout(() => { target.click(); }, 700);
      }
    }, 250);

    // Detecta conclusão do CD do desafio e marca como feito
    const obs = new MutationObserver(() => {
      const overlay = document.getElementById('finishOverlay');
      if (overlay && overlay.classList.contains('show')) {
        // Verifica se era o CD do desafio
        const currentIdx = window.currentAlbumIndex;
        if (currentIdx === idx || isDesafio) markDone();
      }
    });
    const overlayEl = document.getElementById('finishOverlay');
    if (overlayEl) obs.observe(overlayEl, { attributes: true, attributeFilter: ['class'] });
  }

  // ── Init ──
  function init() {
    injectCSS();
    if (PAGE === 'index' || PAGE === '') {
      injectIndexBanner();
    } else if (PAGE === 'radio') {
      highlightRadioAlbum();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
