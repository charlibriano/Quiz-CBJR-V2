/**
 * descoberta.js — Explorador CBJR (recompensa de primeira visita)
 *
 * Funciona como o desafio.js: arquivo independente, plug-and-play,
 * não mexe em nenhuma função existente.
 *
 * Adicionar em: fans.html, ranking.html, conquistas.html, radio.html, letras.html, quiz.html
 *   <script src="./descoberta.js" defer></script>
 *
 * O que faz:
 *  - Primeira visita à Comunidade, ao Ranking ou às Conquistas → +50 XP
 *  - Primeiro nível concluído no Quiz → +50 XP
 *  - Primeiro CD completado na Rádio → +50 XP
 *  - Primeiro álbum completado nas Letras → +50 XP
 *
 * Regras:
 *  - Só jogador logado com Google ganha (visitante/guest não).
 *  - Cada descoberta é única (marcada em localStorage e registrada no
 *    progresso na nuvem via CBJRCloudProgress.save, quando disponível).
 *  - Crédito de XP pelo MESMO caminho do desafio diário:
 *    window.CBJRProgress.addXp se existir, senão incrementa cbjr_xp_total.
 */

(function () {
  'use strict';

  const STORE_KEY = 'cbjr_descobertas_v1';
  const XP_KEY    = 'cbjr_xp_total';
  const XP_REWARD = 50;
  const PAGE      = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';

  const DISCOVERIES = {
    fans:        { icon: '💬', title: 'Você descobriu a Comunidade!',      sub: 'Deixe seu recado no mural dos fãs.' },
    ranking:     { icon: '🏆', title: 'Você descobriu o Ranking!',         sub: 'Será que você chega no Top 10?' },
    conquistas:  { icon: '🏅', title: 'Você descobriu as Conquistas!',     sub: 'Tem medalha esperando por você.' },
    quiz_play:   { icon: '🎯', title: 'Primeiro nível vencido no Quiz!',   sub: 'O universo CBJR te espera nos outros modos.' },
    radio_play:  { icon: '📻', title: 'Primeiro CD completado na Rádio!',  sub: 'Agora é destravar os 13 discos.' },
    letras_play: { icon: '🎵', title: 'Primeiro álbum nas Letras!',        sub: 'Chorão ficaria orgulhoso.' }
  };

  function getState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function isGuest() {
    try { return !!(window.CBJR_GUEST?.isGuest() && !window.CBJR_GUEST?.isLoggedIn()); }
    catch (_) { return false; }
  }

  // Espera o Firebase Auth confirmar o login (o perfil Google carrega
  // de forma assíncrona nas páginas). Mesmo padrão do radio.html.
  function waitForAuthUser(timeoutMs = 6000) {
    return new Promise(resolve => {
      if (window.CBJR_AUTH_USER) { resolve(window.CBJR_AUTH_USER); return; }
      const start = Date.now();
      const check = setInterval(() => {
        if (window.CBJR_AUTH_USER) {
          clearInterval(check);
          resolve(window.CBJR_AUTH_USER);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(check);
          resolve(null);
        }
      }, 250);
    });
  }

  async function award(id) {
    const d = DISCOVERIES[id];
    if (!d) return;
    if (getState()[id]) return;   // já descoberto neste navegador
    if (isGuest()) return;        // visitante não ganha — incentivo pro login

    const user = await waitForAuthUser();
    if (!user) return;            // só jogador logado

    const state = getState();     // re-checa após a espera (evita corrida)
    if (state[id]) return;
    state[id] = { at: Date.now(), xp: XP_REWARD };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}

    // ── Crédito de XP: mesmo caminho do desafio diário ──
    let newTotal = 0;
    if (window.CBJRProgress?.addXp) {
      window.CBJRProgress.addXp(XP_REWARD, 'Explorador CBJR: ' + id);
    } else {
      try {
        newTotal = Number(localStorage.getItem(XP_KEY) || 0) + XP_REWARD;
        localStorage.setItem(XP_KEY, String(newTotal));
      } catch (_) {}
    }

    // ── Registra a descoberta no progresso na nuvem (quando disponível).
    // O perfil.html usa max(local, remoto) pro XP, então enviar o total
    // aqui é seguro e ajuda o XP a sobreviver à troca de aparelho. ──
    try {
      const extra = {};
      extra[STORE_KEY] = JSON.stringify(state);
      if (newTotal) extra[XP_KEY] = String(newTotal);
      window.CBJRCloudProgress?.save?.(extra);
    } catch (_) {}

    showDiscoveryToast(d);
  }

  // ── Toast de descoberta (canto inferior ESQUERDO — o popup de
  // conquistas do site usa o canto direito, sem colisão) ──
  function injectCSS() {
    if (document.getElementById('cbjr-descoberta-style')) return;
    const s = document.createElement('style');
    s.id = 'cbjr-descoberta-style';
    s.textContent = `
      .cbjr-descoberta-toast{
        position:fixed;left:18px;bottom:18px;z-index:99998;
        display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;
        width:min(380px,calc(100vw - 28px));
        border:1px solid rgba(30,215,96,.55);border-radius:20px;
        padding:12px 14px 12px 10px;
        background:radial-gradient(circle at 0% 0%,rgba(30,215,96,.20),transparent 40%),linear-gradient(180deg,rgba(0,0,0,.94),rgba(0,0,0,.84));
        color:#fff;font-family:Inter,Arial,sans-serif;
        box-shadow:0 24px 70px rgba(0,0,0,.62),0 0 28px rgba(30,215,96,.16),inset 0 1px 0 rgba(255,255,255,.10);
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
        transform:translateX(-120%) scale(.96);opacity:0;
        animation:cbjrDescIn .44s cubic-bezier(.2,.85,.25,1.18) forwards,cbjrDescOut .42s ease forwards 6.4s;
        cursor:pointer;
      }
      .cbjr-descoberta-icon{
        width:52px;height:52px;border-radius:16px;display:grid;place-items:center;
        background:linear-gradient(135deg,#1ed760,#f1c40f);color:#050505;
        font-size:1.7rem;box-shadow:0 0 26px rgba(30,215,96,.30);
      }
      .cbjr-descoberta-copy{min-width:0;display:grid;gap:2px;}
      .cbjr-descoberta-kicker{color:#1ed760;text-transform:uppercase;letter-spacing:.12em;font-size:.68rem;font-weight:1000;}
      .cbjr-descoberta-title{color:#f1c40f;font-weight:1000;font-size:.94rem;line-height:1.1;}
      .cbjr-descoberta-sub{color:rgba(255,255,255,.72);font-size:.76rem;font-weight:850;line-height:1.2;}
      .cbjr-descoberta-xp{
        border:1px solid rgba(30,215,96,.42);border-radius:999px;background:rgba(30,215,96,.14);
        color:#1ed760;font-weight:1000;font-size:.78rem;padding:7px 10px;white-space:nowrap;align-self:center;
      }
      @keyframes cbjrDescIn{to{transform:translateX(0) scale(1);opacity:1}}
      @keyframes cbjrDescOut{to{transform:translateX(-120%) scale(.98);opacity:0}}
      @media(max-width:620px){
        .cbjr-descoberta-toast{left:10px;bottom:76px;grid-template-columns:44px 1fr;padding:10px}
        .cbjr-descoberta-icon{width:44px;height:44px;font-size:1.4rem}
        .cbjr-descoberta-xp{grid-column:2;justify-self:start;padding:5px 9px}
      }
      @media (prefers-reduced-motion: reduce){
        .cbjr-descoberta-toast{animation:none;transform:none;opacity:1}
      }
    `;
    document.head.appendChild(s);
  }

  function showDiscoveryToast(d) {
    injectCSS();
    const old = document.getElementById('cbjrDescobertaToast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'cbjrDescobertaToast';
    el.className = 'cbjr-descoberta-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <div class="cbjr-descoberta-icon">${d.icon}</div>
      <div class="cbjr-descoberta-copy">
        <span class="cbjr-descoberta-kicker">🧭 Explorador CBJR</span>
        <span class="cbjr-descoberta-title">${d.title}</span>
        <span class="cbjr-descoberta-sub">${d.sub}</span>
      </div>
      <span class="cbjr-descoberta-xp">+${XP_REWARD} XP</span>
    `;
    el.addEventListener('click', () => el.remove());
    setTimeout(() => { try { el.remove(); } catch (_) {} }, 7200);
    document.body.appendChild(el);
  }

  // ── Init: descoberta por visita ou por primeira conclusão ──
  function init() {
    if (PAGE === 'fans') {
      award('fans');
    } else if (PAGE === 'ranking') {
      award('ranking');
    } else if (PAGE === 'conquistas') {
      award('conquistas');
    } else if (PAGE === 'quiz') {
      window.addEventListener('cbjr-quiz-level-complete', function onDone() {
        window.removeEventListener('cbjr-quiz-level-complete', onDone);
        award('quiz_play');
      });
    } else if (PAGE === 'radio') {
      window.addEventListener('cbjr-radio-cd-complete', function onDone() {
        window.removeEventListener('cbjr-radio-cd-complete', onDone);
        award('radio_play');
      });
    } else if (PAGE === 'letras') {
      window.addEventListener('cbjr-letras-album-complete', function onDone() {
        window.removeEventListener('cbjr-letras-album-complete', onDone);
        award('letras_play');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
