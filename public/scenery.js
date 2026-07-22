/* Cenário compartilhado: bandeirinhas, estrelas e balões (com estouro 🎈) */
window.STAR_PATH = 'M12 1.8l2.9 6.2 6.8.8-5 4.7 1.3 6.7-6-3.4-6 3.4 1.3-6.7-5-4.7 6.8-.8z';

(function () {
  const stage = document.getElementById('stage');
  if (!stage) return;

  /* ---------- bandeirinhas ---------- */
  const svg = document.getElementById('bunting');
  if (svg) {
    const colors = ['#ab0831', '#e6c9ce', '#bed5e4', '#f0dcc3'];
    const W = 1000, sag = 38, y0 = 12, n = 16;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([t * W, y0 + Math.sin(Math.PI * t) * sag]);
    }
    const d = 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
    let tris = '';
    for (let i = 0; i < n; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      tris += `<polygon points="${x1},${y1} ${x2},${y2} ${(x1 + x2) / 2},${(y1 + y2) / 2 + 46}" fill="${colors[i % colors.length]}" opacity="0.9"/>`;
    }
    svg.innerHTML = tris + `<path d="${d}" fill="none" stroke="#c39d76" stroke-width="3"/>`;
  }

  /* ---------- estrelas ---------- */
  const starColors = ['#e6c9ce', '#bed5e4', '#d4af6a', '#ab0831'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = 10 + Math.random() * 14;
    s.style.cssText = `left:${3 + Math.random() * 94}%; top:${8 + Math.random() * 80}%; width:${size}px; height:${size}px;` +
      `--tw-dur:${3 + Math.random() * 4}s; --tw-delay:${Math.random() * 5}s; --tw-max:${.35 + Math.random() * .45};`;
    s.innerHTML = `<svg viewBox="0 0 24 24"><path d="${window.STAR_PATH}" fill="${starColors[i % starColors.length]}"/></svg>`;
    stage.appendChild(s);
  }

  /* ---------- balões (clique para estourar) ---------- */
  const balloonColors = ['#e6c9ce', '#bed5e4', '#f0dcc3'];

  function burst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const bit = document.createElement('div');
      bit.className = 'pop-bit';
      const ang = (Math.PI * 2 * i) / 10 + Math.random() * .6;
      const dist = 30 + Math.random() * 46;
      bit.style.cssText = `left:${x}px; top:${y}px; background:${color};` +
        `--dx:${Math.cos(ang) * dist}px; --dy:${Math.sin(ang) * dist}px;` +
        `width:${5 + Math.random() * 6}px; height:${5 + Math.random() * 6}px;`;
      document.body.appendChild(bit);
      setTimeout(() => bit.remove(), 700);
    }
  }

  function spawnBalloon(initialDelay) {
    const b = document.createElement('div');
    b.className = 'balloon';
    const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
    b.style.cssText = `left:${5 + Math.random() * 88}%; --b-size:${34 + Math.random() * 26}px;` +
      `--b-color:${color}; --b-dur:${22 + Math.random() * 16}s; --b-delay:${initialDelay}s;`;
    b.addEventListener('pointerdown', (e) => {
      const r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, color);
      b.remove();
      setTimeout(() => spawnBalloon(0), 1200 + Math.random() * 2500);
    });
    stage.appendChild(b);
  }

  for (let i = 0; i < 6; i++) spawnBalloon(-(Math.random() * 30));
})();
