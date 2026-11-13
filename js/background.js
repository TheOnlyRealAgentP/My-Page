/* =========================================================================
   Animated topographic background
   -------------------------------------------------------------------------
   A slowly evolving 3D noise field is sampled on a coarse grid and traced
   into contour lines with marching squares. The pointer acts like a small
   mound in the terrain, bending nearby contours around it.

   Tunables are in CONFIG below.
   ========================================================================= */
(function () {
  "use strict";

  const CONFIG = {
    cell: 16, // grid spacing in CSS px (smaller = smoother, slower)
    levels: 14, // number of contour bands
    scale: 0.0024, // terrain feature size (smaller = broader hills)
    speed: 0.000045, // terrain evolution speed
    majorEvery: 5, // every Nth contour is an "index contour" (brighter)
    color: [76, 201, 240], // line RGB
    minor: 0.075, // minor contour alpha
    major: 0.2, // index contour alpha
    mouseRadius: 180, // px
    mouseStrength: 0.35,
    fps: 30,
  };

  const canvas = document.getElementById("bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 3D Perlin noise ---------- */
  const perm = new Uint8Array(512);
  (function seed() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = 1337;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);
  function grad(h, x, y, z) {
    h &= 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function noise(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
           lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
           lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
      w
    );
  }
  // two octaves → more natural terrain
  const terrain = (x, y, t) => noise(x, y, t) * 0.75 + noise(x * 2.1, y * 2.1, t * 1.3) * 0.25;

  /* ---------- State ---------- */
  let W = 0, H = 0, cols = 0, rows = 0, field = null, dpr = 1;
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, a: 0, ta: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // fewer samples on small screens
    const cell = W < 640 ? CONFIG.cell + 4 : CONFIG.cell;
    cols = Math.ceil(W / cell) + 1;
    rows = Math.ceil(H / cell) + 1;
    field = new Float32Array(cols * rows);
    field.cell = cell;
  }

  function sample(t) {
    const c = field.cell, s = CONFIG.scale;
    const r2 = CONFIG.mouseRadius * CONFIG.mouseRadius;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * c, y = j * c;
        let v = terrain(x * s, y * s, t);
        if (mouse.a > 0.001) {
          const dx = x - mouse.x, dy = y - mouse.y;
          v += Math.exp(-(dx * dx + dy * dy) / r2) * CONFIG.mouseStrength * mouse.a;
        }
        field[j * cols + i] = v;
      }
    }
  }

  // Marching squares for one iso-level, appended to the current path.
  function contour(level) {
    const c = field.cell;
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const k = j * cols + i;
        const a = field[k], b = field[k + 1], d = field[k + cols], e = field[k + cols + 1];
        // corners: a=top-left, b=top-right, e=bottom-right, d=bottom-left
        const idx = (a > level) | ((b > level) << 1) | ((e > level) << 2) | ((d > level) << 3);
        if (idx === 0 || idx === 15) continue;

        const x = i * c, y = j * c;
        const top = () => [x + c * ((level - a) / (b - a)), y];
        const right = () => [x + c, y + c * ((level - b) / (e - b))];
        const bottom = () => [x + c * ((level - d) / (e - d)), y + c];
        const left = () => [x, y + c * ((level - a) / (d - a))];

        let segs;
        switch (idx) {
          case 1: case 14: segs = [left(), top()]; break;
          case 2: case 13: segs = [top(), right()]; break;
          case 3: case 12: segs = [left(), right()]; break;
          case 4: case 11: segs = [right(), bottom()]; break;
          case 6: case 9: segs = [top(), bottom()]; break;
          case 7: case 8: segs = [left(), bottom()]; break;
          case 5: segs = [left(), top(), right(), bottom()]; break;
          case 10: segs = [top(), right(), bottom(), left()]; break;
        }
        for (let s = 0; s < segs.length; s += 2) {
          ctx.moveTo(segs[s][0], segs[s][1]);
          ctx.lineTo(segs[s + 1][0], segs[s + 1][1]);
        }
      }
    }
  }

  function draw(time) {
    const t = time * CONFIG.speed;
    // ease the pointer influence in and out
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    mouse.a += (mouse.ta - mouse.a) * 0.06;

    sample(t);
    ctx.clearRect(0, 0, W, H);
    const [r, g, b] = CONFIG.color;
    const lo = -0.7, hi = 0.7 + CONFIG.mouseStrength * 0.5;

    for (let n = 1; n < CONFIG.levels; n++) {
      const level = lo + ((hi - lo) * n) / CONFIG.levels;
      const major = n % CONFIG.majorEvery === 0;
      ctx.beginPath();
      contour(level);
      ctx.strokeStyle = `rgba(${r},${g},${b},${major ? CONFIG.major : CONFIG.minor})`;
      ctx.lineWidth = major ? 1.1 : 0.7;
      ctx.stroke();
    }
  }

  /* ---------- Loop ---------- */
  let last = 0, raf = 0;
  const frameMs = 1000 / CONFIG.fps;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < frameMs) return;
    last = now;
    draw(now);
  }

  function start() {
    cancelAnimationFrame(raf);
    if (reduceMotion) draw(0);
    else raf = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    resize();
    if (reduceMotion) draw(0);
  });

  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      if (mouse.x < -1000) { mouse.x = e.clientX; mouse.y = e.clientY; }
      mouse.ta = 1;
    },
    { passive: true }
  );
  document.addEventListener("pointerleave", () => (mouse.ta = 0));
  window.addEventListener("blur", () => (mouse.ta = 0));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else start();
  });

  resize();
  start();
})();
