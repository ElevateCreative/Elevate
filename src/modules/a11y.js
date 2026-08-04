/* תוסף נגישות — bespoke accessibility widget, styled to match the floating dock.
   Settings persist in localStorage ('elevate-a11y') and are re-applied before first
   paint by the inline <head> script; "stop animations" reloads the page so main.js
   boots straight into its reduced-motion path (no Lenis, no GSAP choreography).
   Bilingual: strings follow the page language (<html lang>), set before this runs. */

import { A11Y_KEY as KEY, loadA11yPrefs } from './a11y-prefs.js';

const FLAGS = { contrast: 'a11y-contrast', links: 'a11y-links', font: 'a11y-font', cursor: 'a11y-cursor', motion: 'a11y-no-motion' };
const FS_MAX = 3; // 100% → 137.5% in 12.5% steps

const HE = {
  panel: 'הגדרות נגישות', fab: 'תפריט נגישות',
  fs: 'גודל טקסט', fsDown: 'הקטנת טקסט', fsUp: 'הגדלת טקסט',
  contrast: 'ניגודיות גבוהה', links: 'הדגשת קישורים', font: 'גופן קריא', cursor: 'סמן גדול', motion: 'עצירת אנימציות',
  reset: 'איפוס', statement: 'הצהרת נגישות', close: 'סגירת החלון',
  modalTitle: 'הצהרת נגישות',
  p1: 'אתר Elevate Creative הונגש מתוך אמונה שלכל אדם מגיעה חוויית גלישה שווה, נוחה ומכבדת, כולל אנשים עם מוגבלות.',
  p2: 'האתר מותאם לדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג 2013, לתקן הישראלי (ת"י 5568) ולהנחיות WCAG 2.1 ברמה AA.',
  featTitle: 'התאמות הנגישות באתר',
  li1: 'ניווט מלא במקלדת: Tab למעבר בין רכיבים, Enter להפעלה, Esc לסגירת תפריטים וחלונות.',
  li2: 'תפריט נגישות: הגדלת טקסט, ניגודיות גבוהה, הדגשת קישורים, גופן קריא, סמן גדול ועצירת אנימציות.',
  li3: 'תמיכה אוטומטית בהעדפת "הפחתת תנועה" של מערכת ההפעלה.',
  li4: 'מבנה כותרות תקין, טקסט חלופי ותיוג ARIA לרכיבים אינטראקטיביים.',
  issueTitle: 'נתקלתם בקושי?',
  issueBody: 'אם נתקלתם ברכיב באתר שאינו נגיש, או שיש משהו שלא הצלחתם לעשות דרכו, נשמח שתספרו לנו ונטפל בזה במהירות. אפשר לפנות אלינו באחת מהדרכים האלה:',
  contactPhone: 'טלפון', contactWa: 'וואטסאפ', contactWaText: 'שליחת הודעה',
  known: 'נכון להיום איננו מכירים רכיב באתר שאינו נגיש. אם תמצאו כזה, זו בדיוק הפנייה שאנחנו רוצים לקבל.',
  date: 'עדכון אחרון: אוגוסט 2026',
};
const EN = {
  panel: 'Accessibility settings', fab: 'Accessibility menu',
  fs: 'Text size', fsDown: 'Decrease text', fsUp: 'Increase text',
  contrast: 'High contrast', links: 'Underlined links', font: 'Readable font', cursor: 'Large cursor', motion: 'Stop animations',
  reset: 'Reset', statement: 'Accessibility statement', close: 'Close window',
  modalTitle: 'Accessibility Statement',
  p1: 'The Elevate Creative website was made accessible out of the belief that every person deserves an equal, comfortable and respectful browsing experience, including people with disabilities.',
  p2: 'The site conforms to the Israeli Equal Rights for Persons with Disabilities regulations (service accessibility adjustments) 2013, Israeli Standard 5568 and the WCAG 2.1 level AA guidelines.',
  featTitle: 'Accessibility features on this site',
  li1: 'Full keyboard navigation: Tab to move between elements, Enter to activate, Esc to close menus and dialogs.',
  li2: 'Accessibility menu: text sizing, high contrast, underlined links, readable font, large cursor and stopping animations.',
  li3: 'Automatic support for the operating system\'s reduced-motion preference.',
  li4: 'Proper heading structure, alternative text and ARIA labelling for interactive elements.',
  issueTitle: 'Ran into a difficulty?',
  issueBody: 'If you came across anything on this site that is not accessible, or something you could not do through it, please tell us and we will fix it quickly. You can reach us in any of these ways:',
  contactPhone: 'Phone', contactWa: 'WhatsApp', contactWaText: 'Send a message',
  known: 'As of today we are not aware of any part of this site that is not accessible. If you find one, that is exactly the message we want to get.',
  date: 'Last updated: August 2026',
};

export function initA11y() {
  const s = loadA11yPrefs();
  const root = document.documentElement;
  const T = root.lang === 'en' ? EN : HE;

  const wrap = document.createElement('div');
  wrap.className = 'a11y';
  wrap.id = 'a11y';
  wrap.innerHTML = `
    <div class="a11y__panel" id="a11yPanel" role="group" aria-label="${T.panel}" aria-hidden="true" inert>
      <p class="a11y__title" dir="ltr">ACCESSIBILITY</p>
      <div class="a11y__row">
        <span class="a11y__row-label">${T.fs}</span>
        <span class="a11y__stepper" dir="ltr">
          <button type="button" class="a11y__step" data-a11y-fs="-1" aria-label="${T.fsDown}">−</button>
          <span class="a11y__fs" id="a11yFs" aria-live="polite">100%</span>
          <button type="button" class="a11y__step" data-a11y-fs="1" aria-label="${T.fsUp}">+</button>
        </span>
      </div>
      <button type="button" class="a11y__opt" data-a11y="contrast" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>${T.contrast}</button>
      <button type="button" class="a11y__opt" data-a11y="links" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>${T.links}</button>
      <button type="button" class="a11y__opt" data-a11y="font" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>${T.font}</button>
      <button type="button" class="a11y__opt" data-a11y="cursor" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>${T.cursor}</button>
      <button type="button" class="a11y__opt" data-a11y="motion" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>${T.motion}</button>
      <div class="a11y__foot">
        <button type="button" class="a11y__reset" id="a11yReset">${T.reset}</button>
        <button type="button" class="a11y__statement-link" id="a11yStatementBtn">${T.statement}</button>
      </div>
    </div>
    <button class="a11y-fab" id="a11yFab" type="button" aria-label="${T.fab}" aria-expanded="false" aria-controls="a11yPanel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/></svg>
    </button>`;
  document.body.appendChild(wrap);

  const modal = document.createElement('div');
  modal.className = 'a11y-modal';
  modal.id = 'a11yModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'a11yModalTitle');
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('inert', '');
  modal.innerHTML = `
    <div class="a11y-modal__backdrop" data-a11y-close></div>
    <div class="a11y-modal__box">
      <button class="a11y-modal__close" type="button" aria-label="${T.close}" data-a11y-close>×</button>
      <h2 id="a11yModalTitle">${T.modalTitle}</h2>
      <div class="a11y-modal__body">
        <p>${T.p1}</p>
        <p>${T.p2}</p>
        <p><strong>${T.featTitle}</strong></p>
        <ul>
          <li>${T.li1}</li>
          <li>${T.li2}</li>
          <li>${T.li3}</li>
          <li>${T.li4}</li>
        </ul>
        <p>${T.known}</p>
        <p><strong>${T.issueTitle}</strong> ${T.issueBody}</p>
        <ul class="a11y-modal__contact">
          <li><strong>${T.contactPhone}:</strong> <a href="tel:+972546679080" dir="ltr">054-667-9080</a></li>
          <li><strong>${T.contactWa}:</strong> <a href="https://wa.me/972546679080" target="_blank" rel="noopener">${T.contactWaText}</a></li>
        </ul>
        <p class="a11y-modal__date">${T.date}</p>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const fab = wrap.querySelector('.a11y-fab');
  const panel = wrap.querySelector('.a11y__panel');
  const fsOut = wrap.querySelector('#a11yFs');
  const opts = wrap.querySelectorAll('[data-a11y]');

  const save = () => localStorage.setItem(KEY, JSON.stringify(s));
  const apply = () => {
    Object.entries(FLAGS).forEach(([k, cls]) => root.classList.toggle(cls, !!s[k]));
    root.style.fontSize = s.fs ? `${100 + s.fs * 12.5}%` : '';
    fsOut.textContent = `${100 + (s.fs || 0) * 12.5}%`;
    opts.forEach((b) => b.setAttribute('aria-pressed', String(!!s[b.dataset.a11y])));
    wrap.classList.toggle('has-active', Object.keys(FLAGS).some((k) => s[k]) || !!s.fs);
    window.dispatchEvent(new Event('resize')); // let ScrollTrigger re-measure after font-size shifts
  };

  /* ----- panel open/close (mirrors the dock) ----- */
  const setOpen = (open) => {
    const wasInside = panel.contains(document.activeElement);
    wrap.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    panel.toggleAttribute('inert', !open);
    /* The panel sits BEFORE the button in the DOM, so tabbing on from the
       button leaves the widget rather than entering it. Opening therefore has
       to hand focus over itself, and closing has to hand it back if it is
       still in there — otherwise focus is left on an inert element. */
    if (open) { const first = panel.querySelector('button'); if (first) first.focus(); }
    else if (wasInside) fab.focus();
  };
  fab.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!wrap.classList.contains('is-open')); });
  document.addEventListener('click', (e) => { if (wrap.classList.contains('is-open') && !wrap.contains(e.target)) setOpen(false); });

  /* ----- statement modal ----- */
  let lastFocus = null;
  const openModal = () => {
    lastFocus = document.activeElement;
    setOpen(false);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.removeAttribute('inert');
    modal.querySelector('.a11y-modal__close').focus();
  };
  const closeModal = () => {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  wrap.querySelector('#a11yStatementBtn').addEventListener('click', openModal);
  modal.querySelectorAll('[data-a11y-close]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setOpen(false); closeModal(); } });

  /* The statement also has to be reachable from the page itself, not only from
     inside this panel: the regulations want a plain, prominent link on every
     page. The footer carries one pointing at #accessibility.

     This module is lazy-loaded once the browser is idle, so the link can be
     clicked before any of this exists. That is why it is a real href rather
     than a JS-only button — the click lands in the address bar either way, and
     whichever of the two happens second opens the window. */
  document.querySelectorAll('[data-a11y-statement]').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', '#accessibility'); openModal(); });
  });
  if (location.hash === '#accessibility') openModal();
  window.addEventListener('hashchange', () => { if (location.hash === '#accessibility') openModal(); });

  /* Arrow keys walk the panel, and Tab is kept inside it while it is open, so
     nobody tabs out into the page behind with the panel still hanging open. */
  const stops = () => [...panel.querySelectorAll('button')].filter((el) => el.offsetParent !== null);
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Tab') return;
    const list = stops();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'Tab') {
      if (e.shiftKey && i === 0) { e.preventDefault(); list[list.length - 1].focus(); }
      else if (!e.shiftKey && i === list.length - 1) { e.preventDefault(); list[0].focus(); }
      return;
    }
    e.preventDefault();
    list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length].focus();
  });

  /* ----- controls ----- */
  opts.forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.a11y;
    s[k] = !s[k];
    save();
    if (k === 'motion') { location.reload(); return; } // reboot into the reduced-motion path
    apply();
  }));
  wrap.querySelectorAll('[data-a11y-fs]').forEach((b) => b.addEventListener('click', () => {
    s.fs = Math.min(FS_MAX, Math.max(0, (s.fs || 0) + Number(b.dataset.a11yFs)));
    save();
    apply();
  }));
  wrap.querySelector('#a11yReset').addEventListener('click', () => {
    const hadMotion = !!s.motion;
    Object.keys(s).forEach((k) => delete s[k]);
    save();
    if (hadMotion) { location.reload(); return; }
    apply();
  });

  apply();
}
