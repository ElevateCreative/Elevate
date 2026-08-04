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

  /* contact */
  'contact.l1': 'Ready to',
  'contact.l2': 'level up?',
  'contact.sub': 'Tell us about your business, and we will return a digital vision that lifts you above everyone else.',
  'elastic.hint': 'Drag the letters ✦ then let go',
  'contact.about': 'Elevate Creative is led by Orel, driven by a deep passion for digital excellence and cutting-edge design. The studio was founded to help businesses transcend their digital boundaries with premium, high-performance websites. We combine strategic thinking with meticulous craftsmanship to ensure your brand stands out, performs flawlessly, and stays ahead of the competition.',
  'wa.title': 'Talk to us on WhatsApp',
  'wa.sub': 'Click to send a message and we will get back to you fast',
  'wa.arrow': '→',
  'phones.label': 'Or give us a call',
  'socials.aria': 'Social media',

  /* footer */
  'footer.legal.aria': 'Legal documents',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Use',
  'footer.a11y': 'Accessibility Statement',

  /* ---------- the word carried across the page transition ---------- */
  'xfade.work': 'WORK',
  'xfade.home': 'ELEVATE',

  /* ================= /work/ — the case-study gallery ================= */
  'work.meta.title': 'Projects · The Elevate Creative Portfolio',
  'work.meta.desc': 'Behind every site there is a process. Projects from Elevate Creative: each element of a client site, the problem it solves, the decision we made and the marketing logic behind it. Starting with Job Power HR.',

  'work.nav.studio': 'The studio',
  'work.dock.back': 'Back to the site',
  'work.dock.case': 'The project',
  'work.dock.decisions': 'The decisions',
  'work.dock.result': 'The result',

  'work.intro.h1': 'Every pixel here is a decision',
  'work.intro.lead': 'This is not a gallery of pretty pictures. Each card takes one element out of a real site we built and shows the three things nobody sees from the outside: what the problem was, what we decided to do, and why it works commercially. A look inside our UI/UX process.',
  'work.intro.m1': 'project',
  'work.intro.m2': 'decisions taken apart',
  'work.intro.m3': 'hours on the details',

  'work.label.problem': 'The problem',
  'work.label.decision': 'The decision',
  'work.label.why': 'The marketing logic',
  'work.label.a11y': 'Accessibility',
  'work.flip.cta': 'Flip it',

  'work.case.name': 'Job Power',
  'work.case.sub': 'Recruitment and staffing · Hadera · since 2010',
  'work.case.mediaAlt': 'The first screen of the Job Power site',
  'work.case.f1.k': 'Client',
  'work.case.f2.k': 'Sector',
  'work.case.f2.v': 'Recruitment and human-resources staffing',
  'work.case.f3.k': 'What we did',
  'work.case.f3.v': 'Strategy · UX/UI · Development · Accessibility · SEO · Two languages',
  'work.case.f4.k': 'How it is built',
  'work.case.f4.v': 'HTML, CSS and JavaScript. GSAP and Lenis. No CMS, no template.',
  'work.case.f5.k': 'Live site',
  'work.case.brief': 'The company has an excellent name in Hadera and the Hefer Valley, and a website from 2010 that said none of it. Two completely different audiences shared one page, job seekers and employers, and each of them wanted something else entirely. Everything below is how we solved that, one decision at a time.',

  'work.d1.kicker': 'The starting point',
  'work.d1.title': 'Same business, two decades',
  'work.d1.problem': 'The previous site went live in 2010 and stayed there. A single page built on tables, a graphic menu, a stock photo, no mobile version and nothing that says this company is serious. The business itself moved fifteen years forward. The site did not.',
  'work.d1.why': 'A staffing agency\'s website is almost never the first thing anyone sees. It opens after somebody has already heard of you, usually on a phone. It is not the advertising, it is the proof. When it looks old it quietly contradicts everything the person who recommended you just said.',
  'work.d1.altOld': 'The old Job Power site, captured in 2018',
  'work.d1.altNew': 'The new Job Power site, 2026',
  'work.d1.cap': 'The old site is a capture from the Internet Archive. Click the card to flip it.',

  'work.d2.kicker': 'The first screen',
  'work.d2.title': 'Three fields, two cuts',
  'work.d2.problem': 'The site has two audiences who want opposite things. A job seeker wants to send a CV. An employer wants filtered candidates on their desk. A page that tries to speak to both in the same sentence speaks to neither.',
  'work.d2.decision': 'We split the first screen into three fields on two diagonal cuts. The violet, the brand colour, holds the middle and most of the screen. The two sides are slivers carrying only a label and a headline. Reach for one and it throws open: the copy and the button unfold, the cut slides across, and the violet folds back to a strip.',
  'work.d2.why': 'This way the page says who it is first, and answers "what do you need" only once you reach for it. A vertical divider would read as a table of two equal columns. A diagonal commits the page to a direction, and gives the eye somewhere to travel.',
  'work.d2.demo.sub': 'Recruitment and staffing · Hadera',
  'work.d2.demo.hireK': 'Hiring',
  'work.d2.demo.hireH': 'The right person, without months of searching',
  'work.d2.demo.hireL': 'A database updated daily, professional screening and assessment, and filtered candidates on your desk.',
  'work.d2.demo.hireC': 'Find people',
  'work.d2.demo.seekK': 'Looking for work',
  'work.d2.demo.seekH': 'Your next role is already in the database',
  'work.d2.demo.seekL': 'Send a CV and we match you to a role that genuinely fits, with personal support up to your first day.',
  'work.d2.demo.seekC': 'Send a CV',
  'work.d2.demo.hint': 'Hover one of the sides',
  'work.d2.demo.hintTouch': 'Tap one of the sides',
  'work.d2.cap': 'The real mechanic, rebuilt here so you can play with it.',
  'work.d2.deep': 'The entire geometry is four numbers: where each of the two cuts meets the top and the bottom edge. Every field clip, both seam lights, the hover states and the position of the lockup all derive from those four, so the colour boundary and the light sitting on it cannot drift out of register. The lockup is a sibling of the fields rather than a child of one — as a child, every opening side would have shrunk it, and the brand would have appeared to retreat from its own page.',

  'work.d3.kicker': 'One committed idea',
  'work.d3.title': 'Perform it, do not claim it',
  'work.d3.problem': 'In the first version every section said exactly the same sentence: numbered eyebrow, title, subtitle, grid. Six times in a row, two of them grids of six identical tiles. That is what reads as basic. Not the colours, not the typeface.',
  'work.d3.decision': 'We built one section that IS the idea of the site. Two streams travel in opposite directions, candidates in one and roles in the other, and your scroll is what drags them past each other. Whichever pair crosses the centre line locks together and lights it.',
  'work.d3.why': 'It is the company\'s actual job as a mechanic, not as a claim. Nobody really believes the sentence "we match people to jobs", because every agency in the sector writes it. Everybody believes something happening in front of them, at a pace they control.',
  'work.d3.demo.people': 'Candidates',
  'work.d3.demo.roles': 'Open roles',
  'work.d3.demo.badge': 'MATCH',
  'work.d3.p1b': 'Software engineer', 'work.d3.p1i': '7 years experience',
  'work.d3.p2b': 'Bookkeeper', 'work.d3.p2i': 'Grade 3',
  'work.d3.p3b': 'Maintenance technician', 'work.d3.p3i': 'Certified',
  'work.d3.p4b': 'Recruitment coordinator', 'work.d3.p4i': 'Graduate',
  'work.d3.p5b': 'Licensed electrician', 'work.d3.p5i': 'Practical engineer',
  'work.d3.p6b': 'Medical secretary', 'work.d3.p6i': 'Speaks 3 languages',
  'work.d3.r1b': 'Industrial plant', 'work.d3.r1i': 'Hadera',
  'work.d3.r2b': 'Accountancy firm', 'work.d3.r2i': 'Pardes Hanna',
  'work.d3.r3b': 'Logistics centre', 'work.d3.r3i': 'Caesarea',
  'work.d3.r4b': 'Startup', 'work.d3.r4i': 'Herzliya',
  'work.d3.r5b': 'Hotel', 'work.d3.r5i': 'Netanya',
  'work.d3.r6b': 'Private clinic', 'work.d3.r6i': 'Hadera',
  'work.d3.cap': 'Scroll the page. The streams drift on their own, and scrolling accelerates them.',
  'work.d3.deep': 'Two thresholds drive it. The chip nearest the line always highlights, so it is always clear what is in the window. The line itself ignites only on a real alignment. A single loose threshold left it lit for the whole section, and then the lock means nothing. Each chip\'s width is rounded to an exact divisor of the total, or the two streams would be permanently out of phase and a meeting on the line would be a coincidence rather than a structure.',

  'work.d4.kicker': 'Colour',
  'work.d4.title': 'Colour is signage, not decoration',
  'work.d4.decision': 'The palette stays in one family. Fuchsia on one side, indigo on the other, and the brand violet between them. No blue, no teal, no "accent" colour that arrived because something felt missing.',
  'work.d4.why': 'The two routes are told apart by colour before a single word is read. Once the eye has learned that the fuchsia side belongs to job seekers, it never has to read that label again anywhere else on the site. That saves the reader work on every scroll.',
  'work.d4.magAlt': 'The first screen with the job-seekers field thrown open',
  'work.d4.hint': 'Hover to zoom in',
  'work.d4.cap': 'Five shades of one family and a single background. The whole site is built from this.',

  'work.d5.kicker': 'Buttons',
  'work.d5.title': 'A material, not a style',
  'work.d5.decision': 'The buttons get a language of their own: a specular rim along the top edge, a lens highlight pulled from above, a dark far edge, and a blur that lifts and saturates the video passing behind.',
  'work.d5.why': 'The radius is part of the material, not a design preference. A two-pixel corner has no thickness for light to bend through. The rest of the site is near-square, and the buttons are the one place the language gives way, because they are the only thing on the page that should look like something you press.',
  'work.d5.btn1': 'Send a CV',
  'work.d5.btn2': 'Find people',
  'work.d5.cap': 'The background moves on purpose. A material is measured by what passes underneath it.',
  'work.d5.deep': 'The clear variants carry a dimming floor under the tint, so a white label never rides a bright frame of the video. The system respects the operating system: Reduce Transparency and Increase Contrast drop the material for an opaque colour, and Reduce Motion drops the press.',

  'work.d6.kicker': 'Mobile',
  'work.d6.title': 'A phone has no hover',
  'work.d6.problem': 'Every hover state simply never happened on a phone. The service cards, the advantages, the contact rows and the testimonial wall were completely flat there, and that is exactly where most visitors are.',
  'work.d6.decision': 'Making them tap targets would have been wrong, because most of them are links and a tap navigates. Instead every element lights as it crosses a thin band a little above the middle of the screen. Scrolling itself is the pointer.',
  'work.d6.why': 'Most enquiries arrive from a phone. A site whose whole life lives in hover states is a site most of your clients see switched off.',
  'work.d6.demo.lead': 'The Job Power advantage',
  'work.d6.c1b': 'Saves time and money', 'work.d6.c1i': 'No candidate screening, no job adverts.',
  'work.d6.c2b': 'The right candidates', 'work.d6.c2i': 'Professional sourcing with minimal response time.',
  'work.d6.c3b': 'Personal treatment', 'work.d6.c3i': 'Close support for both sides throughout.',
  'work.d6.c4b': 'Updated daily', 'work.d6.c4i': 'A large, quality database for every field.',
  'work.d6.c5b': 'Periodic feedback', 'work.d6.c5i': 'We check satisfaction over time.',
  'work.d6.c6b': '15+ years of experience', 'work.d6.c6i': 'Since 2010, across varied sectors.',
  'work.d6.cap': 'Scroll inside the screen. Exactly one card is lit, the one crossing the band.',
  'work.d6.deep': 'Measured at 812px tall: the band lands between 309 and 390 against a screen centre of 406, and exactly one card is lit at any moment, the one crossing it. The mechanic is gated behind a (hover: none) check in both the CSS and the script, so a device with a mouse keeps real hover and nothing is driven twice.',

  'work.d7.kicker': 'Performance',
  'work.d7.title': 'What is not loaded cannot slow you down',
  'work.d7.problem': 'Three things came down to the browser before the page could finish loading, and none of them needed to be there.',
  'work.d7.decision': 'The logo was a 2826 by 2311 master file, and it is the first thing painted on the screen. Nowhere on the site shows it larger than 170px. The video library weighs more than all the rest of the code put together, and it is a polyfill that Safari and iOS downloaded and never called. It is now fetched only if the browser genuinely cannot play the stream by itself, and only after first paint.',
  'work.d7.why': 'A staffing agency\'s site opens on a phone, on the street, on a data plan. A second of loading is not a technical statistic, it is people who never reached the form.',
  'work.d7.k1': 'Logo',
  'work.d7.ondemand': 'on demand',
  'work.d7.total': 'off the initial load',
  'work.d7.cap': 'Every number here was measured before and after, not estimated.',
  'work.d7.deep': 'Two things were measured and deliberately left alone. Switching the fonts URL to the range form looks like a saving, but both URLs return exactly the same eight files, so that was documented in the code so it does not get "optimised" again later. Width and height attributes on the logo, normally a layout-stability win, fought the existing stylesheet and laid a 44px logo out at 356px. Reverted.',

  'work.d8.kicker': 'Languages and accessibility',
  'work.d8.title': 'Hebrew and Russian, not half a translation',
  'work.d8.decision': '157 translation keys. Every string on the page, the testimonials and the accessibility widget included. Hebrew stays the source of truth and stays inside the HTML, and the language file carries only what moves away from it, so switching back restores the real thing rather than a second copy of it that could drift.',
  'work.d8.why': 'Hadera and the Hefer Valley have a large Russian-speaking population, on the candidate side and the employer side alike. A partial translation is worse than none, because it says "we thought about you halfway".',
  'work.d8.a11y': 'The site conforms to Israeli Standard 5568 and to WCAG 2.1 level AA, with a full accessibility menu: text size, contrast, underlined links, a readable font and stopping animations. Even the language button shows the language you would switch TO, because a flag or the current language both read as "you are here".',
  'work.d8.altHe': 'The Hebrew build, laid out right to left',
  'work.d8.altRu': 'The Russian build, laid out left to right',
  'work.d8.cap': 'The same page, two reading directions. Note that everything mirrors, not only the text.',
  'work.d8.deep': 'The language file is the one script on the page that is not deferred. It sets lang and dir from local storage before the parser reaches the body, so a returning Russian visitor never watches the page lay itself out right to left and then flip. Almost the whole stylesheet is written in logical properties and mirrors on its own. What needed doing by hand was the hero, which is carved by physical clip percentages: its copy is pinned physically too, or the Russian build would have sent the seekers\' text to one side while its field stayed on the other.',

  'work.result.h2': 'This is what a process looks like',
  'work.result.lead': 'Each of the decisions above looks small on its own. Together they are the difference between a site that looks good and a site that works: one that says who you are in the first second, leads each audience to its own place, loads fast on a phone in the street, and speaks the client\'s language. This is what we do on every project.',
  'work.result.live': 'Visit the live Job Power site',
  'work.result.talk': 'Want one? Talk to us',
};

export function currentLang() {
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'he'; } catch { return 'he'; }
}

export function applyI18n() {
  if (currentLang() !== 'en') return;

  /* Each page names its own title/description keys, so one table can serve both
     documents without the gallery inheriting the studio page's meta. */
  const onWork = document.body.classList.contains('work-page');
  const titleKey = onWork ? 'work.meta.title' : 'meta.title';
  const descKey = onWork ? 'work.meta.desc' : 'meta.desc';

  document.title = EN[titleKey];
  document.querySelector('meta[name="description"]')?.setAttribute('content', EN[descKey]);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', EN[titleKey]);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', EN[onWork ? descKey : 'meta.og.desc']);
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', 'en_US');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = EN[el.dataset.i18n];
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const v = EN[el.dataset.i18nAria];
    if (v != null) el.setAttribute('aria-label', v);
  });
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    const v = EN[el.dataset.i18nAlt];
    if (v != null) el.setAttribute('alt', v);
  });
  /* Generic form: data-i18n-attr="attribute:key". The gallery needs it for the word the
     page transition carries — that word is an attribute, not text. */
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const v = EN[key];
      if (attr && v != null) el.setAttribute(attr, v);
    });
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
