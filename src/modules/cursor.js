/* Minimal platinum cursor: snappy dot + trailing ring that grows over targets. */
export function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor = document.querySelector('.cursor');
  if (!cursor) return;
  const ring = cursor.querySelector('.cursor__ring');
  const dot = cursor.querySelector('.cursor__dot');

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  };
  loop();

  /* Delegated, not per-element: one pair of listeners instead of ~60, and it keeps
     working for anything mounted later (the accessibility widget is now lazy-loaded). */
  const targets = 'a, button, [data-magnetic], [data-tilt], input, textarea, .service, .tile';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest?.(targets)) cursor.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest?.(targets) && !e.relatedTarget?.closest?.(targets)) cursor.classList.remove('is-hover');
  });

  document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
  document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));
}
