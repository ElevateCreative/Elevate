/* תוסף נגישות — bespoke accessibility widget, styled to match the floating dock.
   Settings persist in localStorage ('elevate-a11y') and are re-applied before first
   paint by the inline <head> script; "stop animations" reloads the page so main.js
   boots straight into its reduced-motion path (no Lenis, no GSAP choreography). */

const KEY = 'elevate-a11y';
const FLAGS = { contrast: 'a11y-contrast', links: 'a11y-links', font: 'a11y-font', cursor: 'a11y-cursor', motion: 'a11y-no-motion' };
const FS_MAX = 3; // 100% → 137.5% in 12.5% steps

export function loadA11yPrefs() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export function initA11y() {
  const s = loadA11yPrefs();
  const root = document.documentElement;

  const wrap = document.createElement('div');
  wrap.className = 'a11y';
  wrap.id = 'a11y';
  wrap.innerHTML = `
    <div class="a11y__panel" id="a11yPanel" role="group" aria-label="הגדרות נגישות" aria-hidden="true" inert>
      <p class="a11y__title" dir="ltr">ACCESSIBILITY</p>
      <div class="a11y__row">
        <span class="a11y__row-label">גודל טקסט</span>
        <span class="a11y__stepper" dir="ltr">
          <button type="button" class="a11y__step" data-a11y-fs="-1" aria-label="הקטנת טקסט">−</button>
          <span class="a11y__fs" id="a11yFs" aria-live="polite">100%</span>
          <button type="button" class="a11y__step" data-a11y-fs="1" aria-label="הגדלת טקסט">+</button>
        </span>
      </div>
      <button type="button" class="a11y__opt" data-a11y="contrast" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>ניגודיות גבוהה</button>
      <button type="button" class="a11y__opt" data-a11y="links" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>הדגשת קישורים</button>
      <button type="button" class="a11y__opt" data-a11y="font" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>גופן קריא</button>
      <button type="button" class="a11y__opt" data-a11y="cursor" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>סמן גדול</button>
      <button type="button" class="a11y__opt" data-a11y="motion" aria-pressed="false"><span class="a11y__dot" aria-hidden="true"></span>עצירת אנימציות</button>
      <div class="a11y__foot">
        <button type="button" class="a11y__reset" id="a11yReset">איפוס</button>
        <button type="button" class="a11y__statement-link" id="a11yStatementBtn">הצהרת נגישות</button>
      </div>
    </div>
    <button class="a11y-fab" id="a11yFab" type="button" aria-label="תפריט נגישות" aria-expanded="false" aria-controls="a11yPanel">
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
      <button class="a11y-modal__close" type="button" aria-label="סגירת החלון" data-a11y-close>×</button>
      <h2 id="a11yModalTitle">הצהרת נגישות</h2>
      <div class="a11y-modal__body">
        <p>אתר Elevate Creative הונגש מתוך אמונה שלכל אדם מגיעה חוויית גלישה שווה, נוחה ומכבדת, כולל אנשים עם מוגבלות.</p>
        <p>האתר מותאם לדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג 2013, לתקן הישראלי (ת"י 5568) ולהנחיות WCAG 2.1 ברמה AA.</p>
        <p><strong>התאמות הנגישות באתר</strong></p>
        <ul>
          <li>ניווט מלא במקלדת: Tab למעבר בין רכיבים, Enter להפעלה, Esc לסגירת תפריטים וחלונות.</li>
          <li>תפריט נגישות: הגדלת טקסט, ניגודיות גבוהה, הדגשת קישורים, גופן קריא, סמן גדול ועצירת אנימציות.</li>
          <li>תמיכה אוטומטית בהעדפת "הפחתת תנועה" של מערכת ההפעלה.</li>
          <li>מבנה כותרות תקין, טקסט חלופי ותיוג ARIA לרכיבים אינטראקטיביים.</li>
        </ul>
        <p><strong>נתקלתם בקושי?</strong> נשמח לשמוע ולתקן במהירות.</p>
        <p>רכז נגישות: אגם · <a href="tel:+972543904753" dir="ltr">054-390-4753</a> · <a href="mailto:agamvigp@gmail.com" dir="ltr">agamvigp@gmail.com</a></p>
        <p class="a11y-modal__date">עדכון אחרון: יולי 2026</p>
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
    wrap.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    panel.toggleAttribute('inert', !open);
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
