/* ═════════════════════════════════════════════════════════════
   VIGDER · SPECTRE · WebGL layer
   1) Eclipse backdrop: frozen aurora shader, ice-blue folds
   2) NOIR flacon: black glass + chrome, scroll spin + drag spin
   ═════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, 1.75);

/* ─────────────────────────────────────────────
   1 · AURORA BACKDROP
   ───────────────────────────────────────────── */
(function aurora() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec2  uRes;
      uniform vec2  uMouse;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = rot * p * 2.02;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uRes.xy;
        vec2 p = uv;
        p.x *= uRes.x / uRes.y;

        float t = uTime * 0.038;
        vec2 m = (uMouse - 0.5) * 0.32;

        float n1 = fbm(p * 1.4 + vec2(t * 0.8, -t * 0.3) + m);
        float n2 = fbm(p * 2.8 - vec2(t * 0.45, t * 0.2) + n1 * 1.5);
        float folds = fbm(p * 1.9 + n2 * 1.7 - m * 0.5);

        float band = sin((p.y * 1.3 + folds * 3.6 + t) * 6.28318);
        float ridge = pow(abs(band), 3.4);
        float sheen = pow(clamp(n2 * 1.2 - 0.28, 0.0, 1.0), 3.0);

        vec3 voidc = vec3(0.012, 0.014, 0.030);
        vec3 deep  = vec3(0.040, 0.060, 0.115);
        vec3 ice   = vec3(0.560, 0.740, 1.000);

        vec3 col = mix(voidc, deep, folds);
        col += ice * ridge * sheen * 0.30;
        col += ice * pow(sheen, 2.2) * 0.05;

        // cold horizon breathing at the floor
        col += vec3(0.75, 0.85, 1.0) * pow(1.0 - uv.y, 5.5) * 0.10;

        float vig = smoothstep(1.3, 0.35, distance(uv, vec2(0.5, 0.46)));
        col *= mix(0.5, 1.0, vig);

        col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
    depthWrite: false,
    depthTest: false,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const mouseTarget = new THREE.Vector2(0.5, 0.5);
  window.addEventListener('pointermove', (e) => {
    mouseTarget.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * DPR, h * DPR);
  }
  window.addEventListener('resize', resize);
  resize();

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 })
    .observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(mouseTarget, 0.045);
    renderer.render(scene, camera);
  }

  if (REDUCE) {
    uniforms.uTime.value = 20;
    resize();
    renderer.render(scene, camera);
  } else {
    tick();
  }
})();

/* ─────────────────────────────────────────────
   2 · NOIR FLACON · glass + chrome
   ───────────────────────────────────────────── */
(function noirFlacon() {
  const canvas = document.getElementById('noirCanvas');
  const section = document.getElementById('noir');
  if (!canvas || !section) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    section.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(DPR);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 1.35, 7.6);
  camera.lookAt(0, 1.05, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x060608,
    roughness: 0.07,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.4,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: 0xdfe7f2,
    metalness: 1.0,
    roughness: 0.16,
    envMapIntensity: 1.15,
  });

  const flacon = new THREE.Group();

  const profile = [
    [0.00, 0.00], [0.46, 0.00], [0.56, 0.05], [0.60, 0.16],
    [0.62, 0.70], [0.62, 1.40], [0.58, 1.62], [0.44, 1.80],
    [0.26, 1.90], [0.20, 1.96], [0.19, 2.20],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  flacon.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 72), glass));

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.028, 20, 48), chrome);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 2.2;
  flacon.add(collar);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.25, 0.52, 48), chrome);
  cap.position.y = 2.48;
  flacon.add(cap);

  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.06, 48), chrome);
  capTop.position.y = 2.77;
  flacon.add(capTop);

  /* etched label */
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 512;
  const ctx = labelCanvas.getContext('2d');
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.anisotropy = 4;
  function drawLabel() {
    ctx.clearRect(0, 0, 512, 512);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#dbe7ff';
    ctx.font = '72px "Stardom", "Space Grotesk", Arial, sans-serif';
    ctx.fillText('V I G D E R', 256, 208);
    ctx.fillRect(156, 246, 200, 2);
    ctx.font = '46px "Stardom", "Space Grotesk", Arial, sans-serif';
    ctx.fillText('N O I R', 256, 318);
    ctx.fillStyle = 'rgba(238,241,246,0.72)';
    ctx.font = '22px "Stardom", "Space Grotesk", Arial, sans-serif';
    ctx.fillText('EXTRAIT DE PARFUM · 50 ML', 256, 378);
    labelTex.needsUpdate = true;
  }
  drawLabel();
  /* redraw once the brand webfont is ready */
  if (document.fonts?.ready) document.fonts.ready.then(drawLabel);

  const labelArc = 1.15;
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.632, 0.632, 0.85, 48, 1, true, -labelArc / 2, labelArc),
    new THREE.MeshStandardMaterial({
      map: labelTex,
      transparent: true,
      roughness: 0.3,
      metalness: 0.75,
      envMapIntensity: 0.8,
    })
  );
  label.position.y = 1.02;
  flacon.add(label);

  flacon.position.y = -0.35;
  scene.add(flacon);

  /* lights: cold key, volt rim, deep fill */
  const key = new THREE.DirectionalLight(0xf2f7ff, 1.45);
  key.position.set(3.5, 4.5, 4);
  scene.add(key);

  const rim = new THREE.PointLight(0x4d9fff, 30, 20);
  rim.position.set(-3.2, 2.4, -2.6);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x2c4a7d, 0.5);
  fill.position.set(-2, 1, 3);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0x0e1626, 1.4));

  /* scroll-driven rotation */
  let scrollRotY = 0;
  let scrollTiltX = 0;
  if (window.gsap && window.ScrollTrigger && !REDUCE) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    const state = { p: 0 };
    window.gsap.to(state, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
        /* this module runs before main.js creates its pins */
        refreshPriority: -2,
      },
      onUpdate() {
        scrollRotY = state.p * Math.PI * 2.2;
        scrollTiltX = Math.sin(state.p * Math.PI) * 0.12;
      },
    });
  }

  /* drag to spin, with inertia */
  let dragOff = 0;
  let dragVel = 0;
  let dragging = false;
  let lastX = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    dragVel = dx * 0.0075;
    dragOff += dragVel;
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  /* pointer parallax */
  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 })
    .observe(section);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (!dragging) {
      dragOff += dragVel;
      dragVel *= 0.94;
    }
    flacon.rotation.y = -0.5 + scrollRotY + dragOff + pointer.x * 0.07;
    flacon.rotation.x = scrollTiltX + pointer.y * 0.04;
    flacon.position.y = -0.35 + Math.sin(t * 1.1) * 0.045;
    renderer.render(scene, camera);
  }

  if (REDUCE) {
    flacon.rotation.y = 0.6;
    resize();
    renderer.render(scene, camera);
  } else {
    tick();
  }
})();
