/* ============================================================
   FOCUS REVEAL — type that pulls into focus, word by word
   ------------------------------------------------------------
   Each word arrives oversized, blurred and transparent, then settles. It is the
   gallery's own entrance, deliberately different from the studio page's mask-rise,
   so arriving here reads as arriving somewhere else.

   Per WORD, never per character. This document is Hebrew: an inline-block per letter
   turns every letter into an atomic inline, which the bidi algorithm treats as a
   neutral object rather than part of a run — an embedded Latin word then lays out
   letter-box by letter-box in RTL order, i.e. backwards — and it makes a line break
   legal in the middle of a word. The same trap is documented on `.wgt` and `.rh-word`
   in main.css. A word-sized box has neither problem, and a blur on five boxes instead
   of forty is also the only version of this that is affordable.
   ============================================================ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

function splitToWords(el) {
  const words = [];
  const text = el.textContent;
  el.textContent = '';
  text.split(/(\s+)/).forEach((tok) => {
    if (tok === '') return;
    if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
    const span = document.createElement('span');
    span.className = 'fr-word';
    span.textContent = tok;
    el.appendChild(span);
    words.push(span);
  });
  return words;
}

export function initFocusReveal({ reduced = false } = {}) {
  const nodes = [...document.querySelectorAll('[data-focus-reveal]')];
  if (!nodes.length) return;
  if (reduced) return; // the copy is already in the markup and already readable

  nodes.forEach((el) => {
    const words = splitToWords(el);
    if (!words.length) return;
    const from = { autoAlpha: 0, scale: 1.4, filter: 'blur(14px)' };
    const to = { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.62, ease: 'power2.out', stagger: 0.07 };
    gsap.set(words, from);

    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => gsap.to(words, { ...to, overwrite: true }),
      onLeaveBack: () => gsap.to(words, { ...from, duration: 0.25, ease: 'power2.in', overwrite: true }),
    });
  });
}

/* The page's first headline cannot wait for a scroll trigger — it is already on screen —
   and it has to fire after the incoming curtain has cleared, not before it. */
export function playFocusReveal(el, delay = 0) {
  const words = el?.querySelectorAll('.fr-word');
  if (!words?.length) return;
  gsap.to(words, {
    autoAlpha: 1, scale: 1, filter: 'blur(0px)',
    duration: 0.7, ease: 'power2.out', stagger: 0.075, delay, overwrite: true,
  });
}
