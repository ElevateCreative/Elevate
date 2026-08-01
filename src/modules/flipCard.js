/* ============================================================
   FLIP CARD — two states of one thing, on two sides of the same card
   ------------------------------------------------------------
   Used where the point IS the comparison (the site in 2018 against the site now, the
   Hebrew build against the Russian one). A slider or a crossfade shows you a blend of
   both; a flip makes you hold one, then the other, which is how you actually notice
   what changed.

   The rotation accumulates rather than toggling between 0 and 180, so repeated flips
   keep turning the same way instead of rocking back and forth, and the two faces are
   swapped at the halfway point — the face coming towards you is always the one you
   asked for.

   Keyboard reaches it through a real <button> in the markup; the card surface is an
   extra affordance for pointers, not the only one.
   ============================================================ */

import { gsap } from 'gsap';

const TILT_LIMIT = 9;

export function initFlipCards({ reduced = false } = {}) {
  document.querySelectorAll('[data-flip]').forEach((card) => {
    const tilt = card.querySelector('.flip__tilt');
    const inner = card.querySelector('.flip__inner');
    const faces = [...card.querySelectorAll('.flip__face')];
    const btn = card.querySelector('[data-flip-toggle]');
    if (!inner || faces.length < 2) return;

    let angle = 0;
    let showing = 0;

    const flip = () => {
      angle += 180;
      showing = showing === 0 ? 1 : 0;
      card.dataset.showing = String(showing);
      btn?.setAttribute('aria-pressed', String(showing === 1));
      if (reduced) { gsap.set(inner, { rotationY: angle }); return; }
      gsap.to(inner, { rotationY: angle, duration: 0.85, ease: 'power3.inOut' });
    };

    btn?.addEventListener('click', (e) => { e.stopPropagation(); flip(); });
    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return; // let real controls be themselves
      flip();
    });

    if (reduced || !tilt) return;
    const rotX = gsap.quickTo(tilt, 'rotationX', { duration: 0.5, ease: 'power3' });
    const rotY = gsap.quickTo(tilt, 'rotationY', { duration: 0.5, ease: 'power3' });
    gsap.set(tilt, { transformPerspective: 1200, transformOrigin: '50% 50%' });
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = card.getBoundingClientRect();
      rotX(((e.clientY - r.top) / r.height - 0.5) * -TILT_LIMIT * 2);
      rotY(((e.clientX - r.left) / r.width - 0.5) * TILT_LIMIT * 2);
    }, { passive: true });
    card.addEventListener('pointerleave', () => { rotX(0); rotY(0); });
  });
}
