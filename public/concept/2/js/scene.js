/* ═══════════════════════════════════════════════════════════
   UMBRAS · scene.js
   Procedural UMBRAS ONE device, cursor-driven sunlight,
   real cast shadow onto the page, dust motes.
   ═══════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* Kelvin → THREE.Color (Tanner Helland approximation, compacted) */
function kelvinToColor(k) {
  const t = k / 100;
  let r, g, b;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  const c = (v) => Math.min(255, Math.max(0, v)) / 255;
  return new THREE.Color(c(r), c(g), c(b));
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function radialTexture(inner, outer, stops) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, inner, 128, 128, outer);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function initScene(canvas, state) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    document.body.classList.add('no-webgl');
    return null;
  }

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCoarse ? 1.7 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, 8.4);

  /* environment for metals */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  /* ── lights ─────────────────────────────────────────────── */
  const hemi = new THREE.HemisphereLight(0xfff6e4, 0xe0c9a8, 0.65);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe0b0, 1.9);
  sun.position.set(3, 4, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  /* frustum kept wide enough that its edge is always off-screen, so the shadow
     never ends in a hard "cut" line across the page */
  sun.shadow.camera.left = -11;
  sun.shadow.camera.right = 11;
  sun.shadow.camera.top = 11;
  sun.shadow.camera.bottom = -11;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 40;
  sun.shadow.radius = 8;
  sun.shadow.bias = -0.0006;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);
  scene.add(sun.target);

  /* ── the page catches the device's shadow ───────────────── */
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ color: 0x4a2c0e, opacity: 0.2 })
  );
  shadowPlane.position.z = -2.7;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  /* ── materials ──────────────────────────────────────────── */
  const champagne = new THREE.MeshPhysicalMaterial({
    color: 0xe7d3ac, metalness: 1, roughness: 0.34,
    clearcoat: 0.55, clearcoatRoughness: 0.3,
  });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x5e5346, metalness: 0.85, roughness: 0.52 });
  const matteBack = new THREE.MeshStandardMaterial({ color: 0xd8c9ae, metalness: 0.25, roughness: 0.8 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb9863c, metalness: 1, roughness: 0.3 });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.07,
    transmission: 0.92, thickness: 0.12, ior: 1.45,
    clearcoat: 0.4, transparent: true,
  });

  /* ── device ─────────────────────────────────────────────── */
  const device = new THREE.Group();
  scene.add(device);

  const parts = []; // { group, basePos, explodeZ, explodeRot }
  function addPart(group, z, explodeZ, explodeRot = 0) {
    group.position.z = z;
    device.add(group);
    parts.push({ group, baseZ: z, explodeZ, explodeRot });
    return group;
  }

  /* 1 · mounting plate */
  const mount = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.44, 0.06, 64), matteBack);
  plate.rotation.x = Math.PI / 2;
  mount.add(plate);
  for (let i = 0; i < 3; i++) {
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.1), matteBack);
    const a = (i / 3) * Math.PI * 2;
    tab.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0);
    tab.rotation.z = a;
    mount.add(tab);
  }
  addPart(mount, -0.3, -1.45, 0.12);

  /* 2 · passive heatsink */
  const heat = new THREE.Group();
  const heatCore = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 0.2, 64), darkMetal);
  heatCore.rotation.x = Math.PI / 2;
  heat.add(heatCore);
  const finGeo = new THREE.BoxGeometry(0.3, 0.022, 0.2);
  const fins = new THREE.InstancedMesh(finGeo, darkMetal, 56);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const eul = new THREE.Euler();
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    eul.set(0, 0, a);
    q.setFromEuler(eul);
    m4.compose(
      new THREE.Vector3(Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0),
      q,
      new THREE.Vector3(1, 1, 1)
    );
    fins.setMatrixAt(i, m4);
  }
  heat.add(fins);
  addPart(heat, -0.16, -0.9, -0.2);

  /* 3 · spectrum engine, 7 tinted glass discs */
  const spectrum = new THREE.Group();
  const discColors = [0xd84438, 0xe8752c, 0xf2b13c, 0xf6ecd2, 0x7fae62, 0x5f9aa8, 0x7a6aa8];
  const discMeshes = [];
  discColors.forEach((c, i) => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: c, metalness: 0, roughness: 0.16,
      transmission: 0.72, thickness: 0.08, ior: 1.4,
      transparent: true, side: THREE.DoubleSide,
    });
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.015, 64), mat);
    d.rotation.x = Math.PI / 2;
    d.position.z = (i - 3) * 0.045;
    d.userData.slot = i - 3;
    spectrum.add(d);
    discMeshes.push(d);
  });
  const specRing = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.035, 14, 72), brass);
  spectrum.add(specRing);
  addPart(spectrum, 0.0, -0.35, 0.3);

  /* 4 · HELIOS core ring */
  const helios = new THREE.Group();
  const hRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.065, 16, 64), brass);
  helios.add(hRing);
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x2c2318, emissive: 0xff9a2e, emissiveIntensity: 1.4, roughness: 0.4 });
  for (let i = 0; i < 4; i++) {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.05), chipMat);
    const a = (i / 4) * Math.PI * 2 + 0.4;
    chip.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.03);
    chip.rotation.z = a;
    helios.add(chip);
  }
  addPart(helios, 0.14, 0.22, -0.35);

  /* 5 · sky disc (the light itself) */
  const skyGroup = new THREE.Group();
  const skyTex = radialTexture(10, 128, [
    [0, '#fff3d2'], [0.35, '#ffe2a0'], [0.75, '#f7cf8e'], [1, '#e8ecf2'],
  ]);
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false });
  const sky = new THREE.Mesh(new THREE.CircleGeometry(1.24, 72), skyMat);
  skyGroup.add(sky);
  const glowTex = radialTexture(2, 128, [
    [0, 'rgba(255,235,190,0.85)'], [0.4, 'rgba(255,210,130,0.28)'], [1, 'rgba(255,200,120,0)'],
  ]);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.75,
  }));
  glow.scale.set(5.6, 5.6, 1);
  skyGroup.add(glow);
  /* wide soft halo — the light the panel throws into the room, spilling well
     beyond its own body so the sun reads as an actual emitter */
  const haloTex = radialTexture(1, 128, [
    [0, 'rgba(255,228,172,0.6)'], [0.28, 'rgba(255,205,130,0.22)'],
    [0.6, 'rgba(255,180,110,0.06)'], [1, 'rgba(255,170,100,0)'],
  ]);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5,
  }));
  halo.scale.set(11, 11, 1);
  halo.position.z = -0.05;
  skyGroup.add(halo);
  addPart(skyGroup, 0.19, 0.7, 0.1);

  /* 6 · collimation lens, hex micro-array */
  const lensGroup = new THREE.Group();
  const hexGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.05, 6);
  hexGeo.rotateX(Math.PI / 2);
  const hexPos = [];
  const S = 0.168;
  for (let row = -8; row <= 8; row++) {
    for (let col = -8; col <= 8; col++) {
      const x = (col + (row % 2 ? 0.5 : 0)) * S;
      const y = row * S * 0.866;
      if (Math.hypot(x, y) <= 1.12) hexPos.push([x, y]);
    }
  }
  const hexes = new THREE.InstancedMesh(hexGeo, lensMat, hexPos.length);
  hexPos.forEach(([x, y], i) => {
    m4.makeTranslation(x, y, 0);
    hexes.setMatrixAt(i, m4);
  });
  lensGroup.add(hexes);
  const lensRim = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.02, 12, 72), brass);
  lensGroup.add(lensRim);
  addPart(lensGroup, 0.3, 1.25, -0.15);

  /* 7 · outer bezel (lathe ring) */
  const bezelPts = [
    new THREE.Vector2(1.26, -0.3), new THREE.Vector2(1.5, -0.3),
    new THREE.Vector2(1.58, -0.2), new THREE.Vector2(1.58, 0.2),
    new THREE.Vector2(1.5, 0.3), new THREE.Vector2(1.3, 0.32),
    new THREE.Vector2(1.26, 0.18),
  ];
  const bezelGeo = new THREE.LatheGeometry(bezelPts, 96);
  const bezel = new THREE.Mesh(bezelGeo, champagne);
  bezel.rotation.x = Math.PI / 2;
  const bezelGroup = new THREE.Group();
  bezelGroup.add(bezel);
  const rimLine = new THREE.Mesh(new THREE.TorusGeometry(1.29, 0.012, 10, 96), brass);
  rimLine.position.z = 0.3;
  bezelGroup.add(rimLine);
  addPart(bezelGroup, 0.02, 1.7, 0.22);

  /* shadows on / off per mesh */
  device.traverse((o) => {
    if (o.isMesh || o.isInstancedMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
    }
  });
  glow.castShadow = false;
  sky.castShadow = false;

  /* ── dust motes ─────────────────────────────────────────── */
  const dustCount = isCoarse ? 110 : 230;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(dustCount * 3);
  const dSeed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dp[i * 3] = (Math.random() - 0.5) * 9;
    dp[i * 3 + 1] = (Math.random() - 0.5) * 6;
    dp[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5;
    dSeed[i] = Math.random() * 100;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dustTex = radialTexture(2, 128, [
    [0, 'rgba(255,240,210,1)'], [0.5, 'rgba(255,225,170,0.35)'], [1, 'rgba(255,220,160,0)'],
  ]);
  const dustMat = new THREE.PointsMaterial({
    size: 0.055, map: dustTex, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    color: 0xffdfae,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ── section targets ────────────────────────────────────── */
  const T = {
    pos: new THREE.Vector3(-2.05, -0.1, 0),
    rot: new THREE.Euler(-0.12, 0.35, 0),
    scale: 1,
    explode: 0,
    dustO: 0.5,
    kelvin: 3400,
  };
  const cur = {
    pos: new THREE.Vector3(-2.05, -0.4, 0),
    rot: new THREE.Euler(-0.12, 0.35, 0),
    scale: 0.001,
    explode: 0,
    dustO: 0,
    kelvin: 2600,
  };

  function computeTargets() {
    const a = camera.aspect;
    const wide = a > 0.95;
    const p = state.p;
    const sec = state.section;

    /* global "solar day" kelvin from scroll */
    let kelvin = 2100 + 4200 * Math.pow(Math.sin(Math.PI * clamp01(p)), 1.15);

    /* The device is the sun. It is present and framed when it is the star of a
       section, and exits cleanly (straight up, out of the way) when the content
       grids take over. Every visible pose stays fully on-screen; only the final
       sunset dips below the page edge, on purpose. Moves between neighbouring
       sections are short so the motion reads as deliberate, never random. */
    switch (sec) {
      case 'hero':
        /* low on the left, prominent; the headline owns the right (RTL) */
        if (wide) {
          T.pos.set(-clamp(1.7 + a * 0.45, 2.1, 3.0), -0.15, 0);
          T.scale = clamp(a * 0.52, 0.6, 0.92);
        } else {
          T.pos.set(0, 1.72, 0);
          T.scale = clamp(a * 0.95, 0.4, 0.5);
        }
        T.rot.set(-0.10, 0.36, 0);
        T.explode = 0;
        T.dustO = 0.5;
        break;
      case 'drift':
        /* steps back and rises a touch while the "92%" stats speak */
        T.pos.set(wide ? -2.9 : -1.0, wide ? 0.8 : 2.0, -0.4);
        T.rot.set(-0.26, 0.66, 0.05);
        T.scale = wide ? 0.6 : 0.4;
        T.explode = 0;
        T.dustO = 0.24;
        break;
      case 'explode': {
        /* assembles back toward centre-left and opens up (pinned) */
        if (wide) {
          T.pos.set(-1.7, 0.05, 0);
          T.scale = clamp(a * 0.44, 0.6, 0.8);
        } else {
          T.pos.set(0, 0.02, 0);
          T.scale = 0.45;
        }
        T.rot.set(-0.5, 0.6, 0);
        const e = smooth(0.06, 0.88, state.explodeP);
        T.explode = e;
        T.dustO = 0.12;
        break;
      }
      case 'aside':
        /* the plant comparison sits centre; the sun stays on the empty left,
           low, as if it is the light pouring onto the plant */
        T.pos.set(wide ? -2.85 : 0, wide ? -0.1 : 2.15, -0.3);
        T.rot.set(-0.14, 0.5, 0);
        T.scale = wide ? 0.62 : 0.4;
        T.explode = 0;
        T.dustO = 0.4;
        break;
      case 'day': {
        /* overhead ceiling-panel pose — tilted just enough that its glowing
           face still reads to the viewer, floating above the heading */
        T.pos.set(0, wide ? 0.78 : 1.5, 0.35);
        T.rot.set(wide ? -0.6 : -0.85, 0, 0);
        T.scale = wide ? clamp(a * 0.5, 0.78, 1.0) : 0.6;
        T.explode = 0;
        T.dustO = 0.55;
        const t = state.dayP;
        kelvin = 1900 + 4100 * Math.pow(Math.sin(Math.PI * clamp01(t)), 1.1);
        break;
      }
      case 'away':
        /* content grids: the sun stays a visible glowing presence in the upper
           left, out of the way of the copy but never off-screen */
        T.pos.set(wide ? -3.05 : 0, wide ? 1.25 : 2.25, -0.6);
        T.rot.set(-0.18, 0.32, 0);
        T.scale = wide ? 0.52 : 0.38;
        T.explode = 0;
        T.dustO = 0.32;
        break;
      case 'sunset':
        /* the sun sets on the horizon: centred and low, most of it below the
           page edge, a warm glowing cap that never covers the footer copy */
        T.pos.set(0, wide ? -2.85 : -2.6, -0.2);
        T.rot.set(-0.04, 0.08, 0);
        T.scale = wide ? 0.82 : 0.6;
        T.explode = 0;
        T.dustO = 0.4;
        kelvin = 1850;
        break;
    }
    T.kelvin = kelvin;
  }

  /* ── frame loop ─────────────────────────────────────────── */
  const clock = new THREE.Clock();
  const sunColor = new THREE.Color();

  function frame() {
    const t = clock.getElapsedTime();
    computeTargets();

    /* ease current toward targets */
    cur.pos.lerp(T.pos, 0.055);
    cur.rot.x = lerp(cur.rot.x, T.rot.x, 0.05);
    cur.rot.y = lerp(cur.rot.y, T.rot.y, 0.05);
    cur.rot.z = lerp(cur.rot.z, T.rot.z, 0.05);
    cur.scale = lerp(cur.scale, T.scale, 0.06);
    cur.explode = lerp(cur.explode, T.explode, 0.075);
    cur.dustO = lerp(cur.dustO, T.dustO, 0.04);
    cur.kelvin = lerp(cur.kelvin, T.kelvin, 0.045);

    /* autonomous life — never depends on a pointer, so the sun stays alive on
       mobile even while parked. Bob, drift, sway and a slow continuous turn,
       amplified on touch where there's no cursor parallax to animate it. */
    const idle = state.reduced ? 0 : 1;
    const life = idle * (isCoarse ? 1.9 : 1);
    const floatY = Math.sin(t * 0.7) * 0.10 * life;
    const floatX = Math.sin(t * 0.44 + 1.3) * 0.07 * life;
    const swayX = Math.sin(t * 0.31) * 0.09 * life;
    const swayY = Math.sin(t * 0.23 + 0.6) * 0.15 * life;
    const turn = idle * t * (isCoarse ? 0.16 : 0.1); // slow, continuous, never rests
    const breathe = 1 + Math.sin(t * 0.9) * 0.012 * idle;
    const px = state.sun.x, py = state.sun.y;

    device.position.set(cur.pos.x + floatX, cur.pos.y + floatY, cur.pos.z);
    device.rotation.set(
      cur.rot.x + py * 0.1 + swayX,
      cur.rot.y + px * 0.16 + swayY,
      cur.rot.z + Math.sin(turn) * 0.5 + turn * 0.06
    );
    device.scale.setScalar(Math.max(cur.scale * breathe, 0.001));

    /* explode the stack */
    for (const part of parts) {
      part.group.position.z = part.baseZ + part.explodeZ * cur.explode;
      part.group.rotation.z = part.explodeRot * cur.explode;
    }
    discMeshes.forEach((d) => {
      d.position.z = d.userData.slot * 0.045 * (1 + cur.explode * 5.2);
    });

    /* sunlight follows the cursor-sun */
    sunColor.copy(kelvinToColor(cur.kelvin));
    sun.color.copy(sunColor);
    sun.intensity = 1.5 + 0.9 * Math.sin(Math.PI * clamp01(state.p));
    sun.position.set(
      device.position.x + px * 6.5,
      device.position.y + 2.2 + py * 3.4,
      6.2
    );
    sun.target.position.copy(device.position);

    hemi.intensity = 0.45 + 0.35 * Math.sin(Math.PI * clamp01(state.p));

    /* the emitted light — warmth rises as the light cools toward sunset,
       swelling the glow and halo so the panel reads as a real emitter */
    const warmth = clamp((3300 - cur.kelvin) / 1500, 0, 1);
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
    const warmTint = new THREE.Color(0xffb066);

    skyMat.color.copy(sunColor).lerp(new THREE.Color(0xffffff), 0.24 - warmth * 0.18);

    glow.material.color.copy(sunColor);
    glow.material.opacity = 0.5 + 0.24 * warmth + 0.06 * pulse;
    const gs = 5.6 * (1 + warmth * 0.55 + 0.04 * pulse);
    glow.scale.set(gs, gs, 1);

    halo.material.color.copy(sunColor).lerp(warmTint, warmth * 0.55);
    halo.material.opacity = 0.34 + 0.5 * warmth;
    const hs = 11 * (1 + warmth * 0.8 + 0.03 * pulse);
    halo.scale.set(hs, hs, 1);

    /* dust drift */
    dust.material.opacity = cur.dustO;
    if (!state.reduced) {
      const pos = dust.geometry.attributes.position;
      for (let i = 0; i < dustCount; i++) {
        const iy = i * 3 + 1;
        const ix = i * 3;
        pos.array[iy] += Math.sin(t * 0.35 + dSeed[i]) * 0.0009 + 0.0011;
        pos.array[ix] += Math.cos(t * 0.22 + dSeed[i]) * 0.0007;
        if (pos.array[iy] > 3.2) pos.array[iy] = -3.2;
        if (pos.array[ix] > 4.8) pos.array[ix] = -4.8;
      }
      pos.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  /* ── sizing / lifecycle ─────────────────────────────────── */
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  window.addEventListener('resize', resize);

  renderer.setAnimationLoop(frame);
  document.addEventListener('visibilitychange', () => {
    renderer.setAnimationLoop(document.hidden ? null : frame);
  });

  return { renderer };
}
