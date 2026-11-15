/* PDF engine: turns files into PDFs and merges PDFs, all in the browser.
   Nothing is uploaded. Libraries load only when a file needs them.
   Exposes window.PdfEngine. */
(function () {
  "use strict";

  /* ---------- libraries (pinned versions, checked with SRI) ---------- */
  const LIBS = {
    pdflib: {
      src: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
      sri: "sha384-weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI",
      global: "PDFLib",
    },
    h2c: {
      src: "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      sri: "sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H",
      global: "html2canvas",
    },
    jszip: {
      src: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
      sri: "sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG",
      global: "JSZip",
    },
    docx: {
      src: "https://cdn.jsdelivr.net/npm/docx-preview@0.4.1/dist/docx-preview.min.js",
      sri: "sha384-DifWB1GSGsQgwTegPEbGdEMnGZpmfhUsx9A3WuHv+rfQVCFXMhawW/v4AZcP1FzL",
      global: "docx",
      needs: ["jszip"],
    },
    xlsx: {
      src: "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js",
      sri: "sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT",
      global: "XLSX",
    },
    pptx: {
      src: "https://cdn.jsdelivr.net/npm/pptx-preview@1.0.7/dist/pptx-preview.umd.js",
      sri: "sha384-CwntHHT2FbwZXuCmbf6K93YaEB9xRVVLaqFJ7pdMykeQABb/3MA0sbt2lGbgi1Mr",
      global: "pptxPreview",
    },
  };
  const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/";
  const loading = {};

  function load(name) {
    const lib = LIBS[name];
    if (window[lib.global]) return Promise.resolve(window[lib.global]);
    if (loading[name]) return loading[name];
    loading[name] = Promise.all((lib.needs || []).map(load)).then(
      () =>
        new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = lib.src;
          s.integrity = lib.sri;
          s.crossOrigin = "anonymous";
          s.onload = () => (window[lib.global] ? resolve(window[lib.global]) : reject(new Error(`${name} didn't load`)));
          s.onerror = () => {
            delete loading[name];
            s.remove();
            reject(new Error("Couldn't download a library this needs. Check your connection and try again."));
          };
          document.head.appendChild(s);
        })
    );
    return loading[name];
  }

  let pdfjsP = null;
  function pdfjs() {
    if (!pdfjsP) {
      pdfjsP = import(PDFJS + "pdf.min.mjs").then((m) => {
        m.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.mjs";
        return m;
      });
      pdfjsP.catch(() => (pdfjsP = null));
    }
    return pdfjsP;
  }

  /* ---------- file types ---------- */
  const EXT = {
    pdf: "pdf",
    jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image", bmp: "image", avif: "image", heic: "image", heif: "image", svg: "image",
    docx: "word", docm: "word", dotx: "word",
    xlsx: "sheet", xlsm: "sheet", xls: "sheet", ods: "sheet", numbers: "sheet", csv: "sheet", tsv: "sheet",
    pptx: "slides", ppsx: "slides", potx: "slides",
    txt: "text", text: "text", log: "text", md: "markdown", markdown: "markdown",
    json: "code", xml: "code", py: "code", js: "code", m: "code", r: "code", c: "code", cpp: "code", h: "code", java: "code", html: "code", css: "code", sql: "code", sh: "code", yml: "code", yaml: "code", ipynb: "code",
  };
  const OLD = {
    doc: "Old .doc files can't be read here. Open it in Word or Google Docs and save it as .docx or PDF.",
    ppt: "Old .ppt files can't be read here. Open it in PowerPoint or Google Slides and save it as .pptx or PDF.",
    pages: "Pages files can't be read here. In Pages, use File, Export To, PDF.",
    key: "Keynote files can't be read here. In Keynote, use File, Export To, PDF.",
    odt: "OpenDocument text files can't be read here. Save it as .docx or PDF first.",
    rtf: "RTF files can't be read here. Save it as .docx or PDF first.",
  };
  const ext = (name) => (name.match(/\.([^.]+)$/) || [, ""])[1].toLowerCase();
  function kindOf(file) {
    const e = ext(file.name);
    if (EXT[e]) return EXT[e];
    if (OLD[e]) return "old";
    if (file.type === "application/pdf") return "pdf";
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("text/")) return "text";
    return "unknown";
  }
  const reasonFor = (file) => OLD[ext(file.name)] || "This kind of file isn't supported. Try a PDF, a photo, or a Word, Excel, PowerPoint or text file.";

  /* ---------- page sizes (points; 72 pt = 1 in) ---------- */
  const SIZES = { letter: [612, 792], a4: [595.28, 841.89] };
  const PX = 96 / 72; // CSS px per pt

  /* ---------- helpers ---------- */
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const canvasToBytes = (canvas, type = "image/jpeg", q = 0.9) =>
    new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? b.arrayBuffer().then((a) => resolve(new Uint8Array(a))) : reject(new Error("Couldn't draw the page."))), type, q)
    );

  function thumbFrom(canvas, w = 160) {
    const s = Math.min(1, w / canvas.width);
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(canvas.width * s));
    c.height = Math.max(1, Math.round(canvas.height * s));
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(canvas, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  }

  // How text, code and spreadsheets look on the page. Plain print styles: black on white.
  const DOC_CSS = `
.pdf-stage, .pdf-stage * { box-sizing: border-box; }
.pdf-doc { background: #fff; color: #111; font: 11pt/1.45 "Inter", Arial, Helvetica, sans-serif; letter-spacing: 0; text-align: left; }
.pdf-doc .ln { white-space: pre-wrap; overflow-wrap: anywhere; min-height: 1.45em; }
.pdf-code { font: 9pt/1.5 "JetBrains Mono", Consolas, "Courier New", monospace; tab-size: 4; }
.pdf-md h1, .pdf-md h2, .pdf-md h3, .pdf-md h4 { margin: 1.1em 0 0.4em; line-height: 1.25; color: #000; }
.pdf-md h1 { font-size: 20pt; } .pdf-md h2 { font-size: 15pt; } .pdf-md h3 { font-size: 12.5pt; }
.pdf-md > :first-child { margin-top: 0; }
.pdf-md p, .pdf-md ul, .pdf-md ol { margin: 0 0 0.7em; }
.pdf-md code, .pdf-md pre { font-family: "JetBrains Mono", Consolas, monospace; font-size: 9pt; background: #f2f2f2; }
.pdf-md pre { padding: 8px 10px; border-radius: 4px; }
.pdf-md blockquote { margin: 0 0 0.7em; padding-left: 12px; border-left: 3px solid #bbb; color: #444; }
.pdf-md hr { border: 0; border-top: 1px solid #bbb; margin: 1em 0; }
.pdf-md .lnk { color: #1a56c4; text-decoration: underline; }
.pdf-sheet + .pdf-sheet { margin-top: 28px; }
.pdf-sheet-name { font-size: 13pt; margin: 0 0 8px; color: #000; }
.pdf-sheet table { border-collapse: collapse; font: 9.5pt/1.3 Arial, Helvetica, sans-serif; }
.pdf-sheet td, .pdf-sheet th { border: 1px solid #c4c4c4; padding: 3px 6px; vertical-align: top; white-space: nowrap; }
.pdf-sheet td.long { white-space: normal; min-width: 1.6in; max-width: 3.2in; overflow-wrap: anywhere; }
.pdf-sheet td[data-t="n"] { text-align: right; }
.pdf-word .docx-wrapper { background: none; padding: 0; display: block; }
.pdf-word .docx-wrapper > section.docx { box-shadow: none; margin: 0 0 24px; }
.pdf-pptx { width: 1280px; background: #fff; }
.pdf-pptx .pptx-preview-wrapper { height: auto !important; overflow: visible !important; }
`;
  function ensureCss() {
    if (document.getElementById("pdf-engine-css")) return;
    const st = document.createElement("style");
    st.id = "pdf-engine-css";
    st.textContent = DOC_CSS;
    document.head.appendChild(st);
  }

  // an off-screen area where documents are laid out before they're drawn
  function makeStage() {
    ensureCss();
    const st = document.createElement("div");
    st.className = "pdf-stage";
    st.setAttribute("aria-hidden", "true");
    st.style.cssText = "position:fixed;left:-30000px;top:0;width:auto;pointer-events:none;"; // fixed, so it never adds page scroll
    document.body.appendChild(st);
    return st;
  }

  /* ---------- the paginator ----------
     Lays a tall element across pages, breaking only between lines of text,
     never through a line or a picture, then draws each page into the PDF. */
  function blockedSpans(box) {
    const top = box.getBoundingClientRect().top;
    const spans = [];
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.height > 0) spans.push([r.top - top, r.bottom - top]);
    }
    box.querySelectorAll("img,svg,canvas,video,hr,.pdf-keep").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height > 0) spans.push([r.top - top, r.bottom - top]);
    });
    spans.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const s of spans) {
      const last = merged[merged.length - 1];
      if (last && s[0] < last[1] - 0.5) last[1] = Math.max(last[1], s[1]);
      else merged.push([s[0], s[1]]);
    }
    return merged;
  }

  // Where to end a page that starts at `start` and can't go past `limit`
  function breakAt(spans, start, limit) {
    for (const [a, b] of spans) {
      if (b <= limit) continue; // fits
      if (a >= limit) return limit; // starts after the limit; cut in the gap
      if (a > start + 4) return a; // straddles the limit; push it to the next page
      return limit; // taller than a page; cut through it
    }
    return limit;
  }

  /* Draw `box` into `pdf`, one or more pages.
     geom: { pageW, pageH } in CSS px of the page; scale s maps box px to page px;
     padTop / padBottom: the box's top/bottom margins in box px. */
  async function paginateInto(pdf, box, geom, onPage) {
    const h2c = window.html2canvas;
    const { pageW, pageH, s = 1, padTop = 0, padBottom = 0 } = geom;
    const R = 2; // render at 2x for sharp text (about 192 dpi)
    const boxW = box.offsetWidth;
    const total = box.scrollHeight;
    const pageHb = pageH / s;
    const spans = blockedSpans(box);
    // forced page breaks (break-after: page / break-before: page)
    const boxRectTop = box.getBoundingClientRect().top;
    const forced = [];
    box.querySelectorAll("*").forEach((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.breakAfter === "page" || cs.pageBreakAfter === "always") forced.push(r.bottom - boxRectTop);
      if (cs.breakBefore === "page" || cs.pageBreakBefore === "always") forced.push(r.top - boxRectTop);
    });
    forced.sort((a, b) => a - b);
    const contentEnd = spans.length ? Math.min(total, spans[spans.length - 1][1] + padBottom) : total;
    const wPt = pageW / PX;
    const hPt = pageH / PX;
    let start = 0;
    let first = true;
    let thumb = null;
    while (first || start < contentEnd - padBottom - 1) {
      let limit = first ? pageHb - padBottom : start + pageHb - padTop - padBottom;
      const fb = forced.find((y) => y > start + 1 && y <= limit);
      if (fb !== undefined) limit = fb;
      let end = Math.min(breakAt(spans, start, limit), contentEnd);
      if (end <= start) end = Math.min(limit, contentEnd);
      const sliceH = Math.max(1, Math.ceil(end - start));
      const canvas = await h2c(box, {
        x: 0, // html2canvas measures x and y from the element's own corner
        y: start,
        width: boxW,
        height: sliceH,
        scale: R * s,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        windowWidth: Math.max(document.documentElement.clientWidth, boxW + 40),
      });
      const img = await pdf.embedJpg(await canvasToBytes(canvas));
      const page = pdf.addPage([wPt, hPt]);
      const offset = first ? 0 : padTop * s;
      const drawH = (sliceH * s) / PX;
      page.drawImage(img, { x: 0, y: hPt - offset / PX - drawH, width: wPt, height: drawH });
      if (!thumb) thumb = thumbPage(canvas, pageW * R, pageH * R, first ? 0 : padTop * s * R);
      if (onPage) onPage(pdf.getPageCount());
      first = false;
      start = end;
      await tick();
    }
    return thumb;
  }

  function thumbPage(slice, w, h, top) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(slice, 0, top);
    return thumbFrom(c);
  }

  /* ---------- converters: each returns { bytes, pages, thumb } ---------- */

  async function fromPdf(file, onPage) {
    const { PDFDocument } = await load("pdflib");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let doc = null;
    try {
      doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    } catch (e) {
      doc = null; // damaged, or something pdf-lib can't read; pdf.js may still open it
    }
    if (doc && !doc.isEncrypted) return { bytes, pages: doc.getPageCount(), thumb: null, doc };
    return redrawPdf(bytes, file.name, onPage, doc ? "Locked PDF, so the pages were copied as pictures" : "Repaired, so the pages were copied as pictures");
  }

  // Locked (copy-protected) or damaged PDFs can't be copied page by page,
  // but pdf.js can still draw them, so each page goes in as a picture.
  async function redrawPdf(bytes, name, onPage, note) {
    const [{ PDFDocument }, lib] = await Promise.all([load("pdflib"), pdfjs()]);
    const task = lib.getDocument({ data: bytes.slice(0), isEvalSupported: false });
    let src;
    try {
      src = await task.promise;
    } catch (e) {
      task.destroy();
      if (e && e.name === "PasswordException") throw new Error("This PDF needs a password to open. Open it with the password, print it to a new PDF, and add that one.");
      throw new Error("This PDF looks damaged and couldn't be opened.");
    }
    const pdf = await PDFDocument.create();
    let thumb = null;
    try {
      for (let i = 1; i <= src.numPages; i++) {
        const page = await src.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: Math.min(2.2, 2600 / Math.max(base.width, base.height)) });
        const c = document.createElement("canvas");
        c.width = Math.round(vp.width);
        c.height = Math.round(vp.height);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, canvas: c, viewport: vp }).promise;
        const img = await pdf.embedJpg(await canvasToBytes(c, "image/jpeg", 0.88));
        pdf.addPage([base.width, base.height]).drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
        if (!thumb) thumb = thumbFrom(c);
        page.cleanup();
        if (onPage) onPage(i);
        await tick();
      }
    } finally {
      task.destroy();
    }
    const out = await finish(pdf, thumb, name);
    out.note = note;
    return out;
  }

  function decodeImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => resolve({ img, url });
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(/hei[cf]$/i.test(blob.name || "") ? "This browser can't open HEIC photos. On an iPhone, Safari can; or set Camera, Formats to Most Compatible." : "This picture couldn't be opened."));
      };
      img.src = url;
    });
  }

  // opts: { size: "letter" | "a4" | "fit", margin: pt }
  async function addImagePage(pdf, file, opts) {
    const { img, url } = await decodeImage(file);
    try {
      let w = img.naturalWidth || 1200;
      let h = img.naturalHeight || 1600;
      const MAX = 2600; // plenty for a printed page, keeps phone photos from making huge PDFs
      const k = Math.min(1, MAX / Math.max(w, h));
      w = Math.round(w * k);
      h = Math.round(h * k);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; // transparent PNGs get a white background
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h); // the browser applies the photo's rotation (EXIF) here
      const isPng = /png|gif|svg/i.test(file.type) || /\.(png|gif|svg)$/i.test(file.name);
      const bytes = await canvasToBytes(c, isPng ? "image/png" : "image/jpeg", 0.88);
      const emb = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      let pw, ph;
      if (opts.size === "fit") {
        // page the size of the picture, as if printed at 150 dpi, with the long side capped at 17 in
        const scale = Math.min(72 / 150, (17 * 72) / Math.max(w, h));
        pw = w * scale + 2 * opts.margin;
        ph = h * scale + 2 * opts.margin;
      } else {
        [pw, ph] = SIZES[opts.size] || SIZES.letter;
        if (w > h) [pw, ph] = [ph, pw]; // wide pictures get a landscape page
      }
      const m = opts.margin;
      const fit = Math.min((pw - 2 * m) / w, (ph - 2 * m) / h);
      const dw = w * fit;
      const dh = h * fit;
      const page = pdf.addPage([pw, ph]);
      page.drawImage(emb, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      return thumbFrom(c);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function fromImage(file, opts) {
    const { PDFDocument } = await load("pdflib");
    const pdf = await PDFDocument.create();
    const thumb = await addImagePage(pdf, file, opts);
    return finish(pdf, thumb, file.name);
  }

  // Several photos into one PDF, one per page
  async function imagesToPdf(files, opts) {
    const { PDFDocument } = await load("pdflib");
    const pdf = await PDFDocument.create();
    for (const f of files) await addImagePage(pdf, f, opts);
    return pdf.save();
  }

  async function finish(pdf, thumb, name) {
    pdf.setTitle(name.replace(/\.[^.]+$/, ""));
    pdf.setProducer("harrisonpstewart.com PDF tools (pdf-lib)");
    pdf.setCreator("harrisonpstewart.com PDF tools");
    const bytes = await pdf.save();
    return { bytes, pages: pdf.getPageCount(), thumb };
  }

  // Lay out flowing HTML on letter/A4 pages with margins
  async function flowToPdf(html, name, opts, onPage, extraClass = "") {
    const [{ PDFDocument }] = await Promise.all([load("pdflib"), load("h2c")]);
    const pdf = await PDFDocument.create();
    const stage = makeStage();
    let thumb = null;
    try {
      const parts = Array.isArray(html) ? html : [html];
      for (const part of parts) {
        let [wPt, hPt] = SIZES[opts.size === "a4" ? "a4" : "letter"];
        const mPx = Math.max(opts.margin, 36) * PX; // documents always get at least half-inch margins
        const box = document.createElement("div");
        box.className = "pdf-doc " + extraClass;
        box.innerHTML = part;
        stage.replaceChildren(box);
        // lay out at the page's text width; only content that still sticks out (wide tables)
        // gets a sideways page, and then shrinks to fit
        await document.fonts?.ready;
        const fitW = (w) => {
          box.style.padding = "0";
          box.style.width = w + "px";
          return Math.max(w, box.scrollWidth);
        };
        let natural = fitW(wPt * PX - 2 * mPx);
        if (natural > wPt * PX - 2 * mPx + 1 && opts.landscape !== false) {
          [wPt, hPt] = [hPt, wPt];
          natural = fitW(wPt * PX - 2 * mPx);
        }
        const pageW = wPt * PX;
        const pageH = hPt * PX;
        const s = Math.min(1, (pageW - 2 * mPx) / Math.max(1, natural));
        box.style.width = pageW / s + "px";
        box.style.padding = `${mPx / s}px`;
        await document.fonts?.ready;
        await tick();
        const t = await paginateInto(pdf, box, { pageW, pageH, s, padTop: mPx / s, padBottom: mPx / s }, onPage);
        thumb = thumb || t;
      }
    } finally {
      stage.remove();
    }
    if (!pdf.getPageCount()) throw new Error("This file is empty.");
    return finish(pdf, thumb, name);
  }

  const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  async function readText(file) {
    const buf = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buf);
    if (text.includes("�")) text = new TextDecoder("windows-1252").decode(buf);
    return text.replace(/\r\n?/g, "\n");
  }

  async function fromText(file, opts, onPage, mono) {
    let text = await readText(file);
    if (ext(file.name) === "ipynb") text = notebookText(text);
    const html = text
      .split("\n")
      .map((l) => `<div class="ln">${l ? escHtml(l) : "&nbsp;"}</div>`)
      .join("");
    return flowToPdf(`<div class="${mono ? "pdf-code" : "pdf-text"}">${html}</div>`, file.name, { ...opts, landscape: false }, onPage);
  }

  function notebookText(src) {
    try {
      const nb = JSON.parse(src);
      return (nb.cells || [])
        .map((c) => {
          const s = Array.isArray(c.source) ? c.source.join("") : c.source || "";
          const out = (c.outputs || [])
            .map((o) => (o.text ? [].concat(o.text).join("") : o.data?.["text/plain"] ? [].concat(o.data["text/plain"]).join("") : ""))
            .filter(Boolean)
            .join("\n");
          return (c.cell_type === "code" ? "In:\n" : "") + s + (out ? "\n\nOut:\n" + out : "");
        })
        .join("\n\n" + "─".repeat(60) + "\n\n");
    } catch {
      return src;
    }
  }

  // A small Markdown reader: headings, lists, quotes, code, bold, italic, links
  function markdown(src) {
    const inline = (t) =>
      escHtml(t)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<span class="lnk">$1</span>');
    const out = [];
    let list = null;
    let code = null;
    let para = [];
    const flush = () => {
      if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
      if (list) out.push(`</${list}>`);
      list = null;
    };
    for (const line of src.split("\n")) {
      if (code !== null) {
        if (/^```/.test(line)) {
          out.push(`<pre>${code.map((l) => `<div class="ln">${escHtml(l) || "&nbsp;"}</div>`).join("")}</pre>`);
          code = null;
        } else code.push(line);
        continue;
      }
      let m;
      if (/^```/.test(line)) {
        flush();
        code = [];
      } else if ((m = line.match(/^(#{1,6})\s+(.*)/))) {
        flush();
        out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
      } else if ((m = line.match(/^\s*([-*+]|\d+[.)])\s+(.*)/))) {
        if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`), (para = []);
        const tag = /\d/.test(m[1]) ? "ol" : "ul";
        if (list !== tag) {
          if (list) out.push(`</${list}>`);
          out.push(`<${tag}>`);
          list = tag;
        }
        out.push(`<li>${inline(m[2])}</li>`);
      } else if ((m = line.match(/^>\s?(.*)/))) {
        flush();
        out.push(`<blockquote>${inline(m[1])}</blockquote>`);
      } else if (/^\s*([-*_])\s*\1\s*\1[\s\1]*$/.test(line)) {
        flush();
        out.push("<hr>");
      } else if (!line.trim()) flush();
      else {
        if (list) out.push(`</${list}>`), (list = null);
        para.push(line.trim());
      }
    }
    if (code) out.push(`<pre>${code.map((l) => `<div class="ln">${escHtml(l) || "&nbsp;"}</div>`).join("")}</pre>`);
    flush();
    return `<div class="pdf-md">${out.join("")}</div>`;
  }

  async function fromMarkdown(file, opts, onPage) {
    return flowToPdf(markdown(await readText(file)), file.name, { ...opts, landscape: false }, onPage);
  }

  async function fromSheet(file, opts, onPage) {
    const XLSX = await load("xlsx");
    const e = ext(file.name);
    let wb;
    try {
      wb =
        e === "csv" || e === "tsv"
          ? XLSX.read(await readText(file), { type: "string", FS: e === "tsv" ? "\t" : undefined, raw: false })
          : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    } catch (err) {
      throw new Error("This spreadsheet couldn't be read. If it has a password, remove it and try again.");
    }
    const parts = [];
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      if (!ws || !ws["!ref"]) continue;
      const tpl = document.createElement("template");
      tpl.innerHTML = XLSX.utils.sheet_to_html(ws, { header: "", footer: "" });
      tpl.content.querySelectorAll("td").forEach((td) => td.textContent.length > 32 && td.classList.add("long")); // only long text wraps
      const html = tpl.innerHTML;
      const title = wb.SheetNames.length > 1 ? `<h2 class="pdf-sheet-name">${escHtml(name)}</h2>` : "";
      parts.push(`<div class="pdf-sheet">${title}${html}</div>`);
    }
    if (!parts.length) throw new Error("This spreadsheet is empty.");
    return flowToPdf(parts, file.name, opts, onPage);
  }

  async function fromWord(file, opts, onPage) {
    const [{ PDFDocument }, docx] = await Promise.all([load("pdflib"), load("docx"), load("h2c")]);
    const pdf = await PDFDocument.create();
    const stage = makeStage();
    let thumb = null;
    try {
      const body = document.createElement("div");
      const styles = document.createElement("div");
      body.className = "pdf-word";
      stage.append(styles, body);
      try {
        await docx.renderAsync(await file.arrayBuffer(), body, styles, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false, // use the page breaks Word saved, when it saved them
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
          experimental: true,
        });
      } catch (err) {
        throw new Error("This Word file couldn't be read. If it has a password, remove it and try again.");
      }
      await document.fonts?.ready;
      await tick();
      const sections = [...body.querySelectorAll("section.docx")];
      if (!sections.length) throw new Error("This Word file looks empty.");
      for (const sec of sections) {
        const cs = getComputedStyle(sec);
        const pageW = sec.offsetWidth;
        const pageH = parseFloat(cs.minHeight) || pageW * (11 / 8.5);
        const t = await paginateInto(pdf, sec, { pageW, pageH, s: 1, padTop: parseFloat(cs.paddingTop) || 0, padBottom: parseFloat(cs.paddingBottom) || 0 }, onPage);
        thumb = thumb || t;
      }
    } finally {
      stage.remove();
    }
    return finish(pdf, thumb, file.name);
  }

  async function fromSlides(file, opts, onPage) {
    const [{ PDFDocument }, pptx] = await Promise.all([load("pdflib"), load("pptx"), load("h2c")]);
    const pdf = await PDFDocument.create();
    const stage = makeStage();
    let thumb = null;
    try {
      const host = document.createElement("div");
      host.className = "pdf-pptx";
      stage.append(host);
      const W = 1280;
      let deck;
      try {
        const viewer = pptx.init(host, { width: W, height: Math.round((W * 9) / 16), mode: "list" });
        deck = await viewer.preview(await file.arrayBuffer());
      } catch (err) {
        throw new Error("This PowerPoint file couldn't be read. If it has a password, remove it and try again.");
      }
      await document.fonts?.ready;
      await new Promise((r) => setTimeout(r, 300)); // let pictures finish loading
      await Promise.all([...host.querySelectorAll("img")].map((im) => (im.complete ? 0 : new Promise((r) => ((im.onload = im.onerror = r))))));
      const slides = [...host.querySelectorAll(".pptx-preview-slide-wrapper")];
      if (!slides.length) throw new Error("No slides could be read from this file. Try saving it again from PowerPoint or Google Slides.");
      const h2c = window.html2canvas;
      for (const sl of slides) {
        const w = sl.offsetWidth;
        const h = sl.offsetHeight;
        const canvas = await h2c(sl, { scale: 1600 / w, backgroundColor: "#ffffff", logging: false, useCORS: true });
        const wPt = 720; // 10 in wide, like PowerPoint's own PDFs
        const hPt = (wPt * h) / w;
        const img = await pdf.embedJpg(await canvasToBytes(canvas, "image/jpeg", 0.9));
        pdf.addPage([wPt, hPt]).drawImage(img, { x: 0, y: 0, width: wPt, height: hPt });
        thumb = thumb || thumbFrom(canvas);
        if (onPage) onPage(pdf.getPageCount());
        await tick();
      }
      void deck;
    } finally {
      stage.remove();
    }
    return finish(pdf, thumb, file.name);
  }

  /* ---------- public: convert one file ---------- */
  async function convert(file, opts = {}, onPage) {
    opts = { size: "letter", margin: 36, ...opts };
    const k = kindOf(file);
    switch (k) {
      case "pdf":
        return fromPdf(file, onPage);
      case "image":
        return fromImage(file, opts);
      case "word":
        return fromWord(file, opts, onPage);
      case "sheet":
        return fromSheet(file, opts, onPage);
      case "slides":
        return fromSlides(file, opts, onPage);
      case "markdown":
        return fromMarkdown(file, opts, onPage);
      case "text":
        return fromText(file, opts, onPage, false);
      case "code":
        return fromText(file, opts, onPage, true);
      default:
        throw new Error(reasonFor(file));
    }
  }

  /* ---------- public: merge ----------
     parts: [{ bytes, pages: [0-based indices] | null, rotate: 0|90|180|270 }] */
  async function merge(parts, title) {
    const { PDFDocument, degrees } = await load("pdflib");
    const out = await PDFDocument.create();
    for (const p of parts) {
      const src = p.doc || (await PDFDocument.load(p.bytes, { ignoreEncryption: true, updateMetadata: false }));
      const idx = p.pages || src.getPageIndices();
      const copied = await out.copyPages(src, idx);
      for (const pg of copied) {
        if (p.rotate) pg.setRotation(degrees((pg.getRotation().angle + p.rotate) % 360));
        out.addPage(pg);
      }
      await tick();
    }
    if (title) out.setTitle(title);
    out.setProducer("harrisonpstewart.com PDF tools (pdf-lib)");
    out.setCreator("harrisonpstewart.com PDF tools");
    return out.save();
  }

  // "1-3, 5, 8-" -> [0,1,2,4,7,...]; throws a readable error
  function parseRange(text, count) {
    const t = (text || "").trim();
    if (!t || /^all$/i.test(t)) return null;
    const out = [];
    for (const raw of t.split(/[,;\s]+/).filter(Boolean)) {
      const m = raw.match(/^(\d+)?\s*(?:(-|–|to)\s*(\d+)?)?$/i);
      if (!m || (!m[1] && !m[3])) throw new Error(`"${raw}" isn't a page or a range like 2-5.`);
      const a = m[1] ? +m[1] : 1;
      const b = m[2] ? (m[3] ? +m[3] : count) : a;
      if (a < 1 || b < 1 || a > count || b > count) throw new Error(`This file only has ${count} page${count === 1 ? "" : "s"}.`);
      const step = a <= b ? 1 : -1;
      for (let i = a; step > 0 ? i <= b : i >= b; i += step) out.push(i - 1);
    }
    return out;
  }

  /* ---------- public: thumbnail of page 1 of a PDF ---------- */
  async function pdfThumb(bytes, width = 160) {
    const lib = await pdfjs();
    const task = lib.getDocument({ data: bytes.slice(0), isEvalSupported: false, disableFontFace: false });
    try {
      const doc = await task.promise;
      const page = await doc.getPage(1);
      const vp0 = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: width / vp0.width });
      const c = document.createElement("canvas");
      c.width = Math.round(vp.width);
      c.height = Math.round(vp.height);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, canvas: c, viewport: vp }).promise;
      return c.toDataURL("image/jpeg", 0.8);
    } finally {
      task.destroy();
    }
  }

  async function zip(files) {
    const JSZip = await load("jszip");
    const z = new JSZip();
    const used = new Set();
    for (const f of files) {
      let n = f.name;
      for (let i = 2; used.has(n.toLowerCase()); i++) n = f.name.replace(/(\.pdf)?$/i, ` (${i}).pdf`);
      used.add(n.toLowerCase());
      z.file(n, f.bytes);
    }
    return z.generateAsync({ type: "blob" });
  }

  function download(data, name, type = "application/pdf") {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  window.PdfEngine = { load, kindOf, convert, merge, parseRange, pdfThumb, imagesToPdf, zip, download, flowToPdf, paginateInto, SIZES };
})();
