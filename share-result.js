/**
 * share-result.js — Card de Resultado Compartilhável CBJR
 * Usado na Rádio, Letras e Quiz para gerar card após cada resultado.
 */
(function() {
  'use strict';

  const SITE_URL = 'charlibriano.github.io/Quiz-CBJR-V2';

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxW && i > 0) {
        ctx.fillText(line.trim(), x, y); y += lineH; line = words[i] + ' ';
      } else { line = test; }
    }
    ctx.fillText(line.trim(), x, y);
    return y;
  }

  // ── CORE: Gera o canvas ──────────────────────────────────────
  function drawCard({ mode, title, subtitle, score, scoreLabel, detail, coverUrl, accentColor, accentGlow }) {
    const W = 450, H = 800;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Fundo
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);

    // Glow superior (cor do modo)
    const gTop = ctx.createRadialGradient(W/2, 0, 0, W/2, 0, 300);
    gTop.addColorStop(0, accentGlow || 'rgba(241,196,15,0.28)');
    gTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gTop;
    ctx.fillRect(0, 0, W, H);

    // Glow inferior amarelo
    const gBot = ctx.createRadialGradient(W/2, H, 0, W/2, H, 200);
    gBot.addColorStop(0, 'rgba(30,215,96,0.12)');
    gBot.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gBot;
    ctx.fillRect(0, 0, W, H);

    // Borda
    ctx.strokeStyle = accentColor || 'rgba(241,196,15,0.55)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 8, 8, W-16, H-16, 24); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    roundRect(ctx, 14, 14, W-28, H-28, 20); ctx.stroke();

    // Badge modo
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, W/2-90, 36, 180, 30, 15); ctx.fill();
    ctx.strokeStyle = accentColor || 'rgba(241,196,15,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, W/2-90, 36, 180, 30, 15); ctx.stroke();
    ctx.fillStyle = accentColor ? accentColor.replace(/[\d.]+\)$/, '1)') : '#f1c40f';
    ctx.font = 'bold 11px Inter, Arial';
    ctx.fillText(`🎸 QUIZ CHARLIE BROWN JR. · ${mode.toUpperCase()}`, W/2, 57);

    // Capa do CD (se houver)
    const coverSize = 140;
    const coverY = 82;

    if (coverUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        roundRect(ctx, W/2 - coverSize/2, coverY, coverSize, coverSize, 14);
        ctx.clip();
        ctx.drawImage(img, W/2 - coverSize/2, coverY, coverSize, coverSize);
        ctx.restore();
        // Borda da capa
        ctx.strokeStyle = accentColor || 'rgba(241,196,15,0.5)';
        ctx.lineWidth = 2;
        roundRect(ctx, W/2 - coverSize/2, coverY, coverSize, coverSize, 14);
        ctx.stroke();
        finishDraw(ctx, W, H, { title, subtitle, score, scoreLabel, detail, coverBottom: coverY + coverSize + 18, accentColor });
      };
      img.onerror = () => {
        drawModeIcon(ctx, W, coverY, coverSize, mode);
        finishDraw(ctx, W, H, { title, subtitle, score, scoreLabel, detail, coverBottom: coverY + coverSize + 18, accentColor });
      };
      img.src = coverUrl;
    } else {
      drawModeIcon(ctx, W, coverY, coverSize, mode);
      finishDraw(ctx, W, H, { title, subtitle, score, scoreLabel, detail, coverBottom: coverY + coverSize + 18, accentColor });
    }

    return canvas;
  }

  function drawModeIcon(ctx, W, y, size, mode) {
    const icons = { radio: '📻', letras: '✍️', quiz: '🎸' };
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, W/2 - size/2, y, size, size, 14); ctx.fill();
    ctx.font = `${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(icons[mode] || '🎸', W/2, y + size * 0.65);
  }

  function finishDraw(ctx, W, H, { title, subtitle, score, scoreLabel, detail, coverBottom, accentColor }) {
    const accent = accentColor ? accentColor.replace(/[\d.]+\)$/, '1)') : '#f1c40f';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'transparent';

    // Título
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Inter, Arial';
    ctx.fillText(title, W/2, coverBottom + 4);

    // Subtítulo
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '850 13px Inter, Arial';
    ctx.fillText(subtitle, W/2, coverBottom + 24);

    // Separador
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, coverBottom + 38); ctx.lineTo(W-40, coverBottom + 38); ctx.stroke();

    // Score principal
    const scoreY = coverBottom + 100;
    ctx.fillStyle = accent;
    ctx.font = 'bold 80px Arial Black, Arial';
    ctx.shadowColor = accent.replace('1)', '0.4)');
    ctx.shadowBlur = 20;
    ctx.fillText(score, W/2, scoreY);
    ctx.shadowBlur = 0;

    // Label do score
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'bold 12px Inter, Arial';
    ctx.letterSpacing = '0.1em';
    ctx.fillText(scoreLabel.toUpperCase(), W/2, scoreY + 22);
    ctx.letterSpacing = '0';

    // Separador
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.moveTo(40, scoreY + 40); ctx.lineTo(W-40, scoreY + 40); ctx.stroke();

    // Detalhe / descrição
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = 'bold 15px Inter, Arial';
    wrapText(ctx, detail, W/2, scoreY + 68, W - 80, 22);

    // CTA
    const ctaY = H - 110;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, 30, ctaY, W-60, 58, 16); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    roundRect(ctx, 30, ctaY, W-60, 58, 16); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 13px Inter, Arial';
    ctx.fillText('Você consegue superar? Venha jogar! 🎸', W/2, ctaY + 22);
    ctx.fillStyle = accent;
    ctx.font = 'bold 15px Inter, Arial';
    ctx.shadowColor = accent.replace('1)', '0.4)');
    ctx.shadowBlur = 8;
    ctx.fillText(SITE_URL, W/2, ctaY + 44);
    ctx.shadowBlur = 0;

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font = '11px Inter, Arial';
    ctx.fillText('Quiz CBJR V2 · Em memória de Chorão e Champignon 🎸', W/2, H - 20);
  }

  // ── MODAL DE COMPARTILHAMENTO ────────────────────────────────
  function showShareModal(canvas, whatsappText) {
    document.getElementById('cbjrShareResultModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'cbjrShareResultModal';
    modal.innerHTML = `
      <div class="csrm-box">
        <button class="csrm-close" onclick="document.getElementById('cbjrShareResultModal').remove()">✕</button>
        <h2 class="csrm-title">Compartilhar resultado</h2>
        <div class="csrm-canvas-wrap"></div>
        <div class="csrm-btns">
          <button class="csrm-btn csrm-download" id="csrmDownload">⬇ Baixar imagem</button>
          <button class="csrm-btn csrm-whatsapp" id="csrmWhatsApp">📲 WhatsApp</button>
        </div>
        <p class="csrm-tip">Salve e poste nos stories do Instagram para desafiar seus amigos! 🎸</p>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #cbjrShareResultModal {
        position:fixed;inset:0;z-index:99999;
        display:flex;align-items:center;justify-content:center;
        padding:18px;background:rgba(0,0,0,.88);
        backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
        animation:csrmFadeIn .25s ease;
      }
      @keyframes csrmFadeIn{from{opacity:0}to{opacity:1}}
      .csrm-box{
        width:min(400px,100%);border:1px solid rgba(241,196,15,.45);border-radius:28px;
        background:radial-gradient(circle at 50% 0%,rgba(241,196,15,.16),transparent 48%),rgba(5,5,5,.97);
        box-shadow:0 30px 80px rgba(0,0,0,.85);padding:20px;position:relative;text-align:center;
        animation:csrmSlideUp .28s ease;font-family:Inter,Arial,sans-serif;color:#fff;
      }
      @keyframes csrmSlideUp{from{transform:translateY(20px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
      .csrm-close{position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font-size:1rem;display:grid;place-items:center;transition:.18s ease}
      .csrm-close:hover{background:rgba(255,59,48,.18);border-color:rgba(255,59,48,.4)}
      .csrm-title{font-family:'Elektrix',Arial,sans-serif;color:#f1c40f;font-size:1.6rem;margin:0 0 12px;text-shadow:0 0 16px rgba(241,196,15,.4)}
      .csrm-canvas-wrap{display:flex;justify-content:center;margin-bottom:14px}
      .csrm-canvas-wrap canvas{border-radius:14px;max-width:100%;height:auto;max-height:55vh;box-shadow:0 10px 36px rgba(0,0,0,.6),0 0 28px rgba(241,196,15,.1)}
      .csrm-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .csrm-btn{min-height:46px;border-radius:14px;border:0;font-weight:950;font-size:.88rem;cursor:pointer;font-family:inherit;transition:.18s ease;display:flex;align-items:center;justify-content:center;gap:8px}
      .csrm-btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
      .csrm-download{background:linear-gradient(90deg,#f1c40f,#e6b800);color:#050505;box-shadow:0 8px 22px rgba(241,196,15,.28)}
      .csrm-whatsapp{background:linear-gradient(90deg,#25D366,#1ead52);color:#fff;box-shadow:0 8px 22px rgba(37,211,102,.25)}
      .csrm-tip{margin:12px 0 0;font-size:.74rem;color:rgba(255,255,255,.45);font-weight:850;line-height:1.5}
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    // Insere canvas no modal
    const wrap = modal.querySelector('.csrm-canvas-wrap');
    wrap.appendChild(canvas);

    // Botão download
    modal.querySelector('#csrmDownload').onclick = () => {
      const link = document.createElement('a');
      link.download = 'resultado-cbjr.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    // Botão WhatsApp
    modal.querySelector('#csrmWhatsApp').onclick = () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
    };
  }

  // ── API PÚBLICA ──────────────────────────────────────────────
  window.CBJRShareResult = {

    radio: function({ albumName, albumYear, correct, total, coverUrl }) {
      const pct = Math.round((correct / total) * 100);
      const canvas = drawCard({
        mode: 'radio', coverUrl,
        title: albumName,
        subtitle: `${albumYear} · Modo Rádio`,
        score: `${correct}/${total}`,
        scoreLabel: 'faixas acertadas',
        detail: `Acertei ${correct} de ${total} faixas do CD "${albumName}" na Rádio CBJR!`,
        accentColor: 'rgba(241,196,15,1)',
        accentGlow: 'rgba(241,196,15,0.28)',
      });
      const whatsapp = `🎵 Acertei ${correct}/${total} faixas do CD "${albumName}" na Rádio CBJR!\n\nVocê consegue superar? 👉 ${SITE_URL}`;
      setTimeout(() => showShareModal(canvas, whatsapp), 100);
    },

    letras: function({ albumName, correct, total, coverUrl }) {
      const pct = Math.round((correct / total) * 100);
      const canvas = drawCard({
        mode: 'letras', coverUrl,
        title: albumName,
        subtitle: 'Modo Letras',
        score: `${pct}%`,
        scoreLabel: 'de acerto',
        detail: `Completei o álbum "${albumName}" com ${correct} acertos em ${total} trechos!`,
        accentColor: 'rgba(30,215,96,1)',
        accentGlow: 'rgba(30,215,96,0.25)',
      });
      const whatsapp = `✍️ Completei "${albumName}" com ${pct}% de acerto no Modo Letras CBJR!\n\nVocê consegue superar? 👉 ${SITE_URL}`;
      setTimeout(() => showShareModal(canvas, whatsapp), 100);
    },

    quiz: function({ levelName, levelNumber, difficulty, score, hits, total }) {
      const diffLabel = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' }[difficulty] || 'Normal';
      const pct = total ? Math.round((hits / total) * 100) : 0;
      const canvas = drawCard({
        mode: 'quiz', coverUrl: null,
        title: `Nível ${levelNumber} — ${levelName}`,
        subtitle: `Modo ${diffLabel} · Quiz CBJR`,
        score: `${pct}%`,
        scoreLabel: 'de aproveitamento',
        detail: `Passei o Nível ${levelNumber} "${levelName}" no Quiz CBJR com ${hits}/${total} acertos!`,
        accentColor: 'rgba(100,149,237,1)',
        accentGlow: 'rgba(100,149,237,0.25)',
      });
      const whatsapp = `🎸 Passei o Nível ${levelNumber} "${levelName}" no Quiz CBJR!\nAproveitamento: ${pct}% (${hits}/${total} acertos) · Modo ${diffLabel}\n\nVocê consegue superar? 👉 ${SITE_URL}`;
      setTimeout(() => showShareModal(canvas, whatsapp), 100);
    },
  };
})();
