/* PDF slide viewer: view.html?talk=<slug>#<slide>
   Keys: ← → (also Space, PageUp/PageDown, Home/End) move · F full screen · O all slides · Esc closes the overview */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const msg = (t) => ($("msg").textContent = t);
  const slug = new URLSearchParams(location.search).get("talk");
  const talk = (window.TALKS || []).find((t) => t.slug === slug && t.type === "pdf");
  if (!talk) {
    msg("That presentation isn't here. Go back to the list.");
    return;
  }
  const url = `${encodeURIComponent(talk.slug)}/${talk.file || "slides.pdf"}`;
  document.title = `${talk.title} · Presentations`;
  $("title").textContent = talk.title;
  $("dl").href = url;
  if (!window.pdfjsLib) {
    msg("The slide viewer couldn't load. Download the PDF instead.");
    return;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let doc = null, n = 0, cur = 1, renderTask = null;
  const cache = new Map(); // page number -> rendered canvas (current and neighbors)
  const canvas = $("slide");

  async function renderTo(p, target, maxW, maxH) {
    const page = await doc.getPage(p);
    const base = page.getViewport({ scale: 1 });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(maxW / base.width, maxH / base.height) * dpr;
    const vp = page.getViewport({ scale });
    target.width = Math.floor(vp.width);
    target.height = Math.floor(vp.height);
    target.style.width = `${Math.floor(vp.width / dpr)}px`;
    target.style.height = `${Math.floor(vp.height / dpr)}px`;
    const task = page.render({ canvasContext: target.getContext("2d"), viewport: vp });
    return task;
  }
  const stageSize = () => {
    const r = $("stage").getBoundingClientRect();
    return [r.width, r.height];
  };
  async function prerender(p) {
    if (p < 1 || p > n || cache.has(p)) return;
    const c = document.createElement("canvas");
    cache.set(p, c);
    const [w, h] = stageSize();
    try {
      await (await renderTo(p, c, w, h)).promise;
    } catch (_) {
      cache.delete(p);
    }
  }
  async function show(p) {
    p = Math.max(1, Math.min(n, p));
    cur = p;
    $("count").textContent = `${p} / ${n}`;
    $("prog").style.width = `${(p / n) * 100}%`;
    canvas.setAttribute("aria-label", `Slide ${p} of ${n}`);
    history.replaceState(null, "", `#${p}`);
    const ready = cache.get(p);
    if (ready && ready.width) {
      canvas.width = ready.width;
      canvas.height = ready.height;
      canvas.style.width = ready.style.width;
      canvas.style.height = ready.style.height;
      canvas.getContext("2d").drawImage(ready, 0, 0);
    } else {
      if (renderTask) renderTask.cancel();
      const [w, h] = stageSize();
      try {
        renderTask = await renderTo(p, canvas, w, h);
        await renderTask.promise;
      } catch (_) {}
    }
    msg("");
    // Keep the neighbors ready and the cache small
    for (const k of [...cache.keys()]) if (Math.abs(k - p) > 2) cache.delete(k);
    prerender(p + 1);
    prerender(p - 1);
    markOverview();
  }
  const go = (d) => show(cur + d);

  // Overview grid
  function buildOverview() {
    const box = $("overview");
    if (box.childElementCount) return;
    box.innerHTML = Array.from({ length: n }, (_, i) => `<button class="thumb" data-p="${i + 1}"><canvas></canvas><span>${i + 1}</span></button>`).join("");
    const io = new IntersectionObserver((es) =>
      es.forEach(async (e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const c = e.target.querySelector("canvas");
        try {
          await (await renderTo(+e.target.dataset.p, c, 360, 203)).promise;
          c.style.width = "";
          c.style.height = "";
        } catch (_) {}
      })
    );
    box.querySelectorAll(".thumb").forEach((t) => io.observe(t));
    box.addEventListener("click", (e) => {
      const t = e.target.closest(".thumb");
      if (!t) return;
      toggleOverview(false);
      show(+t.dataset.p);
    });
  }
  function markOverview() {
    document.querySelectorAll(".thumb").forEach((t) => t.classList.toggle("on", +t.dataset.p === cur));
  }
  function toggleOverview(on) {
    const box = $("overview");
    const open = on ?? box.hidden;
    if (open) buildOverview();
    box.hidden = !open;
    markOverview();
    if (open) {
      const t = box.querySelector(`.thumb[data-p="${cur}"]`);
      if (t) t.scrollIntoView({ block: "center" });
    }
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
  }
  document.addEventListener("fullscreenchange", () => {
    document.body.classList.toggle("fs", !!document.fullscreenElement);
    cache.clear();
    setTimeout(() => show(cur), 120);
  });

  // Hide the toolbar while presenting full screen
  let idleTimer = 0;
  const wake = () => {
    document.body.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add("idle"), 2200);
  };
  window.addEventListener("mousemove", wake, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter", "n"].includes(k)) go(1);
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "p"].includes(k)) go(-1);
    else if (k === "Home") show(1);
    else if (k === "End") show(n);
    else if (k === "f" || k === "F") fullscreen();
    else if (k === "o" || k === "O" || k === "g" || k === "G") toggleOverview();
    else if (k === "Escape" && !$("overview").hidden) toggleOverview(false);
    else return;
    e.preventDefault();
  });
  $("prev").addEventListener("click", () => go(-1));
  $("next").addEventListener("click", () => go(1));
  $("grid").addEventListener("click", () => toggleOverview());
  $("fs").addEventListener("click", fullscreen);
  // Click or tap: right two-thirds moves forward, left third goes back
  $("stage").addEventListener("click", (e) => go(e.clientX < window.innerWidth / 3 ? -1 : 1));
  // Swipe on phones and tablets
  let sx = null;
  $("stage").addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  $("stage").addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) {
      e.preventDefault();
      go(dx < 0 ? 1 : -1);
    }
    sx = null;
  });
  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      cache.clear();
      show(cur);
    }, 150);
  });

  pdfjsLib
    .getDocument(url)
    .promise.then((d) => {
      doc = d;
      n = d.numPages;
      const start = parseInt(location.hash.slice(1), 10);
      show(Number.isFinite(start) ? start : 1);
    })
    .catch(() => msg("The slides couldn't be loaded. Try downloading the PDF."));
})();
