/* ============================================================
   ELEVATE — central living element (off-brand-style).
   The glossy blue arrow is the hero object: clean (no noise),
   floating, mouse-reactive, with a small grey satellite and a
   soft glow. Its on-screen position is driven by scroll so it
   travels through the sections. Sits on a warm-dark stage so the
   huge type can blend over it (mix-blend in CSS).
   ============================================================ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const BG = 0x161517;

function softTexture() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(70,150,255,0.55)');
  g.addColorStop(0.5, 'rgba(40,110,255,0.18)');
  g.addColorStop(1, 'rgba(0,80,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createArrow(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // transparent — the CSS dark field shows through
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 17);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xcfe4ff, 0.9); key.position.set(3, 9, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x2f74ff, 0.8); rim.position.set(-7, -1, 4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x9ec6ff, 0.5); fill.position.set(0, -7, 6); scene.add(fill);

  /* --- the arrow (logo silhouette, glossy blue gradient) --- */
  const shape = new THREE.Shape();
  shape.moveTo(60, -6);
  shape.bezierCurveTo(71, -33, 95, -86, 116, -126);
  shape.bezierCurveTo(94, -104, 71, -87, 60, -80);
  shape.bezierCurveTo(49, -87, 26, -104, 4, -126);
  shape.bezierCurveTo(25, -86, 49, -33, 60, -6);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 32, bevelEnabled: true, bevelThickness: 8, bevelSize: 5.5, bevelSegments: 7, curveSegments: 90 });
  geo.center(); geo.computeVertexNormals(); geo.computeBoundingBox();

  const minY = geo.boundingBox.min.y, maxY = geo.boundingBox.max.y;
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cTop = new THREE.Color(0x6cc6ff), cBot = new THREE.Color(0x07309f), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    let t = (pos.getY(i) - minY) / (maxY - minY);
    t = Math.pow(t, 1.7);
    tmp.copy(cBot).lerp(cTop, t);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, color: 0xffffff, metalness: 0.0, roughness: 0.18,
    clearcoat: 1.0, clearcoatRoughness: 0.18, envMapIntensity: 0.4, transparent: true, opacity: 1,
  });
  const arrow = new THREE.Mesh(geo, mat);
  arrow.scale.setScalar(0.05);

  const group = new THREE.Group(); // scroll moves this group
  group.add(arrow);
  scene.add(group);

  // (no full glow — keeps the field truly dark so the blended type stays neutral)

  // small grey satellite (recurring off-brand motif)
  const sat = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 32, 32),
    new THREE.MeshPhysicalMaterial({ color: 0x9a9a9c, roughness: 0.35, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.2, envMapIntensity: 0.7, transparent: true, opacity: 1 }),
  );
  scene.add(sat);

  /* --- subtle bloom --- */
  // Render directly (no bloom) onto the transparent canvas, so the field stays
  // truly dark/neutral and the blended type only shifts where it crosses the arrow.
  let composer, bloom, useComposer = false;

  const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
  function setMouse(nx, ny) { mouse.tx = nx; mouse.ty = ny; }

  function update(t) {
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    arrow.rotation.y = mouse.x * 0.5 + Math.sin(t * 0.5) * 0.13;
    arrow.rotation.x = -mouse.y * 0.3 + Math.sin(t * 0.42) * 0.05;
    arrow.position.y = Math.sin(t * 0.8) * 0.16;
    // satellite orbits the group
    sat.position.set(group.position.x + Math.cos(t * 0.4) * 3.4, group.position.y + 2.6 + Math.sin(t * 0.4) * 0.8, 2);
    if (useComposer) composer.render(); else renderer.render(scene, camera);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    if (useComposer) { composer.setSize(w, h); bloom.setSize(w, h); }
  }
  window.addEventListener('resize', resize);

  return { renderer, scene, camera, arrow, arrowGroup: group, arrowMat: mat, satellite: sat, update, resize, setMouse };
}
