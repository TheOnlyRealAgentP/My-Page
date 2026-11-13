/* VS Code + AI guide: copy buttons, checklist progress (saved in this browser only), TOC highlight. */
(function () {
  "use strict";

  const KEY = "vscode-ai-guide:checked";
  const store = {
    get() {
      try {
        return JSON.parse(localStorage.getItem(KEY) || "[]");
      } catch (_) {
        return [];
      }
    },
    set(v) {
      try {
        localStorage.setItem(KEY, JSON.stringify(v));
      } catch (_) {}
    },
  };

  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      // Fallback for browsers without async clipboard access
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (_) {}
      ta.remove();
    }
    const old = btn.innerHTML;
    btn.classList.add("ok");
    btn.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i>Copied';
    setTimeout(() => {
      btn.classList.remove("ok");
      btn.innerHTML = old;
    }, 1400);
  }

  /* Copy buttons: code blocks get one automatically; extension IDs copy an install command. */
  document.querySelectorAll(".code").forEach((block) => {
    const head = block.querySelector(".code-head");
    if (!head || head.querySelector(".copy")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy";
    btn.innerHTML = '<i class="ph ph-copy" aria-hidden="true"></i>Copy';
    btn.addEventListener("click", () => copyText(block.querySelector("pre").innerText, btn));
    head.appendChild(btn);
  });
  document.querySelectorAll(".ext .id").forEach((btn) => {
    btn.title = "Copy install command";
    btn.addEventListener("click", () => copyText(`code --install-extension ${btn.dataset.id}`, btn));
  });

  /* Stacked tables: label each cell with its column heading for the phone layout */
  document.querySelectorAll("table.stack").forEach((t) => {
    const heads = [...t.querySelectorAll("thead th")].map((th) => th.childNodes[0]?.textContent.trim() || "");
    t.querySelectorAll("tbody tr").forEach((tr) =>
      [...tr.children].forEach((td, i) => {
        if (i > 1 && heads[i]) td.dataset.label = heads[i];
      })
    );
  });

  /* Checklist */
  const checks = [...document.querySelectorAll(".step .check")];
  const saved = new Set(store.get());
  const bar = document.querySelector(".progress .bar i");
  const label = document.querySelector(".progress .count");
  function update() {
    const done = checks.filter((c) => c.checked);
    checks.forEach((c) => c.closest(".step").classList.toggle("done", c.checked));
    if (bar) bar.style.width = `${checks.length ? (done.length / checks.length) * 100 : 0}%`;
    if (label) label.textContent = `${done.length} of ${checks.length} steps done`;
    store.set(done.map((c) => c.id));
  }
  checks.forEach((c) => {
    c.checked = saved.has(c.id);
    c.addEventListener("change", update);
  });
  update();

  /* TOC highlight */
  const links = [...document.querySelectorAll(".toc a")];
  if ("IntersectionObserver" in window && links.length) {
    const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.remove("active"));
          byId.get(en.target.id)?.classList.add("active");
        }),
      { rootMargin: "-30% 0px -65% 0px" }
    );
    document.querySelectorAll(".g-sec").forEach((s) => io.observe(s));
  }
})();
