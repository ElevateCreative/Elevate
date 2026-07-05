/* ═════════════════════════════════════════════════════════════
   VIGDER · SPECTRE · motion engine
   GSAP + ScrollTrigger + Lenis · RTL
   boot → eclipse dive → signal → channel theater → darkroom →
   noir → finale · scramble text · velocity blur · HUD telemetry
   ═════════════════════════════════════════════════════════════ */

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(pointer: fine)').matches;
const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);

const body = document.body;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const pad3 = (n) => String(Math.max(0, Math.round(n))).padStart(3, '0');

/* ─── glyph scramble ─── */
const GLYPHS = 'אבגדהוזחטיכלמנסעפצקרשת0123456789▮▯/\\<>·';
function scramble(el, finalText, dur = 0.7) {
  if (!el) return;
  if (!HAS_GSAP || REDUCE) { el.textContent = finalText; return; }
  el.__scr?.kill();
  const len = finalText.length;
  const state = { p: 0 };
  el.__scr = gsap.to(state, {
    p: 1, duration: dur, ease: 'power2.out',
    onUpdate() {
      let out = '';
      const solid = Math.floor(state.p * len);
      for (let i = 0; i < len; i++) {
        const c = finalText[i];
        out += (i < solid || c === ' ') ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete() { el.textContent = finalText; },
  });
}

/* ─── modal ─── */
const modal = $('#buyModal');
const modalPanel = $('.modal-panel', modal);
const modalBackdrop = $('#modalBackdrop');
let lastFocused = null;

function openModal() {
  lastFocused = document.activeElement;
  modal.classList.add('is-open');
  body.classList.add('is-locked');
  window.__lenis?.stop();
  if (HAS_GSAP && !REDUCE) {
    gsap.timeline()
      .to(modalBackdrop, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
      .fromTo(modalPanel, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.06)
      .fromTo($$('.modal-panel > *:not(.modal-close)'),
        { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.055, ease: 'power2.out' }, 0.16);
  } else {
    modalBackdrop.style.opacity = 1;
    modalPanel.style.opacity = 1;
    modalPanel.style.transform = 'none';
  }
  $('.modal-actions .btn-volt', modal)?.focus({ preventScroll: true });
}

function closeModal() {
  const done = () => modal.classList.remove('is-open');
  if (HAS_GSAP && !REDUCE) {
    gsap.timeline({ onComplete: done })
      .to(modalPanel, { y: 30, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(modalBackdrop, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.04);
  } else {
    modalBackdrop.style.opacity = 0;
    done();
  }
  body.classList.remove('is-locked');
  window.__lenis?.start();
  lastFocused?.focus?.({ preventScroll: true });
}

$$('[data-buy]').forEach((btn) => btn.addEventListener('click', openModal));
$('#modalClose').addEventListener('click', closeModal);
$('#modalStay').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

/* ─── index overlay ─── */
const idx = $('#idx');
const idxBtn = $('#indexBtn');
let idxOpen = false;

function toggleIdx(force) {
  idxOpen = force !== undefined ? force : !idxOpen;
  idxBtn.setAttribute('aria-expanded', idxOpen);
  idx.setAttribute('aria-hidden', !idxOpen);
  if (HAS_GSAP && !REDUCE) {
    if (idxOpen) {
      window.__lenis?.stop();
      body.classList.add('is-locked');
      gsap.timeline()
        .set(idx, { visibility: 'visible' })
        .to(idx, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0)
        .fromTo($$('.idx-tile'), { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.055, ease: 'power3.out' }, 0.08);
    } else {
      window.__lenis?.start();
      body.classList.remove('is-locked');
      gsap.timeline()
        .to(idx, { opacity: 0, duration: 0.28, ease: 'power2.in' })
        .set(idx, { visibility: 'hidden' });
    }
  } else {
    idx.style.visibility = idxOpen ? 'visible' : 'hidden';
    idx.style.opacity = idxOpen ? 1 : 0;
    body.classList.toggle('is-locked', idxOpen);
    if (idxOpen) window.__lenis?.stop(); else window.__lenis?.start();
  }
}
idxBtn.addEventListener('click', () => toggleIdx());
$('#idxClose').addEventListener('click', () => toggleIdx(false));

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modal.classList.contains('is-open')) closeModal();
    if (idxOpen) toggleIdx(false);
  }
});

/* ─── anchors ─── */
function goTo(hash) {
  const target = $(hash);
  if (!target) return;
  if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1.5 });
  else target.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
}
$$('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
  const href = a.getAttribute('href');
  if (href?.startsWith('#')) { e.preventDefault(); goTo(href); }
}));
$$('[data-goto-id]').forEach((t) => t.addEventListener('click', () => {
  toggleIdx(false);
  setTimeout(() => goTo('#' + t.dataset.gotoId), 220);
}));

/* ─── background music (starts on first gesture, mutable) ─── */
const bgm = $('#bgm');
const soundBtn = $('#soundBtn');
const MUSIC_PREF = 'vigder-music';
let musicOn = false;

function soundUI() {
  soundBtn.classList.toggle('is-on', musicOn);
  soundBtn.setAttribute('aria-pressed', musicOn);
  soundBtn.setAttribute('aria-label', musicOn ? 'השתקת מוזיקת רקע' : 'הפעלת מוזיקת רקע');
}
function startMusic() {
  if (musicOn) return;
  bgm.volume = 0;
  bgm.play().then(() => {
    musicOn = true;
    soundUI();
    if (window.gsap) gsap.to(bgm, { volume: 0.35, duration: 1.8, ease: 'power1.out' });
    else bgm.volume = 0.35;
  }).catch(() => {});
}
function stopMusic() {
  musicOn = false;
  soundUI();
  if (window.gsap) gsap.to(bgm, { volume: 0, duration: 0.5, ease: 'power1.in', onComplete: () => bgm.pause() });
  else bgm.pause();
}
soundBtn.addEventListener('click', () => {
  if (musicOn) { stopMusic(); localStorage.setItem(MUSIC_PREF, 'off'); }
  else { startMusic(); localStorage.setItem(MUSIC_PREF, 'on'); }
});
soundUI();
if (localStorage.getItem(MUSIC_PREF) !== 'off') {
  const KICK_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
  const kick = (e) => {
    /* the toggle button owns its own clicks — don't race it */
    if (e.target?.closest?.('#soundBtn')) return;
    KICK_EVENTS.forEach((ev) => window.removeEventListener(ev, kick));
    startMusic();
  };
  KICK_EVENTS.forEach((ev) => window.addEventListener(ev, kick, { passive: true }));
}

/* ═══ no GSAP? bail gracefully ═══ */
if (!HAS_GSAP) {
  $('#boot')?.remove();
} else {
  gsap.registerPlugin(ScrollTrigger);

  /* ─── Lenis ─── */
  if (!REDUCE && window.Lenis) {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ─── hero intro (played after boot) ─── */
  const heroIntro = gsap.timeline({ paused: true })
    .fromTo('#ringWrap', { scale: 0.84, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5, ease: 'expo.out' }, 0)
    .fromTo('#orbit', { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power2.out' }, 0.35)
    .fromTo('.ec-eyebrow', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.4)
    .fromTo('#ecBrand', { opacity: 0, letterSpacing: '0.85em', filter: 'blur(12px)' },
      { opacity: 1, letterSpacing: '0.32em', filter: 'blur(0px)', duration: 1.3, ease: 'power3.out' }, 0.5)
    .fromTo('.ec-title', { y: 44, opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' },
      { y: 0, opacity: 1, clipPath: 'inset(-8% 0% -8% 0%)', duration: 1.05, ease: 'power4.out' }, 0.75)
    .fromTo('.ec-sub', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 1.0)
    .fromTo('.ec-hint', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.25);

  if (!REDUCE) {
    gsap.to('#orbitG', { rotation: 360, svgOrigin: '50 50', duration: 80, ease: 'none', repeat: -1 });
  }

  /* ─── boot ─── */
  const boot = $('#boot');
  if (REDUCE) {
    boot?.remove();
    heroIntro.progress(1);
  } else {
    body.classList.add('is-locked');
    window.__lenis?.stop();
    const count = { v: 0 };
    gsap.timeline({
      onComplete() {
        boot.remove();
        body.classList.remove('is-locked');
        window.__lenis?.start();
        heroIntro.play();
        ScrollTrigger.refresh();
      },
    })
      .add(() => scramble($('#bootWord'), 'VIGDER', 1.1), 0.1)
      .to('#bootBar', { scaleX: 1, duration: 1.45, ease: 'power2.inOut' }, 0.1)
      .to(count, {
        v: 100, duration: 1.45, ease: 'power2.inOut',
        onUpdate: () => { $('#bootPct').textContent = pad3(count.v); },
      }, 0.1)
      .to('#bootFlash', { opacity: 0.9, duration: 0.07, ease: 'none' }, '+=0.12')
      .to('#bootFlash', { opacity: 0, duration: 0.16, ease: 'power1.out' })
      .to('.boot-core', { opacity: 0, duration: 0.2 }, '<')
      .to(boot, { opacity: 0, duration: 0.3 }, '-=0.05');
  }

  /* ─── HUD telemetry ─── */
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) { $('#telePct').textContent = pad3(self.progress * 100) + '%'; },
  });

  $$('.scene').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      /* measured after the pins add their spacers */
      refreshPriority: -1,
      onToggle(self) {
        if (!self.isActive) return;
        body.dataset.scene = sec.dataset.sceneNum;
        $('#teleSec').textContent = 'SEC ' + sec.dataset.sceneNum;
        scramble($('#teleName'), sec.dataset.sceneName, 0.5);
      },
    });
  });

  /* ─── product pages: colorway logic (motion optional) ─── */
  const looksEls = $$('.ch-look');
  const looksData = looksEls.map((f) => f.dataset);

  function activeVar(look) { return $('.ch-var.is-active', look); }

  function setVariant(lookIdx, varIdx) {
    const look = looksEls[lookIdx];
    const vars = $$('.ch-var', look);
    const next = vars[varIdx];
    const prev = activeVar(look);
    if (!next || next === prev) return;
    prev.classList.remove('is-active');
    next.classList.add('is-active');
    const gr = $('.ch-ghost-r', look);
    const gc = $('.ch-ghost-c', look);
    gr.src = gc.src = next.getAttribute('src');
    if (!REDUCE) {
      gsap.timeline()
        .set('#chFlash', { opacity: 0.5 }, 0)
        .to('#chFlash', { opacity: 0, duration: 0.3, ease: 'power2.out' }, 0.02)
        .set(prev, { clearProps: 'opacity,visibility,scale,filter' }, 0.16)
        .fromTo(next, { opacity: 0, scale: 1.07, filter: 'blur(12px)' },
          { opacity: 1, scale: 1.02, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, 0)
        .fromTo(gr, { x: -20, opacity: 0.85 }, { x: 0, opacity: 0, duration: 0.55, ease: 'power3.out' }, 0.05)
        .fromTo(gc, { x: 20, opacity: 0.85 }, { x: 0, opacity: 0, duration: 0.55, ease: 'power3.out' }, 0.05);
    }
    $('#chColorName').textContent = next.dataset.cname;
    $$('.swatch').forEach((s, si) => s.classList.toggle('is-active', si === varIdx));
  }

  function buildSwatches(lookIdx) {
    const wrap = $('#chSwatches');
    wrap.innerHTML = '';
    $$('.ch-var', looksEls[lookIdx]).forEach((v, vi) => {
      const b = document.createElement('button');
      b.className = 'swatch' + (v.classList.contains('is-active') ? ' is-active' : '');
      b.style.setProperty('--sw', v.dataset.chex);
      b.setAttribute('aria-label', 'גוון ' + v.dataset.cname);
      b.addEventListener('click', () => setVariant(lookIdx, vi));
      wrap.appendChild(b);
    });
    $('#chColorName').textContent = activeVar(looksEls[lookIdx])?.dataset.cname || '';
  }
  buildSwatches(0);

  /* mobile: tap the product image to cycle colorways */
  if (!FINE) {
    $('#chStage')?.addEventListener('click', () => {
      const li = Math.max(0, looksEls.findIndex((l) => l.classList.contains('is-on')));
      const vars = $$('.ch-var', looksEls[li]);
      const ai = vars.indexOf(activeVar(looksEls[li]));
      setVariant(li, (ai + 1) % vars.length);
    });
  }

  if (!REDUCE) {

    /* ─── 01 · eclipse: dive into the void ─── */
    gsap.timeline({
      scrollTrigger: {
        trigger: '#eclipse',
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    })
      .to('.ec-hint', { opacity: 0, duration: 0.12 }, 0)
      .to('.ec-center', { opacity: 0, y: -40, duration: 0.34 }, 0)
      .to('#orbit', { opacity: 0, duration: 0.3 }, 0.05)
      .to('.horizon', { opacity: 0, duration: 0.4 }, 0.1)
      .to('#bgCanvas', { opacity: 0.1, duration: 0.6 }, 0.15)
      .to('#ringWrap', { scale: 8.6, duration: 1, ease: 'power2.in' }, 0);

    /* ─── 02 · signal: chromatic transmissions ─── */
    {
      const lines = $$('.sig-line');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#signal',
          start: 'top top',
          end: '+=' + lines.length * 95 + '%',
          pin: '.signal-pin',
          scrub: 0.7,
        },
      });
      lines.forEach((line, i) => {
        const base = $('.sig-base', line);
        const gr = $('.sig-ghost-r', line);
        const gc = $('.sig-ghost-c', line);
        const at = i * 3;
        tl.fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.7 }, at)
          .fromTo(base, { filter: 'blur(26px)' }, { filter: 'blur(0px)', duration: 1.1 }, at)
          .fromTo(gr, { x: -46, opacity: 0.9 }, { x: 0, opacity: 0, duration: 1.35 }, at)
          .fromTo(gc, { x: 46, opacity: 0.9 }, { x: 0, opacity: 0, duration: 1.35 }, at);
        tl.to(line, { opacity: 0, duration: 0.6 }, at + 2.2)
          .to(base, { filter: 'blur(18px)', duration: 0.6 }, at + 2.2)
          .to(gr, { x: 30, opacity: 0.5, duration: 0.5 }, at + 2.25)
          .to(gc, { x: -30, opacity: 0.5, duration: 0.5 }, at + 2.25);
      });
      tl.to({}, { duration: 0.6 });
    }

    /* ─── 03 · product pages: channel zapping between items ─── */
    {
      let cur = 0;
      let flipTl = null;

      function flip(i) {
        if (i === cur) return;
        const prev = looksEls[cur];
        const next = looksEls[i];
        cur = i;
        flipTl?.kill();

        const nVar = activeVar(next);
        const nR = $('.ch-ghost-r', next);
        const nC = $('.ch-ghost-c', next);
        nR.src = nC.src = nVar.getAttribute('src');

        flipTl = gsap.timeline()
          .set('#chFlash', { opacity: 0.85 }, 0)
          .to('#chFlash', { opacity: 0, duration: 0.32, ease: 'power2.out' }, 0.03)
          .set(next, { visibility: 'visible' }, 0)
          .to(next, { opacity: 1, duration: 0.12 }, 0.02)
          .set(prev, { opacity: 0, visibility: 'hidden' }, 0.1)
          .fromTo(nVar, { scale: 1.16, filter: 'blur(18px)' },
            { scale: 1.04, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' }, 0.05)
          .fromTo(nR, { x: -30, opacity: 0.9 }, { x: 0, opacity: 0, duration: 0.65, ease: 'power3.out' }, 0.07)
          .fromTo(nC, { x: 30, opacity: 0.9 }, { x: 0, opacity: 0, duration: 0.65, ease: 'power3.out' }, 0.07)
          .fromTo('#chBig', { yPercent: 16, opacity: 0.2 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.1);

        prev.classList.remove('is-on');
        next.classList.add('is-on');

        $('#chBig').textContent = pad3(i + 1).slice(1);
        $('#chNum').textContent = pad3(i + 1).slice(1);
        scramble($('#chName'), looksData[i].name, 0.6);
        scramble($('#chLatin'), looksData[i].latin, 0.7);
        scramble($('#chDesc'), looksData[i].desc, 0.8);
        buildSwatches(i);
      }

      gsap.timeline({
        scrollTrigger: {
          trigger: '#looks',
          start: 'top top',
          end: '+=' + looksEls.length * 110 + '%',
          pin: '.looks-pin',
          scrub: 0.5,
          onUpdate(self) {
            const seg = Math.min(looksEls.length - 1, Math.floor(self.progress * looksEls.length));
            flip(seg);
          },
        },
      })
        .fromTo('.ch-stage', { y: 10 }, { y: -10, ease: 'none', duration: 1 }, 0)
        .fromTo('.ch-mesh', { backgroundPosition: '0px 0px' }, { backgroundPosition: '0px -44px', ease: 'none', duration: 1 }, 0);

      gsap.set(activeVar(looksEls[0]), { scale: 1.04 });
    }

    /* ─── marquee ─── */
    const marqueeTweens = [];
    $$('[data-marquee]').forEach((track) => {
      marqueeTweens.push(gsap.to(track, { xPercent: -50, duration: 24, ease: 'none', repeat: -1 }));
    });

    /* ─── 04 · darkroom: the torch ─── */
    {
      const sticky = $('.dark-sticky');
      const veil = $('#darkVeil');
      const pos = { x: 50, y: 45 };
      const target = { x: 50, y: 45 };
      let lastPointer = 0;

      const roam = gsap.timeline({ paused: true, repeat: -1, yoyo: true })
        .to(target, { x: 26, y: 34, duration: 3.2, ease: 'sine.inOut' })
        .to(target, { x: 70, y: 30, duration: 3.4, ease: 'sine.inOut' })
        .to(target, { x: 66, y: 66, duration: 3.2, ease: 'sine.inOut' })
        .to(target, { x: 30, y: 62, duration: 3.4, ease: 'sine.inOut' });

      sticky.addEventListener('pointermove', (e) => {
        const r = sticky.getBoundingClientRect();
        target.x = ((e.clientX - r.left) / r.width) * 100;
        target.y = ((e.clientY - r.top) / r.height) * 100;
        lastPointer = performance.now();
        roam.pause();
      }, { passive: true });

      gsap.ticker.add(() => {
        pos.x += (target.x - pos.x) * 0.09;
        pos.y += (target.y - pos.y) * 0.09;
        veil.style.setProperty('--x', pos.x + '%');
        veil.style.setProperty('--y', pos.y + '%');
        if (performance.now() - lastPointer > 3200 && !roam.isActive() && roamOn) roam.play();
      });

      let roamOn = false;
      ScrollTrigger.create({
        trigger: '#darkroom',
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle(self) {
          roamOn = self.isActive;
          body.classList.toggle('cursor-torch', self.isActive && FINE);
          if (self.isActive && (!FINE || performance.now() - lastPointer > 3200)) roam.play();
          else if (!self.isActive) roam.pause();
        },
      });

      gsap.fromTo('.dark-head > *, .dark-hint', { opacity: 0, y: 18 }, {
        opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '#darkroom', start: 'top 45%', once: true },
      });
    }

    /* ─── 05 · noir reveals ─── */
    gsap.fromTo('.noir-copy > *', { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.85, stagger: 0.09, ease: 'power3.out',
      scrollTrigger: { trigger: '#noir', start: 'top 66%', once: true },
    });
    gsap.fromTo('.noir-stage', { scale: 0.92, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#noir', start: 'top 70%', once: true },
    });
    gsap.fromTo('.noir-ghost', { xPercent: 12 }, {
      xPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '#noir', start: 'top bottom', end: 'bottom top', scrub: true },
    });

    /* ─── 06 · finale: the ring collapses ─── */
    gsap.fromTo('.fin-media img', { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '#finale', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('#finRing', { scale: 4.8, opacity: 0.14 }, {
      scale: 0.055, opacity: 0.95, ease: 'power1.inOut',
      scrollTrigger: { trigger: '#finale', start: 'top 90%', end: 'center 46%', scrub: 0.6 },
    });
    gsap.fromTo('.fin-inner > *', { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.85, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#finale', start: 'top 55%', once: true },
    });

    /* ─── velocity blur + skew ─── */
    {
      const els = $$('.ch-frame, .fin-title, .ec-title');
      let lastY = window.scrollY;
      let velS = 0;
      gsap.ticker.add(() => {
        const y = window.scrollY;
        velS += ((y - lastY) - velS) * 0.16;
        lastY = y;
        const a = Math.abs(velS);
        const blur = Math.min(a * 0.085, 7);
        const skew = gsap.utils.clamp(-3.6, 3.6, velS * 0.045);
        els.forEach((el) => {
          if (a > 4) {
            el.style.filter = `blur(${blur.toFixed(2)}px)`;
            el.style.transform = `skewY(${skew.toFixed(2)}deg)`;
          } else if (el.style.filter) {
            el.style.filter = '';
            el.style.transform = '';
          }
        });
        marqueeTweens.forEach((t) => t.timeScale(1 + Math.min(a / 60, 3.2)));
      });
    }

    /* ─── magnetic buttons + hover scramble ─── */
    if (FINE) {
      $$('.btn, .hud-btn').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, {
            x: ((e.clientX - r.left) / r.width - 0.5) * 12,
            y: ((e.clientY - r.top) / r.height - 0.5) * 12,
            duration: 0.4, ease: 'power2.out',
          });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.45)' });
        });
        if (btn.children.length === 0) {
          const label = btn.textContent;
          let cool = 0;
          btn.addEventListener('mouseenter', () => {
            const now = performance.now();
            if (now - cool < 900) return;
            cool = now;
            scramble(btn, label, 0.45);
          });
        }
      });
    }

    /* ─── mobile: device-tilt parallax on the eclipse (where supported) ─── */
    if (!FINE && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma == null || e.beta == null) return;
        gsap.to('#ringWrap', {
          x: gsap.utils.clamp(-16, 16, e.gamma * 0.55),
          y: gsap.utils.clamp(-12, 12, (e.beta - 45) * 0.3),
          duration: 0.5, ease: 'power2.out', overwrite: 'auto',
        });
      }, { passive: true });
    }

    /* ─── cursor ─── */
    if (FINE) {
      const dotX = gsap.quickTo('#cursorDot', 'x', { duration: 0.07, ease: 'power2.out' });
      const dotY = gsap.quickTo('#cursorDot', 'y', { duration: 0.07, ease: 'power2.out' });
      const boxX = gsap.quickTo('#cursorBox', 'x', { duration: 0.38, ease: 'power3.out' });
      const boxY = gsap.quickTo('#cursorBox', 'y', { duration: 0.38, ease: 'power3.out' });
      window.addEventListener('pointermove', (e) => {
        dotX(e.clientX); dotY(e.clientY);
        boxX(e.clientX); boxY(e.clientY);
      }, { passive: true });
      document.addEventListener('mouseover', (e) => {
        body.classList.toggle('cursor-hot', !!e.target.closest('a, button'));
      });
    }
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
}
