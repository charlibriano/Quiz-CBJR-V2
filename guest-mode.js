/* =========================================================
   CBJR GUEST MODE — Modo Visitante
   Controla limitações de degustação para usuários sem login.
   Zera ao fechar o navegador (sessionStorage).
   ========================================================= */

const CBJR_GUEST = (() => {

  function isGuest() {
    try { return sessionStorage.getItem('cbjr_guest_mode') === '1'; } catch (e) { return false; }
  }

  function isLoggedIn() {
    try { return localStorage.getItem('cbjr_google_logged') === '1'; } catch (e) { return false; }
  }

  // Se não é visitante nem logado, redireciona para o login
  function requireAccess() {
    if (!isGuest() && !isLoggedIn()) {
      location.href = 'index.html';
      return false;
    }
    return true;
  }

  // Bloqueia páginas exclusivas de logados
  function requireLogin(pageName) {
    if (isGuest() && !isLoggedIn()) {
      showGuestBlock(pageName);
      return false;
    }
    return true;
  }

  /* ── MODAL DE BLOQUEIO VISITANTE ─────────────────────── */
  const MODAL_ID = 'cbjrGuestBlockModal';

  function getModal() {
    return document.getElementById(MODAL_ID);
  }

  function createModal() {
    if (getModal()) return getModal();
    const el = document.createElement('div');
    el.id = MODAL_ID;
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('role', 'dialog');
    el.innerHTML = `
      <div class="cbjr-guest-box">
        <div class="cbjr-guest-icon">🔐</div>
        <h2 class="cbjr-guest-title" id="cbjrGuestTitle">Acesso restrito</h2>
        <p class="cbjr-guest-text" id="cbjrGuestText">Para continuar, faça login com sua conta Google e tenha acesso completo ao universo CBJR.</p>
        <a href="index.html" class="cbjr-guest-btn-primary">
          <span style="background:#fff;color:#4285f4;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:950;flex-shrink:0;">G</span>
          Entrar com Google
        </a>
        <button class="cbjr-guest-btn-secondary" id="cbjrGuestClose" type="button">Continuar como Visitante</button>
        <p class="cbjr-guest-perks">✅ Ranking online &nbsp; ✅ Conquistas &nbsp; ✅ Comunidade CBJR<br>✅ Progresso salvo na nuvem &nbsp; ✅ Todos os CDs</p>
      </div>
    `;
    // Estilos do modal
    const style = document.createElement('style');
    style.textContent = `
      #${MODAL_ID} {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        padding: 18px;
        background: rgba(0,0,0,.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        animation: cbjrGuestFadeIn .25s ease;
      }
      @keyframes cbjrGuestFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .cbjr-guest-box {
        width: min(440px, 100%);
        border: 1px solid rgba(241,196,15,.45);
        border-radius: 28px;
        background:
          radial-gradient(circle at 50% 0%, rgba(241,196,15,.16), transparent 48%),
          rgba(5,5,5,.96);
        box-shadow: 0 30px 100px rgba(0,0,0,.84), 0 0 48px rgba(241,196,15,.12);
        padding: clamp(22px,4vw,34px);
        text-align: center;
        animation: cbjrGuestSlideUp .28s ease;
      }
      @keyframes cbjrGuestSlideUp {
        from { transform: translateY(20px) scale(.97); opacity: 0; }
        to   { transform: translateY(0) scale(1);    opacity: 1; }
      }
      .cbjr-guest-icon {
        font-size: 2.4rem; margin-bottom: 10px;
      }
      .cbjr-guest-title {
        font-family: 'Elektrix', Arial, sans-serif;
        color: #f1c40f;
        font-size: clamp(1.8rem,5vw,2.6rem);
        line-height: .9; margin: 0 0 10px;
        text-shadow: 0 0 20px rgba(241,196,15,.4);
      }
      .cbjr-guest-text {
        color: rgba(255,255,255,.78); font-weight: 900;
        line-height: 1.5; margin: 0 0 20px; font-size: .96rem;
      }
      .cbjr-guest-btn-primary {
        display: flex; align-items: center; justify-content: center;
        gap: 10px; width: 100%; min-height: 52px;
        border-radius: 15px; border: 0;
        background: #18a097; color: #fff;
        font-weight: 950; font-size: .96rem;
        text-decoration: none; cursor: pointer;
        box-shadow: 0 14px 36px rgba(24,160,151,.24);
        transition: .18s ease; margin-bottom: 10px;
      }
      .cbjr-guest-btn-primary:hover {
        transform: translateY(-2px); filter: brightness(1.08);
      }
      .cbjr-guest-btn-secondary {
        width: 100%; min-height: 44px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 15px;
        background: rgba(255,255,255,.06);
        color: rgba(255,255,255,.72);
        font-weight: 950; font-size: .88rem;
        cursor: pointer; transition: .18s ease;
      }
      .cbjr-guest-btn-secondary:hover {
        border-color: rgba(255,255,255,.38); color: #fff;
        background: rgba(255,255,255,.10);
      }
      .cbjr-guest-perks {
        margin: 14px 0 0; font-size: .76rem;
        color: rgba(255,255,255,.48); font-weight: 850;
        line-height: 1.6;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(el);

    el.querySelector('#cbjrGuestClose')?.addEventListener('click', () => {
      hideModal();
    });

    return el;
  }

  function showModal(title, text) {
    const modal = createModal();
    const titleEl = modal.querySelector('#cbjrGuestTitle');
    const textEl  = modal.querySelector('#cbjrGuestText');
    if (titleEl && title) titleEl.textContent = title;
    if (textEl  && text)  textEl.textContent  = text;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function hideModal() {
    const modal = getModal();
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ── BLOQUEIO DE PÁGINAS COMPLETAS ───────────────────── */
  function showGuestBlock(pageName) {
    const titles = {
      ranking:    'Ranking Online',
      conquistas: 'Conquistas',
      fans:       'Comunidade CBJR',
    };
    const texts = {
      ranking:    'O ranking online é exclusivo para jogadores com conta Google. Faça login para ver sua posição entre os maiores fãs do Charlie Brown Jr.!',
      conquistas: 'As conquistas e medalhas ficam salvas na sua conta Google. Faça login para desbloqueá-las e acompanhar seu progresso.',
      fans:       'A Comunidade CBJR é exclusiva para membros com conta Google. Faça login para interagir com outros fãs!',
    };

    // Cria overlay cobrindo o conteúdo da página
    const overlay = document.createElement('div');
    overlay.id = 'cbjrGuestPageBlock';
    overlay.innerHTML = `
      <div class="cbjr-page-block-box">
        <div class="cbjr-guest-icon">🔐</div>
        <h2 class="cbjr-guest-title">${titles[pageName] || 'Acesso restrito'}</h2>
        <p class="cbjr-guest-text">${texts[pageName] || 'Esta área é exclusiva para usuários com conta Google.'}</p>
        <a href="index.html" class="cbjr-guest-btn-primary" style="display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;border-radius:15px;border:0;background:#18a097;color:#fff;font-weight:950;text-decoration:none;box-shadow:0 14px 36px rgba(24,160,151,.24);transition:.18s ease;margin-bottom:10px;">
          <span style="background:#fff;color:#4285f4;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:950;flex-shrink:0;">G</span>
          Entrar com Google — Acesso completo
        </a>
        <a href="index.html" class="cbjr-guest-btn-secondary" style="display:flex;align-items:center;justify-content:center;width:100%;min-height:44px;border:1px solid rgba(255,255,255,.18);border-radius:15px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.72);font-weight:950;text-decoration:none;transition:.18s ease;">
          ← Voltar ao menu
        </a>
        <p style="margin:14px 0 0;font-size:.76rem;color:rgba(255,255,255,.48);font-weight:850;line-height:1.6;">
          ✅ Ranking online &nbsp; ✅ Conquistas &nbsp; ✅ Comunidade<br>✅ Progresso salvo &nbsp; ✅ Todos os CDs liberados
        </p>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #cbjrGuestPageBlock {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        padding: 18px;
        background: rgba(0,0,0,.92);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }
      .cbjr-page-block-box {
        width: min(440px, 100%);
        border: 1px solid rgba(241,196,15,.45);
        border-radius: 28px;
        background:
          radial-gradient(circle at 50% 0%, rgba(241,196,15,.16), transparent 48%),
          rgba(5,5,5,.96);
        box-shadow: 0 30px 100px rgba(0,0,0,.84);
        padding: clamp(22px,4vw,34px);
        text-align: center;
      }
      .cbjr-page-block-box .cbjr-guest-icon { font-size: 2.4rem; margin-bottom: 10px; }
      .cbjr-page-block-box .cbjr-guest-title {
        font-family: 'Elektrix', Arial, sans-serif;
        color: #f1c40f; font-size: clamp(1.8rem,5vw,2.6rem);
        line-height: .9; margin: 0 0 10px;
        text-shadow: 0 0 20px rgba(241,196,15,.4);
      }
      .cbjr-page-block-box .cbjr-guest-text {
        color: rgba(255,255,255,.78); font-weight: 900;
        line-height: 1.5; margin: 0 0 20px; font-size: .94rem;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  /* ── CONTADOR DE AÇÕES DO VISITANTE ──────────────────── */
  function getCount(key) {
    try { return Number(sessionStorage.getItem(key) || 0); } catch (e) { return 0; }
  }
  function incCount(key) {
    try { sessionStorage.setItem(key, String(getCount(key) + 1)); } catch (e) {}
  }
  function resetCount(key) {
    try { sessionStorage.removeItem(key); } catch (e) {}
  }

  return {
    isGuest,
    isLoggedIn,
    requireAccess,
    requireLogin,
    showModal,
    hideModal,
    showGuestBlock,
    getCount,
    incCount,
    resetCount,
  };
})();

window.CBJR_GUEST = CBJR_GUEST;
