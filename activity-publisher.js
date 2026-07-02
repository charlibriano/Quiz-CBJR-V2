/**
 * activity-publisher.js — Publicador de Atividades CBJR
 *
 * Inclua em qualquer página para publicar atividades no mural da comunidade.
 * Usa localStorage + evento storage para comunicar com fans.html em tempo real.
 *
 * Uso:
 *   CBJRActivityPublisher.publish('radio', 'completou o CD <strong>Bocas Ordinárias</strong> na Rádio 🎵');
 */

(function() {
  'use strict';

  const COOLDOWN_KEY = 'cbjr_activity_cooldown';
  const COOLDOWN_MS  = 5 * 60 * 1000; // 5 minutos entre publicações do mesmo tipo

  function getUserName() {
    // Tenta pegar do CBJR_AUTH_USER (injetado pelo cbjr-auth-profile-script)
    try {
      const user = window.CBJR_AUTH_USER;
      if (user) return user.displayName || 'Fã CBJR';
    } catch(_) {}
    // Fallback: localStorage
    try { return localStorage.getItem('lettersCBJR_playerName') || 'Fã CBJR'; } catch(_) {}
    return 'Fã CBJR';
  }

  function canPublish(type) {
    try {
      const cooldowns = JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '{}');
      const last = cooldowns[type] || 0;
      return Date.now() - last > COOLDOWN_MS;
    } catch(_) { return true; }
  }

  function markPublished(type) {
    try {
      const cooldowns = JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '{}');
      cooldowns[type] = Date.now();
      localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldowns));
    } catch(_) {}
  }

  function publish(type, text) {
    if (!canPublish(type)) return;
    // Só publica se usuário estiver logado
    const user = window.CBJR_AUTH_USER;
    if (!user) return;

    markPublished(type);

    // Se estiver na página de fãs, publica diretamente
    if (window.CBJRActivity?.publish) {
      window.CBJRActivity.publish(type, text, user);
      return;
    }

    // Senão, usa localStorage para comunicar com a aba de fãs aberta
    try {
      localStorage.setItem('cbjr_nova_atividade', JSON.stringify({ type, text, ts: Date.now() }));
      // Remove logo depois para permitir próximas publicações
      setTimeout(() => localStorage.removeItem('cbjr_nova_atividade'), 500);
    } catch(_) {}

    // Também salva no Firestore via fetch se possível
    publishToFirestore(type, text, user);
  }

  async function publishToFirestore(type, text, user) {
    try {
      const payload = {
        uid:   user.uid,
        name:  user.displayName || 'Fã CBJR',
        photo: user.photoURL || '',
        type,
        text,
        ts: { '.sv': 'timestamp' } // Firestore REST não suporta serverTimestamp direto
      };

      // Usa a API REST do Firestore para não precisar do SDK
      const url = `https://firestore.googleapis.com/v1/projects/ranking-cbjr/databases/(default)/documents/cbjr_atividades`;
      const body = {
        fields: {
          uid:   { stringValue: user.uid },
          name:  { stringValue: user.displayName || 'Fã CBJR' },
          photo: { stringValue: user.photoURL || '' },
          type:  { stringValue: type },
          text:  { stringValue: text },
          ts:    { integerValue: String(Date.now()) }
        }
      };

      // Pega o token de auth do usuário
      const token = await user.getIdToken();
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
    } catch(e) {
      console.warn('ActivityPublisher:', e);
    }
  }

  // ── Hooks automáticos ─────────────────────────────────
  // Rádio: detecta conclusão de CD
  window.addEventListener('cbjr-radio-cd-complete', e => {
    const { albumName, albumIndex } = e.detail || {};
    if (albumName) {
      publish('radio', `completou o CD <strong>${albumName}</strong> na Rádio 📻`);
    }
  });

  // Letras: detecta conclusão de álbum
  window.addEventListener('cbjr-letras-album-complete', e => {
    const { albumName } = e.detail || {};
    if (albumName) {
      publish('letras', `completou o álbum <strong>${albumName}</strong> no Modo Letras ✍️`);
    }
  });

  // Quiz: detecta avanço de nível
  window.addEventListener('cbjr-quiz-level-complete', e => {
    const { level, difficulty } = e.detail || {};
    const diffLabel = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' }[difficulty] || 'Normal';
    if (level !== undefined) {
      publish('quiz', `passou para o Nível <strong>${level + 1}</strong> no Quiz (${diffLabel}) 🎸`);
    }
  });

  // Conquistas: detecta medalhas e conquistas
  window.addEventListener('cbjr-medal-unlocked', e => {
    const { label } = e.detail || {};
    if (label) {
      publish('conquista', `desbloqueou a conquista <strong>${label}</strong> 🏅`);
    }
  });

  // Desafio diário
  window.addEventListener('cbjr-desafio-complete', e => {
    const { mode } = e.detail || {};
    const modeLabel = { radio: 'Rádio', letras: 'Letras', quiz: 'Quiz' }[mode] || 'desafio';
    publish('desafio', `completou o desafio do dia de <strong>${modeLabel}</strong> 🔥`);
  });

  // Streak
  window.addEventListener('cbjr-streak-updated', e => {
    const { current } = e.detail || {};
    if (current === 7 || current === 15 || current === 30) {
      publish('conquista', `atingiu <strong>${current} dias seguidos</strong> de streak 🔥`);
    }
  });

  window.CBJRActivityPublisher = { publish };
})();
