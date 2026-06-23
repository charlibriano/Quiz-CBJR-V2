/**
 * easteregg.js — Easter Egg do Chorão
 *
 * Digite "013" em qualquer tela para ativar.
 * No mobile: toque 3x rápido no título da página.
 *
 * Uso: <script src="./easteregg.js" defer></script>
 */

(function () {
  'use strict';

  const ACHIEVE_KEY = 'cobjr_quiz_achievements';
  const ACHIEVE_ID  = 'chorao_013';

  function isUnlocked() {
    try { return !!JSON.parse(localStorage.getItem(ACHIEVE_KEY) || '{}')[ACHIEVE_ID]; }
    catch(_) { return false; }
  }

  function unlock() {
    try {
      const s = JSON.parse(localStorage.getItem(ACHIEVE_KEY) || '{}');
      if (s[ACHIEVE_ID]) return false;
      s[ACHIEVE_ID] = { unlockedAt: Date.now(), source: 'easteregg' };
      localStorage.setItem(ACHIEVE_KEY, JSON.stringify(s));
      return true;
    } catch(_) { return false; }
  }

  function injectCSS() {
    if (document.getElementById('cbjr-egg-style')) return;
    const s = document.createElement('style');
    s.id = 'cbjr-egg-style';
    s.textContent = `
      #cbjrEggOverlay {
        position: fixed; inset: 0; z-index: 999999;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        background: rgba(0,0,0,.97);
        opacity: 0; pointer-events: none;
        transition: opacity .4s ease;
        text-align: center; padding: 24px;
        font-family: Inter, Arial, sans-serif;
      }
      #cbjrEggOverlay.show { opacity: 1; pointer-events: auto; }

      .egg-glow {
        position: absolute; inset: 0;
        background: radial-gradient(circle at 50% 42%, rgba(241,196,15,.20), transparent 62%);
        animation: eggGlow 2s ease-in-out infinite;
        pointer-events: none;
      }
      @keyframes eggGlow { 0%,100%{opacity:.6} 50%{opacity:1} }

      .egg-number {
        font-size: clamp(5rem, 20vw, 10rem);
        font-weight: 900; color: #f1c40f; line-height: 1;
        text-shadow: 0 0 60px rgba(241,196,15,.65), 0 0 120px rgba(241,196,15,.30);
        animation: eggIn .5s cubic-bezier(.2,.85,.25,1.3) both;
        position: relative; z-index: 1;
      }
      @keyframes eggIn {
        from { transform: scale(.3) rotate(-10deg); opacity: 0; }
        to   { transform: scale(1) rotate(0); opacity: 1; }
      }

      .egg-name {
        font-size: clamp(1.4rem, 5vw, 2.8rem);
        font-weight: 900; color: #fff;
        margin: 14px 0 6px; letter-spacing: .02em;
        animation: eggUp .5s .2s ease both;
        position: relative; z-index: 1;
      }
      .egg-phrase {
        font-size: clamp(.9rem, 2.5vw, 1.25rem);
        color: rgba(255,255,255,.70); font-weight: 800; font-style: italic;
        max-width: 500px; line-height: 1.45;
        animation: eggUp .5s .35s ease both;
        position: relative; z-index: 1;
      }
      .egg-achieve {
        margin-top: 26px;
        display: inline-flex; align-items: center; gap: 10px;
        border: 1px solid rgba(241,196,15,.55); border-radius: 999px;
        background: rgba(241,196,15,.10); color: #f1c40f;
        padding: 10px 18px; font-size: .82rem; font-weight: 900;
        letter-spacing: .06em; text-transform: uppercase;
        animation: eggUp .5s .5s ease both;
        position: relative; z-index: 1;
      }
      .egg-achieve.already {
        border-color: rgba(255,255,255,.20); color: rgba(255,255,255,.55);
        background: rgba(255,255,255,.05);
      }
      .egg-skip {
        margin-top: 18px; font-size: .70rem; color: rgba(255,255,255,.32);
        font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
        animation: eggUp .5s .7s ease both; cursor: pointer;
        border: none; background: none; position: relative; z-index: 1; padding: 8px;
      }
      .egg-skip:hover { color: rgba(255,255,255,.60); }

      @keyframes eggUp {
        from { transform: translateY(16px); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }

      .egg-particle {
        position: absolute; width: 6px; height: 6px; border-radius: 50%;
        pointer-events: none;
        animation: eggP var(--dur,1.2s) ease-out var(--delay,0s) both;
      }
      @keyframes eggP {
        from { transform: translate(0,0) scale(1); opacity: 1; }
        to   { transform: translate(var(--tx,0),var(--ty,-100px)) scale(0); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }

  function spawnParticles(container) {
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('div');
      p.className = 'egg-particle';
      const angle = (i / 28) * 360;
      const dist  = 80 + Math.random() * 160;
      const tx    = Math.cos(angle * Math.PI / 180) * dist;
      const ty    = Math.sin(angle * Math.PI / 180) * dist - 60;
      p.style.cssText = [
        'left:calc(50% - 3px)', 'top:calc(50% - 3px)',
        `--tx:${tx}px`, `--ty:${ty}px`,
        `--dur:${0.8 + Math.random() * 0.7}s`,
        `--delay:${Math.random() * 0.25}s`,
        `background:${Math.random() > .45 ? '#f1c40f' : '#ffffff'}`,
      ].join(';');
      container.appendChild(p);
      setTimeout(() => p.remove(), 2000);
    }
  }

  const PHRASES = [
    'Dias de luta, dias de glória.',
    'Só os loucos sabem.',
    'Não viva em vão.',
    'O som continua, a família não para.',
    'Tamo aí na atividade.',
    'De Santos pro mundo, 013 pra sempre.',
  ];

  function trigger() {
    injectCSS();

    // Remove overlay anterior se existir
    document.getElementById('cbjrEggOverlay')?.remove();

    const alreadyHad = isUnlocked();
    const isNew      = unlock();
    const phrase     = PHRASES[Math.floor(Math.random() * PHRASES.length)];

    const overlay = document.createElement('div');
    overlay.id = 'cbjrEggOverlay';
    overlay.innerHTML = `
      <div class="egg-glow"></div>
      <div class="egg-number">013</div>
      <div class="egg-name">Chorão Eterno 013 🤘</div>
      <p class="egg-phrase">"${phrase}"</p>
      <div class="egg-achieve${alreadyHad ? ' already' : ''}">
        ${alreadyHad
          ? '🏆 Conquista já desbloqueada'
          : '🏆 Conquista desbloqueada: Chorão Eterno +500 XP'}
      </div>
      <button class="egg-skip">Fechar · toque em qualquer lugar</button>
    `;

    document.body.appendChild(overlay);
    spawnParticles(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    // Dispara notificação para outros usuários online
    if (isNew && window.CBJRAchievementPopup) {
      setTimeout(() => {
        window.CBJRAchievementPopup.show({
          id: ACHIEVE_ID, name: 'Chorão Eterno 013', icon: '🤘', source: 'easteregg',
        });
      }, 1800);
    }

    function close() {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 400);
      document.removeEventListener('keydown', onKey);
    }
    function onKey() { close(); }

    setTimeout(() => {
      document.addEventListener('keydown', onKey, { once: true });
      overlay.addEventListener('click', close, { once: true });
    }, 800);

    setTimeout(close, 9000);
  }

  // ── Teclado — detecta "013" ──
  let seq = '', seqTimer = null;
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    seq += e.key;
    if (seq.length > 3) seq = seq.slice(-3);
    clearTimeout(seqTimer);
    seqTimer = setTimeout(() => { seq = ''; }, 1500);
    if (seq === '013') { seq = ''; trigger(); }
  });

  // ── Mobile — 3 toques rápidos no título ──
  function setupMobileTap() {
    // Usa o elemento específico se existir, senão procura h1
    const el = document.getElementById('cbjrEggTrigger') || document.querySelector('h1');
    if (!el) return;
    let taps = 0, tapTimer = null;
    el.addEventListener('click', () => {
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { taps = 0; }, 700);
      if (taps >= 3) { taps = 0; trigger(); }
    });
    el.addEventListener('touchend', e => {
      e.preventDefault();
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { taps = 0; }, 700);
      if (taps >= 3) { taps = 0; trigger(); }
    }, { passive: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileTap);
  } else {
    setupMobileTap();
  }

})();
