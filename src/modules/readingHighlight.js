/* ============================================================
   READING HIGHLIGHT — a paragraph sits dimmed until you scroll
   through it, then lights word by word as if you were reading along.

   Port notes: the reference wraps the paragraph in 100dvh of padding
   top and bottom to guarantee scroll room. That would blow a screen of
   empty space into the middle of the page, so instead the trigger is
   scoped to the paragraph itself and the range is widened with start/
   end offsets — same feel, no layout damage.

   Colours come from CSS custom properties so the dark theme, the light
   theme and the bright takeover gradient can each set their own.
   ============================================================ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

function splitWords(el) {
  const text = el.textContent;
  const words = [];
  el.textContent = '';

  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  el.appendChild(sr);

  text.split(/(\s+)/).forEach((tok) => {
    if (!tok) return;
    if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
    const span = document.createElement('span');
    span.className = 'rh-word';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = tok;
    el.appendChild(span);
    words.push(span);
  });
  return words;
}

export function initReadingHighlight({ reduced } = {}) {
  const nodes = document.querySelectorAll('[data-reading]');
  if (!nodes.length) return;

  nodes.forEach((el) => {
    const cs = getComputedStyle(el);
    const dim = cs.getPropertyValue('--rh-dim').trim() || 'rgba(140,140,140,0.28)';
    const lit = cs.getPropertyValue('--rh-lit').trim() || cs.color;

    const words = splitWords(el);
    if (!words.length) return;

    // reduced motion still gets the paragraph, just fully lit and static
    if (reduced) { gsap.set(words, { color: lit }); return; }

    gsap.set(words, { color: dim });
    gsap.to(words, {
      color: lit,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: {
        trigger: el,
        /* clamp() keeps both ends inside the scrollable range. Without it the last
           paragraph on the page never finishes: its end position sits below the
           document's maximum scroll, so the final words stay dim no matter how far
           you scroll. How badly depends on viewport height, which is why it showed
           up on a tall desktop and not on a laptop. */
        start: 'clamp(top 80%)',
        end: 'clamp(bottom 65%)',
        scrub: 0.4,
      },
    });
  });
}
