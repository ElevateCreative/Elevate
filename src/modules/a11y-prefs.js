/* Saved accessibility preferences.
   Split out of a11y.js on purpose: main.js needs to read `motion` synchronously at
   boot (it decides the whole reduced-motion path), but the widget itself — markup,
   two languages of strings, the statement modal — is dead weight on first paint and
   is now lazy-loaded once the page is idle. */

export const A11Y_KEY = 'elevate-a11y';

export function loadA11yPrefs() {
  try { return JSON.parse(localStorage.getItem(A11Y_KEY)) || {}; } catch { return {}; }
}
