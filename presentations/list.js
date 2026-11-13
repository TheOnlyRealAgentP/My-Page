/* Presentations list: groups talks by year and links each one to its deck. */
(function () {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const talks = (window.TALKS || []).filter((t) => t && t.slug && t.title).slice();
  document.getElementById("yr").textContent = new Date().getFullYear();
  const box = document.getElementById("talks");

  if (!talks.length) {
    box.innerHTML = `<p class="empty">Nothing posted yet.</p>`;
    return;
  }

  const when = (d) => {
    const s = String(d || "");
    const monthOnly = /^\d{4}-\d{2}$/.test(s);
    const t = new Date((monthOnly ? s + "-15" : s) + "T12:00:00");
    if (isNaN(t)) return "";
    return t.toLocaleDateString("en-US", monthOnly ? { month: "long", year: "numeric" } : { month: "long", day: "numeric", year: "numeric" });
  };
  const href = (t) => (t.type === "pdf" ? `view.html?talk=${encodeURIComponent(t.slug)}` : `${encodeURIComponent(t.slug)}/`);
  talks.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const years = [];
  for (const t of talks) {
    const y = String(t.date || "").slice(0, 4) || "Undated";
    let g = years.find((x) => x.y === y);
    if (!g) years.push((g = { y, items: [] }));
    g.items.push(t);
  }

  box.innerHTML = years
    .map(
      (g) => `
      <section class="year">
        <h2>${esc(g.y)}</h2>
        <div class="talk-grid">
          ${g.items
            .map((t) => {
              const meta = [t.event, t.place, when(t.date)].filter(Boolean).map(esc).join(" · ");
              const thumb = t.thumb
                ? `<img src="${esc(t.slug)}/${esc(t.thumb)}" alt="" loading="lazy" />`
                : t.type === "pdf"
                  ? `<canvas data-pdf="${esc(t.slug)}/${esc(t.file || "slides.pdf")}" aria-hidden="true"></canvas>`
                  : `<span class="ph-title">${esc(t.title)}</span>`;
              const pdf = t.type === "pdf" ? `${t.slug}/${t.file || "slides.pdf"}` : t.pdf ? `${t.slug}/${t.pdf}` : "";
              return `
              <article class="talk">
                <a class="talk-link" href="${href(t)}">
                  <div class="thumb">${thumb}<span class="kind">${t.type === "pdf" ? "Slides" : "Web slides"}</span></div>
                  <h3>${esc(t.title)}</h3>
                </a>
                ${meta ? `<p class="meta">${meta}</p>` : ""}
                ${pdf ? `<a class="dl" href="${esc(pdf)}" download><i class="ph ph-download-simple" aria-hidden="true"></i>PDF</a>` : ""}
              </article>`;
            })
            .join("")}
        </div>
      </section>`
    )
    .join("");

  // Slide 1 as the cover for PDF talks without a thumbnail
  const canvases = [...document.querySelectorAll("canvas[data-pdf]")];
  if (!canvases.length) return;
  const draw = async (cv) => {
    if (!window.pdfjsLib) return;
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    try {
      const doc = await pdfjsLib.getDocument({ url: cv.dataset.pdf, disableAutoFetch: true, disableStream: true }).promise;
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const w = cv.parentElement.clientWidth * Math.min(2, window.devicePixelRatio || 1);
      const vp = page.getViewport({ scale: w / base.width });
      cv.width = vp.width;
      cv.height = vp.height;
      await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      cv.classList.add("ready");
    } catch (_) {}
  };
  const io = new IntersectionObserver((es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        io.unobserve(e.target);
        draw(e.target);
      }
    })
  );
  const start = () => canvases.forEach((c) => io.observe(c));
  if (window.pdfjsLib) start();
  else window.addEventListener("load", start);
})();
