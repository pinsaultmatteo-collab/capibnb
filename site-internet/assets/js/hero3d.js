/* CAPIBNB — scène 3D du hero (Three.js)
   Un immeuble toulousain stylisé dont les fenêtres s'allument au fil des
   réservations, une orbite de voyageurs, des cartes « Réservé » qui s'envolent.
   Léger, mis en pause hors écran, version statique si prefers-reduced-motion. */

import * as THREE from '/assets/js/vendor/three.module.min.js';

const mount = document.querySelector('[data-hero-3d]');
if (mount) init(mount);

function init(container) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // pas de WebGL : le dégradé CSS reste
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.035);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const camBase = new THREE.Vector3(6.9, 3.3, 8.9);
  camera.position.copy(camBase);
  const lookAt = new THREE.Vector3(0, 2.4, 0);

  /* ---------- Lumières ---------- */
  scene.add(new THREE.HemisphereLight(0xe8e8e8, 0x0a0a0a, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(6, 9, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8a8d, 0.9);
  rim.position.set(-6, 4, -5);
  scene.add(rim);
  const warm = new THREE.PointLight(0xff5a5f, 2.2, 10, 2);
  warm.position.set(2.4, 0.6, 2.6);
  scene.add(warm);

  /* ---------- Textures procédurales ---------- */
  const glowTex = makeGlowTexture();
  const cardTexts = ['Réservé · 3 nuits', 'Réservé · 2 nuits', 'Réservé · 5 nuits', 'Nouvel avis ★★★★★', 'Check-in autonome'];
  const cardTextures = cardTexts.map(makeCardTexture);

  /* ---------- Immeuble ---------- */
  const building = new THREE.Group();
  scene.add(building);

  const W = 3.2,
    H = 4.4,
    D = 2.6;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x232323, roughness: 0.8, metalness: 0.1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), bodyMat);
  body.position.y = H / 2;
  building.add(body);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 })
  );
  edges.position.copy(body.position);
  building.add(edges);

  // corniche
  const cornice = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.24, 0.14, D + 0.24),
    new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.9 })
  );
  cornice.position.y = H + 0.07;
  building.add(cornice);

  // toit en tuiles (pyramide aplatie) — clin d'œil aux toits toulousains
  const roofGeo = new THREE.ConeGeometry(1, 0.95, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.scale((W + 0.1) / Math.SQRT2, 1, (D + 0.1) / Math.SQRT2);
  const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0xb8544a, roughness: 0.75, flatShading: true }));
  roof.position.y = H + 0.14 + 0.95 / 2;
  building.add(roof);

  // cheminée
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.6, 0.28), bodyMat);
  chimney.position.set(-0.9, H + 0.6, -0.6);
  building.add(chimney);

  // porte + boîte à clés
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.6 })
  );
  door.position.set(0, 0.55, D / 2 + 0.005);
  building.add(door);
  const keybox = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.2, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.4 })
  );
  keybox.position.set(0.55, 1.05, D / 2 + 0.04);
  building.add(keybox);
  const keyLed = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), new THREE.MeshBasicMaterial({ color: 0xff5a5f }));
  keyLed.position.set(0.55, 1.1, D / 2 + 0.085);
  building.add(keyLed);

  // perron
  const stoop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.5), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.95 }));
  stoop.position.set(0, 0.06, D / 2 + 0.25);
  building.add(stoop);

  /* ---------- Fenêtres ---------- */
  const windows = [];
  const offColor = new THREE.Color(0x141414);
  const onColor = new THREE.Color(0xffb0a8);
  const winGeo = new THREE.PlaneGeometry(0.5, 0.72);
  const glowGeo = new THREE.PlaneGeometry(1.5, 1.7);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3c3c3c, roughness: 0.9 });
  const frameGeo = new THREE.PlaneGeometry(0.62, 0.84);

  const addWindow = (x, y, z, rotY) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = 0.004;
    g.add(frame);
    const mat = new THREE.MeshBasicMaterial({ color: offColor.clone() });
    const pane = new THREE.Mesh(winGeo, mat);
    pane.position.z = 0.012;
    g.add(pane);
    const glow = new THREE.Mesh(
      glowGeo,
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xff5a5f })
    );
    glow.position.z = 0.03;
    g.add(glow);
    // meneau
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.72), frameMat);
    bar.position.z = 0.016;
    g.add(bar);
    building.add(g);
    windows.push({ g, mat, glow, lit: 0, target: 0 });
  };
  const floors = [1.35, 2.45, 3.55];
  floors.forEach((y, fi) => {
    const xs = fi === 0 ? [-1.0, 1.0] : [-1.0, 0, 1.0];
    xs.forEach((x) => addWindow(x, y, D / 2, 0));
    [-0.7, 0.7].forEach((z) => addWindow(W / 2, y, z, Math.PI / 2));
  });

  /* ---------- Sol et ombre de contact ---------- */
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 6),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.7, color: 0x000000, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  scene.add(shadow);

  // dallage léger : anneaux concentriques
  const ringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
  [3.2, 4.4, 5.6].forEach((r) => {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0.01, Math.sin(a) * r));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
  });

  /* ---------- Orbite des voyageurs ---------- */
  const orbitR = 3.9;
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(orbitR, 0.012, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xff5a5f, transparent: true, opacity: 0.5 })
  );
  orbit.rotation.x = Math.PI / 2;
  orbit.position.y = 0.03;
  scene.add(orbit);
  const travellers = [];
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, color: 0xff5a5f, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.scale.set(0.9, 0.9, 1);
    t.add(core, halo);
    scene.add(t);
    travellers.push({ g: t, phase: (i / 3) * Math.PI * 2, speed: 0.22 + i * 0.03 });
  }

  /* ---------- Cartes « Réservé » qui s'envolent ---------- */
  const cards = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.42),
      new THREE.MeshBasicMaterial({ map: cardTextures[i % cardTextures.length], transparent: true, opacity: 0, depthWrite: false })
    );
    scene.add(m);
    cards.push({ m, t: -i * 1.4, win: null });
  }

  /* ---------- Particules ---------- */
  const pCount = 140;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 16;
    pPos[i * 3 + 1] = Math.random() * 7;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: 0xffb0a8, size: 0.05, transparent: true, opacity: 0.5, sizeAttenuation: true, depthWrite: false })
  );
  scene.add(particles);

  /* ---------- État / interaction ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  let visible = true;
  const io = new IntersectionObserver((entries) => (visible = entries[0].isIntersecting), { threshold: 0.05 });
  io.observe(container);
  document.addEventListener('visibilitychange', () => (visible = !document.hidden && visible));

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // la caméra recule quand la boîte est étroite (portrait) et avance quand elle est très large
    const a = camera.aspect;
    const fit = a < 0.95 ? 0.95 / a : a > 1.6 ? 0.88 : 1;
    camBase.set(6.9 * fit, 3.3 * fit, 8.9 * fit);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  // entrée : l'immeuble sort de terre
  building.scale.set(1, 0.001, 1);
  let intro = 0;

  let bookingTimer = 0;
  let allLitSince = -1;
  const clock = new THREE.Clock();

  const lightNext = () => {
    const unlit = windows.filter((w) => w.target === 0);
    if (!unlit.length) return null;
    const w = unlit[Math.floor(Math.random() * unlit.length)];
    w.target = 1;
    return w;
  };
  const resetAll = () => windows.forEach((w) => (w.target = 0));

  if (reduce) {
    // image fixe : immeuble entier, fenêtres allumées
    building.scale.set(1, 1, 1);
    windows.forEach((w) => {
      w.lit = 1;
      w.mat.color.copy(onColor);
      w.glow.material.opacity = 0.55;
    });
    travellers.forEach((t, i) => {
      const a = t.phase;
      t.g.position.set(Math.cos(a) * orbitR, 0.12, Math.sin(a) * orbitR);
    });
    camera.lookAt(lookAt);
    renderer.render(scene, camera);
    return;
  }

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // intro
    if (intro < 1) {
      intro = Math.min(1, intro + dt / 1.4);
      const e = 1 - Math.pow(1 - intro, 3);
      building.scale.set(1, Math.max(0.001, e), 1);
    }

    // caméra : parallaxe douce
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    const ang = 0.12 * Math.sin(t * 0.15) + mouse.x * 0.22;
    camera.position.x = camBase.x * Math.cos(ang) - camBase.z * Math.sin(ang);
    camera.position.z = camBase.x * Math.sin(ang) + camBase.z * Math.cos(ang);
    camera.position.y = camBase.y + Math.sin(t * 0.4) * 0.12 - mouse.y * 0.5;
    camera.lookAt(lookAt);

    // réservations : une fenêtre s'allume régulièrement
    bookingTimer += dt;
    if (intro >= 1 && bookingTimer > 0.85) {
      bookingTimer = 0;
      const w = lightNext();
      if (w) {
        const free = cards.find((c) => c.t <= 0 && !c.win) || null;
        if (free) {
          free.win = w;
          free.t = 0.0001;
          free.m.material.map = cardTextures[Math.floor(Math.random() * cardTextures.length)];
        }
      } else if (allLitSince < 0) allLitSince = t;
    }
    if (allLitSince > 0 && t - allLitSince > 4) {
      allLitSince = -1;
      resetAll();
    }
    windows.forEach((w) => {
      w.lit += (w.target - w.lit) * (w.target ? 0.08 : 0.03);
      w.mat.color.copy(offColor).lerp(onColor, w.lit);
      w.glow.material.opacity = 0.6 * w.lit;
    });
    keyLed.material.color.setHSL(0, 1, 0.55 + 0.15 * Math.sin(t * 4));

    // cartes
    cards.forEach((c) => {
      if (c.t <= 0) return;
      c.t += dt;
      const life = 2.6;
      const p = c.t / life;
      if (p >= 1) {
        c.t = 0;
        c.win = null;
        c.m.material.opacity = 0;
        return;
      }
      const wp = new THREE.Vector3();
      c.win.g.getWorldPosition(wp);
      const n = new THREE.Vector3(0, 0, 1).applyQuaternion(c.win.g.getWorldQuaternion(new THREE.Quaternion()));
      c.m.position.copy(wp).addScaledVector(n, 0.5 + p * 0.6);
      c.m.position.y += p * 1.4;
      c.m.quaternion.copy(camera.quaternion);
      c.m.material.opacity = p < 0.15 ? p / 0.15 : p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
      c.m.scale.setScalar(0.85 + 0.15 * Math.min(1, p / 0.2));
    });

    // voyageurs
    travellers.forEach((tr) => {
      const a = tr.phase + t * tr.speed;
      tr.g.position.set(Math.cos(a) * orbitR, 0.12 + Math.sin(t * 2 + tr.phase) * 0.03, Math.sin(a) * orbitR);
    });

    // particules
    particles.rotation.y = t * 0.02;
    const pos = pGeo.attributes.position;
    for (let i = 0; i < pCount; i++) {
      let y = pos.getY(i) + dt * 0.08;
      if (y > 7) y = 0;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;

    renderer.render(scene, camera);
  };
  tick();
}

/* ---------- Helpers texture ---------- */
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCardTexture(text) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 144;
  const ctx = c.getContext('2d');
  const r = 36;
  ctx.fillStyle = 'rgba(10,10,10,0.92)';
  roundRect(ctx, 2, 2, 508, 140, r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 3;
  roundRect(ctx, 2, 2, 508, 140, r);
  ctx.stroke();
  // pastille corail
  ctx.fillStyle = '#ff5a5f';
  roundRect(ctx, 26, 32, 80, 80, 22);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(48, 72);
  ctx.lineTo(62, 86);
  ctx.lineTo(86, 58);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '600 40px Manrope, Poppins, Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 130, 72);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
