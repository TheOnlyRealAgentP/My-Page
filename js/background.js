/* =========================================================================
   Background: contour map of the lower 48
   -------------------------------------------------------------------------
   assets/us-contours.svg holds real 200 m contours (1000 m index contours
   brighter) from AWS Terrain Tiles elevation data, in the NAD83 / Conus
   Albers projection, plus the national outline. It is drawn once per resize
   and the contours under the pointer brighten a little.

   Tunables are in CONFIG below.
   ========================================================================= */
(function () {
  "use strict";

  const CONFIG = {
    src: "assets/us-contours.svg",
    alpha: 0.17, // overall strength of the map
    glow: 0.6, // strength of the contours under the pointer
    mouseRadius: 200, // px
    focusX: 0.32, // which part of the map stays in view when the screen crops it (0 = west, 1 = east)
    focusY: 0.45,
  };

  const canvas = document.getElementById("bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const img = new Image();
  const layer = document.createElement("canvas"); // the map at screen resolution
  const lens = document.createElement("canvas"); // scratch canvas for the pointer glow
  let W = 0, H = 0, dpr = 1, ready = false;
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: false };
  let raf = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    if (!ready) return;
    // Cover the screen, keeping the focus point in view
    const mw = img.naturalWidth || 1600, mh = img.naturalHeight || 1019;
    const s = Math.max(W / mw, H / mh);
    const dw = mw * s, dh = mh * s;
    const dx = (W - dw) * CONFIG.focusX, dy = (H - dh) * CONFIG.focusY;
    layer.width = canvas.width;
    layer.height = canvas.height;
    const l = layer.getContext("2d");
    l.setTransform(dpr, 0, 0, dpr, 0, 0);
    l.clearRect(0, 0, W, H);
    l.drawImage(img, dx, dy, dw, dh);
    draw();
  }

  function draw() {
    if (!ready) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = CONFIG.alpha;
    ctx.drawImage(layer, 0, 0);
    ctx.globalAlpha = 1;

    if (mouse.on && !reduceMotion && !coarse) {
      // Brighter copy of the map, faded out with a radial mask, around the pointer
      const r = CONFIG.mouseRadius * dpr;
      const size = Math.ceil(r * 2);
      if (lens.width !== size) lens.width = lens.height = size;
      const g = lens.getContext("2d");
      const cx = mouse.x * dpr, cy = mouse.y * dpr;
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, size, size);
      g.drawImage(layer, cx - r, cy - r, size, size, 0, 0, size, size);
      g.globalCompositeOperation = "destination-in";
      const grad = g.createRadialGradient(r, r, 0, r, r, r);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      ctx.globalAlpha = CONFIG.glow;
      ctx.drawImage(lens, cx - r, cy - r);
      ctx.globalAlpha = 1;
    }
  }

  // Ease the glow toward the pointer, then stop animating
  function tick() {
    raf = 0;
    mouse.x += (mouse.tx - mouse.x) * 0.25;
    mouse.y += (mouse.ty - mouse.y) * 0.25;
    draw();
    if (Math.abs(mouse.tx - mouse.x) > 0.5 || Math.abs(mouse.ty - mouse.y) > 0.5) raf = requestAnimationFrame(tick);
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      if (!mouse.on) {
        mouse.on = true;
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
      if (!raf && !reduceMotion) raf = requestAnimationFrame(tick);
    },
    { passive: true }
  );
  document.addEventListener("pointerleave", () => {
    mouse.on = false;
    draw();
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  img.onload = () => {
    ready = true;
    resize();
  };
  img.src = CONFIG.src;
  resize();
})();
