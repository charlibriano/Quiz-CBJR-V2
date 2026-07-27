// ═══════════════════════════════════════════════════════
// CBJR SHARE RESULT — gera um card de resultado (imagem) e
// compartilha nativamente (WhatsApp/Instagram no celular),
// com fallback pra texto simples se algo falhar.
// Usado por quiz.html, radio.html e letras.html.
// ═══════════════════════════════════════════════════════
window.CBJRShareResult = (function() {
  const SITE_BASE = 'https://quiz-cbjr.vercel.app/';
  const CARD_SIZE = 1080;

  // ── Toast próprio, não depende de nada da página ──
  function ensureToastEl() {
    let el = document.getElementById('cbjrShareToast');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'cbjrShareToast';
    el.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:26px', 'transform:translateX(-50%) translateY(20px)',
      'background:rgba(15,15,15,.96)', 'color:#fff', 'padding:12px 20px', 'border-radius:14px',
      'border:1px solid rgba(241,196,15,.45)', 'font:800 .85rem/1.4 -apple-system,Segoe UI,Arial,sans-serif',
      'z-index:99999', 'max-width:min(92vw,420px)', 'text-align:center',
      'box-shadow:0 12px 32px rgba(0,0,0,.5)', 'opacity:0',
      'transition:opacity .25s ease, transform .25s ease', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(el);
    return el;
  }

  function showShareToast(message) {
    const el = ensureToastEl();
    el.textContent = message;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3200);
  }

  // ── Carrega uma imagem externa com timeout, sem travar o card se falhar ──
  function loadImageSafe(url, timeoutMs = 3500) {
    return new Promise(resolve => {
      if (!url) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      let done = false;
      const finish = (result) => { if (!done) { done = true; resolve(result); } };
      const timer = setTimeout(() => finish(null), timeoutMs);
      img.onload = () => { clearTimeout(timer); finish(img); };
      img.onerror = () => { clearTimeout(timer); finish(null); };
      img.src = url;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCoverArt(ctx, img, x, y, size) {
    ctx.save();
    roundRect(ctx, x, y, size, size, 28);
    ctx.clip();
    if (img) {
      // cover-fit centralizado
      const ratio = Math.max(size / img.width, size / img.height);
      const w = img.width * ratio, h = img.height * ratio;
      ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
    } else {
      const grad = ctx.createLinearGradient(x, y, x + size, y + size);
      grad.addColorStop(0, '#1a1a1a');
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = 'rgba(241,196,15,.9)';
      ctx.font = `${Math.round(size * 0.4)}px -apple-system,Segoe UI,Arial,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎸', x + size / 2, y + size / 2);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(241,196,15,.35)';
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, size, size, 28);
    ctx.stroke();
  }

  // ── Monta o card 1080x1080 e devolve um Blob PNG (ou null se der erro) ──
  async function buildCard({ kicker, title, subtitle, pct, statLine, coverImg }) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = CARD_SIZE;
      canvas.height = CARD_SIZE;
      const ctx = canvas.getContext('2d');

      // Fundo
      const bg = ctx.createRadialGradient(CARD_SIZE / 2, 260, 80, CARD_SIZE / 2, 260, 900);
      bg.addColorStop(0, '#161616');
      bg.addColorStop(1, '#050505');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

      // Borda dourada sutil
      ctx.strokeStyle = 'rgba(241,196,15,.25)';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, CARD_SIZE - 6, CARD_SIZE - 6);

      // Kicker
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f1c40f';
      ctx.font = '700 34px -apple-system,Segoe UI,Arial,sans-serif';
      ctx.fillText(kicker.toUpperCase(), CARD_SIZE / 2, 100);

      // Capa / arte
      const coverSize = 460;
      drawCoverArt(ctx, coverImg, (CARD_SIZE - coverSize) / 2, 140, coverSize);

      // Título (nome do álbum/nível)
      ctx.fillStyle = '#fff';
      ctx.font = '800 46px -apple-system,Segoe UI,Arial,sans-serif';
      wrapText(ctx, title, CARD_SIZE / 2, 660, CARD_SIZE - 120, 54);

      // Subtítulo
      if (subtitle) {
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.font = '700 30px -apple-system,Segoe UI,Arial,sans-serif';
        ctx.fillText(subtitle, CARD_SIZE / 2, 730);
      }

      // Percentual grande
      ctx.fillStyle = '#f1c40f';
      ctx.font = '900 130px -apple-system,Segoe UI,Arial,sans-serif';
      ctx.fillText(`${pct}%`, CARD_SIZE / 2, 890);

      // Linha de stats
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.font = '700 32px -apple-system,Segoe UI,Arial,sans-serif';
      ctx.fillText(statLine, CARD_SIZE / 2, 940);

      // Rodapé / marca
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.font = '700 26px -apple-system,Segoe UI,Arial,sans-serif';
      ctx.fillText('quiz-cbjr.vercel.app', CARD_SIZE / 2, 1010);

      return await new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png', 0.95));
    } catch (e) {
      console.warn('[CBJRShareResult] Falha ao gerar card:', e.message);
      return null;
    }
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(' ');
    let line = '', lines = [];
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    lines = lines.slice(0, 2); // no máximo 2 linhas, pra não estourar o card
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
  }

  // ── Compartilha: tenta imagem+texto, cai pra só texto, cai pra WhatsApp Web ──
  async function share({ title, text, url, cardData }) {
    const fullText = `${text}\n\n${url}`;

    // 1) Tenta gerar e compartilhar a imagem
    if (cardData) {
      const coverImg = await loadImageSafe(cardData.coverUrl);
      const blob = await buildCard({ ...cardData, coverImg });
      if (blob) {
        const file = new File([blob], 'resultado-cbjr.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ title, text, files: [file] });
            return true;
          } catch (e) {
            if (e && e.name === 'AbortError') return false;
          }
        }
        // Sem suporte a compartilhar arquivo: baixa a imagem e ainda tenta texto
        try {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'resultado-cbjr.png';
          link.click();
          showShareToast('🖼️ Imagem baixada! Cola no WhatsApp ou Instagram junto com o texto copiado.');
        } catch (e) { /* segue pro fallback de texto abaixo */ }
      }
    }

    // 2) Compartilhamento nativo só com texto
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (e) {
        if (e && e.name === 'AbortError') return false;
      }
    }

    // 3) Copia o texto
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(fullText);
        showShareToast('📋 Texto copiado! Cola no WhatsApp, Instagram ou onde quiser.');
        return true;
      } catch (e) { /* segue pro último fallback */ }
    }

    // 4) Último recurso: abre WhatsApp Web com o texto pronto
    window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
    return true;
  }

  function quiz({ levelName, levelNumber, difficulty, score, hits, total }) {
    const pct = total ? Math.round((hits / total) * 100) : 0;
    const diffLabel = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' }[difficulty] || difficulty || '';
    const diffPart = diffLabel ? ` (${diffLabel})` : '';
    return share({
      title: 'Quiz CBJR',
      text: `🎸 Acabei de jogar o Quiz do Charlie Brown Jr.! Nível "${levelName}"${diffPart} com ${pct}% de acerto e ${score} pts. Será que você conhece mais da banda do que eu? Bora testar:`,
      url: `${SITE_BASE}quiz.html`,
      cardData: {
        kicker: 'Quiz CBJR',
        title: levelName || `Nível ${levelNumber}`,
        subtitle: diffLabel,
        pct,
        statLine: `${hits}/${total} acertos • ${score} pts`,
        coverUrl: null
      }
    });
  }

  function radio({ albumName, albumYear, correct, total, coverUrl }) {
    const pct = total ? Math.round((correct / total) * 100) : 0;
    return share({
      title: 'Rádio CBJR',
      text: `📻 Toquei "${albumName}" na Rádio CBJR e acertei ${pct}% das faixas! Será que você reconhece as músicas do Charlie Brown Jr. de ouvido? Bora testar:`,
      url: `${SITE_BASE}radio.html`,
      cardData: {
        kicker: 'Rádio CBJR',
        title: albumName || '',
        subtitle: albumYear ? String(albumYear) : '',
        pct,
        statLine: `${correct}/${total} faixas reconhecidas`,
        coverUrl
      }
    });
  }

  function letras({ albumName, correct, total, coverUrl }) {
    const pct = total ? Math.round((correct / total) * 100) : 0;
    return share({
      title: 'Modo Letras CBJR',
      text: `✍️ Completei "${albumName}" no Modo Letras e acertei ${pct}% das frases do Charlie Brown Jr.! Será que você lembra as letras melhor do que eu? Bora testar:`,
      url: `${SITE_BASE}letras.html`,
      cardData: {
        kicker: 'Modo Letras',
        title: albumName || '',
        subtitle: '',
        pct,
        statLine: `${correct}/${total} frases certas`,
        coverUrl
      }
    });
  }

  return { quiz, radio, letras, share, showShareToast };
})();
