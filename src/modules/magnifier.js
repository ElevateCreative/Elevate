/* ============================================================
   IMAGE MAGNIFIER — a loupe over a screenshot
   ------------------------------------------------------------
   The gallery argues that the details are the work, so the visitor is given a way
   to actually go and look at them: the pointer becomes a lens and the pixels under
   it are drawn at 2.6x. The image is painted into a canvas rather than sitting in
   an <img> because the zoom is a second drawImage of the same texture through a
   circular clip — no second asset, no blur from CSS scaling.

   It renders on demand (pointer move, resize, load) rather than on a rAF loop: a
   still lens has nothing to redraw, and this page can hold several of these.
   ============================================================ */

const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

export function initMagnifier(root = document) {
  const nodes = [...root.querySelectorAll('[data-magnify]')];
  if (!nodes.length) return;

  // touch has no hovering pointer to be a lens, so those visitors get the plain image
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  nodes.forEach((node) => {
    const src = node.dataset.magnify;
    const zoom = parseFloat(node.dataset.magnifyZoom) || 2.6;
    const lens = parseFloat(node.dataset.magnifyLens) || 118;
    const focusY = node.dataset.magnifyFocus ? parseFloat(node.dataset.magnifyFocus) / 100 : 0;

    if (!canHover) {
      const img = new Image();
      img.src = src;
      img.alt = node.getAttribute('aria-label') || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'mag__flat';
      node.appendChild(img);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'mag__canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', node.getAttribute('aria-label') || '');
    node.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let img = null;
    let placed = { dx: 0, dy: 0, dw: 0, dh: 0 };
    let dpr = DPR();
    let lx = 0, ly = 0;
    let hovering = false;

    function layout() {
      dpr = DPR();
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (!img) { placed = { dx: 0, dy: 0, dw: canvas.width, dh: canvas.height }; return; }
      const iw = img.naturalWidth || 1;
      const ih = img.naturalHeight || 1;
      // cover: fill the frame and crop, biased to the top of the shot where the design is
      const scale = Math.max(canvas.width / iw, canvas.height / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      placed = { dx: (canvas.width - dw) / 2, dy: (canvas.height - dh) * focusY, dw, dh };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!img) return;
      ctx.drawImage(img, placed.dx, placed.dy, placed.dw, placed.dh);
      if (!hovering) return;

      const cx = lx * dpr;
      const cy = ly * dpr;
      const r = lens * dpr;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      // keep the point under the lens fixed while everything around it grows
      ctx.drawImage(
        img,
        cx - (cx - placed.dx) * zoom,
        cy - (cy - placed.dy) * zoom,
        placed.dw * zoom,
        placed.dh * zoom,
      );
      ctx.restore();

      // brand-blue rim + a soft inner edge, so the loupe reads as glass, not as a hole
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = 2 * dpr;
      ctx.strokeStyle = 'rgba(0, 136, 255, 0.9)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r - 3 * dpr, 0, Math.PI * 2);
      ctx.lineWidth = 6 * dpr;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.stroke();
    }

    const loading = new Image();
    loading.decoding = 'async';
    loading.onload = () => { img = loading; layout(); draw(); };
    loading.src = src;

    const ro = new ResizeObserver(() => { layout(); draw(); });
    ro.observe(canvas);

    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      lx = e.clientX - rect.left;
      ly = e.clientY - rect.top;
      hovering = true;
      node.classList.add('is-lensing');
      draw();
    }, { passive: true });
    canvas.addEventListener('pointerleave', () => {
      hovering = false;
      node.classList.remove('is-lensing');
      draw();
    });

    layout();
    draw();
  });
}
