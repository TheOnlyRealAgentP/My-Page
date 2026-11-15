/* PDF tools page: the file list, options and downloads. The work happens in pdf-engine.js. */
(function () {
  "use strict";
  const E = window.PdfEngine;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const icon = (n) => `<i class="ph ph-${n}" aria-hidden="true"></i>`;

  const S = {
    mode: "convert",
    items: [],
    size: "letter",
    margin: "small",
    name: "",
    nameTouched: false,
    saving: false,
  };
  let nextId = 1;
  let pumping = false;

  const KIND = {
    pdf: ["PDF", "file-pdf"],
    image: ["Photo", "image"],
    word: ["Word", "file-doc"],
    sheet: ["Spreadsheet", "file-xls"],
    slides: ["PowerPoint", "file-ppt"],
    text: ["Text", "file-text"],
    markdown: ["Markdown", "file-text"],
    code: ["Code", "file-code"],
    old: ["Not supported", "file-x"],
    unknown: ["Not supported", "file-x"],
  };
  const MARGIN = { small: 29, normal: 72, none: 0 };
  const ACCEPT =
    ".pdf,image/*,.heic,.heif,.docx,.docm,.dotx,.xlsx,.xlsm,.xls,.ods,.numbers,.csv,.tsv,.pptx,.ppsx,.potx,.txt,.md,.markdown,.log,.json,.xml,.py,.js,.m,.r,.c,.cpp,.h,.java,.html,.css,.sql,.sh,.yml,.yaml,.ipynb,.doc,.ppt";

  const fmtSize = (b) => (b < 1024 ? b + " B" : b < 1048576 ? Math.round(b / 1024) + " KB" : (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + " MB");
  const base = (n) => n.replace(/\.[^.]+$/, "");
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  /* ---------- adding files ---------- */
  function add(files) {
    const list = [...files].filter((f) => f && f.size !== undefined);
    if (!list.length) return;
    for (const file of list) {
      const kind = E.kindOf(file);
      // unsupported files go through the queue too; the engine says why it can't use them
      S.items.push({ id: nextId++, file, kind, status: "wait", msg: "", res: null, range: "", rotate: 0, page: 0, rangeErr: "" });
    }
    render();
    pump();
  }

  function opts() {
    return { size: S.size, margin: MARGIN[S.margin] ?? 29 };
  }

  async function pump() {
    if (pumping) return;
    pumping = true;
    try {
      for (;;) {
        const it = S.items.find((x) => x.status === "wait");
        if (!it) break;
        it.status = "work";
        it.page = 0;
        updateRow(it);
        updateOut();
        try {
          const res = await E.convert(it.file, opts(), (n) => {
            it.page = n;
            updateRow(it);
          });
          if (!S.items.includes(it)) continue; // removed while working
          it.res = res;
          it.status = "ready";
          if (it.kind === "pdf" && !res.thumb) {
            E.pdfThumb(res.bytes)
              .then((t) => {
                if (it.res === res) {
                  res.thumb = t;
                  updateRow(it);
                }
              })
              .catch(() => {});
          }
        } catch (e) {
          it.status = "error";
          it.msg = e.message || "Something went wrong with this file.";
        }
        validateRange(it);
        updateRow(it);
        updateOut();
      }
    } finally {
      pumping = false;
    }
  }

  /* ---------- the list ---------- */
  function render() {
    const ol = $("#files");
    const keep = new Map([...ol.children].map((li) => [+li.dataset.id, li]));
    S.items.forEach((it, i) => {
      let li = keep.get(it.id);
      if (!li) {
        li = rowEl(it);
      }
      keep.delete(it.id);
      if (ol.children[i] !== li) ol.insertBefore(li, ol.children[i] || null);
      updateRow(it, li);
    });
    keep.forEach((li) => li.remove());
    $("#opts").hidden = !S.items.some((x) => ["image", "text", "markdown", "code", "sheet"].includes(x.kind));
    $("#opt-note").textContent = S.items.some((x) => x.kind === "image")
      ? ""
      : "Page size and margins are for photos, text and spreadsheets.";
    $("#drop").classList.toggle("small", S.items.length > 0);
    updateOut();
  }

  function rowEl(it) {
    const li = document.createElement("li");
    li.className = "file";
    li.dataset.id = it.id;
    li.innerHTML = `
      <button type="button" class="grip" draggable="true" aria-label="Drag to move ${esc(it.file.name)}" title="Drag to move">${icon("dots-six-vertical")}</button>
      <div class="thumb"></div>
      <div class="info">
        <div class="fname" title="${esc(it.file.name)}">${esc(it.file.name)}</div>
        <div class="meta"></div>
        <div class="pick">
          <label class="range"><span>Pages</span><input type="text" inputmode="numeric" placeholder="All" spellcheck="false" autocomplete="off" aria-label="Pages to use from ${esc(it.file.name)}" /></label>
          <button type="button" class="ibtn rot" aria-label="Rotate ${esc(it.file.name)} a quarter turn" title="Rotate">${icon("arrow-clockwise")}</button>
          <span class="range-err" role="alert"></span>
        </div>
      </div>
      <div class="acts">
        <button type="button" class="ibtn dl" aria-label="Download ${esc(base(it.file.name))}.pdf" title="Download this PDF">${icon("download-simple")}</button>
        <button type="button" class="ibtn up" aria-label="Move up" title="Move up">${icon("arrow-up")}</button>
        <button type="button" class="ibtn down" aria-label="Move down" title="Move down">${icon("arrow-down")}</button>
        <button type="button" class="ibtn rm" aria-label="Remove ${esc(it.file.name)}" title="Remove">${icon("x")}</button>
      </div>`;
    const input = li.querySelector(".range input");
    input.addEventListener("input", () => {
      it.range = input.value;
      validateRange(it);
      updateRow(it);
      updateOut();
    });
    li.querySelector(".rot").addEventListener("click", () => {
      it.rotate = (it.rotate + 90) % 360;
      updateRow(it);
    });
    li.querySelector(".dl").addEventListener("click", () => downloadOne(it));
    li.querySelector(".up").addEventListener("click", () => move(it, -1));
    li.querySelector(".down").addEventListener("click", () => move(it, 1));
    li.querySelector(".rm").addEventListener("click", () => remove(it));
    // drag to reorder (mouse); the arrow buttons do the same on phones
    const grip = li.querySelector(".grip");
    grip.addEventListener("dragstart", (e) => {
      dragId = it.id;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(it.id));
      e.dataTransfer.setDragImage(li, 24, 24);
      li.classList.add("dragging");
    });
    grip.addEventListener("dragend", () => {
      dragId = null;
      li.classList.remove("dragging");
      document.querySelectorAll(".file.over-top,.file.over-bot").forEach((x) => x.classList.remove("over-top", "over-bot"));
    });
    grip.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        move(it, e.key === "ArrowUp" ? -1 : 1);
        requestAnimationFrame(() => document.querySelector(`.file[data-id="${it.id}"] .grip`)?.focus());
      }
    });
    li.addEventListener("dragover", (e) => {
      if (dragId === null || dragId === it.id) return;
      e.preventDefault();
      const r = li.getBoundingClientRect();
      const below = e.clientY > r.top + r.height / 2;
      li.classList.toggle("over-bot", below);
      li.classList.toggle("over-top", !below);
    });
    li.addEventListener("dragleave", () => li.classList.remove("over-top", "over-bot"));
    li.addEventListener("drop", (e) => {
      if (dragId === null) return;
      e.preventDefault();
      e.stopPropagation();
      const below = li.classList.contains("over-bot");
      li.classList.remove("over-top", "over-bot");
      const from = S.items.findIndex((x) => x.id === dragId);
      const moving = S.items.splice(from, 1)[0];
      let to = S.items.indexOf(it) + (below ? 1 : 0);
      S.items.splice(to, 0, moving);
      dragId = null;
      render();
    });
    return li;
  }
  let dragId = null;

  function updateRow(it, li) {
    li = li || document.querySelector(`.file[data-id="${it.id}"]`);
    if (!li) return;
    const [label, ic] = KIND[it.kind] || KIND.unknown;
    li.classList.toggle("is-error", it.status === "error");
    li.classList.toggle("is-work", it.status === "work" || it.status === "wait");
    const thumb = li.querySelector(".thumb");
    const src = it.res?.thumb;
    if (src && thumb.dataset.src !== src) {
      thumb.dataset.src = src;
      thumb.innerHTML = `<img alt="" src="${src}" />`;
    } else if (!src && !thumb.firstChild) {
      thumb.innerHTML = icon(ic);
    } else if (!src && thumb.querySelector("img")) {
      thumb.dataset.src = "";
      thumb.innerHTML = icon(ic);
    }
    thumb.style.setProperty("--rot", it.rotate + "deg");
    thumb.classList.toggle("turned", it.rotate % 180 !== 0);
    let meta;
    if (it.status === "work") meta = `<span class="spin"></span>${it.page ? `Making page ${it.page + 1}…` : it.kind === "pdf" ? "Reading…" : "Converting…"}`;
    else if (it.status === "wait") meta = `<span class="spin"></span>Waiting…`;
    else if (it.status === "error") meta = `${icon("warning-circle")}<span>${esc(it.msg || "This file can't be used.")}</span>`;
    else {
      const p = it.res.pages;
      const used = usedPages(it);
      const sel = used && used.length !== p ? ` · using ${used.length}` : "";
      meta = `${esc(label)} · ${plural(p, "page")}${sel} · ${fmtSize(it.kind === "pdf" && !it.res.note ? it.file.size : it.res.bytes.length)}${it.rotate ? ` · turned ${it.rotate}°` : ""}${it.res.note ? ` · ${esc(it.res.note)}` : ""}`;
    }
    const m = li.querySelector(".meta");
    if (m.innerHTML !== meta) m.innerHTML = meta;
    const ready = it.status === "ready";
    li.querySelector(".pick").hidden = S.mode !== "combine" || !ready;
    li.querySelector(".range-err").textContent = it.rangeErr;
    li.querySelector(".range input").classList.toggle("bad", !!it.rangeErr);
    li.querySelector(".dl").hidden = !(S.mode === "convert" && ready && it.kind !== "pdf");
    const i = S.items.indexOf(it);
    li.querySelector(".up").disabled = i <= 0;
    li.querySelector(".down").disabled = i === S.items.length - 1;
    li.querySelector(".grip").hidden = S.items.length < 2;
  }

  function usedPages(it) {
    if (!it.res || it.rangeErr) return null;
    try {
      return E.parseRange(it.range, it.res.pages);
    } catch {
      return null;
    }
  }
  function validateRange(it) {
    it.rangeErr = "";
    if (!it.res || !it.range.trim()) return;
    try {
      const r = E.parseRange(it.range, it.res.pages);
      if (r && !r.length) it.rangeErr = "No pages picked.";
    } catch (e) {
      it.rangeErr = e.message;
    }
  }

  function move(it, d) {
    const i = S.items.indexOf(it);
    const j = i + d;
    if (j < 0 || j >= S.items.length) return;
    S.items.splice(i, 1);
    S.items.splice(j, 0, it);
    render();
  }
  function remove(it) {
    S.items = S.items.filter((x) => x !== it);
    render();
  }

  /* ---------- output ---------- */
  function updateOut() {
    const out = $("#out");
    out.hidden = S.items.length === 0;
    if (out.hidden) return;
    const ready = S.items.filter((x) => x.status === "ready");
    const working = S.items.filter((x) => x.status === "work" || x.status === "wait").length;
    const bad = S.items.filter((x) => x.status === "error").length;
    const rangeBad = ready.some((x) => x.rangeErr);
    const pages = ready.reduce((n, x) => n + (usedPages(x)?.length ?? x.res.pages), 0);

    if (!S.nameTouched) {
      const first = ready[0] || S.items.find((x) => x.status !== "error");
      S.name = ready.length > 1 || (S.mode === "combine" && S.items.length > 1) ? "combined" : first ? base(first.file.name) : "document";
      $("#out-name").value = S.name;
    }

    const parts = [];
    if (working) parts.push(`Working on ${plural(working, "file")}…`);
    else if (ready.length) parts.push(`${plural(pages, "page")} from ${plural(ready.length, "file")}`);
    if (bad) parts.push(`${plural(bad, "file")} can't be used and will be left out`);
    $("#out-sum").textContent = parts.join(" · ");

    const one = $("#dl-one");
    const many = ready.length > 1;
    one.querySelector("span").textContent =
      S.saving ? "Making the PDF…" : S.mode === "combine" ? (many ? "Combine and download" : "Download PDF") : many ? "Download as one PDF" : "Download PDF";
    one.disabled = S.saving || working > 0 || !ready.length || rangeBad;
    const zip = $("#dl-zip");
    zip.hidden = S.mode !== "convert" || ready.length < 2;
    zip.disabled = S.saving || working > 0;
  }

  async function downloadOne(it) {
    if (!it.res) return;
    E.download(it.res.bytes, base(it.file.name) + ".pdf");
  }

  function outName() {
    const n = ($("#out-name").value || "").trim().replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-");
    return (n || "combined") + ".pdf";
  }

  async function downloadAll() {
    const ready = S.items.filter((x) => x.status === "ready");
    if (!ready.length) return;
    S.saving = true;
    updateOut();
    try {
      let bytes;
      if (ready.length === 1 && !ready[0].range.trim() && !ready[0].rotate) bytes = ready[0].res.bytes;
      else
        bytes = await E.merge(
          ready.map((x) => ({ bytes: x.res.bytes, doc: x.res.doc, pages: usedPages(x), rotate: x.rotate })),
          base(outName())
        );
      E.download(bytes, outName());
      toast(`Saved ${outName()}`);
    } catch (e) {
      toast(e.message || "That didn't work. Try again.", true);
    } finally {
      S.saving = false;
      updateOut();
    }
  }

  async function downloadZip() {
    const ready = S.items.filter((x) => x.status === "ready");
    S.saving = true;
    updateOut();
    try {
      const blob = await E.zip(ready.map((x) => ({ name: base(x.file.name) + ".pdf", bytes: x.res.bytes })));
      E.download(blob, base(outName()) + ".zip", "application/zip");
    } catch (e) {
      toast(e.message || "That didn't work. Try again.", true);
    } finally {
      S.saving = false;
      updateOut();
    }
  }

  let toastT;
  function toast(msg, bad) {
    const s = $("#out-sum");
    s.textContent = msg;
    s.classList.toggle("bad", !!bad);
    clearTimeout(toastT);
    toastT = setTimeout(() => {
      s.classList.remove("bad");
      updateOut();
    }, 4000);
  }

  /* ---------- modes ---------- */
  function setMode(m) {
    S.mode = m === "combine" ? "combine" : "convert";
    document.body.dataset.mode = S.mode;
    document.querySelectorAll(".seg [data-mode]").forEach((b) => {
      const on = b.dataset.mode === S.mode;
      b.setAttribute("aria-selected", on);
      b.setAttribute("aria-pressed", on);
    });
    $("#drop-title").textContent = S.mode === "combine" ? "Drop the PDFs to put together" : "Drop files to turn into PDFs";
    $("#drop-types").textContent =
      S.mode === "combine"
        ? "PDFs, plus photos and Office files (they get converted first). Then drag them into order."
        : "Photos, Word (.docx), Excel (.xlsx, .csv), PowerPoint (.pptx), text and Markdown.";
    document.title = (S.mode === "combine" ? "Combine PDFs" : "Convert to PDF") + " · Harrison Stewart";
    S.items.forEach((it) => updateRow(it));
    updateOut();
  }

  /* ---------- wiring ---------- */
  function init() {
    const fileIn = $("#file-in");
    fileIn.accept = ACCEPT;
    $("#pick").addEventListener("click", () => fileIn.click());
    fileIn.addEventListener("change", () => {
      add(fileIn.files);
      fileIn.value = "";
    });
    const cam = $("#cam-in");
    $("#snap").hidden = !matchMedia("(pointer: coarse)").matches;
    $("#snap").addEventListener("click", () => cam.click());
    cam.addEventListener("change", () => {
      add(cam.files);
      cam.value = "";
    });

    // drop anywhere on the page
    let depth = 0;
    const isFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
    window.addEventListener("dragenter", (e) => {
      if (!isFiles(e)) return;
      depth++;
      document.body.classList.add("dropping");
    });
    window.addEventListener("dragleave", (e) => {
      if (!isFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) document.body.classList.remove("dropping");
    });
    window.addEventListener("dragover", (e) => {
      if (isFiles(e)) e.preventDefault();
    });
    window.addEventListener("drop", (e) => {
      if (!isFiles(e)) return;
      e.preventDefault();
      depth = 0;
      document.body.classList.remove("dropping");
      add(e.dataTransfer.files);
    });
    // paste a screenshot
    window.addEventListener("paste", (e) => {
      if (e.target.closest?.("input, textarea")) return;
      const files = [...(e.clipboardData?.files || [])];
      if (!files.length) return;
      e.preventDefault();
      add(files.map((f, i) => (f.name && f.name !== "image.png" ? f : new File([f], `pasted-${Date.now()}-${i + 1}.png`, { type: f.type || "image/png" }))));
    });

    $("#o-size").addEventListener("change", (e) => reconvert("size", e.target.value));
    $("#o-margin").addEventListener("change", (e) => reconvert("margin", e.target.value));
    $("#out-name").addEventListener("input", () => (S.nameTouched = true));
    $("#dl-one").addEventListener("click", downloadAll);
    $("#dl-zip").addEventListener("click", downloadZip);
    $("#clear").addEventListener("click", () => {
      S.items = [];
      S.nameTouched = false;
      render();
    });

    document.querySelectorAll(".seg [data-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        history.replaceState(null, "", "#" + b.dataset.mode);
        setMode(b.dataset.mode);
      })
    );
    window.addEventListener("hashchange", () => setMode(location.hash.slice(1)));
    setMode(location.hash.slice(1));
    render();
  }

  function reconvert(key, val) {
    S[key] = val;
    let any = false;
    for (const it of S.items) {
      if (["image", "text", "markdown", "code", "sheet"].includes(it.kind) && it.status !== "error") {
        it.status = "wait";
        it.res = null;
        any = true;
        updateRow(it);
      }
    }
    if (any) {
      updateOut();
      pump();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
