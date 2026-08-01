/* ============================================================
   BLOB REVEAL — an image that grows into frame in organic patches
   ------------------------------------------------------------
   Not a fade and not a wipe: a handful of soft masses bloom out of the picture and
   merge until they have covered it. A straight circle would read as a graphic disc,
   so the mask is pushed through an feTurbulence displacement — the edge wobbles, the
   patches meet at soft joins, and the whole thing looks like liquid rather than
   geometry.

   Built as SVG rather than WebGL on purpose. The reference implementation for this
   effect is three.js + a fragment shader, which is ~600KB of runtime for one
   entrance; this site dropped three.js once already to get its bundle from 701KB to
   ~140KB (see SPEC.md §8) and is not paying that again. An <image> inside an SVG
   <mask> costs nothing and is supported everywhere.

   The filter is desktop-only. Re-rasterising a displaced mask over a full-width
   image every frame is exactly the class of work that made the arrow unaffordable on
   phones, so touch devices get the same masses without the displacement.
   ============================================================ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* Fixed, hand-placed seeds rather than Math.random(): the reveal should look the same
   on every visit, and one of these has to start at the centre or the picture appears
   to open from a corner. Values are fractions of the frame. */
const SEEDS = [
  { x: 0.50, y: 0.54, r: 0.30, delay: 0.00 },
  { x: 0.20, y: 0.30, r: 0.20, delay: 0.22 },
  { x: 0.79, y: 0.26, r: 0.22, delay: 0.14 },
  { x: 0.13, y: 0.78, r: 0.18, delay: 0.40 },
  { x: 0.86, y: 0.76, r: 0.20, delay: 0.32 },
  { x: 0.36, y: 0.88, r: 0.16, delay: 0.52 },
  { x: 0.66, y: 0.08, r: 0.16, delay: 0.48 },
];

let uid = 0;

export function initBlobReveal({ reduced = false } = {}) {
  const nodes = [...document.querySelectorAll('[data-blob-reveal]')];
  if (!nodes.length) return;

  const light = reduced || window.matchMedia('(max-width: 760px), (hover: none) and (pointer: coarse)').matches;

  nodes.forEach((node) => {
    const src = node.dataset.blobReveal;
    const label = node.getAttribute('aria-label') || '';

    if (reduced) {
      const img = new Image();
      img.src = src; img.alt = label; img.decoding = 'async';
      img.className = 'blobrev__flat';
      node.appendChild(img);
      return;
    }

    const id = `br${++uid}`;
    /* The SVG's user space has to carry the ELEMENT's proportions, not a square. With a
       square viewBox stretched to a 16:9 box, `slice` fits the photo to the square first
       and the stretch then squashes it — the screenshot came out visibly wide. Sizing the
       user space to the box makes the mapping uniform: the picture is undistorted and the
       mask's circles stay circles. */
    const box = node.getBoundingClientRect();
    const VW = 1000;
    const VH = Math.round(VW * (box.height / (box.width || 1))) || 562;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'blobrev__svg');
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);

    const defs = document.createElementNS(SVG_NS, 'defs');

    if (!light) {
      const filter = document.createElementNS(SVG_NS, 'filter');
      filter.setAttribute('id', `${id}-warp`);
      // generous bounds: the displacement pushes pixels well outside the shapes' own boxes
      filter.setAttribute('x', '-30%'); filter.setAttribute('y', '-30%');
      filter.setAttribute('width', '160%'); filter.setAttribute('height', '160%');
      filter.innerHTML =
        '<feTurbulence type="fractalNoise" baseFrequency="0.004 0.006" numOctaves="3" seed="11" result="noise"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="noise" scale="180" xChannelSelector="R" yChannelSelector="G"/>';
      defs.appendChild(filter);
    }

    const mask = document.createElementNS(SVG_NS, 'mask');
    mask.setAttribute('id', `${id}-mask`);
    const group = document.createElementNS(SVG_NS, 'g');
    if (!light) group.setAttribute('filter', `url(#${id}-warp)`);

    const circles = SEEDS.map((s) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', String(s.x * VW));
      c.setAttribute('cy', String(s.y * VH));
      c.setAttribute('r', '0');
      c.setAttribute('fill', '#fff');
      group.appendChild(c);
      return c;
    });
    mask.appendChild(group);
    defs.appendChild(mask);
    svg.appendChild(defs);

    const image = document.createElementNS(SVG_NS, 'image');
    image.setAttribute('href', src);
    image.setAttribute('x', '0'); image.setAttribute('y', '0');
    image.setAttribute('width', String(VW)); image.setAttribute('height', String(VH));
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    image.setAttribute('mask', `url(#${id}-mask)`);
    svg.appendChild(image);
    node.appendChild(svg);

    /* Each mass grows to whatever radius reaches the corner FURTHEST from it, plus room
       for the displacement to wobble the edge back inwards. Sized to the frame rather
       than to a constant, so the reveal finishes exactly as the last corner is covered
       instead of running on with nothing left to uncover. */
    const reach = (s) => {
      const px = s.x * VW, py = s.y * VH;
      const far = Math.max(
        Math.hypot(px, py), Math.hypot(VW - px, py),
        Math.hypot(px, VH - py), Math.hypot(VW - px, VH - py),
      );
      return far * (0.30 + s.r) + 200;
    };
    /* power1.out, not power2.out: with the sharper curve the masses were at four fifths
       of their final size within the first third of the timeline, so the reveal was over
       before it had been seen. */
    const tl = gsap.timeline({ paused: true });
    circles.forEach((c, i) => {
      tl.fromTo(c, { attr: { r: 0 } }, { attr: { r: reach(SEEDS[i]) }, duration: 1.7, ease: 'power1.out' }, SEEDS[i].delay);
    });

    ScrollTrigger.create({
      trigger: node,
      start: 'top 82%',
      onEnter: () => tl.play(),
      // replays on the way back up: this is the section's entrance, and it should still
      // be an entrance the second time you come down to it
      onLeaveBack: () => tl.pause(0),
    });
  });
}
