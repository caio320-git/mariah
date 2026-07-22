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

  /* ---------- balões: mini game de estourar 🎈 ---------- */
  const balloonColors = ['#e6c9ce', '#bed5e4', '#f0dcc3'];
  const MAX_BALLOONS = 12;
  let score = 0;
  let best = Number(localStorage.getItem('mariah_balloon_best') || 0);
  let scoreEl = null;
  let balloonCount = 0;

  // quanto mais pontos, mais rápido: 1.0 → 0.25 do tempo original
  function speedFactor() { return Math.max(0.25, 1 - score * 0.045); }

  function updateScore() {
    if (!scoreEl) {
      scoreEl = document.createElement('div');
      scoreEl.className = 'balloon-score';
      document.body.appendChild(scoreEl);
    }
    if (score > best) {
      best = score;
      try { localStorage.setItem('mariah_balloon_best', String(best)); } catch {}
    }
    scoreEl.innerHTML = `🎈 <strong>${score}</strong>` +
      (best > score ? ` <span class="best">recorde: ${best}</span>` : (score >= 10 ? ' <span class="best">novo recorde!</span>' : ''));
    scoreEl.classList.remove('bump');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('bump');
  }

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
    if (balloonCount >= MAX_BALLOONS) return;
    balloonCount++;
    const b = document.createElement('div');
    b.className = 'balloon';
    const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
    b.style.cssText = `left:${5 + Math.random() * 88}%; --b-size:${34 + Math.random() * 26}px;` +
      `--b-color:${color}; --b-dur:${(22 + Math.random() * 16) * speedFactor()}s; --b-delay:${initialDelay}s;`;
    b.addEventListener('pointerdown', () => {
      const r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, color);
      b.remove();
      balloonCount--;
      score++;
      updateScore();
      // a cada 4 estouros entra um balão extra na roda
      if (score % 4 === 0) spawnBalloon(0);
      setTimeout(() => spawnBalloon(0), (1200 + Math.random() * 2500) * speedFactor());
    });
    stage.appendChild(b);
  }

  for (let i = 0; i < 6; i++) spawnBalloon(-(Math.random() * 30));

  /* ---------- easter egg 1: o coração do palhaço é tricolor 🇭🇺 ---------- */
  const clownChar = document.querySelector('.char-clown');
  if (clownChar) {
    ['/assets/clown-noheart.webp', '/assets/flu.webp'].forEach((s) => { const i = new Image(); i.src = s; });
    const clownImg = clownChar.querySelector('img');
    const clownSpot = document.createElement('div');
    clownSpot.className = 'egg-hotspot';
    clownSpot.style.cssText = 'inset:0;';
    clownSpot.title = '…';
    let fluOn = false, shieldEl = null;
    clownSpot.addEventListener('pointerdown', () => {
      fluOn = !fluOn;
      if (fluOn) {
        clownImg.src = '/assets/clown-noheart.webp';
        shieldEl = document.createElement('div');
        shieldEl.className = 'flu-shield';
        shieldEl.innerHTML = '<img src="/assets/flu.webp" alt="">';
        clownChar.appendChild(shieldEl);
      } else {
        clownImg.src = '/assets/clown-flag.webp';
        if (shieldEl) shieldEl.remove();
      }
    });
    clownChar.appendChild(clownSpot);
  }

  /* ---------- easter egg 2: a cachorrinha e a bolinha 🎾 ---------- */
  const girlChar = document.querySelector('.char-girl');
  if (girlChar) {
    ['/assets/girl-nodog.webp', '/assets/dog.webp'].forEach((s) => { const i = new Image(); i.src = s; });
    const girlImg = girlChar.querySelector('img');
    // caixa da cachorrinha dentro da ilustração (percentuais medidos)
    const BOX = { left: 3.7, top: 50.1, w: 39.4, h: 30.2 };
    const dogSpot = document.createElement('div');
    dogSpot.className = 'egg-hotspot';
    dogSpot.style.cssText = `left:${BOX.left}%; top:${BOX.top}%; width:${BOX.w}%; height:${BOX.h}%;`;
    let done = false;
    dogSpot.addEventListener('pointerdown', () => {
      if (done) return;
      done = true;
      dogSpot.remove();
      const ball = document.createElement('div');
      ball.className = 'orange-ball';
      girlChar.appendChild(ball);
      // a cachorrinha alcança a bolinha e leva embora
      setTimeout(() => { ball.style.opacity = '0'; setTimeout(() => ball.remove(), 350); }, 1750);
      setTimeout(() => {
        girlImg.src = '/assets/girl-nodog.webp';
        const dog = document.createElement('div');
        dog.className = 'dog-run';
        dog.style.cssText = `left:${BOX.left}%; top:${BOX.top}%; width:${BOX.w}%;`;
        // distância até sair da tela pela direita
        const rect = girlChar.getBoundingClientRect();
        const dogW = rect.width * BOX.w / 100;
        const dist = (window.innerWidth - rect.left) + dogW;
        dog.style.setProperty('--run-dist', `${Math.ceil(dist / dogW * 100)}%`);
        dog.innerHTML = '<img src="/assets/dog.webp" alt="">';
        girlChar.appendChild(dog);
        dog.addEventListener('animationend', () => dog.remove());
      }, 650);
    });
    girlChar.appendChild(dogSpot);
  }

  /* gatilho de teste: /#egg dispara os dois */
  if (location.hash === '#egg') {
    setTimeout(() => {
      document.querySelectorAll('.egg-hotspot').forEach((h) =>
        h.dispatchEvent(new Event('pointerdown')));
    }, 800);
  }
})();
