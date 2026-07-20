/* i18n — Hebrew (source of truth, lives in the HTML) ↔ English.
   The saved language is applied to <html lang/dir> before first paint by the
   inline <head> script; here we swap the visible copy (data-i18n / data-i18n-aria)
   synchronously at boot, BEFORE any GSAP text-splitting or measuring runs.
   Switching languages reloads the page (same pattern as the a11y "stop animations"
   toggle) so every measurement, split and snap-point is rebuilt cleanly. */

const KEY = 'elevate-lang';

const EN = {
  /* meta */
  'meta.title': 'Elevate Creative · Premium Web Design & Development Agency',
  'meta.desc': 'Elevate Creative is a digital and creative agency building premium, high-performance websites. Web design, development, branding and SEO that lift your business above the competition.',
  'meta.og.desc': 'Premium web design and development. Digital experiences that launch brands above the competition.',

  /* chrome */
  'skip': 'Skip to content',
  'nav.manifesto': 'Manifesto',
  'nav.work': 'Work',
  'nav.cta': 'Contact',
  'dock.home': 'Home',
  'dock.manifesto': 'Manifesto',
  'dock.services': 'Services',
  'dock.work': 'Work',
  'dock.process': 'Process',
  'dock.contact': 'Contact',
  'dock.theme': 'Theme',
  'dock.lang': 'Language',
  'aria.menu': 'Navigation menu',
  'aria.theme': 'Dark or light mode',

  /* hero */
  'hero.seo': 'Elevate Creative · premium web design, development and creative agency',
  'hero.scroll': 'SCROLL',
  'pw.1': 'Premium websites',
  'pw.2': 'Unforgettable design',
  'pw.3': 'A presence that lifts',

  /* manifesto */
  'about.l1': 'Through emotion, strategy',
  'about.l2': 'and design, we push the',
  'about.l3': 'boundaries of digital craft.',
  'about.upper': 'A digital and creative agency crafting premium websites and unforgettable experiences.',
  'about.link': 'About us',
  'about.lead': 'Elevate Creative was born to take businesses, lift them and launch them to the next level. We distil the identity of every brand and tailor it a stunning premium website, one that speaks its exact language and pushes it above the competition.',

  /* services */
  'services.h2': 'Web design, development and creative services',
  'services.intro': 'From strategy to launch, everything you need to build a digital presence that leads, all under one roof.',
  'service.1.name': 'Strategy & Branding',
  'service.1.desc': 'Distilling the story, the voice and the edge that make you unforgettable.',
  'service.2.name': 'Experience Design · UX/UI',
  'service.2.desc': 'Beautiful interfaces that feel natural, guide the eye and turn visitors into clients.',
  'service.3.name': 'Premium Web Development',
  'service.3.desc': 'Clean, fast, precise code, with living animations that feel expensive.',
  'service.4.name': 'Motion, 3D & Interaction',
  'service.4.desc': 'Movement that tells a story, draws attention and leaves an emotional mark.',
  'service.5.name': 'Launch & Optimisation',
  'service.5.desc': 'SEO, performance and analytics, so you keep climbing after going live.',

  /* work */
  'work.h2': 'Featured work · website portfolio',
  'work.all': 'All work',
  'work.jp.sub': 'Recruitment agency',
  'work.vg.sub': 'Tech couture · concept site',
  'work.um.sub': 'Smart sun window · concept site',
  'work.next.h': 'The next one',
  'work.next.sub': 'could be yours?',
  'work.next.aria': 'The next project could be yours. Talk to us',
  'work.note': '* Job Power, a live client site. VIGDER and UMBRAS, live concept sites we built from scratch, step in and explore. The last tile is waiting for your project.',

  /* process */
  'process.l1': 'A precise process,',
  'process.l2': 'a result that lifts.',
  'step.1.name': 'Discovery',
  'step.1.desc': 'We dive deep into the business, the audience and the goals, and find what truly sets you apart.',
  'step.2.name': 'Strategy',
  'step.2.desc': 'We shape a direction, a message and an experience architecture that speak your exact language.',
  'step.3.name': 'Design & Build',
  'step.3.desc': 'We craft a visual language and code a fast, living site, animated down to the last pixel.',
  'step.4.name': 'Launch & Rise',
  'step.4.desc': 'We go live, measure, refine, and keep launching you forward.',

  /* CTA marquee */
  'cta.aria': 'Websites far beyond design',
  'cta.1': 'Websites far beyond design',
  'cta.2': 'Innovative technology',
  'cta.3': 'Unforgettable user experiences',
  'cta.4': 'Driving your business forward',

  /* contact */
  'contact.l1': 'Ready to',
  'contact.l2': 'level up?',
  'contact.sub': 'Tell us about your business, and we will return a digital vision that lifts you above everyone else.',
  'contact.about': 'Elevate Creative is led by Orel and Agam, a team driven by a shared passion for digital excellence and cutting-edge design. We founded the studio to help businesses transcend their digital boundaries with premium, high-performance websites. We combine strategic thinking with meticulous craftsmanship to ensure your brand stands out, performs flawlessly, and stays ahead of the competition.',
  'wa.title': 'Talk to us on WhatsApp',
  'wa.sub': 'Click to send a message and we will get back to you fast',
  'wa.arrow': '→',
  'phones.label': 'Or give us a call',
  'phones.orel': 'Orel',
  'phones.agam': 'Agam',
  'socials.aria': 'Social media',

  /* footer */
  'footer.legal.aria': 'Legal documents',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Use',
};

export function currentLang() {
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'he'; } catch { return 'he'; }
}

export function applyI18n() {
  if (currentLang() !== 'en') return;

  document.title = EN['meta.title'];
  document.querySelector('meta[name="description"]')?.setAttribute('content', EN['meta.desc']);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', EN['meta.title']);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', EN['meta.og.desc']);
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', 'en_US');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = EN[el.dataset.i18n];
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const v = EN[el.dataset.i18nAria];
    if (v != null) el.setAttribute('aria-label', v);
  });
}

export function initLangToggle() {
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = currentLang() === 'en' ? 'he' : 'en';
      try { localStorage.setItem(KEY, next); } catch { /* private mode — the reload just stays in the current language */ }
      location.reload();
    });
  });
}
