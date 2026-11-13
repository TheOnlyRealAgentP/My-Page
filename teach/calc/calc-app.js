/* =========================================================================
   Engineering calculator: interface
   Tabs: Calculate · Graph · Stats · Matrix · Solve · Units · Constants
   ========================================================================= */
(function () {
  "use strict";
  const C = window.CALC;
  const app = document.getElementById("app");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const icon = (n) => `<i class="ph ph-${n}" aria-hidden="true"></i>`;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ---------- State ---------- */
  const S = C.newState();
  const COLORS = ["#4cc9f0", "#f72585", "#ffd166", "#2ee6a6", "#f8961e", "#a78bfa", "#ef476f", "#e9ecef"];
  S.graph.fns = COLORS.map(() => ({ expr: "", on: true }));
  const LISTS = ["L1", "L2", "L3", "L4", "L5", "L6"];
  const MATS = ["A", "B", "C", "D", "E"];
  const UI = {
    history: [],
    hi: null,
    draft: "",
    second: false,
    kbd: false,
    refQuery: "",
    g: { view: { xmin: -10, xmax: 10, ymin: -7, ymax: 7 }, keyPoints: true, plots: [], table: { start: -5, step: 1 }, integral: null, trace: null, pinned: false, points: [] },
    st: { list: 0, oneData: 0, oneFreq: -1, regX: 0, regY: 1, regType: "linear", fit: null, fitSlot: null },
    mx: { cur: "A", x: "A", y: "B", res: null, resText: "", dims: {} },
    sv: { preset: "manning-depth", eq: "", values: {}, unknown: null, lo: "", hi: "", roots: null, err: "", poly: { deg: 3, c: ["1", "-6", "11", "-6"] }, sys: { n: 3, A: [["2", "1", "-1"], ["-3", "-1", "2"], ["-2", "1", "2"]], b: ["8", "-11", "-3"] } },
    un: { cat: "length", v: "1", from: "ft", to: "m" },
  };

  /* ---------- Storage (this browser only) ---------- */
  const KEY = "calc:v1";
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const fns = {};
        for (const [k, f] of Object.entries(S.fns)) fns[k] = { params: f.params, src: f.src };
        localStorage.setItem(KEY, JSON.stringify({
          mode: S.mode, vars: { ...S.vars }, fns, ans: S.ans, history: UI.history.slice(-100),
          graph: { fns: S.graph.fns, view: UI.g.view, plots: UI.g.plots, keyPoints: UI.g.keyPoints, table: UI.g.table },
          un: UI.un,
        }));
      } catch (_) {}
    }, 250);
  }
  const okValue = (v) => typeof v === "number" || (Array.isArray(v) && v.every((x) => typeof x === "number")) || (v && Array.isArray(v.mat));
  function load() {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (_) {}
    if (!d) {
      S.graph.fns[0].expr = "x^2/4 - 3";
      S.graph.fns[1].expr = "1.5x - 2";
      return;
    }
    try {
      if (d.mode) Object.assign(S.mode, d.mode);
      for (const [k, v] of Object.entries(d.vars || {})) if (okValue(v)) S.vars[k] = v;
      for (const [k, f] of Object.entries(d.fns || {})) {
        try {
          C.run(`${k}(${f.params.join(",")}) = ${f.src}`, S);
        } catch (_) {}
      }
      if (okValue(d.ans)) S.ans = d.ans;
      if (Array.isArray(d.history)) UI.history = d.history.filter((h) => h && typeof h.input === "string");
      if (d.graph) {
        (d.graph.fns || []).slice(0, 8).forEach((f, i) => (S.graph.fns[i] = { expr: String(f.expr || ""), on: f.on !== false }));
        if (d.graph.view && d.graph.view.xmax > d.graph.view.xmin && d.graph.view.ymax > d.graph.view.ymin) UI.g.view = d.graph.view;
        if (Array.isArray(d.graph.plots)) UI.g.plots = d.graph.plots;
        if (typeof d.graph.keyPoints === "boolean") UI.g.keyPoints = d.graph.keyPoints;
        if (d.graph.table) UI.g.table = d.graph.table;
      }
      if (d.un && C.UNITS[d.un.cat]) UI.un = d.un;
    } catch (_) {}
  }

  /* ---------- Helpers ---------- */
  let toastTimer = 0;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }
  const fmtV = (v, as) => C.format.value(v, S.mode, as === "dec" ? undefined : as);
  function short(x, sig = 7) {
    if (!Number.isFinite(x)) return "—";
    if (x === 0) return "0";
    const ax = Math.abs(x);
    if (ax >= 1e9 || ax < 1e-5) return C.format.sci(x, sig);
    return String(+x.toPrecision(sig));
  }
  // Evaluate a small input (cell, field) to a number; NaN if it isn't one
  function num(text, extra) {
    const t = String(text ?? "").trim();
    if (!t) return NaN;
    if (/^-?\d*\.?\d+(e-?\d+)?$/i.test(t)) return parseFloat(t);
    const st = extra ? { ...S, vars: Object.assign(Object.create(null), S.vars, extra) } : S;
    try {
      return C.compile(t, st, [])();
    } catch (_) {
      return NaN;
    }
  }
  const insertText = (v) => {
    if (typeof v === "number") {
      const s = String(+v.toPrecision(15));
      return v < 0 ? `(${s})` : s;
    }
    return C.format.value(v, { notation: "auto" });
  };
  const pretty = (s) => s.replace(/\*/g, "×").replace(/->/g, "→").replace(/\bsqrt\(/g, "√(").replace(/\bpi\b/g, "π");

  /* =======================================================================
     Shell
     ======================================================================= */
  const TABS = [
    ["calc", "Calculate", "calculator"],
    ["graph", "Graph", "chart-line"],
    ["stats", "Stats", "chart-scatter"],
    ["matrix", "Matrix", "grid-four"],
    ["solve", "Solve", "function"],
    ["units", "Units", "arrows-left-right"],
    ["constants", "Constants", "atom"],
  ];
  function shell() {
    app.innerHTML = `
      <header class="c-head">
        <div>
          <div class="eyebrow">Surveying &amp; civil engineering · Tool</div>
          <h1>Engineering Calculator</h1>
        </div>
        <div class="modes">
          <div class="seg" role="group" aria-label="Angle mode">
            ${["deg", "rad", "grad"].map((m) => `<button type="button" data-angle="${m}">${m.toUpperCase()}</button>`).join("")}
          </div>
          <label class="sel">Display
            <select id="notation" aria-label="Number display">
              <option value="auto">Normal</option><option value="sci">Scientific</option><option value="eng">Engineering</option><option value="fix">Fixed</option>
            </select>
          </label>
          <label class="sel" id="digits-wrap">Digits
            <select id="digits" aria-label="Digits">${Array.from({ length: 11 }, (_, i) => `<option value="${i}">${i}</option>`).join("")}</select>
          </label>
          <button type="button" class="icon-btn" id="help" aria-label="How to use the calculator" title="Help">${icon("question")}</button>
        </div>
      </header>
      <nav class="c-tabs" aria-label="Calculator sections">
        ${TABS.map(([id, label, ic]) => `<a href="#/${id}" data-tab="${id}">${icon(ic)}${label}</a>`).join("")}
      </nav>
      <div id="view"></div>
      <dialog class="dlg" id="help-dlg" aria-labelledby="help-h">
        <div class="dlg-head"><h2 id="help-h">Using the calculator</h2><button type="button" class="icon-btn" data-close aria-label="Close">${icon("x")}</button></div>
        <div class="dlg-body">${helpHTML()}</div>
      </dialog>`;
    $$("[data-angle]").forEach((b) =>
      b.addEventListener("click", () => {
        S.mode.angle = b.dataset.angle;
        syncModes();
        save();
        rerender();
      })
    );
    $("#notation").addEventListener("change", (e) => {
      S.mode.notation = e.target.value;
      syncModes();
      save();
      rerender();
    });
    $("#digits").addEventListener("change", (e) => {
      S.mode.digits = +e.target.value;
      save();
      rerender();
    });
    const dlg = $("#help-dlg");
    $("#help").addEventListener("click", () => (dlg.showModal ? dlg.showModal() : null));
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
    });
    syncModes();
  }
  function syncModes() {
    $$("[data-angle]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.angle === S.mode.angle)));
    $("#notation").value = S.mode.notation;
    $("#digits").value = String(S.mode.digits);
    $("#digits-wrap").style.display = S.mode.notation === "auto" ? "none" : "";
  }
  function helpHTML() {
    return `
      <h3>Typing</h3>
      <ul>
        <li>Type with the keyboard or the keypad. <b>Enter</b> calculates; <b>↑</b> and <b>↓</b> bring back earlier lines.</li>
        <li>Multiplication can be implied: <code>2(3+4)</code>, <code>3x</code>, <code>2sin(30)</code>. <code>1/2x</code> means (1/2)·x; write <code>1/(2x)</code> if you mean that.</li>
        <li>Missing closing parentheses at the end are filled in for you.</li>
        <li>Start a line with + − × ÷ or ^ to use the last answer, or type <code>ans</code>.</li>
        <li>Click an earlier input to edit it again, or a result to insert it. Use the small buttons next to a result to see it as a fraction, in scientific or engineering notation, or in degrees-minutes-seconds.</li>
      </ul>
      <h3>Angles</h3>
      <ul>
        <li>DEG, RAD and GRAD at the top set how trig functions read and report angles.</li>
        <li><code>30°</code> is always degrees, whatever the mode. Type <code>12°30'15"</code> for degrees-minutes-seconds, or use <code>dms(12, 30, 15)</code>.</li>
      </ul>
      <h3>Memory, functions and equations</h3>
      <ul>
        <li>Store a value with <code>Q = 2.5</code> or <code>2.5 → Q</code>. Any name works, like <code>area</code> or <code>n_pipe</code>.</li>
        <li>Define a function with <code>f(x) = x^2 + 1</code>, then use <code>f(3)</code>.</li>
        <li>Type an equation with one unknown, like <code>2x + 3 = 7</code>, to solve it. The Solve tab handles formulas with many variables.</li>
        <li><code>{1, 2, 3}</code> is a list; <code>L1</code> to <code>L6</code> are the lists on the Stats tab. <code>[A]</code> to <code>[E]</code> are the matrices on the Matrix tab.</li>
      </ul>
      <h3>Saving</h3>
      <ul><li>History, variables, functions, lists, matrices and graphs are saved in this browser. Nothing is sent anywhere.</li></ul>`;
  }

  /* =======================================================================
     Calculate
     ======================================================================= */
  const KEYS = [
    [["2nd", "@2nd", null, null, "mod second"], ["x⁻¹", "⁻¹", "Aᵀ", "ᵀ"], ["x²", "²", "x³", "³"], ["^", "^", "ʸ√x", "root("], ["√", "√(", "∛", "∛("], ["⌫", "@del", "CLEAR", "@clear", "mod"]],
    [["sin", "sin(", "sin⁻¹", "asin("], ["cos", "cos(", "cos⁻¹", "acos("], ["tan", "tan(", "tan⁻¹", "atan("], ["ln", "ln(", "eˣ", "exp("], ["log", "log(", "10ˣ", "10^"], ["π", "π", "e", "e"]],
    [["(", "(", "{", "{"], [")", ")", "}", "}"], [",", ",", "[", "["], ["x", "x", "y", "y"], ["°", "°", "dms", "dms("], ["EE", "E", "%", "%"]],
    [["7", "7"], ["8", "8"], ["9", "9"], ["÷", "/", "mod", "mod("], ["ans", "ans", "→", "→"], ["=", "=", "<", "<"]],
    [["4", "4"], ["5", "5"], ["6", "6"], ["×", "*", "nCr", "nCr("], ["!", "!", "nPr", "nPr("], ["abs", "abs(", "round", "round("]],
    [["1", "1"], ["2", "2"], ["3", "3"], ["−", "-", ">", ">"], ["◀", "@left", "home", "@home", "mod"], ["▶", "@right", "end", "@end", "mod"]],
    [["0", "0"], [".", "."], ["(−)", "@neg"], ["+", "+", "]", "]"], ["ENTER", "@enter", null, null, "enter"]],
  ];
  const NUMKEYS = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "(−)"]);
  const OPKEYS = new Set(["÷", "×", "−", "+", "^"]);
  const ARIA = { "⌫": "Delete", "◀": "Cursor left", "▶": "Cursor right", "(−)": "Negative", "x⁻¹": "Reciprocal", "x²": "Squared", "√": "Square root", "EE": "Times ten to the power", "2nd": "Second function" };
  const ANS_START = ["+", "*", "/", "^", "²", "³", "⁻¹", "!", "→", "-"];

  function keyHTML(k) {
    const [label, ins, alt, altIns, cls] = k;
    const c = cls || (NUMKEYS.has(label) ? "num" : OPKEYS.has(label) ? "op" : "fn");
    return `<button type="button" class="key ${c}" data-k="${esc(ins)}"${alt ? ` data-alt="${esc(altIns)}"` : ""} aria-label="${esc(ARIA[label] || label)}${alt ? `, second function ${esc(alt)}` : ""}">${alt ? `<span class="alt">${esc(alt)}</span>` : ""}<span class="main">${esc(label)}</span></button>`;
  }

  function renderCalc(view) {
    view.innerHTML = `
      <div class="c-calc">
        <section class="panel screen" aria-label="Calculator screen">
          <div class="tape" id="tape" aria-live="polite"></div>
          <form class="entry" id="entry-form" autocomplete="off">
            <input id="entry" class="entry-in" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="Expression"
              placeholder="Type a calculation" />
            <button type="submit" class="go" aria-label="Calculate">=</button>
          </form>
          <div class="entry-msg" id="msg" role="status"></div>
          <div class="screen-bar">
            ${coarse ? `<button type="button" class="linkish" id="kbd">${icon("keyboard")}<span>Use phone keyboard</span></button>` : ""}
            <button type="button" class="linkish" id="clear-tape">${icon("trash")}Clear history</button>
            <span class="hint">Enter calculates · ↑ ↓ recall · click a result to reuse it</span>
          </div>
        </section>
        <section class="panel pad" aria-label="Keypad">
          <div class="keys" id="keys">${KEYS.flat().map(keyHTML).join("")}</div>
          <div class="pad-foot"><span>Yellow labels: press 2nd first</span><span id="mode-tag">${S.mode.angle.toUpperCase()}</span></div>
        </section>
        <section class="panel ref" aria-label="Function reference and memory">
          <div class="ref-cols">
            <div>
              <div class="ref-head">
                <h2>${icon("book-open")}Functions</h2>
                <input class="in" id="ref-q" type="search" placeholder="Search, like log or matrix" value="${esc(UI.refQuery)}" aria-label="Search functions" />
              </div>
              <div class="cat" id="cat"></div>
            </div>
            <div>
              <div class="ref-head"><h2>${icon("database")}Memory</h2></div>
              <div class="mem-list" id="mem"></div>
            </div>
          </div>
        </section>
      </div>`;

    const entry = $("#entry");
    if (coarse) entry.inputMode = UI.kbd ? "text" : "none";
    renderTape();
    renderCatalog();
    renderMemory();

    $("#entry-form").addEventListener("submit", (e) => {
      e.preventDefault();
      evaluate();
    });
    entry.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const ins = UI.history.map((h) => h.input);
        if (!ins.length) return;
        e.preventDefault();
        if (e.key === "ArrowUp") {
          if (UI.hi === null) {
            UI.draft = entry.value;
            UI.hi = ins.length - 1;
          } else UI.hi = Math.max(0, UI.hi - 1);
          entry.value = ins[UI.hi];
        } else {
          if (UI.hi === null) return;
          UI.hi++;
          if (UI.hi >= ins.length) {
            UI.hi = null;
            entry.value = UI.draft;
          } else entry.value = ins[UI.hi];
        }
        entry.setSelectionRange(entry.value.length, entry.value.length);
      } else if (e.key === "Escape") {
        entry.value = "";
        setMsg("");
      }
    });
    entry.addEventListener("input", () => {
      UI.hi = null;
      if ($("#msg").classList.contains("err")) setMsg("");
    });
    $("#keys").addEventListener("click", (e) => {
      const b = e.target.closest(".key");
      if (b) pressKey(b);
    });
    $("#clear-tape").addEventListener("click", () => {
      if (!UI.history.length) return;
      UI.history = [];
      renderTape();
      save();
      toast("History cleared. Variables and functions are kept.");
    });
    if ($("#kbd"))
      $("#kbd").addEventListener("click", () => {
        UI.kbd = !UI.kbd;
        entry.inputMode = UI.kbd ? "text" : "none";
        $("#kbd span").textContent = UI.kbd ? "Use keypad only" : "Use phone keyboard";
        entry.blur();
        entry.focus();
      });
    $("#tape").addEventListener("click", (e) => {
      const inp = e.target.closest(".t-in");
      if (inp) {
        entry.value = UI.history[+inp.dataset.i].input;
        entry.focus();
        entry.setSelectionRange(entry.value.length, entry.value.length);
        return;
      }
      const val = e.target.closest(".t-val");
      if (val) {
        const h = UI.history[+val.dataset.i];
        const v = h.kind === "solve" ? h.roots[+val.dataset.r || 0] : h.value;
        insert(insertText(v));
        return;
      }
      const f = e.target.closest("[data-fmt]");
      if (f) {
        const i = +f.closest(".t-row").dataset.i;
        UI.history[i].fmt = f.dataset.fmt;
        renderTape(false);
        save();
      }
    });
    $("#ref-q").addEventListener("input", (e) => {
      UI.refQuery = e.target.value;
      renderCatalog();
    });
    $("#cat").addEventListener("click", (e) => {
      const b = e.target.closest("[data-ins]");
      if (b) insert(b.dataset.ins);
    });
    $("#mem").addEventListener("click", (e) => {
      const ins = e.target.closest("[data-ins]");
      if (ins) return insert(ins.dataset.ins);
      const del = e.target.closest("[data-del]");
      if (del) {
        const [kind, name] = del.dataset.del.split(":");
        if (kind === "v") delete S.vars[name];
        else delete S.fns[name];
        renderMemory();
        save();
      }
    });
    if (!coarse) entry.focus();
  }

  function setMsg(text, isErr) {
    const m = $("#msg");
    if (!m) return;
    m.textContent = text;
    m.classList.toggle("err", !!isErr);
  }
  function insert(text) {
    const el = $("#entry");
    if (!el) return;
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
    el.value = el.value.slice(0, s) + text + el.value.slice(e);
    const c = s + text.length;
    el.focus();
    el.setSelectionRange(c, c);
    UI.hi = null;
  }
  function pressKey(btn) {
    btn.classList.add("flash");
    setTimeout(() => btn.classList.remove("flash"), 110);
    const el = $("#entry");
    let ins = UI.second && btn.dataset.alt ? btn.dataset.alt : btn.dataset.k;
    if (ins !== "@2nd" && UI.second) {
      UI.second = false;
      $("#keys").classList.remove("second-on");
    }
    const pos = el.selectionStart ?? el.value.length;
    switch (ins) {
      case "@2nd":
        UI.second = !UI.second;
        $("#keys").classList.toggle("second-on", UI.second);
        return;
      case "@del": {
        const e2 = el.selectionEnd ?? pos;
        if (e2 > pos) el.value = el.value.slice(0, pos) + el.value.slice(e2);
        else if (pos > 0) {
          // Delete whole function names like "sin(" in one press
          const before = el.value.slice(0, pos);
          const m = /(?:[A-Za-z_][A-Za-z0-9_]*\(|->|ans)$/.exec(before);
          const n = m ? m[0].length : 1;
          el.value = before.slice(0, -n) + el.value.slice(pos);
          el.focus();
          el.setSelectionRange(pos - n, pos - n);
          return;
        }
        el.focus();
        el.setSelectionRange(pos, pos);
        return;
      }
      case "@clear":
        el.value = "";
        setMsg("");
        el.focus();
        return;
      case "@left":
      case "@right":
      case "@home":
      case "@end": {
        const to = ins === "@left" ? Math.max(0, pos - 1) : ins === "@right" ? Math.min(el.value.length, pos + 1) : ins === "@home" ? 0 : el.value.length;
        el.focus();
        el.setSelectionRange(to, to);
        return;
      }
      case "@enter":
        evaluate();
        return;
      case "@neg":
        insert("-");
        return;
    }
    if (!el.value.trim() && ANS_START.includes(ins) && UI.history.length) ins = "ans" + ins;
    insert(ins);
  }

  function evaluate() {
    const el = $("#entry");
    let src = el.value.trim();
    if (!src) {
      if (!UI.history.length) return;
      src = UI.history[UI.history.length - 1].input;
    }
    let shift = 0;
    if (/^(\+|\*|\/|\^|×|÷|²|³|⁻¹|!|->|→)/.test(src)) {
      src = "ans" + src;
      shift = 3;
    }
    try {
      const r = C.run(src, S);
      if (!r) return;
      UI.history.push({ input: src, kind: r.kind, value: r.value, roots: r.roots, name: r.name, text: r.text });
      if (UI.history.length > 200) UI.history.splice(0, UI.history.length - 200);
      el.value = "";
      UI.hi = null;
      setMsg(r.kind === "assign" ? `Stored in ${r.name}` : r.kind === "define" ? `Defined ${r.name}. Try ${r.name}(2).` : r.kind === "solve" && r.roots.length > 1 ? `${r.roots.length} solutions found` : "");
      renderTape();
      renderMemory();
      save();
    } catch (e) {
      let msg = e.message || "Something went wrong";
      if (/isn't defined/.test(msg) && /^\s*y\s*=/.test(src)) msg += " To graph y = …, use the Graph tab.";
      setMsg(msg, true);
      if (typeof e.pos === "number") {
        const p = Math.max(0, Math.min(el.value.length, e.pos - shift));
        el.focus();
        el.setSelectionRange(p, Math.min(el.value.length, p + 1));
      }
    }
  }

  const FMTS_NUM = [["dec", "Dec"], ["frac", "Frac"], ["sci", "Sci"], ["eng", "Eng"], ["dms", "DMS"]];
  function valueHTML(h, i) {
    const as = h.fmt || "dec";
    const v = h.value;
    if (C.isMat(v)) {
      const cell = (x) => esc(fmtV(x, as));
      return `<button type="button" class="t-val t-mat" data-i="${i}" title="Insert this matrix"><table>${v.mat.map((r) => `<tr>${r.map((x) => `<td>${cell(x)}</td>`).join("")}</tr>`).join("")}</table></button>`;
    }
    let sub = "";
    if (as === "eng" && typeof v === "number") {
      const p = C.format.eng(v, 12).prefix;
      if (p) sub = `<span class="t-sub">(${esc(p)})</span>`;
    }
    if (as === "frac" && typeof v === "number" && !C.format.fraction(v)) sub = `<span class="t-sub">(no simple fraction)</span>`;
    return `${sub}<button type="button" class="t-val" data-i="${i}" title="Insert this value"><span class="eq">=</span>${esc(fmtV(v, as))}</button>`;
  }
  function fmtBar(h) {
    const v = h.kind === "solve" ? h.roots[0] : h.value;
    if (v === undefined || (typeof v !== "number" && !Array.isArray(v) && !C.isMat(v))) return "";
    const opts = typeof v === "number" ? FMTS_NUM : FMTS_NUM.slice(0, 4);
    const as = h.fmt || "dec";
    return `<span class="fmts" role="group" aria-label="Show result as">${opts.map(([k, l]) => `<button type="button" data-fmt="${k}" aria-pressed="${k === as}">${l}</button>`).join("")}</span>`;
  }
  function renderTape(scroll = true) {
    const tape = $("#tape");
    if (!tape) return;
    if (!UI.history.length) {
      tape.innerHTML = `<div class="tape-empty">Try <code>2(3+4)</code>, <code>sin(30°)</code>, <code>12°30'15"</code>,
        <code>Q = 2.5</code>, <code>f(x) = x^2 + 1</code> or <code>2x + 3 = 7</code>.<br>The ? button at the top explains the rest.</div>`;
      return;
    }
    tape.innerHTML = UI.history
      .map((h, i) => {
        let out = "";
        if (h.kind === "value") out = fmtBar(h) + valueHTML(h, i);
        else if (h.kind === "assign") out = `<span class="t-store">→ ${esc(h.name)}</span>` + fmtBar(h) + valueHTML(h, i);
        else if (h.kind === "define") out = `<span class="t-def">${icon("check")}${esc(h.text)}</span>`;
        else if (h.kind === "solve") {
          const as = h.fmt || "dec";
          out = fmtBar(h) + `<span class="t-sub">${esc(h.name)} =</span>` + h.roots.map((r, k) => `<button type="button" class="t-val" data-i="${i}" data-r="${k}" title="Insert this value">${esc(fmtV(r, as))}</button>`).join(`<span class="t-sub">or</span>`);
        }
        return `<div class="t-row" data-i="${i}"><button type="button" class="t-in" data-i="${i}" title="Edit this line again">${esc(pretty(h.input))}</button><div class="t-out">${out}</div></div>`;
      })
      .join("");
    if (scroll) tape.scrollTop = tape.scrollHeight;
  }

  const SPECIAL_INS = {
    "x^y": "^", "√(x)": "√(", "x!": "!", "x%": "%", "30°": "°", "12°30'15\"": "°", "2E3": "E", "{1, 2, 3}": "{", "L1 … L6": "L1",
    "[A] … [J]": "[A]", "[[1, 2], [3, 4]]": "[[", "A = 5  ·  5 → A": "→", "f(x) = x^2 + 1": "f(x) = ", "ans": "ans", "Y1(2)": "Y1(",
    "2x + 3 = 7": "=", "g · g_ft": "g", "gamma_w · gamma_w_ft": "gamma_w", "pi · e": "π", "inv([A]) or [A]⁻¹": "inv(", "trans([A]) or [A]ᵀ": "trans(",
  };
  function insertionFor(syn) {
    if (SPECIAL_INS[syn]) return SPECIAL_INS[syn];
    const m = /^([A-Za-z_][A-Za-z0-9_]*)/.exec(syn);
    if (m && C.isBuiltin(m[1])) return m[1] + "(";
    return m ? m[1] : syn;
  }
  function renderCatalog() {
    const q = UI.refQuery.trim().toLowerCase();
    const groups = C.CATALOG.map(([title, items]) => [title, items.filter(([syn, desc]) => !q || (syn + " " + desc + " " + title).toLowerCase().includes(q))]).filter(([, items]) => items.length);
    $("#cat").innerHTML = groups.length
      ? groups
          .map(([title, items]) => `<h3>${esc(title)}</h3><div class="cat-list">${items.map(([syn, desc]) => `<button type="button" class="cat-item" data-ins="${esc(insertionFor(syn))}" title="Insert"><code>${esc(syn)}</code><span>${esc(desc)}</span></button>`).join("")}</div>`)
          .join("")
      : `<p class="muted">Nothing matches “${esc(UI.refQuery)}”.</p>`;
  }
  function renderMemory() {
    const el = $("#mem");
    if (!el) return;
    const rows = [];
    for (const [k, v] of Object.entries(S.vars)) {
      let shown;
      if (typeof v === "number") shown = `${k} = ${short(v, 8)}`;
      else if (Array.isArray(v)) shown = `${k} = {${v.slice(0, 4).map((x) => short(x, 5)).join(", ")}${v.length > 4 ? ", …" : ""}} (${v.length})`;
      else shown = `${k} = ${v.mat.length}×${v.mat[0].length} matrix`;
      rows.push(`<div class="mem"><button type="button" class="ins" data-ins="${esc(k)}" title="Insert ${esc(k)}">${esc(shown)}</button><button type="button" class="del" data-del="v:${esc(k)}" aria-label="Delete ${esc(k)}">${icon("x")}</button></div>`);
    }
    for (const [k, f] of Object.entries(S.fns))
      rows.push(`<div class="mem"><button type="button" class="ins" data-ins="${esc(k)}(" title="Insert ${esc(k)}(">${esc(`${k}(${f.params.join(", ")}) = ${f.src}`)}</button><button type="button" class="del" data-del="f:${esc(k)}" aria-label="Delete ${esc(k)}">${icon("x")}</button></div>`);
    el.innerHTML = rows.length ? rows.join("") : `<p class="muted">Stored values and functions show up here. Try <code>Q = 2.5</code> or <code>f(x) = x^2</code>.</p>`;
  }

  /* =======================================================================
     Graph
     ======================================================================= */
  const G = UI.g;
  let gctx = null, raf = 0, kpTimer = 0, resizeObs = null;
  const enabledFns = () =>
    S.graph.fns
      .map((f, i) => ({ ...f, i }))
      .filter((f) => f.on && f.expr.trim())
      .map((f) => {
        try {
          return { ...f, fn: C.compile(f.expr, S) };
        } catch (_) {
          return null;
        }
      })
      .filter(Boolean);

  function renderGraph(view) {
    const plotRows = G.plots
      .map((p, k) => `<div class="plot-row"><button type="button" class="y-dot" style="color:#e9ecef" data-plot-on="${k}" aria-pressed="${p.on !== false}" aria-label="Show plot ${k + 1}"></button>Plot ${k + 1}: ${esc(p.x)}, ${esc(p.y)}<button type="button" class="linkish" data-plot-del="${k}" aria-label="Remove plot">${icon("x")}</button></div>`)
      .join("");
    view.innerHTML = `
      <div class="c-graph">
        <aside class="panel g-side">
          <h2>${icon("function")}Functions of x</h2>
          <div class="yeq">
            ${S.graph.fns
              .map(
                (f, i) => `<div class="y-row">
                  <button type="button" class="y-dot" style="color:${COLORS[i]}" data-on="${i}" aria-pressed="${f.on}" aria-label="Show Y${i + 1}"></button>
                  <span class="y-lab">Y${i + 1}=</span>
                  <input class="in" data-y="${i}" value="${esc(f.expr)}" spellcheck="false" autocomplete="off" aria-label="Y${i + 1} as a function of x" />
                  <span class="y-err" id="yerr${i}"></span>
                </div>`
              )
              .join("")}
            ${plotRows}
          </div>
          <p class="muted">Trig uses the ${S.mode.angle.toUpperCase()} mode, so in DEG try <code>sin(30x)</code> or zoom with Trig. <code>Y1(2)</code> works on the Calculate tab.</p>
          <h3>Window</h3>
          <div class="win">
            ${["xmin", "xmax", "ymin", "ymax"].map((k) => `<label>${k.replace("min", " min").replace("max", " max")}<input class="in" data-win="${k}" inputmode="decimal" /></label>`).join("")}
          </div>
          <div class="zooms">
            <button type="button" class="btn small" data-zoom="std">Standard</button>
            <button type="button" class="btn small" data-zoom="fit">Fit y</button>
            <button type="button" class="btn small" data-zoom="square">Square</button>
            <button type="button" class="btn small" data-zoom="trig">Trig</button>
            ${G.plots.length ? `<button type="button" class="btn small" data-zoom="data">Fit data</button>` : ""}
          </div>
          <h3>Analyze</h3>
          <label class="toggle"><input type="checkbox" id="kp-on" ${G.keyPoints ? "checked" : ""} /> Mark zeros, minima, maxima and intersections</label>
          <div class="int-row">
            <select id="int-f" aria-label="Function to integrate"></select>
            <input class="in" id="int-a" placeholder="from" value="${G.integral ? G.integral.a : ""}" aria-label="Lower limit" />
            <input class="in" id="int-b" placeholder="to" value="${G.integral ? G.integral.b : ""}" aria-label="Upper limit" />
          </div>
          <div class="hrow" style="margin-top:6px">
            <button type="button" class="btn small" id="int-go">${icon("sigma")}Shade ∫ area</button>
            <button type="button" class="btn small" id="int-clear">Clear</button>
          </div>
          <div class="int-out" id="int-out"></div>
        </aside>
        <section class="panel g-main">
          <div class="g-canvas-wrap" id="gwrap">
            <canvas id="gc" tabindex="0" aria-label="Graph. Drag to pan, scroll or pinch to zoom, arrow keys trace."></canvas>
            <div class="g-readout" id="readout"></div>
            <div class="g-tools">
              <button type="button" class="icon-btn" data-zoom="in" aria-label="Zoom in">${icon("magnifying-glass-plus")}</button>
              <button type="button" class="icon-btn" data-zoom="out" aria-label="Zoom out">${icon("magnifying-glass-minus")}</button>
            </div>
          </div>
          <div class="g-points" id="gpoints"></div>
          <details class="g-table" id="gtable" ${G.tableOpen ? "open" : ""}>
            <summary>${icon("table")}Table of values</summary>
            <div class="hrow" style="margin-top:8px">
              <label class="sel">Start <input class="in" id="t-start" value="${esc(G.table.start)}" style="width:90px" /></label>
              <label class="sel">Step <input class="in" id="t-step" value="${esc(G.table.step)}" style="width:90px" /></label>
            </div>
            <div class="tbl-wrap" id="ttable"></div>
          </details>
        </section>
      </div>`;

    $$("[data-y]").forEach((inp) =>
      inp.addEventListener("input", () => {
        S.graph.fns[+inp.dataset.y].expr = inp.value;
        onFnsChanged();
      })
    );
    $$("[data-on]").forEach((b) =>
      b.addEventListener("click", () => {
        const f = S.graph.fns[+b.dataset.on];
        f.on = !f.on;
        b.setAttribute("aria-pressed", String(f.on));
        onFnsChanged();
      })
    );
    $$("[data-plot-on]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = G.plots[+b.dataset.plotOn];
        p.on = p.on === false;
        b.setAttribute("aria-pressed", String(p.on));
        redraw();
        save();
      })
    );
    $$("[data-plot-del]").forEach((b) =>
      b.addEventListener("click", () => {
        G.plots.splice(+b.dataset.plotDel, 1);
        save();
        renderGraph(view);
      })
    );
    $$("[data-win]").forEach((inp) =>
      inp.addEventListener("change", () => {
        const v = num(inp.value);
        const nv = { ...G.view, [inp.dataset.win]: v };
        if (Number.isFinite(v) && nv.xmax > nv.xmin && nv.ymax > nv.ymin) setView(nv);
        else syncWindow();
      })
    );
    $$("[data-zoom]").forEach((b) => b.addEventListener("click", () => zoomPreset(b.dataset.zoom)));
    $("#kp-on").addEventListener("change", (e) => {
      G.keyPoints = e.target.checked;
      save();
      scheduleKeyPoints();
    });
    $("#int-go").addEventListener("click", shadeIntegral);
    $("#int-clear").addEventListener("click", () => {
      G.integral = null;
      $("#int-out").textContent = "";
      redraw();
    });
    $("#gtable").addEventListener("toggle", (e) => {
      G.tableOpen = e.target.open;
      if (G.tableOpen) renderTable();
    });
    ["t-start", "t-step"].forEach((id) =>
      $("#" + id).addEventListener("change", (e) => {
        G.table[id === "t-start" ? "start" : "step"] = e.target.value;
        save();
        renderTable();
      })
    );
    $("#gpoints").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pt]");
      if (!b) return;
      const p = G.points[+b.dataset.pt];
      G.trace = p.x;
      G.pinned = true;
      G.hoverPt = p;
      redraw();
    });

    const cv = $("#gc");
    gctx = cv.getContext("2d");
    wireCanvas(cv);
    if (resizeObs) resizeObs.disconnect();
    resizeObs = new ResizeObserver(() => redraw());
    resizeObs.observe($("#gwrap"));
    syncWindow();
    checkFns();
    fillIntegralSelect();
    if (G.integral) $("#int-out").textContent = integralText();
    if (G.tableOpen) renderTable();
    redraw();
    scheduleKeyPoints();
  }

  function onFnsChanged() {
    clearTimeout(onFnsChanged.t);
    onFnsChanged.t = setTimeout(() => {
      checkFns();
      fillIntegralSelect();
      redraw();
      scheduleKeyPoints();
      if (G.tableOpen) renderTable();
      save();
    }, 120);
  }
  function checkFns() {
    S.graph.fns.forEach((f, i) => {
      const el = $("#yerr" + i);
      if (!el) return;
      let msg = "";
      if (f.expr.trim()) {
        try {
          msg = C.check(f.expr, S) || "";
        } catch (e) {
          msg = e.message;
        }
      }
      el.textContent = msg;
      const inp = $(`[data-y="${i}"]`);
      if (inp) inp.classList.toggle("bad", !!msg);
    });
  }
  function fillIntegralSelect() {
    const sel = $("#int-f");
    if (!sel) return;
    const cur = sel.value || (G.integral ? String(G.integral.i) : "");
    const opts = S.graph.fns.map((f, i) => (f.expr.trim() ? `<option value="${i}">Y${i + 1}</option>` : "")).join("");
    sel.innerHTML = opts || `<option value="">No functions</option>`;
    if (cur && sel.querySelector(`option[value="${cur}"]`)) sel.value = cur;
  }
  function shadeIntegral() {
    const i = +$("#int-f").value;
    const a = num($("#int-a").value), b = num($("#int-b").value);
    const f = S.graph.fns[i];
    if (!f || !f.expr.trim() || !Number.isFinite(a) || !Number.isFinite(b)) {
      $("#int-out").textContent = "Pick a function and enter both limits.";
      return;
    }
    let value;
    try {
      const fn = C.compile(f.expr, S);
      value = C.calculus.integrate(fn, Math.min(a, b), Math.max(a, b)) * (b < a ? -1 : 1);
    } catch (e) {
      $("#int-out").textContent = e.message;
      return;
    }
    G.integral = { i, a, b, value };
    $("#int-out").textContent = integralText();
    redraw();
  }
  const integralText = () => (G.integral && Number.isFinite(G.integral.value) ? `∫ Y${G.integral.i + 1} dx from ${short(G.integral.a)} to ${short(G.integral.b)} = ${short(G.integral.value, 10)}` : "The integral doesn't converge on that interval.");

  function syncWindow() {
    $$("[data-win]").forEach((inp) => {
      if (document.activeElement !== inp) inp.value = short(G.view[inp.dataset.win], 6);
    });
  }
  function setView(v, keepPoints) {
    G.view = v;
    syncWindow();
    redraw();
    if (!keepPoints) scheduleKeyPoints();
    save();
  }
  function zoomPreset(kind) {
    const v = G.view;
    const cx = (v.xmin + v.xmax) / 2, cy = (v.ymin + v.ymax) / 2;
    const w = v.xmax - v.xmin, h = v.ymax - v.ymin;
    const cv = $("#gc");
    if (kind === "in") return setView({ xmin: cx - w / 4, xmax: cx + w / 4, ymin: cy - h / 4, ymax: cy + h / 4 });
    if (kind === "out") return setView({ xmin: cx - w, xmax: cx + w, ymin: cy - h, ymax: cy + h });
    if (kind === "std") return setView({ xmin: -10, xmax: 10, ymin: -10, ymax: 10 });
    if (kind === "square") {
      const ratio = cv.clientHeight / cv.clientWidth;
      const nh = w * ratio;
      return setView({ ...v, ymin: cy - nh / 2, ymax: cy + nh / 2 });
    }
    if (kind === "trig") {
      const X = { deg: 360, rad: 2 * Math.PI, grad: 400 }[S.mode.angle];
      return setView({ xmin: -X, xmax: X, ymin: -4, ymax: 4 });
    }
    if (kind === "fit") {
      const ys = [];
      for (const f of enabledFns())
        for (let k = 0; k <= 400; k++) {
          const y = f.fn(v.xmin + (k / 400) * w);
          if (Number.isFinite(y)) ys.push(y);
        }
      for (const p of plotData()) ys.push(...p.ys);
      if (!ys.length) return toast("Nothing to fit in this x range.");
      ys.sort((a, b) => a - b);
      let lo = ys[Math.floor(ys.length * 0.02)], hi = ys[Math.ceil(ys.length * 0.98) - 1];
      if (hi - lo < 1e-9) {
        lo -= 1;
        hi += 1;
      }
      const pad = (hi - lo) * 0.1;
      return setView({ ...v, ymin: lo - pad, ymax: hi + pad });
    }
    if (kind === "data") return fitToData();
  }
  function plotData() {
    return G.plots
      .filter((p) => p.on !== false)
      .map((p) => {
        const xs = S.vars[p.x] || [], ys = S.vars[p.y] || [];
        const n = Math.min(xs.length, ys.length);
        return { xs: xs.slice(0, n), ys: ys.slice(0, n) };
      });
  }
  function fitToData() {
    const pts = plotData();
    const xs = pts.flatMap((p) => p.xs), ys = pts.flatMap((p) => p.ys);
    if (!xs.length) return;
    let [x0, x1] = [Math.min(...xs), Math.max(...xs)], [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    if (x1 - x0 < 1e-9) [x0, x1] = [x0 - 1, x1 + 1];
    if (y1 - y0 < 1e-9) [y0, y1] = [y0 - 1, y1 + 1];
    const px = (x1 - x0) * 0.12, py = (y1 - y0) * 0.15;
    setView({ xmin: x0 - px, xmax: x1 + px, ymin: y0 - py, ymax: y1 + py });
  }

  function niceStep(raw) {
    const p = 10 ** Math.floor(Math.log10(raw));
    const n = raw / p;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
  }
  const redraw = () => {
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      draw();
    });
  };

  function draw() {
    const cv = $("#gc");
    if (!cv || !gctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const g = gctx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = G.view;
    const sx = W / (v.xmax - v.xmin), sy = H / (v.ymax - v.ymin);
    const X = (x) => (x - v.xmin) * sx, Y = (y) => H - (y - v.ymin) * sy;
    const clampY = (py) => Math.max(-10 * H, Math.min(11 * H, py));
    g.fillStyle = "#0a0d12";
    g.fillRect(0, 0, W, H);

    // Grid and axes
    const tx = niceStep((v.xmax - v.xmin) / Math.max(2, W / 90)), ty = niceStep((v.ymax - v.ymin) / Math.max(2, H / 70));
    g.lineWidth = 1;
    g.strokeStyle = "rgba(255,255,255,0.055)";
    g.beginPath();
    for (let x = Math.ceil(v.xmin / tx) * tx; x <= v.xmax; x += tx) {
      const px = Math.round(X(x)) + 0.5;
      g.moveTo(px, 0);
      g.lineTo(px, H);
    }
    for (let y = Math.ceil(v.ymin / ty) * ty; y <= v.ymax; y += ty) {
      const py = Math.round(Y(y)) + 0.5;
      g.moveTo(0, py);
      g.lineTo(W, py);
    }
    g.stroke();
    g.strokeStyle = "rgba(232,237,243,0.4)";
    g.beginPath();
    const ax = Math.round(X(0)) + 0.5, ay = Math.round(Y(0)) + 0.5;
    if (ax >= 0 && ax <= W) {
      g.moveTo(ax, 0);
      g.lineTo(ax, H);
    }
    if (ay >= 0 && ay <= H) {
      g.moveTo(0, ay);
      g.lineTo(W, ay);
    }
    g.stroke();
    g.font = "11px 'JetBrains Mono', monospace";
    g.fillStyle = "rgba(154,166,180,0.85)";
    const labY = Math.min(H - 6, Math.max(14, ay + 14));
    const labX = Math.min(W - 6, Math.max(6, ax + 6));
    const lab = (t) => {
      const s = Math.abs(t) < 1e-12 ? "0" : short(t, 6);
      return s;
    };
    g.textAlign = "center";
    for (let x = Math.ceil(v.xmin / tx) * tx; x <= v.xmax; x += tx) {
      if (Math.abs(x) < tx / 2 || X(x) < 16 || X(x) > W - 16) continue;
      g.fillText(lab(x), X(x), labY);
    }
    g.textAlign = ax + 6 > W - 50 ? "right" : "left";
    for (let y = Math.ceil(v.ymin / ty) * ty; y <= v.ymax; y += ty) {
      if (Math.abs(y) < ty / 2 || Y(y) < 10 || Y(y) > H - 6) continue;
      g.fillText(lab(y), g.textAlign === "right" ? W - 6 : labX, Y(y) + 4);
    }

    const fns = enabledFns();

    // Integral shading
    if (G.integral && Number.isFinite(G.integral.value)) {
      const f = fns.find((q) => q.i === G.integral.i);
      if (f) {
        const a = Math.min(G.integral.a, G.integral.b), b = Math.max(G.integral.a, G.integral.b);
        g.fillStyle = hexA(COLORS[f.i], 0.22);
        g.beginPath();
        g.moveTo(X(a), Y(0));
        const n = 300;
        for (let k = 0; k <= n; k++) {
          const x = a + ((b - a) * k) / n, y = f.fn(x);
          g.lineTo(X(x), clampY(Y(Number.isFinite(y) ? y : 0)));
        }
        g.lineTo(X(b), Y(0));
        g.closePath();
        g.fill();
      }
    }

    // Functions
    const step = 1 / Math.min(2, dpr);
    for (const f of fns) {
      g.strokeStyle = COLORS[f.i];
      g.lineWidth = 2;
      g.beginPath();
      let pen = false, lastPy = 0;
      for (let px = 0; px <= W; px += step) {
        const x = v.xmin + px / sx, y = f.fn(x);
        if (!Number.isFinite(y)) {
          pen = false;
          continue;
        }
        const py = clampY(Y(y));
        if (pen && Math.abs(py - lastPy) > H * 1.5) pen = false;
        if (pen) g.lineTo(px, py);
        else g.moveTo(px, py);
        pen = true;
        lastPy = py;
      }
      g.stroke();
    }

    // Scatter plots
    plotData().forEach((p) => {
      g.fillStyle = "#e9ecef";
      g.strokeStyle = "#0a0d12";
      for (let k = 0; k < p.xs.length; k++) {
        const px = X(p.xs[k]), py = Y(p.ys[k]);
        if (px < -5 || px > W + 5 || py < -5 || py > H + 5) continue;
        g.fillRect(px - 3.5, py - 3.5, 7, 7);
        g.strokeRect(px - 3.5, py - 3.5, 7, 7);
      }
    });

    // Key points
    if (G.keyPoints)
      G.points.forEach((p) => {
        const px = X(p.x), py = Y(p.y);
        if (px < 0 || px > W || py < 0 || py > H) return;
        g.beginPath();
        g.arc(px, py, p === G.hoverPt ? 6 : 4.5, 0, Math.PI * 2);
        g.fillStyle = p.kind === "int" ? "#ffffff" : p.kind === "zero" ? "#0a0d12" : COLORS[p.i];
        g.fill();
        g.lineWidth = 2;
        g.strokeStyle = p.kind === "zero" ? COLORS[p.i] : "#0a0d12";
        g.stroke();
      });

    // Trace
    const ro = $("#readout");
    if (G.hoverPt) {
      const p = G.hoverPt;
      ro.innerHTML = `<i style="background:${p.kind === "int" ? "#fff" : COLORS[p.i]}"></i>${esc(pointLabel(p))}<br>x = ${esc(short(p.x, 10))}<br>y = ${esc(short(p.y, 10))}`;
    } else if (G.trace !== null && fns.length) {
      const x = G.trace, px = X(x);
      g.strokeStyle = "rgba(232,237,243,0.35)";
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(px, 0);
      g.lineTo(px, H);
      g.stroke();
      g.setLineDash([]);
      const rows = [`x = ${esc(short(x, 8))}`];
      fns.forEach((f) => {
        const y = f.fn(x);
        if (Number.isFinite(y)) {
          g.beginPath();
          g.arc(px, clampY(Y(y)), 4, 0, Math.PI * 2);
          g.fillStyle = COLORS[f.i];
          g.fill();
        }
        rows.push(`<i style="background:${COLORS[f.i]}"></i>Y${f.i + 1} = ${esc(short(y, 8))}`);
      });
      ro.innerHTML = rows.join("<br>");
    } else ro.innerHTML = "";
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function wireCanvas(cv) {
    const ptrs = new Map();
    let drag = null, pinch = null;
    const toX = (px) => G.view.xmin + (px / cv.clientWidth) * (G.view.xmax - G.view.xmin);
    const toY = (py) => G.view.ymax - (py / cv.clientHeight) * (G.view.ymax - G.view.ymin);
    const nearPoint = (px, py) => {
      if (!G.keyPoints) return null;
      const v = G.view, sx = cv.clientWidth / (v.xmax - v.xmin), sy = cv.clientHeight / (v.ymax - v.ymin);
      let best = null, bd = 12;
      for (const p of G.points) {
        const d = Math.hypot((p.x - v.xmin) * sx - px, cv.clientHeight - (p.y - v.ymin) * sy - py);
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      return best;
    };
    cv.addEventListener("pointerdown", (e) => {
      cv.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (ptrs.size === 1) drag = { x0: e.offsetX, y0: e.offsetY, view: { ...G.view }, moved: false };
      else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, view: { ...G.view } };
        drag = null;
      }
    });
    cv.addEventListener("pointermove", (e) => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (pinch && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const k = pinch.d0 / Math.max(10, d);
        const v = pinch.view, W = cv.clientWidth, H = cv.clientHeight;
        const cx = v.xmin + (pinch.mx / W) * (v.xmax - v.xmin), cy = v.ymax - (pinch.my / H) * (v.ymax - v.ymin);
        setView({ xmin: cx - (cx - v.xmin) * k, xmax: cx + (v.xmax - cx) * k, ymin: cy - (cy - v.ymin) * k, ymax: cy + (v.ymax - cy) * k });
        return;
      }
      if (drag && ptrs.has(e.pointerId)) {
        const dx = e.offsetX - drag.x0, dy = e.offsetY - drag.y0;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        drag.moved = true;
        const v = drag.view, kx = (v.xmax - v.xmin) / cv.clientWidth, ky = (v.ymax - v.ymin) / cv.clientHeight;
        G.hoverPt = null;
        setView({ xmin: v.xmin - dx * kx, xmax: v.xmax - dx * kx, ymin: v.ymin + dy * ky, ymax: v.ymax + dy * ky });
        return;
      }
      if (e.pointerType === "mouse" && !G.pinned) {
        G.hoverPt = nearPoint(e.offsetX, e.offsetY);
        G.trace = toX(e.offsetX);
        redraw();
      }
    });
    const end = (e) => {
      const wasTap = drag && !drag.moved && ptrs.size === 1;
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (wasTap) {
        const p = nearPoint(e.offsetX, e.offsetY);
        G.hoverPt = p;
        G.trace = p ? p.x : toX(e.offsetX);
        G.pinned = !(G.pinned && !p && e.pointerType === "mouse");
        if (!G.pinned) G.trace = toX(e.offsetX);
        redraw();
      }
      if (drag && drag.moved) scheduleKeyPoints();
      if (!ptrs.size) drag = null;
    };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
    cv.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse" && !G.pinned) {
        G.trace = null;
        G.hoverPt = null;
        redraw();
      }
    });
    cv.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const k = Math.exp(Math.max(-0.5, Math.min(0.5, e.deltaY * 0.0015)));
        const cx = toX(e.offsetX), cy = toY(e.offsetY), v = G.view;
        setView({ xmin: cx - (cx - v.xmin) * k, xmax: cx + (v.xmax - cx) * k, ymin: cy - (cy - v.ymin) * k, ymax: cy + (v.ymax - cy) * k });
      },
      { passive: false }
    );
    cv.addEventListener("keydown", (e) => {
      const v = G.view, w = v.xmax - v.xmin;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        G.pinned = true;
        G.hoverPt = null;
        G.trace = (G.trace ?? (v.xmin + v.xmax) / 2) + (e.key === "ArrowLeft" ? -1 : 1) * w / 100;
        redraw();
      } else if (e.key === "+" || e.key === "=") zoomPreset("in");
      else if (e.key === "-") zoomPreset("out");
    });
  }

  function scheduleKeyPoints() {
    clearTimeout(kpTimer);
    kpTimer = setTimeout(() => {
      G.points = G.keyPoints ? computeKeyPoints() : [];
      G.hoverPt = null;
      renderPointChips();
      redraw();
    }, 160);
  }
  function computeKeyPoints() {
    const v = G.view, fns = enabledFns(), pts = [];
    const N = 600, lo = v.xmin, hi = v.xmax, hy = (v.ymax - v.ymin) * 2;
    const inView = (y) => y >= v.ymin - 1e-9 && y <= v.ymax + 1e-9;
    for (const f of fns) {
      for (const x of C.calculus.findRoots(f.fn, lo, hi, N)) pts.push({ kind: "zero", i: f.i, x, y: 0 });
      const xs = Array.from({ length: N + 1 }, (_, k) => lo + ((hi - lo) * k) / N), ys = xs.map(f.fn);
      for (let k = 1; k < N; k++) {
        const [a, b, c] = [ys[k - 1], ys[k], ys[k + 1]];
        if (![a, b, c].every(Number.isFinite)) continue;
        const isMax = b > a && b >= c, isMin = b < a && b <= c;
        if (!isMax && !isMin) continue;
        const g = isMax ? (x) => -f.fn(x) : f.fn;
        const x = C.calculus.minimize(g, xs[k - 1], xs[k + 1]);
        const y = f.fn(x);
        if (Number.isFinite(y) && Math.abs(y - b) < hy && inView(y)) pts.push({ kind: isMax ? "max" : "min", i: f.i, x, y });
      }
      if (lo <= 0 && hi >= 0) {
        const y0 = f.fn(0);
        if (Number.isFinite(y0) && inView(y0) && !pts.some((p) => p.i === f.i && Math.abs(p.x) < 1e-9 && Math.abs(p.y - y0) < 1e-9)) pts.push({ kind: "yint", i: f.i, x: 0, y: y0 });
      }
    }
    for (let a = 0; a < fns.length; a++)
      for (let b = a + 1; b < fns.length; b++) {
        const fa = fns[a].fn, fb = fns[b].fn;
        for (const x of C.calculus.findRoots((x) => fa(x) - fb(x), lo, hi, N)) {
          const y = fa(x);
          if (Number.isFinite(y) && inView(y)) pts.push({ kind: "int", i: fns[a].i, j: fns[b].i, x, y });
        }
      }
    const tiny = (hi - lo) * 1e-9, tinyY = (v.ymax - v.ymin) * 1e-9;
    return pts
      .filter((p) => inView(p.y))
      .map((p) => ({ ...p, x: Math.abs(p.x) < tiny ? 0 : +p.x.toPrecision(12), y: Math.abs(p.y) < tinyY ? 0 : +p.y.toPrecision(12) }))
      .sort((p, q) => p.x - q.x)
      .slice(0, 60);
  }
  function pointLabel(p) {
    const n = `Y${p.i + 1}`;
    return p.kind === "zero" ? `${n} zero` : p.kind === "max" ? `${n} maximum` : p.kind === "min" ? `${n} minimum` : p.kind === "yint" ? `${n} y-intercept` : `${n} ∩ Y${p.j + 1}`;
  }
  function renderPointChips() {
    const el = $("#gpoints");
    if (!el) return;
    el.innerHTML = G.keyPoints
      ? G.points.map((p, k) => `<button type="button" class="kp" data-pt="${k}"><i class="sw" style="background:${p.kind === "int" ? "#fff" : COLORS[p.i]}"></i>${esc(pointLabel(p))} (${esc(short(p.x, 6))}, ${esc(short(p.y, 6))})</button>`).join("")
      : "";
  }
  function renderTable() {
    const el = $("#ttable");
    if (!el) return;
    const start = num(G.table.start), step = num(G.table.step);
    if (!Number.isFinite(start) || !Number.isFinite(step) || step === 0) {
      el.innerHTML = `<p class="muted" style="padding:10px">Enter a start value and a nonzero step.</p>`;
      return;
    }
    const fns = enabledFns();
    if (!fns.length) {
      el.innerHTML = `<p class="muted" style="padding:10px">Turn on at least one function.</p>`;
      return;
    }
    const rows = Array.from({ length: 31 }, (_, k) => +(start + k * step).toPrecision(12));
    el.innerHTML = `<table class="tbl"><thead><tr><th>x</th>${fns.map((f) => `<th style="color:${COLORS[f.i]}">Y${f.i + 1}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((x) => `<tr><td>${esc(short(x, 10))}</td>${fns.map((f) => `<td>${esc(short(f.fn(x), 8))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  /* =======================================================================
     Stats
     ======================================================================= */
  const SAMPLE = {
    title: "Sample stage–discharge data (made up for practice)",
    x: [1.2, 1.8, 2.5, 3.1, 3.9, 4.6, 5.2],
    y: [35, 98, 210, 340, 560, 800, 1030],
  };
  const listOf = (k) => (Array.isArray(S.vars[LISTS[k]]) ? S.vars[LISTS[k]] : []);
  const listOptions = (sel, none) => (none ? `<option value="-1"${sel === -1 ? " selected" : ""}>None</option>` : "") + LISTS.map((n, k) => `<option value="${k}"${k === sel ? " selected" : ""}>${n} (${listOf(k).length})</option>`).join("");

  function renderStats(view) {
    const rows = Math.max(12, ...LISTS.map((_, k) => listOf(k).length + 3));
    view.innerHTML = `
      <div class="c-stats">
        <section class="panel">
          <h2>${icon("table")}Lists</h2>
          <div class="hrow" style="margin-bottom:10px">
            <span class="muted" style="margin:0">Selected: <b style="color:var(--text)">${LISTS[UI.st.list]}</b></span>
            <span class="grow"></span>
            <button type="button" class="btn small" id="l-sort">${icon("sort-ascending")}Sort</button>
            <button type="button" class="btn small" id="l-clear">${icon("trash")}Clear</button>
            <button type="button" class="btn small" id="l-paste">${icon("clipboard-text")}Paste data</button>
            <button type="button" class="btn small" id="l-sample">Sample data</button>
          </div>
          <div class="paste" id="paste" hidden>
            <textarea id="paste-text" placeholder="Paste columns from a spreadsheet or type numbers separated by spaces, commas or tabs. A header row is skipped."></textarea>
            <div class="hrow">
              <label class="sel">First column goes in <select id="paste-start">${LISTS.map((n, k) => `<option value="${k}"${k === UI.st.list ? " selected" : ""}>${n}</option>`).join("")}</select></label>
              <button type="button" class="btn small primary" id="paste-go">Fill lists</button>
            </div>
          </div>
          <div class="lists-wrap">
            <table class="lists">
              <thead><tr><th class="idx">#</th>${LISTS.map((n, k) => `<th><button type="button" data-sel="${k}" aria-pressed="${k === UI.st.list}">${n}</button></th>`).join("")}</tr></thead>
              <tbody>${Array.from({ length: rows }, (_, r) => `<tr><td class="idx">${r + 1}</td>${LISTS.map((_, k) => `<td><input data-l="${k}" data-r="${r}" value="${listOf(k)[r] !== undefined ? esc(String(listOf(k)[r])) : ""}" inputmode="decimal" aria-label="${LISTS[k]} row ${r + 1}" /></td>`).join("")}</tr>`).join("")}</tbody>
            </table>
          </div>
          <p class="note">Cells accept expressions like <code>3/4</code> or <code>cvt(2, ft, m)</code>. Use the lists anywhere as L1…L6, like <code>mean(L1)</code>.</p>
        </section>
        <section class="panel">
          <h2>${icon("chart-bar")}One-variable statistics</h2>
          <div class="form-grid">
            <label>Data<select id="o-data">${listOptions(UI.st.oneData)}</select></label>
            <label>Frequency<select id="o-freq">${listOptions(UI.st.oneFreq, true)}</select></label>
            <button type="button" class="btn primary" id="o-go">Calculate</button>
          </div>
          <div class="results" id="o-out"></div>
          <h2 style="margin-top:22px">${icon("chart-line-up")}Regression</h2>
          <div class="form-grid">
            <label>x list<select id="r-x">${listOptions(UI.st.regX)}</select></label>
            <label>y list<select id="r-y">${listOptions(UI.st.regY)}</select></label>
            <label style="grid-column: 1 / -1">Model<select id="r-type">${Object.entries(C.stats.REGRESSIONS).map(([k, r]) => `<option value="${k}"${k === UI.st.regType ? " selected" : ""}>${esc(r.label)}</option>`).join("")}</select></label>
            <button type="button" class="btn primary" id="r-go">Fit</button>
          </div>
          <div class="results" id="r-out"></div>
        </section>
      </div>`;

    const tbl = $(".lists");
    tbl.addEventListener("change", (e) => {
      const inp = e.target.closest("input[data-l]");
      if (inp) commitList(+inp.dataset.l);
    });
    tbl.addEventListener("keydown", (e) => {
      const inp = e.target.closest("input[data-l]");
      if (!inp || e.key !== "Enter") return;
      e.preventDefault();
      const l = +inp.dataset.l, r = +inp.dataset.r;
      commitList(l);
      const next = $(`input[data-l="${l}"][data-r="${r + 1}"]`);
      if (next) next.focus();
    });
    $$("[data-sel]").forEach((b) =>
      b.addEventListener("click", () => {
        UI.st.list = +b.dataset.sel;
        renderStats(view);
      })
    );
    $("#l-sort").addEventListener("click", () => {
      S.vars[LISTS[UI.st.list]] = [...listOf(UI.st.list)].sort((a, b) => a - b);
      save();
      renderStats(view);
    });
    $("#l-clear").addEventListener("click", () => {
      delete S.vars[LISTS[UI.st.list]];
      save();
      renderStats(view);
    });
    $("#l-paste").addEventListener("click", () => {
      const p = $("#paste");
      p.hidden = !p.hidden;
      if (!p.hidden) $("#paste-text").focus();
    });
    $("#paste-go").addEventListener("click", () => {
      const cols = parsePaste($("#paste-text").value);
      if (!cols.length) return toast("No numbers found in the pasted text.");
      const start = +$("#paste-start").value;
      cols.slice(0, 6 - start).forEach((col, k) => (S.vars[LISTS[start + k]] = col));
      save();
      toast(`Filled ${Math.min(cols.length, 6 - start)} list${cols.length > 1 ? "s" : ""}.`);
      renderStats(view);
    });
    $("#l-sample").addEventListener("click", () => {
      S.vars.L1 = SAMPLE.x.slice();
      S.vars.L2 = SAMPLE.y.slice();
      UI.st.regX = 0;
      UI.st.regY = 1;
      UI.st.regType = "power";
      save();
      renderStats(view);
      toast("Loaded sample stage (L1, ft) and discharge (L2, cfs). Try a power fit.");
    });
    $("#o-go").addEventListener("click", () => {
      UI.st.oneData = +$("#o-data").value;
      UI.st.oneFreq = +$("#o-freq").value;
      oneVarOut();
    });
    $("#r-go").addEventListener("click", () => {
      UI.st.regX = +$("#r-x").value;
      UI.st.regY = +$("#r-y").value;
      UI.st.regType = $("#r-type").value;
      fitOut();
    });
    if (UI.st.fit) fitOut();
  }
  function commitList(l) {
    const cells = $$(`input[data-l="${l}"]`);
    const vals = [];
    let bad = false;
    cells.forEach((c) => {
      const t = c.value.trim();
      c.classList.remove("bad");
      if (!t) return;
      const v = num(t);
      if (Number.isFinite(v)) vals.push(v);
      else {
        c.classList.add("bad");
        bad = true;
      }
    });
    if (vals.length) S.vars[LISTS[l]] = vals;
    else delete S.vars[LISTS[l]];
    save();
    if (bad) toast("Some cells aren't numbers and were left out.");
    $$("#o-data option, #o-freq option, #r-x option, #r-y option").forEach((o) => {
      const k = +o.value;
      if (k >= 0) o.textContent = `${LISTS[k]} (${listOf(k).length})`;
    });
  }
  function parsePaste(text) {
    const rows = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/[\t,;]+|\s+/).map((t) => t.trim()).filter(Boolean));
    const numeric = rows.filter((r) => r.length && r.every((t) => Number.isFinite(parseFloat(t)) && /^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(t)));
    if (!numeric.length) return [];
    const width = Math.max(...numeric.map((r) => r.length));
    if (numeric.length === 1 && width > 1) return [numeric[0].map(Number)];
    return Array.from({ length: width }, (_, c) => numeric.map((r) => r[c]).filter((t) => t !== undefined).map(Number));
  }
  function oneVarOut() {
    const out = $("#o-out");
    try {
      const xs = listOf(UI.st.oneData);
      const fs = UI.st.oneFreq >= 0 ? listOf(UI.st.oneFreq) : null;
      const r = C.stats.oneVar(xs, fs);
      const rows = [["n", r.n], ["mean x̄", r.mean], ["Σx", r.sum], ["Σx²", r.sumSq], ["Sx (sample)", r.Sx], ["σx (population)", r.sigmaX], ["min", r.min], ["Q1", r.Q1], ["median", r.median], ["Q3", r.Q3], ["max", r.max]];
      out.innerHTML = `<dl class="kv">${rows.filter(([, v]) => v !== undefined).map(([k, v]) => `<dt>${k}</dt><dd>${esc(short(v, 10))}</dd>`).join("")}</dl><p class="note">Quartiles are the medians of the lower and upper halves (the middle value is left out of both when n is odd), the same method most graphing calculators use.</p>`;
    } catch (e) {
      out.innerHTML = `<div class="err-box">${esc(e.message)}</div>`;
    }
  }
  function fitOut() {
    const out = $("#r-out");
    try {
      const xs = listOf(UI.st.regX), ys = listOf(UI.st.regY);
      if (!xs.length || !ys.length) throw new Error(`Put x values in ${LISTS[UI.st.regX]} and y values in ${LISTS[UI.st.regY]} first (or load the sample data).`);
      const f = C.stats.regress(UI.st.regType, xs, ys);
      UI.st.fit = { ...f, xl: LISTS[UI.st.regX], yl: LISTS[UI.st.regY] };
      const c = f.coef.map((v) => short(v, 6));
      const eqText = {
        linear: `y = ${c[0]} + ${c[1]}·x`,
        quadratic: `y = ${c[0]} + ${c[1]}·x + ${c[2]}·x²`,
        cubic: `y = ${c[0]} + ${c[1]}·x + ${c[2]}·x² + ${c[3]}·x³`,
        quartic: `y = ${c[0]} + ${c[1]}·x + ${c[2]}·x² + ${c[3]}·x³ + ${c[4]}·x⁴`,
        exponential: `y = ${c[0]} · ${c[1]}ˣ`,
        power: `y = ${c[0]} · x^${c[1]}`,
        logarithmic: `y = ${c[0]} + ${c[1]}·ln x`,
      }[f.type].replace(/\+ -/g, "− ");
      const tv = C.stats.twoVar(xs, ys);
      out.innerHTML = `
        <div class="eqn">${esc(eqText)}</div>
        <dl class="kv">
          ${f.names.map((n, k) => `<dt>${n}</dt><dd>${esc(short(f.coef[k], 10))}</dd>`).join("")}
          ${f.r !== undefined ? `<dt>r</dt><dd>${esc(short(f.r, 8))}</dd>` : ""}
          <dt>r²</dt><dd>${esc(short(f.r2, 8))}</dd>
          <dt>n</dt><dd>${tv.n}</dd><dt>x̄, ȳ</dt><dd>${esc(short(tv.meanX, 8))}, ${esc(short(tv.meanY, 8))}</dd>
        </dl>
        ${f.linearized ? `<p class="note">This model is fit as a straight line on the transformed data (logs), so r and r² describe that line.</p>` : ""}
        <div class="hrow" style="margin-top:10px">
          <button type="button" class="btn primary" id="r-graph">${icon("chart-line")}Graph data and fit</button>
          <label class="sel">Predict y at x = <input class="in" id="r-px" style="width:90px" /></label>
          <span class="mono" id="r-py"></span>
        </div>`;
      $("#r-graph").addEventListener("click", graphFit);
      $("#r-px").addEventListener("input", (e) => {
        const x = num(e.target.value);
        $("#r-py").textContent = Number.isFinite(x) ? `ŷ = ${short(f.fn(x), 8)}` : "";
      });
    } catch (e) {
      UI.st.fit = null;
      out.innerHTML = `<div class="err-box">${esc(e.message)}</div>`;
    }
  }
  function graphFit() {
    const f = UI.st.fit;
    if (!f) return;
    let slot = UI.st.fitSlot;
    if (slot === null || (S.graph.fns[slot].expr.trim() && S.graph.fns[slot].expr !== UI.st.lastFitExpr)) {
      slot = S.graph.fns.findIndex((q) => !q.expr.trim());
      if (slot < 0) slot = 7;
    }
    S.graph.fns[slot] = { expr: f.expr, on: true };
    UI.st.fitSlot = slot;
    UI.st.lastFitExpr = f.expr;
    if (!G.plots.some((p) => p.x === f.xl && p.y === f.yl)) G.plots.push({ x: f.xl, y: f.yl, on: true });
    G.plots.forEach((p) => {
      if (p.x === f.xl && p.y === f.yl) p.on = true;
    });
    save();
    location.hash = "#/graph";
    setTimeout(fitToData, 50);
    toast(`Fit drawn as Y${slot + 1}.`);
  }

  /* =======================================================================
     Matrix
     ======================================================================= */
  const matOf = (n) => (S.vars[`[${n}]`] && S.vars[`[${n}]`].mat) || null;
  function renderMatrix(view) {
    const cur = UI.mx.cur;
    const m = matOf(cur);
    const [r, c] = m ? [m.length, m[0].length] : UI.mx.dims[cur] || [3, 3];
    view.innerHTML = `
      <div class="c-matrix">
        <section class="panel">
          <h2>${icon("grid-four")}Edit a matrix</h2>
          <div class="chips">${MATS.map((n) => {
            const mm = matOf(n);
            return `<button type="button" class="chip" data-m="${n}" aria-pressed="${n === cur}">[${n}]<small>${mm ? `${mm.length}×${mm[0].length}` : "empty"}</small></button>`;
          }).join("")}</div>
          <div class="hrow" style="margin-top:12px">
            <label class="sel">Rows <select id="m-r">${Array.from({ length: 8 }, (_, i) => `<option${i + 1 === r ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label>
            <label class="sel">Columns <select id="m-c">${Array.from({ length: 8 }, (_, i) => `<option${i + 1 === c ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label>
            <span class="grow"></span>
            <button type="button" class="btn small" id="m-clear">${icon("trash")}Clear [${cur}]</button>
          </div>
          <div class="mgrid" id="mgrid" style="grid-template-columns: repeat(${c}, auto)">
            ${Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => `<input data-i="${i}" data-j="${j}" value="${m ? esc(String(m[i][j])) : ""}" inputmode="decimal" aria-label="[${cur}] row ${i + 1} column ${j + 1}" />`).join("")).join("")}
          </div>
          <p class="note">Blank cells count as 0. Entries can be expressions like <code>1/3</code> or <code>cos(30)</code>. On the Calculate tab, use <code>[${cur}]</code> in any expression, like <code>det([${cur}])</code> or <code>[${cur}]⁻¹*[B]</code>.</p>
        </section>
        <section class="panel">
          <h2>${icon("math-operations")}Operations</h2>
          <div class="form-grid">
            <label>Matrix X<select id="m-x">${MATS.map((n) => `<option${n === UI.mx.x ? " selected" : ""}>${n}</option>`).join("")}</select></label>
            <label>Matrix Y<select id="m-y">${MATS.map((n) => `<option${n === UI.mx.y ? " selected" : ""}>${n}</option>`).join("")}</select></label>
          </div>
          <div class="hrow" style="margin-top:10px">
            ${[["det", "det X"], ["inv", "X⁻¹"], ["trans", "Xᵀ"], ["rref", "rref X"], ["sq", "X²"], ["add", "X + Y"], ["sub", "X − Y"], ["mul", "X × Y"], ["solve", "Solve X·v = Y"]].map(([k, l]) => `<button type="button" class="btn small" data-op="${k}">${l}</button>`).join("")}
          </div>
          <div class="results mres" id="m-out">${UI.mx.res ? matResultHTML() : `<p class="muted">Pick an operation. “Solve X·v = Y” uses the first column of Y as the right-hand side.</p>`}</div>
        </section>
      </div>`;

    $$("[data-m]").forEach((b) =>
      b.addEventListener("click", () => {
        UI.mx.cur = b.dataset.m;
        renderMatrix(view);
      })
    );
    const resize = () => {
      const nr = +$("#m-r").value, nc = +$("#m-c").value;
      UI.mx.dims[cur] = [nr, nc];
      const old = matOf(cur);
      if (old) S.vars[`[${cur}]`] = { mat: Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (old[i] && old[i][j] !== undefined ? old[i][j] : 0))) };
      save();
      renderMatrix(view);
    };
    $("#m-r").addEventListener("change", resize);
    $("#m-c").addEventListener("change", resize);
    $("#m-clear").addEventListener("click", () => {
      delete S.vars[`[${cur}]`];
      save();
      renderMatrix(view);
    });
    $("#mgrid").addEventListener("change", () => {
      const cells = $$("#mgrid input");
      const out = Array.from({ length: r }, () => new Array(c).fill(0));
      let bad = false;
      cells.forEach((inp) => {
        const t = inp.value.trim();
        const v = t ? num(t) : 0;
        inp.classList.toggle("bad", !Number.isFinite(v));
        if (!Number.isFinite(v)) bad = true;
        else out[+inp.dataset.i][+inp.dataset.j] = v;
      });
      if (bad) return toast("Fix the highlighted cells; they aren't numbers.");
      S.vars[`[${cur}]`] = { mat: out };
      save();
      $$("[data-m]").forEach((b) => {
        const mm = matOf(b.dataset.m);
        b.querySelector("small").textContent = mm ? `${mm.length}×${mm[0].length}` : "empty";
      });
    });
    $("#m-x").addEventListener("change", (e) => (UI.mx.x = e.target.value));
    $("#m-y").addEventListener("change", (e) => (UI.mx.y = e.target.value));
    $$("[data-op]").forEach((b) => b.addEventListener("click", () => matOp(b.dataset.op, view)));
    wireMatStore(view);
  }
  function matOp(op, view) {
    const X = `[${UI.mx.x}]`, Y = `[${UI.mx.y}]`;
    const expr = { det: `det(${X})`, inv: `inv(${X})`, trans: `trans(${X})`, rref: `rref(${X})`, sq: `${X}^2`, add: `${X}+${Y}`, sub: `${X}-${Y}`, mul: `${X}*${Y}` }[op];
    try {
      let v;
      if (op === "solve") {
        const ym = matOf(UI.mx.y);
        if (!ym) throw new Error(`${Y} is empty.`);
        const b = ym.map((row) => row[0]);
        S.vars.__b = b;
        try {
          v = C.run(`linsolve(${X}, __b)`, S).value;
        } finally {
          delete S.vars.__b;
        }
        UI.mx.resText = `Solution v of ${X}·v = first column of ${Y}`;
      } else {
        v = C.run(expr, S).value;
        UI.mx.resText = expr;
      }
      UI.mx.res = v;
    } catch (e) {
      UI.mx.res = null;
      $("#m-out").innerHTML = `<div class="err-box">${esc(e.message)}</div>`;
      return;
    }
    $("#m-out").innerHTML = matResultHTML();
    wireMatStore(view);
  }
  function matResultHTML() {
    const v = UI.mx.res;
    let body;
    if (typeof v === "number") body = `<div class="scalar">${esc(fmtV(v))}</div>`;
    else if (Array.isArray(v)) body = `<dl class="kv">${v.map((x, i) => `<dt>v${i + 1}</dt><dd>${esc(fmtV(x))}</dd>`).join("")}</dl>`;
    else body = `<table>${v.mat.map((r) => `<tr>${r.map((x) => `<td>${esc(fmtV(x))}</td>`).join("")}</tr>`).join("")}</table>`;
    const storable = C.isMat(v) || Array.isArray(v);
    return `<p class="muted mono">${esc(UI.mx.resText)}</p>${body}${
      storable
        ? `<div class="hrow" style="margin-top:10px"><label class="sel">Store in <select id="m-store">${(C.isMat(v) ? MATS.map((n) => `[${n}]`) : LISTS).map((n) => `<option>${n}</option>`).join("")}</select></label><button type="button" class="btn small" id="m-store-go">Store</button></div>`
        : ""
    }`;
  }
  function wireMatStore(view) {
    const b = $("#m-store-go");
    if (!b) return;
    b.addEventListener("click", () => {
      const target = $("#m-store").value;
      S.vars[target] = C.isMat(UI.mx.res) ? { mat: UI.mx.res.mat.map((r) => r.slice()) } : UI.mx.res.slice();
      save();
      toast(`Stored in ${target}.`);
      if (target.startsWith("[")) renderMatrix(view);
    });
  }

  /* =======================================================================
     Solve
     ======================================================================= */
  const PRESETS = [
    { id: "custom", name: "Custom equation", eq: "" },
    { id: "manning-depth", name: "Manning: normal depth, rectangular channel (U.S.)", eq: "Q = 1.49/n * (b*y) * ((b*y)/(b + 2*y))^(2/3) * S^(1/2)", unknown: "y",
      vars: { Q: ["20", "cfs", "Discharge"], n: ["0.013", "", "Manning roughness (concrete)"], b: ["3", "ft", "Bottom width"], y: ["", "ft", "Flow depth"], S: ["0.002", "ft/ft", "Channel slope"] },
      note: "Flow area A = b·y and hydraulic radius R = A/(b + 2y). 1.49 is the U.S.-unit factor (often written 1.486)." },
    { id: "manning-si", name: "Manning's equation (SI)", eq: "Q = 1/n * A * R^(2/3) * S^(1/2)", unknown: "Q",
      vars: { Q: ["", "m³/s", "Discharge"], n: ["0.015", "", "Manning roughness"], A: ["2.5", "m²", "Flow area"], R: ["0.6", "m", "Hydraulic radius A/P"], S: ["0.001", "m/m", "Slope"] } },
    { id: "hazen", name: "Hazen–Williams head loss (U.S.)", eq: "hf = 4.73 * L * Q^1.852 / (C^1.852 * D^4.87)", unknown: "hf",
      vars: { hf: ["", "ft", "Head loss"], L: ["1000", "ft", "Pipe length"], Q: ["1.5", "cfs", "Flow"], C: ["130", "", "Hazen–Williams C"], D: ["0.833", "ft", "Diameter (10 in)"] },
      note: "Q in cfs and D in feet. The coefficient 4.73 belongs to that unit set." },
    { id: "darcy", name: "Darcy–Weisbach head loss (SI)", eq: "hf = f * (L/D) * V^2 / (2*g)", unknown: "hf",
      vars: { hf: ["", "m", "Head loss"], f: ["0.02", "", "Darcy friction factor"], L: ["100", "m", "Length"], D: ["0.3", "m", "Diameter"], V: ["2", "m/s", "Mean velocity"] },
      note: "g is the built-in constant 9.80665 m/s²." },
    { id: "orifice", name: "Orifice flow (SI)", eq: "Q = Cd * A * sqrt(2*g*h)", unknown: "h",
      vars: { Q: ["0.05", "m³/s", "Flow"], Cd: ["0.61", "", "Discharge coefficient"], A: ["0.01", "m²", "Orifice area"], h: ["", "m", "Head above the orifice"] } },
    { id: "weir", name: "Sharp-crested rectangular weir (U.S.)", eq: "Q = 3.33 * L * H^1.5", unknown: "H",
      vars: { Q: ["25", "cfs", "Flow"], L: ["4", "ft", "Crest length"], H: ["", "ft", "Head over the crest"] }, note: "Francis formula without end contractions." },
    { id: "rational", name: "Rational method (U.S.)", eq: "Q = C * i * A", unknown: "Q",
      vars: { Q: ["", "cfs", "Peak runoff"], C: ["0.5", "", "Runoff coefficient"], i: ["2.4", "in/hr", "Rainfall intensity"], A: ["12", "ac", "Drainage area"] },
      note: "Acre-inches per hour come out almost exactly in cfs (the factor is 1.008)." },
    { id: "beam", name: "Beam deflection: simple span, uniform load", eq: "delta = 5*w*L^4 / (384*E*I)", unknown: "delta",
      vars: { delta: ["", "in", "Midspan deflection"], w: ["0.1", "kip/in", "Uniform load (1.2 kip/ft)"], L: ["240", "in", "Span (20 ft)"], E: ["29000", "ksi", "Modulus (steel)"], I: ["510", "in⁴", "Moment of inertia"] },
      note: "Keep units consistent: kips and inches here." },
    { id: "continuity", name: "Continuity: Q = V·A", eq: "Q = V * A", unknown: "V", vars: { Q: ["10", "cfs", "Flow"], V: ["", "ft/s", "Mean velocity"], A: ["4", "ft²", "Flow area"] } },
  ];
  const CONST_NAMES = new Set([...C.CONSTANTS.map((c) => c[0]), "π", "ans"]);
  function splitEq(src) {
    for (let k = 0; k < src.length; k++) {
      if (src[k] !== "=") continue;
      const a = src[k - 1], b = src[k + 1];
      if ("<>!=".includes(a || "") || b === "=") {
        if (b === "=") k++;
        continue;
      }
      return [src.slice(0, k), src.slice(k + 1)];
    }
    return null;
  }
  function eqVars(src) {
    const parts = splitEq(src);
    if (!parts) throw new Error("Write an equation with one = sign, like Q = V*A.");
    if (!parts[0].trim() || !parts[1].trim()) throw new Error("Both sides of the = need something.");
    const names = new Set();
    for (const side of parts) C.freeVars(C.parseExpression(side, S), names);
    return { parts, names: [...names].filter((n) => !CONST_NAMES.has(n)) };
  }
  function loadPreset(id) {
    const p = PRESETS.find((q) => q.id === id) || PRESETS[0];
    UI.sv.preset = p.id;
    UI.sv.roots = null;
    UI.sv.err = "";
    if (p.id === "custom") return;
    UI.sv.eq = p.eq;
    UI.sv.values = Object.fromEntries(Object.entries(p.vars).map(([k, v]) => [k, v[0]]));
    UI.sv.unknown = p.unknown;
  }
  function renderSolve(view) {
    if (!UI.sv.eq && UI.sv.preset !== "custom") loadPreset(UI.sv.preset);
    const p = PRESETS.find((q) => q.id === UI.sv.preset) || PRESETS[0];
    let info, err = "";
    try {
      info = eqVars(UI.sv.eq);
    } catch (e) {
      info = { names: [] };
      err = UI.sv.eq.trim() ? e.message : "";
    }
    if (info.names.length && !info.names.includes(UI.sv.unknown)) UI.sv.unknown = info.names.find((n) => !String(UI.sv.values[n] ?? "").trim()) || info.names[0];
    const meta = (n) => (p.vars && p.vars[n]) || ["", "", ""];
    const poly = UI.sv.poly, sys = UI.sv.sys;
    view.innerHTML = `
      <div class="c-solve">
        <section class="panel">
          <h2>${icon("function")}Equation solver</h2>
          <div class="form-grid">
            <label style="grid-column: 1 / -1">Formula<select id="s-preset">${PRESETS.map((q) => `<option value="${q.id}"${q.id === UI.sv.preset ? " selected" : ""}>${esc(q.name)}</option>`).join("")}</select></label>
          </div>
          <input class="in eq-in" id="s-eq" value="${esc(UI.sv.eq)}" spellcheck="false" autocomplete="off" placeholder="Type an equation, like V = Q / (pi*D^2/4)" aria-label="Equation" style="margin-top:10px" />
          ${p.note && UI.sv.preset !== "custom" ? `<p class="note">${esc(p.note)}</p>` : ""}
          <div class="err-box" style="margin-top:10px">${esc(err)}</div>
          ${info.names.length ? `
          <table class="vars">
            <thead><tr><th>Solve for</th><th>Variable</th><th>Value</th><th>Units / meaning</th></tr></thead>
            <tbody>${info.names.map((n) => `<tr class="${n === UI.sv.unknown ? "unknown" : ""}">
              <td><input type="radio" name="unk" value="${esc(n)}" ${n === UI.sv.unknown ? "checked" : ""} aria-label="Solve for ${esc(n)}" /></td>
              <td class="v">${esc(n)}</td>
              <td><input class="in" data-var="${esc(n)}" value="${esc(n === UI.sv.unknown ? "" : UI.sv.values[n] ?? (typeof S.vars[n] === "number" ? short(S.vars[n], 12) : ""))}" ${n === UI.sv.unknown ? `placeholder="solving…" disabled` : ""} aria-label="Value of ${esc(n)}" /></td>
              <td class="u">${esc([meta(n)[1], meta(n)[2]].filter(Boolean).join(" · "))}</td>
            </tr>`).join("")}</tbody>
          </table>
          <div class="hrow" style="margin-top:12px">
            <label class="sel">Search from <input class="in" id="s-lo" value="${esc(UI.sv.lo)}" placeholder="auto" style="width:80px" /></label>
            <label class="sel">to <input class="in" id="s-hi" value="${esc(UI.sv.hi)}" placeholder="auto" style="width:80px" /></label>
            <span class="grow"></span>
            <button type="button" class="btn primary" id="s-go">${icon("play")}Solve for ${esc(UI.sv.unknown || "")}</button>
          </div>
          <div id="s-out">${solveOutHTML()}</div>` : ""}
          <p class="note">Built-in constants such as <code>g</code> and <code>pi</code> are filled in automatically. Values can be expressions, like <code>cvt(10, in, ft)</code>.</p>
        </section>
        <div class="stack">
          <section class="panel">
            <h2>${icon("wave-sine")}Polynomial roots</h2>
            <label class="sel">Degree <select id="p-deg">${Array.from({ length: 8 }, (_, i) => `<option${i + 1 === poly.deg ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label>
            <div class="coefs">${poly.c.map((v, k) => {
              const pw = poly.deg - k;
              return `<input class="in" data-pc="${k}" value="${esc(v)}" aria-label="Coefficient of x^${pw}" /><span>${pw === 0 ? "" : pw === 1 ? "x" : `x${C.format.SUP[pw] || "^" + pw}`}${k < poly.deg ? " +" : " = 0"}</span>`;
            }).join("")}</div>
            <div class="hrow" style="margin-top:10px"><button type="button" class="btn primary" id="p-go">Find roots</button></div>
            <div class="results" id="p-out"></div>
          </section>
          <section class="panel">
            <h2>${icon("grid-four")}Linear system</h2>
            <label class="sel">Unknowns <select id="y-n">${[2, 3, 4, 5, 6].map((n) => `<option${n === sys.n ? " selected" : ""}>${n}</option>`).join("")}</select></label>
            <div class="sys">${sys.A.map((row, i) => `<div class="sys-row">${row.map((v, j) => `<input class="in" data-a="${i},${j}" value="${esc(v)}" aria-label="Row ${i + 1}, x${j + 1} coefficient" /><span>x${j + 1}${j < sys.n - 1 ? " +" : " ="}</span>`).join("")}<input class="in" data-b="${i}" value="${esc(sys.b[i])}" aria-label="Row ${i + 1} constant" /></div>`).join("")}</div>
            <div class="hrow" style="margin-top:10px"><button type="button" class="btn primary" id="y-go">Solve system</button></div>
            <div class="results" id="y-out"></div>
          </section>
        </div>
      </div>`;

    $("#s-preset").addEventListener("change", (e) => {
      loadPreset(e.target.value);
      if (e.target.value === "custom") {
        UI.sv.eq = "";
        UI.sv.values = {};
      }
      renderSolve(view);
    });
    $("#s-eq").addEventListener("change", (e) => {
      UI.sv.eq = e.target.value;
      UI.sv.preset = PRESETS.some((q) => q.eq === UI.sv.eq) ? UI.sv.preset : "custom";
      UI.sv.roots = null;
      renderSolve(view);
      const el = $("#s-eq");
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
    $$('input[name="unk"]').forEach((r) =>
      r.addEventListener("change", () => {
        UI.sv.unknown = r.value;
        UI.sv.roots = null;
        renderSolve(view);
      })
    );
    $$("[data-var]").forEach((inp) => inp.addEventListener("input", () => (UI.sv.values[inp.dataset.var] = inp.value)));
    if ($("#s-lo")) {
      $("#s-lo").addEventListener("input", (e) => (UI.sv.lo = e.target.value));
      $("#s-hi").addEventListener("input", (e) => (UI.sv.hi = e.target.value));
      $("#s-go").addEventListener("click", () => {
        runSolve(info);
        $("#s-out").innerHTML = solveOutHTML();
        wireSolveOut(view);
      });
      wireSolveOut(view);
    }

    $("#p-deg").addEventListener("change", (e) => {
      const d = +e.target.value;
      const old = UI.sv.poly.c;
      UI.sv.poly = { deg: d, c: Array.from({ length: d + 1 }, (_, k) => old[old.length - d - 1 + k] ?? (k === 0 ? "1" : "0")) };
      renderSolve(view);
    });
    $$("[data-pc]").forEach((inp) => inp.addEventListener("input", () => (UI.sv.poly.c[+inp.dataset.pc] = inp.value)));
    $("#p-go").addEventListener("click", () => {
      const out = $("#p-out");
      const cs = UI.sv.poly.c.map((t) => num(t || "0"));
      if (cs.some((x) => !Number.isFinite(x))) return (out.innerHTML = `<div class="err-box">Every coefficient must be a number.</div>`);
      try {
        const roots = C.polyRoots(cs);
        out.innerHTML = `<dl class="kv">${roots.map((r, k) => `<dt>x${k + 1}</dt><dd>${esc(r.im === 0 ? short(r.re, 10) : `${short(r.re, 8)} ${r.im < 0 ? "−" : "+"} ${short(Math.abs(r.im), 8)}i`)}</dd>`).join("")}</dl>${roots.some((r) => r.im !== 0) ? `<p class="note">Complex roots come in conjugate pairs (a ± bi).</p>` : ""}`;
      } catch (e) {
        out.innerHTML = `<div class="err-box">${esc(e.message)}</div>`;
      }
    });

    $("#y-n").addEventListener("change", (e) => {
      const n = +e.target.value;
      const old = UI.sv.sys;
      UI.sv.sys = { n, A: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (old.A[i] && old.A[i][j] !== undefined ? old.A[i][j] : i === j ? "1" : "0"))), b: Array.from({ length: n }, (_, i) => old.b[i] ?? "0") };
      renderSolve(view);
    });
    $$("[data-a]").forEach((inp) =>
      inp.addEventListener("input", () => {
        const [i, j] = inp.dataset.a.split(",").map(Number);
        UI.sv.sys.A[i][j] = inp.value;
      })
    );
    $$("[data-b]").forEach((inp) => inp.addEventListener("input", () => (UI.sv.sys.b[+inp.dataset.b] = inp.value)));
    $("#y-go").addEventListener("click", () => {
      const out = $("#y-out");
      const A = UI.sv.sys.A.map((r) => r.map((t) => num(t || "0")));
      const b = UI.sv.sys.b.map((t) => num(t || "0"));
      if ([...A.flat(), ...b].some((x) => !Number.isFinite(x))) return (out.innerHTML = `<div class="err-box">Every entry must be a number.</div>`);
      try {
        const x = C.matrix.solveLinear(A, b);
        out.innerHTML = `<dl class="kv">${x.map((v, i) => `<dt>x${i + 1}</dt><dd>${esc(short(v, 10))}</dd>`).join("")}</dl>`;
      } catch (e) {
        out.innerHTML = `<div class="err-box">${esc(e.message)}</div>`;
      }
    });
  }
  function runSolve(info) {
    UI.sv.err = "";
    UI.sv.roots = null;
    const unk = UI.sv.unknown;
    const knowns = Object.create(null);
    for (const n of info.names) {
      if (n === unk) continue;
      const raw = String($(`[data-var="${n}"]`).value || "").trim();
      UI.sv.values[n] = raw;
      const v = num(raw);
      if (!Number.isFinite(v)) {
        UI.sv.err = raw ? `${n} isn't a number.` : `Enter a value for ${n}.`;
        return;
      }
      knowns[n] = v;
    }
    const st = { ...S, vars: Object.assign(Object.create(null), S.vars, knowns) };
    delete st.vars[unk];
    try {
      const [lhs, rhs] = info.parts;
      const lo = num(UI.sv.lo), hi = num(UI.sv.hi);
      let roots;
      if (Number.isFinite(lo) && Number.isFinite(hi) && hi > lo) {
        const f = C.compile(`(${lhs}) - (${rhs})`, st, [unk]);
        roots = C.calculus.findRoots(f, lo, hi, 4000);
        if (!roots.length) throw new Error(`No solution for ${unk} between ${lo} and ${hi}.`);
      } else roots = C.solveEquation(lhs, rhs, unk, st);
      UI.sv.roots = roots;
      UI.sv.st = st;
      UI.sv.parts = info.parts;
    } catch (e) {
      UI.sv.err = e.message;
    }
  }
  function solveOutHTML() {
    if (UI.sv.err) return `<div class="err-box" style="margin-top:10px">${esc(UI.sv.err)}</div>`;
    if (!UI.sv.roots) return "";
    const unk = UI.sv.unknown, roots = UI.sv.roots;
    const pick = roots.find((r) => r > 0) ?? roots[0];
    let check = "";
    try {
      const L = C.compile(UI.sv.parts[0], UI.sv.st, [unk])(pick), R = C.compile(UI.sv.parts[1], UI.sv.st, [unk])(pick);
      check = `<p class="note">Check with ${esc(unk)} = ${esc(short(pick, 8))}: left side ${esc(short(L, 10))}, right side ${esc(short(R, 10))}.</p>`;
    } catch (_) {}
    return `<div class="roots">${roots.map((r) => `<button type="button" class="root" data-root="${r}" title="Store ${esc(unk)} on the Calculate tab">${esc(unk)} = ${esc(short(r, 10))}</button>`).join("")}</div>
      ${roots.length > 1 ? `<p class="note">More than one value satisfies the equation. Pick the one that makes physical sense${roots.some((r) => r > 0) && roots.some((r) => r <= 0) ? " (usually the positive one)" : ""}.</p>` : ""}
      ${check}<p class="note">Click a value to store it, with the inputs, as variables on the Calculate tab.</p>`;
  }
  function wireSolveOut() {
    $$("[data-root]").forEach((b) =>
      b.addEventListener("click", () => {
        const unk = UI.sv.unknown;
        for (const [k, v] of Object.entries(UI.sv.values)) {
          const x = num(v);
          if (k !== unk && Number.isFinite(x) && !C.isBuiltin(k)) S.vars[k] = x;
        }
        S.vars[unk] = +b.dataset.root;
        save();
        toast(`Stored ${unk} = ${short(+b.dataset.root, 8)} and the inputs as variables.`);
      })
    );
  }

  /* =======================================================================
     Units
     ======================================================================= */
  function renderUnits(view) {
    const u = UI.un, cat = C.UNITS[u.cat];
    const codes = Object.keys(cat.units);
    if (!codes.includes(u.from)) u.from = codes[0];
    if (!codes.includes(u.to)) u.to = codes[1] || codes[0];
    const opt = (sel) => codes.map((k) => `<option value="${k}"${k === sel ? " selected" : ""}>${esc(k)} — ${esc(cat.units[k][0])}</option>`).join("");
    view.innerHTML = `
      <div class="c-units">
        <section class="panel">
          <h2>${icon("arrows-left-right")}Convert</h2>
          <div class="form-grid" style="margin-bottom:10px">
            <label>Quantity<select id="u-cat">${Object.entries(C.UNITS).map(([k, c]) => `<option value="${k}"${k === u.cat ? " selected" : ""}>${esc(c.label)}</option>`).join("")}</select></label>
            <label>Value<input class="in" id="u-v" value="${esc(u.v)}" inputmode="decimal" /></label>
          </div>
          <div class="conv">
            <label>From<select id="u-from">${opt(u.from)}</select></label>
            <button type="button" class="icon-btn swap" id="u-swap" aria-label="Swap units">${icon("arrows-left-right")}</button>
            <label>To<select id="u-to">${opt(u.to)}</select></label>
          </div>
          <div class="conv-out" id="u-out"></div>
          <div class="code-line">In an expression: <code id="u-code"></code><button type="button" class="btn small" id="u-ins">Use in calculator</button></div>
          ${u.cat === "length" || u.cat === "area" ? `<p class="note">The U.S. survey foot (ftUS, 1200/3937 m) was retired at the end of 2022 but still appears in older State Plane coordinates and deeds. Acres here use the international foot.</p>` : ""}
        </section>
        <section class="panel">
          <h2>${icon("list-bullets")}Every ${esc(cat.label.toLowerCase())} unit</h2>
          <div class="tbl-wrap" style="max-height:none"><table class="tbl" id="u-all"></table></div>
        </section>
      </div>`;
    const update = () => {
      const v = num(u.v);
      let res = NaN, msg = "";
      try {
        res = Number.isFinite(v) ? C.convert(v, u.from, u.to) : NaN;
      } catch (e) {
        msg = e.message;
      }
      $("#u-out").innerHTML = Number.isFinite(res) ? `${esc(short(res, 10))} <small>${esc(u.to)}</small>` : `<small>${esc(msg || "Enter a number to convert.")}</small>`;
      $("#u-code").textContent = `cvt(${u.v || "1"}, ${u.from}, ${u.to})`;
      $("#u-all").innerHTML = `<thead><tr><th>Unit</th><th>Code</th><th>${esc(u.v || "—")} ${esc(u.from)} =</th></tr></thead><tbody>${codes
        .map((k) => {
          let r = NaN;
          try {
            r = Number.isFinite(v) ? C.convert(v, u.from, k) : NaN;
          } catch (_) {}
          return `<tr class="${k === u.to ? "hit" : ""}"><td>${esc(cat.units[k][0])}</td><td>${esc(k)}</td><td>${esc(short(r, 10))}</td></tr>`;
        })
        .join("")}</tbody>`;
    };
    $("#u-cat").addEventListener("change", (e) => {
      u.cat = e.target.value;
      save();
      renderUnits(view);
    });
    $("#u-v").addEventListener("input", (e) => {
      u.v = e.target.value;
      update();
      save();
    });
    $("#u-from").addEventListener("change", (e) => {
      u.from = e.target.value;
      update();
      save();
    });
    $("#u-to").addEventListener("change", (e) => {
      u.to = e.target.value;
      update();
      save();
    });
    $("#u-swap").addEventListener("click", () => {
      [u.from, u.to] = [u.to, u.from];
      save();
      renderUnits(view);
    });
    $("#u-ins").addEventListener("click", () => goInsert($("#u-code").textContent));
    update();
  }

  /* =======================================================================
     Constants
     ======================================================================= */
  function renderConstants(view) {
    view.innerHTML = `
      <section class="panel">
        <h2>${icon("atom")}Constants</h2>
        <p class="muted" style="margin-bottom:12px">Type these names in any expression. A variable you store with the same name takes priority.</p>
        <div class="tbl-wrap" style="max-height:none">
          <table class="tbl const-tbl">
            <thead><tr><th>Name</th><th>Value</th><th>Units</th><th style="text-align:left">Meaning</th><th></th></tr></thead>
            <tbody>${C.CONSTANTS.map(([n, v, u, d]) => `<tr><td><code>${esc(n)}</code></td><td>${esc(String(+v.toPrecision(12)))}</td><td>${esc(u)}</td><td style="text-align:left;color:var(--text-dim)">${esc(d)}</td><td><button type="button" class="btn small" data-c="${esc(n)}">Insert</button></td></tr>`).join("")}</tbody>
          </table>
        </div>
      </section>`;
    $$("[data-c]").forEach((b) => b.addEventListener("click", () => goInsert(b.dataset.c)));
  }
  function goInsert(text) {
    location.hash = "#/calc";
    setTimeout(() => insert(text), 30);
  }

  /* =======================================================================
     Router
     ======================================================================= */
  const VIEWS = { calc: renderCalc, graph: renderGraph, stats: renderStats, matrix: renderMatrix, solve: renderSolve, units: renderUnits, constants: renderConstants };
  let current = null;
  function route() {
    const id = (location.hash.match(/^#\/(\w+)/) || [])[1];
    const tab = VIEWS[id] ? id : "calc";
    current = tab;
    $$(".c-tabs a").forEach((a) => (a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    if (resizeObs && tab !== "graph") {
      resizeObs.disconnect();
      resizeObs = null;
    }
    VIEWS[tab]($("#view"));
    document.title = `${TABS.find((t) => t[0] === tab)[1]} · Engineering Calculator`;
  }
  function rerender() {
    if (current === "calc") {
      renderTape(false);
      const tag = $("#mode-tag");
      if (tag) tag.textContent = S.mode.angle.toUpperCase();
    } else route();
  }

  load();
  shell();
  window.addEventListener("hashchange", route);
  route();
})();
