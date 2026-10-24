/**
 * 1500 米之后 · 3D 首屏
 * 手写一个微笑的少年、跑道环与漂浮小道具，全部由基础几何体拼出来。
 * 不加载外部模型 / 贴图；只有字体与 Three.js 是本地文件。
 */
import * as THREE from '../vendor/three.module.js';

const canvas = document.getElementById('hero-canvas');
const stage = canvas ? canvas.parentElement : null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && stage) {
  init().catch((error) => {
    console.error('[hero3d]', error);
    fallback();
  });
}

function fallback() {
  document.body.classList.add('no-webgl');
  document.body.classList.add('is-ready');
  window.dispatchEvent(new CustomEvent('hero:ready'));
}

async function init() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  /* ---------------- 材质 ---------------- */

  const standard = (color, overrides = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...overrides });

  const M = {
    skin: standard(0xf3c49c, { roughness: 0.55 }),
    skinShade: standard(0xe2a579),
    hair: standard(0x1c1733, { roughness: 0.48 }),
    shirt: standard(0xf3f0e4, { roughness: 0.82 }),
    ink: standard(0x0d1240, { roughness: 0.7 }),
    blue: standard(0x2238f0, { roughness: 0.66 }),
    lemon: standard(0xeaf36b, { roughness: 0.52 }),
    orange: standard(0xff5a36, { roughness: 0.52 }),
    white: standard(0xf7f3e6, { roughness: 0.4 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xf0bd52, roughness: 0.28, metalness: 0.6 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x161427, roughness: 0.18, metalness: 0.05 }),
    mouth: new THREE.MeshStandardMaterial({ color: 0x5a2a2c, roughness: 0.5 }),
    blush: new THREE.MeshBasicMaterial({ color: 0xff9a76, transparent: true, opacity: 0.5, depthWrite: false }),
  };

  /* ---------------- 小工具 ---------------- */

  const mesh = (geometry, material) => new THREE.Mesh(geometry, material);
  const sphere = (radius, material, segments = 36) =>
    mesh(new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.75)), material);
  const capsule = (radius, length, material) =>
    mesh(new THREE.CapsuleGeometry(radius, length, 10, 22), material);

  function starShape(outer = 0.16, inner = 0.072) {
    const shape = new THREE.Shape();
    const points = 5;
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }

  function radialTexture(inner, outer) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(1, outer);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function badgeTexture(text) {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 160;
    const ctx = c.getContext('2d');
    const radius = 34;
    ctx.fillStyle = '#eaf36b';
    ctx.beginPath();
    ctx.roundRect(4, 4, c.width - 8, c.height - 8, radius);
    ctx.fill();
    ctx.fillStyle = '#0d1240';
    ctx.font = '800 78px "Bricolage Grotesque", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, c.width / 2, c.height / 2 + 4);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  /* ---------------- 世界 ---------------- */

  const world = new THREE.Group();
  scene.add(world);

  const boy = new THREE.Group();
  boy.rotation.y = -0.16;
  world.add(boy);

  /* ---- 腿 ---- */

  function makeLeg(x) {
    const leg = new THREE.Group();
    const shin = capsule(0.092, 0.4, M.skin);
    shin.position.y = 0.5;
    leg.add(shin);

    const sock = capsule(0.098, 0.1, M.white);
    sock.position.y = 0.22;
    leg.add(sock);

    const shoe = sphere(0.15, M.ink, 28);
    shoe.scale.set(1, 0.62, 1.55);
    shoe.position.set(0, 0.1, 0.075);
    leg.add(shoe);

    const sole = sphere(0.16, M.lemon, 24);
    sole.scale.set(1.04, 0.24, 1.6);
    sole.position.set(0, 0.035, 0.075);
    leg.add(sole);

    leg.position.x = x;
    return leg;
  }

  const legLeft = makeLeg(-0.155);
  const legRight = makeLeg(0.155);
  boy.add(legLeft, legRight);

  /* ---- 短裤 / 身体 ---- */

  const shorts = sphere(0.315, M.ink, 40);
  shorts.scale.set(1.06, 0.62, 0.92);
  shorts.position.y = 0.86;
  boy.add(shorts);

  [-0.15, 0.15].forEach((x) => {
    const hem = sphere(0.16, M.ink, 28);
    hem.scale.set(0.98, 0.72, 0.94);
    hem.position.set(x, 0.675, 0.025);
    boy.add(hem);
  });

  const torso = capsule(0.285, 0.3, M.shirt);
  torso.position.y = 1.21;
  torso.scale.z = 0.94;
  boy.add(torso);

  // 胸前的 1500 小徽章
  const badge = mesh(new THREE.PlaneGeometry(0.25, 0.125), new THREE.MeshStandardMaterial({
    map: badgeTexture('1500'),
    roughness: 0.55,
    transparent: true,
  }));
  badge.position.set(0, 1.27, 0.276);
  badge.rotation.x = -0.05;
  boy.add(badge);

  const neck = capsule(0.085, 0.06, M.skin);
  neck.position.y = 1.53;
  boy.add(neck);

  /* ---- 头 ---- */

  const head = new THREE.Group();
  head.position.y = 1.86;
  boy.add(head);

  const skull = sphere(0.42, M.skin, 48);
  skull.scale.set(1, 1.02, 0.97);
  head.add(skull);

  const hairBack = sphere(0.452, M.hair, 44);
  hairBack.scale.set(1.03, 1.06, 0.99);
  hairBack.position.set(0, 0.03, -0.075);
  head.add(hairBack);

  // 头顶发帽（给头发一个完整的轮廓）
  const hairCap = mesh(new THREE.SphereGeometry(0.437, 44, 28, 0, Math.PI * 2, 0, Math.PI * 0.36), M.hair);
  hairCap.position.set(0, 0.04, 0.012);
  hairCap.rotation.x = -0.1;
  head.add(hairCap);

  // 刘海：一排压在前额上的发束
  const fringeSpecs = [
    { x: -0.27, y: 0.225, z: 0.265, rz: -0.5, sx: 1.25, sy: 0.8, sz: 0.8 },
    { x: -0.13, y: 0.255, z: 0.305, rz: -0.2, sx: 1.35, sy: 0.9, sz: 0.85 },
    { x: 0.02, y: 0.26, z: 0.315, rz: 0.05, sx: 1.4, sy: 0.95, sz: 0.9 },
    { x: 0.17, y: 0.245, z: 0.3, rz: 0.28, sx: 1.3, sy: 0.9, sz: 0.85 },
    { x: 0.3, y: 0.2, z: 0.25, rz: 0.5, sx: 1.1, sy: 0.8, sz: 0.8 },
  ];
  fringeSpecs.forEach((spec) => {
    const strand = sphere(0.1, M.hair, 24);
    strand.scale.set(spec.sx, spec.sy, spec.sz);
    strand.position.set(spec.x, spec.y, spec.z);
    strand.rotation.z = spec.rz;
    head.add(strand);
  });

  // 鬓角
  [-1, 1].forEach((side) => {
    const sideburn = sphere(0.075, M.hair, 20);
    sideburn.scale.set(0.75, 1.3, 0.7);
    sideburn.position.set(side * 0.365, 0.07, 0.145);
    head.add(sideburn);
  });

  // 头顶小呆毛
  const cowlick = capsule(0.045, 0.12, M.hair);
  cowlick.position.set(0.03, 0.46, -0.02);
  cowlick.rotation.z = 0.5;
  cowlick.rotation.x = 0.2;
  head.add(cowlick);

  // 耳朵
  const earLeft = sphere(0.085, M.skin, 24);
  earLeft.position.set(-0.41, -0.01, 0.01);
  const earRight = sphere(0.085, M.skin, 24);
  earRight.position.set(0.41, -0.01, 0.01);
  head.add(earLeft, earRight);

  // 眼睛（会眨）
  const eyes = [];
  [-1, 1].forEach((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.155, 0.015, 0.372);
    const ball = sphere(0.055, M.eye, 24);
    ball.scale.set(1, 1.12, 0.5);
    eye.add(ball);
    const glint = sphere(0.018, M.white, 12);
    glint.position.set(0.017, 0.022, 0.03);
    eye.add(glint);
    head.add(eye);
    eyes.push(eye);
  });

  // 眉毛
  [-1, 1].forEach((side) => {
    const brow = capsule(0.013, 0.062, M.hair);
    brow.position.set(side * 0.152, 0.108, 0.378);
    brow.rotation.z = Math.PI / 2 - side * 0.14;
    brow.rotation.y = side * -0.18;
    head.add(brow);
  });

  // 鼻子
  const nose = sphere(0.032, M.skinShade, 16);
  nose.position.set(0, -0.06, 0.405);
  head.add(nose);

  // 微笑：一条向下弯的嘴
  const smileCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.092, -0.082, 0),
    new THREE.Vector3(0, -0.198, 0.012),
    new THREE.Vector3(0.092, -0.082, 0)
  );
  const smile = mesh(new THREE.TubeGeometry(smileCurve, 32, 0.0135, 8, false), M.mouth);
  smile.position.set(0, 0, 0.39);
  head.add(smile);

  // 腮红
  [-1, 1].forEach((side) => {
    const blush = mesh(new THREE.CircleGeometry(0.062, 20), M.blush);
    blush.position.set(side * 0.245, -0.055, 0.322);
    blush.rotation.y = side * 0.62;
    head.add(blush);
  });

  /* ---- 手臂 ---- */

  function makeArm(side) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.3, 1.455, 0.02);

    const sleeve = sphere(0.115, M.shirt, 24);
    sleeve.scale.set(1, 0.92, 0.95);
    arm.add(sleeve);

    const upper = capsule(0.07, 0.22, M.skin);
    upper.position.y = -0.17;
    arm.add(upper);

    const forearm = new THREE.Group();
    forearm.position.y = -0.31;

    const forearmMesh = capsule(0.063, 0.2, M.skin);
    forearmMesh.position.y = -0.12;
    forearm.add(forearmMesh);

    const hand = sphere(0.086, M.skin, 24);
    hand.scale.set(0.92, 1.05, 0.95);
    hand.position.y = -0.26;
    forearm.add(hand);

    arm.add(forearm);
    return { arm, forearm, hand };
  }

  const left = makeArm(-1);
  left.arm.rotation.z = -0.1;
  left.forearm.rotation.z = 0.1;
  boy.add(left.arm);

  const right = makeArm(1);
  right.arm.rotation.z = 2.35;
  right.forearm.rotation.z = 0.78;
  // 挥手的小手掌：几根短短的手指
  [-0.038, -0.012, 0.014, 0.038].forEach((offset) => {
    const finger = capsule(0.015, 0.045, M.skin);
    finger.position.set(offset, -0.08, 0.012);
    finger.rotation.z = offset * -1.6;
    right.hand.add(finger);
  });
  const thumb = capsule(0.018, 0.035, M.skin);
  thumb.position.set(-0.078, -0.038, 0.022);
  thumb.rotation.z = 0.8;
  right.hand.add(thumb);
  boy.add(right.arm);

  /* ---- 脚下的影子 ---- */

  const shadowTexture = radialTexture('rgba(8,12,70,0.55)', 'rgba(8,12,70,0)');
  const shadow = mesh(
    new THREE.PlaneGeometry(3.1, 3.1),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.05, 0.012, 0.22);
  boy.add(shadow);

  /* ---- 跑道环 ---- */

  const track = new THREE.Group();
  track.position.set(0.15, 0.78, -0.7);
  track.rotation.x = -0.74;
  track.rotation.z = 0.1;
  world.add(track);

  function ellipseCurve(rx, rz) {
    const points = [];
    const count = 64;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz));
    }
    return new THREE.CatmullRomCurve3(points, true);
  }

  // 跑道底带：半透明的深蓝，把三条白线连成一条跑道
  const ribbonShape = new THREE.Shape();
  new THREE.EllipseCurve(0, 0, 2.48, 0.8, 0, Math.PI * 2, false, 0)
    .getPoints(90)
    .forEach((p, i) => (i === 0 ? ribbonShape.moveTo(p.x, p.y) : ribbonShape.lineTo(p.x, p.y)));
  const ribbonHole = new THREE.Path();
  new THREE.EllipseCurve(0, 0, 1.86, 0.5, 0, Math.PI * 2, true, 0)
    .getPoints(90)
    .forEach((p, i) => (i === 0 ? ribbonHole.moveTo(p.x, p.y) : ribbonHole.lineTo(p.x, p.y)));
  ribbonShape.holes.push(ribbonHole);
  const ribbon = mesh(
    new THREE.ShapeGeometry(ribbonShape, 64),
    new THREE.MeshStandardMaterial({
      color: 0x0a1264,
      roughness: 0.88,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  ribbon.rotation.x = -Math.PI / 2;
  ribbon.position.y = -0.012;
  track.add(ribbon);

  const ringSpecs = [
    { rx: 2.35, rz: 0.7, tube: 0.028, material: M.shirt, y: 0 },
    { rx: 2.16, rz: 0.64, tube: 0.016, material: M.lemon, y: 0.005 },
    { rx: 1.97, rz: 0.58, tube: 0.012, material: M.shirt, y: 0.01 },
  ];
  ringSpecs.forEach((spec) => {
    const run = mesh(new THREE.TubeGeometry(ellipseCurve(spec.rx, spec.rz), 180, spec.tube, 10, true), spec.material);
    run.position.y = spec.y;
    track.add(run);
  });

  // 外圈上的跑道刻线
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2 + 0.1;
    const dash = mesh(new THREE.BoxGeometry(0.11, 0.014, 0.05), M.lemon);
    dash.position.set(Math.cos(a) * 2.25, 0.01, Math.sin(a) * 0.67);
    dash.rotation.y = -a;
    track.add(dash);
  }

  /* ---- 漂浮的小物件 ---- */

  const props = [];

  function registerProp(group, spec) {
    group.position.set(spec.x, spec.y, spec.z);
    group.rotation.set(spec.rx || 0, spec.ry || 0, spec.rz || 0);
    world.add(group);
    props.push({ group, baseY: spec.y, amp: spec.amp ?? 0.06, speed: spec.speed ?? 1, phase: spec.phase ?? 0, spin: spec.spin ?? 0.2, baseRy: spec.ry || 0 });
  }

  // 奖牌
  const medal = new THREE.Group();
  const medalDisc = mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.045, 40), M.gold);
  medalDisc.rotation.x = Math.PI / 2;
  medal.add(medalDisc);
  const medalFace = mesh(new THREE.CircleGeometry(0.145, 36), M.lemon);
  medalFace.position.z = 0.024;
  medal.add(medalFace);
  const medalStar = mesh(new THREE.ExtrudeGeometry(starShape(0.085, 0.038), { depth: 0.018, bevelEnabled: false }), M.orange);
  medalStar.position.z = 0.026;
  medal.add(medalStar);
  const ribbonA = mesh(new THREE.BoxGeometry(0.075, 0.3, 0.02), M.orange);
  ribbonA.position.set(-0.085, 0.27, 0.005);
  ribbonA.rotation.z = 0.32;
  medal.add(ribbonA);
  const ribbonB = mesh(new THREE.BoxGeometry(0.075, 0.3, 0.02), M.orange);
  ribbonB.position.set(0.085, 0.27, 0.005);
  ribbonB.rotation.z = -0.32;
  medal.add(ribbonB);
  medal.scale.setScalar(1);
  registerProp(medal, { x: -1.2, y: 2.42, z: -1.2, ry: 0.38, rx: -0.12, rz: 0.2, amp: 0.08, speed: 0.9, phase: 0.4, spin: 0.15 });

  // 星星
  const star = new THREE.Group();
  const starBody = mesh(new THREE.ExtrudeGeometry(starShape(0.17, 0.075), { depth: 0.07, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }), M.lemon);
  starBody.position.z = -0.035;
  star.add(starBody);
  star.scale.setScalar(1.05);
  registerProp(star, { x: 1.32, y: 2.68, z: -1.1, ry: -0.3, rx: 0.2, rz: 0.3, amp: 0.1, speed: 0.8, phase: 2.1, spin: 0.3 });

  // 小胶囊
  const pill = new THREE.Group();
  const pillBody = capsule(0.11, 0.26, M.shirt);
  pillBody.rotation.z = Math.PI / 2;
  pill.add(pillBody);
  const pillBand = mesh(new THREE.CylinderGeometry(0.113, 0.113, 0.07, 24), M.blue);
  pillBand.rotation.z = Math.PI / 2;
  pill.add(pillBand);
  pill.scale.setScalar(1.15);
  registerProp(pill, { x: 1.2, y: 1.3, z: -1.5, ry: -0.5, rx: 0.5, rz: 0.2, amp: 0.07, speed: 1.2, phase: 4.2, spin: 0.25 });

  // 小甜甜圈
  const donut = mesh(new THREE.TorusGeometry(0.155, 0.062, 18, 36), M.orange);
  donut.scale.setScalar(1.15);
  registerProp(donut, { x: -1.5, y: 1.75, z: -1.55, ry: 0.4, rx: 0.9, rz: 0.1, amp: 0.06, speed: 1.05, phase: 3.2, spin: 0.2 });

  // 小蓝球
  const blueBall = mesh(new THREE.SphereGeometry(0.085, 28, 20), M.blue);
  blueBall.scale.setScalar(1.2);
  registerProp(blueBall, { x: -0.22, y: 3.0, z: -1.5, ry: 0, rx: 0, rz: 0, amp: 0.09, speed: 1.1, phase: 1.3, spin: 0 });

  // 一枚小柠檬环
  const lemonRing = mesh(new THREE.TorusGeometry(0.11, 0.032, 14, 28), M.lemon);
  registerProp(lemonRing, { x: 1.58, y: 2.1, z: -1.9, ry: 0.6, rx: 1.1, rz: 0.3, amp: 0.08, speed: 1.3, phase: 5.1, spin: 0.35 });

  /* ---- 光晕 ---- */

  const glowTexture = radialTexture('rgba(160,180,255,0.5)', 'rgba(160,180,255,0)');
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.5,
  }));
  glow.position.set(0.5, 1.5, -2.6);
  glow.scale.set(6.5, 6.5, 1);
  scene.add(glow);

  /* ---- 灯光 ---- */

  const hemi = new THREE.HemisphereLight(0xd6e2ff, 0x1a2394, 1.15);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff1dc, 2.5);
  key.position.set(4.2, 6.2, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x8ea4ff, 1.2);
  fill.position.set(-4.5, 2.5, 3.2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x7f94ff, 1.8);
  rim.position.set(-2.5, 4, -4);
  scene.add(rim);

  const warm = new THREE.PointLight(0xffb27a, 6, 5, 2);
  warm.position.set(1.8, 1.4, 1.6);
  scene.add(warm);

  /* ---- 视口 ---- */

  const view = { baseX: 0.1, baseY: 1.5, baseZ: 7.6, lookX: 0.35, lookY: 1.4, lookZ: 0, rootX: 1.45 };

  function layout() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const aspect = width / Math.max(height, 1);
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    if (width < 760) {
      camera.fov = 34;
      view.baseX = 0;
      view.baseY = 1.4;
      view.baseZ = 8;
      view.lookX = 0;
      view.lookY = 1.4;
      view.rootX = 0;
      boy.rotation.y = -0.04;
      track.scale.setScalar(0.6);
      track.position.set(0, 0.38, -0.7);
    } else if (width < 1150) {
      // 平板：把人物和相框收进来一点，避免举起的手被裁掉
      camera.fov = 30;
      view.baseX = 0.1;
      view.baseY = 1.58;
      view.baseZ = 8.2;
      view.lookX = 0.25;
      view.lookY = 1.45;
      view.rootX = 1.0;
      boy.rotation.y = -0.16;
      track.scale.setScalar(0.94);
      track.position.set(0.15, 0.82, -0.7);
    } else {
      camera.fov = 30;
      view.baseX = 0.1;
      view.baseY = 1.5;
      view.baseZ = 7.6;
      view.lookX = 0.35;
      view.lookY = 1.4;
      view.rootX = 1.45;
      boy.rotation.y = -0.16;
      track.scale.setScalar(1);
      track.position.set(0.15, 0.78, -0.7);
    }

    camera.aspect = aspect;
    camera.position.set(view.baseX, view.baseY, view.baseZ);
    camera.lookAt(view.lookX, view.lookY, view.lookZ);
    camera.updateProjectionMatrix();
    world.position.x = view.rootX;

    // 小屏：只保留少年与少量道具，避免贴边裁切；平板宽度再去掉一圈靠边的道具
    const isMobile = width < 760;
    const isTablet = width >= 760 && width < 1150;
    track.visible = !isMobile;
    props.forEach((prop, index) => {
      let visible = !isMobile;
      if (isMobile) visible = false;
      if (isTablet && [1, 2, 5].includes(index)) visible = false;
      prop.group.visible = visible;
    });
  }

  layout();
  window.addEventListener('resize', layout, { passive: true });

  /* ---- 交互与动画 ---- */

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const hero = document.querySelector('.hero');

  if (hero && !reducedMotion) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      pointer.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      pointer.tx = 0;
      pointer.ty = 0;
    }, { passive: true });
  }

  const clock = new THREE.Clock();
  let nextBlink = 2.4;
  let blinkAt = -10;
  let running = !reducedMotion;

  const visibility = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (reducedMotion) return;
      running = entry.isIntersecting && !document.hidden;
    });
  }, { threshold: 0.02 });
  visibility.observe(stage);

  document.addEventListener('visibilitychange', () => {
    if (reducedMotion) return;
    running = !document.hidden;
  });

  let introStart = 0;
  let announced = false;

  function frame() {
    const elapsed = clock.getElapsedTime();
    if (!introStart) introStart = elapsed;

    // 入场
    const intro = Math.min(1, Math.max(0, (elapsed - introStart) / 1.1));
    const introEase = 1 - Math.pow(1 - intro, 3);
    boy.scale.setScalar(0.94 + 0.06 * introEase);

    if (running) {
      const t = elapsed;

      // 呼吸与重心
      boy.position.y = Math.sin(t * 1.35) * 0.018;
      head.rotation.z = Math.sin(t * 0.9) * 0.018;
      head.rotation.y = 0.06 + pointer.x * 0.1;
      head.rotation.x = pointer.y * 0.06;

      // 挥手
      right.arm.rotation.z = 2.35 + Math.sin(t * 3.1) * 0.1;
      right.forearm.rotation.z = 0.78 + Math.sin(t * 3.1 + 0.7) * 0.18;

      // 眨眼
      if (t > nextBlink) {
        blinkAt = t;
        nextBlink = t + 2.6 + Math.random() * 3.2;
      }
      const blinkProgress = Math.min(1, Math.max(0, (t - blinkAt) / 0.16));
      const blink = Math.sin(blinkProgress * Math.PI);
      const eyeScale = 1 - blink * 0.9;
      eyes.forEach((eye) => {
        eye.scale.y = eyeScale;
      });

      // 小物件漂浮
      props.forEach((prop) => {
        prop.group.position.y = prop.baseY + Math.sin(t * prop.speed + prop.phase) * prop.amp;
        prop.group.rotation.y = prop.baseRy + t * prop.spin;
      });

      // 跑道环缓慢呼吸
      track.rotation.z = 0.1 + Math.sin(t * 0.35) * 0.05;
      track.rotation.y = Math.sin(t * 0.22) * 0.06;

      // 鼠标视差
      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;
      camera.position.x = view.baseX + pointer.x * 0.22;
      camera.position.y = view.baseY - pointer.y * 0.1;
      camera.lookAt(view.lookX, view.lookY, view.lookZ);
    }

    renderer.render(scene, camera);

    if (!announced) {
      announced = true;
      document.body.classList.add('is-ready');
      window.__heroReady = true;
      window.dispatchEvent(new CustomEvent('hero:ready'));
    }

    if (!reducedMotion) requestAnimationFrame(frame);
  }

  if (reducedMotion) {
    // 静止画面：保留角色、跑道和道具的最终形态
    head.rotation.y = 0.06;
    renderer.render(scene, camera);
    document.body.classList.add('is-ready');
    window.__heroReady = true;
    window.dispatchEvent(new CustomEvent('hero:ready'));
    window.addEventListener('resize', () => {
      layout();
      renderer.render(scene, camera);
    });
  } else {
    requestAnimationFrame(frame);
  }

  window.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    fallback();
  });

  window.__hero = { scene, camera, renderer, world, boy, head, track, props };
  console.log('[hero3d] ready', renderer.capabilities.isWebGL2 ? 'webgl2' : 'webgl1');
}
