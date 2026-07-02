/* Ascent field: tiny luminous dust that forever rises (we are "elevate", after all).
   Scroll speed turns the dust into wind-streaks, a click bursts sparks that climb,
   and every so often a comet scales the sky. Canvas 2D, DPR-capped, cheap on phones.
   Not initialised at all under reduced motion (OS setting or the a11y widget). */

export function initAscent({ isMobile }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ascent';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  const rand = (a, b) => a + Math.random() * (b - a);
  const COUNT = isMobile ? 40 : Math.min(150, Math.round((window.innerWidth * window.innerHeight) / 11000));

  const makeMote = () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: rand(0.5, 1.8),
    v: rand(0.1, 0.5),          // upward cruise speed
    sway: rand(0.3, 1),          // how much wind/wander this mote feels
    ph: rand(0, Math.PI * 2),
    a: rand(0.15, 0.55),
    blue: Math.random() < 0.35,  // a third of the dust carries the brand blue
  });
  const motes = Array.from({ length: COUNT }, makeMote);

  /* click / tap → a little burst of sparks that climb and fade */
  const sparks = [];
  window.addEventListener('pointerdown', (e) => {
    if (document.body.classList.contains('is-loading')) return;
    const n = isMobile ? 9 : 14;
    for (let i = 0; i < n; i++) {
      sparks.push({
        x: e.clientX + rand(-4, 4), y: e.clientY + rand(-4, 4),
        vx: rand(-1.3, 1.3), vy: rand(-3.6, -1.1),
        r: rand(0.7, 2), life: 1, decay: rand(0.012, 0.022),
        blue: Math.random() < 0.5,
      });
    }
  }, { passive: true });

  /* comets: every so often one climbs across the sky */
  let comet = null;
  let nextComet = performance.now() + rand(6000, 12000);
  const launchComet = (now) => {
    comet = { x: rand(0.15, 0.85) * window.innerWidth, y: window.innerHeight + 60, vx: rand(-1.6, 1.6), vy: -rand(6, 9), life: 1 };
    nextComet = now + rand(9000, 18000);
  };

  /* the cursor gently parts the dust (desktop only) */
  let mx = -1e4, my = -1e4;
  if (!isMobile) window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

  let lastY = window.scrollY;
  let wind = 0; // smoothed scroll velocity
  let fade = 1; // eases out during the takeover finale
  let t = 0;

  const frame = (now) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const w = window.innerWidth, h = window.innerHeight;

    const y = window.scrollY;
    wind += ((y - lastY) - wind) * 0.12;
    lastY = y;

    fade += ((document.body.classList.contains('is-takeover') ? 0 : 1) - fade) * 0.06;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (fade < 0.02) return;

    const light = document.documentElement.getAttribute('data-theme') === 'light'
      && !document.documentElement.classList.contains('a11y-contrast');
    const inkRGB = light ? '30,30,34' : '255,255,255';
    ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
    t += 0.008;

    /* rising dust — streaks when the page is moving fast */
    const stretch = Math.max(-38, Math.min(38, wind * 0.9));
    for (const m of motes) {
      m.y -= m.v + Math.abs(wind) * 0.02;
      m.x += Math.sin(t * 2 + m.ph) * 0.14 * m.sway;
      if (!isMobile) {
        const dx = m.x - mx, dy = m.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 12100) { const d = Math.sqrt(d2) || 1, f = ((110 - d) / 110) * 0.6; m.x += (dx / d) * f; m.y += (dy / d) * f; }
      }
      if (m.y < -20) Object.assign(m, makeMote(), { y: h + 10 });
      else if (m.y > h + 30) Object.assign(m, makeMote(), { y: -10 });
      const col = m.blue ? '80,155,255' : inkRGB;
      const drag = stretch * m.sway;
      if (Math.abs(drag) > 3) {
        ctx.strokeStyle = `rgba(${col},${m.a * fade})`;
        ctx.lineWidth = m.r * 0.9;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x, m.y - drag); ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${col},${m.a * fade})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
      }
    }

    /* click sparks */
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vy *= 0.988; s.life -= s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const col = s.blue ? '80,155,255' : inkRGB;
      ctx.fillStyle = `rgba(${col},${s.life * 0.8 * fade})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * s.life + 0.3, 0, 7); ctx.fill();
    }

    /* comet */
    if (!comet && now > nextComet) launchComet(now);
    if (comet) {
      comet.x += comet.vx; comet.y += comet.vy; comet.life -= 0.006;
      const a = Math.max(0, Math.min(1, comet.life)) * 0.8 * fade;
      const tail = 16;
      const tx = comet.x - comet.vx * tail, ty = comet.y - comet.vy * tail;
      const tailRGB = light ? '70,120,255' : '190,220,255';
      const g = ctx.createLinearGradient(comet.x, comet.y, tx, ty);
      g.addColorStop(0, `rgba(${tailRGB},${a})`);
      g.addColorStop(1, `rgba(${tailRGB},0)`);
      ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(comet.x, comet.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = `rgba(${light ? '50,100,240' : '230,242,255'},${a})`;
      ctx.beginPath(); ctx.arc(comet.x, comet.y, 1.7, 0, 7); ctx.fill();
      if (comet.y < -80 || comet.life <= 0) comet = null;
    }
  };
  requestAnimationFrame(frame);
}
