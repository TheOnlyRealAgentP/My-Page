/* Shared behavior for research explainer pages:
   header from the JSON details, share, cite (APA/BibTeX), present mode, print. */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  let meta = {};
  try {
    meta = JSON.parse($("#explainer-meta")?.textContent || "{}");
  } catch (_) {}

  const url = location.href.split("#")[0];
  const authors = meta.authors || [];
  const year = meta.year || new Date().getFullYear();

  /* ---------- Header fields ---------- */
  const fields = {
    title: meta.title,
    question: meta.question,
    group: meta.group,
    authors: authors.join(", "),
    updated: meta.updated,
    status: meta.status || "",
  };
  document.querySelectorAll("[data-meta]").forEach((el) => {
    const v = fields[el.dataset.meta];
    if (v !== undefined) el.textContent = v;
  });
  if (meta.title) document.title = `${meta.title} · Research explainer`;
  const pu = $(".print-url");
  if (pu) pu.textContent = url;

  /* ---------- Toast ---------- */
  const toastEl = $(".x-toast");
  let timer = 0;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }
  async function copy(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch (_) {
      toast("Copy failed. Select the text and copy it manually.");
    }
  }

  /* ---------- Citation ---------- */
  // "Harrison Stewart" → "Stewart, H."
  const apaName = (n) => {
    const parts = n.trim().split(/\s+/);
    const last = parts.pop();
    return `${last}, ${parts.map((p) => p[0] + ".").join(" ")}`.trim();
  };
  const apaAuthors = (list) => {
    const a = list.map(apaName);
    if (a.length <= 1) return a.join("");
    return `${a.slice(0, -1).join(", ")}, & ${a[a.length - 1]}`;
  };
  const slug = (s) => (s || "explainer").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);

  const formats = {
    apa: () =>
      `${apaAuthors(authors)} (${year}). ${meta.title} [Research explainer]. ${meta.group || ""}. ${url}`.replace(/\s+\./g, "."),
    bibtex: () => {
      const key = `${slug(authors[0]?.split(/\s+/).pop())}${year}${slug(meta.title).slice(0, 10)}`;
      return [
        `@misc{${key},`,
        `  author       = {${authors.join(" and ")}},`,
        `  title        = {${meta.title}},`,
        `  year         = {${year}},`,
        `  howpublished = {\\url{${url}}},`,
        meta.group ? `  note         = {Research explainer, ${meta.group}}` : `  note         = {Research explainer}`,
        `}`,
      ].join("\n");
    },
  };
  let fmt = "apa";
  const citeText = $("#cite-text");
  const renderCite = () => citeText && (citeText.textContent = formats[fmt]());
  document.querySelectorAll(".cite-tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      fmt = b.dataset.fmt;
      document.querySelectorAll(".cite-tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
      renderCite();
    })
  );
  renderCite();

  /* ---------- Present mode ---------- */
  const slides = () => [$(".x-header"), ...document.querySelectorAll(".x-sec")].filter(Boolean);
  let current = 0;
  function go(i) {
    const s = slides();
    current = Math.max(0, Math.min(s.length - 1, i));
    s[current].scrollIntoView({ behavior: "smooth", block: "start" });
    const c = $(".present-count");
    if (c) c.textContent = `${current + 1} / ${s.length}`;
  }
  function present(on) {
    document.body.classList.toggle("present", on);
    if (on) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      go(0);
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }
  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("present")) return;
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(current + 1); }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); go(current - 1); }
    else if (e.key === "Escape") present(false);
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && document.body.classList.contains("present")) present(false);
  });

  /* ---------- Toolbar ---------- */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (btn) {
      const action = btn.dataset.action;
      if (action === "share") {
        if (navigator.share) {
          try {
            await navigator.share({ title: meta.title || document.title, text: meta.question || "", url });
            return;
          } catch (err) {
            if (err && err.name === "AbortError") return;
          }
        }
        copy(url, "Link copied");
      } else if (action === "cite") {
        $("#cite")?.scrollIntoView({ behavior: "smooth" });
        copy(formats[fmt](), "Citation copied");
      } else if (action === "copy-cite") {
        copy(formats[fmt](), "Citation copied");
      } else if (action === "present") {
        present(true);
      } else if (action === "print") {
        window.print();
      }
      return;
    }
    // Placeholder links in a template: say so instead of jumping to the top.
    const a = e.target.closest('a[href="#"]');
    if (a) {
      e.preventDefault();
      toast("Pending completion. This link isn't ready yet.");
    }
  });
})();
