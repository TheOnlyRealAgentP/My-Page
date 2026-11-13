/* =========================================================================
   Field math app: hub of calculators, each with a calculator mode and a
   practice mode. Routes: #/ (hub) and #/<tool-id>.
   ========================================================================= */
(function () {
  "use strict";

  const F = window.FIELD;
  const app = document.getElementById("app");
  const tools = F.tools;
  const byId = (id) => tools.find((t) => t.id === id);

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const icon = (n) => `<i class="ph ph-${n}" aria-hidden="true"></i>`;
  const store = {
    get(k, d) { try { const v = localStorage.getItem("field:" + k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem("field:" + k, JSON.stringify(v)); } catch (_) {} },
  };

  let Ukey = store.get("units", "ft") === "m" ? "m" : "ft";
  const U = () => F.UNITS[Ukey];
  const unitLabel = (u) => (u === "L" ? U().L : u === "A" ? U().A : u || "");

  function unitToggle() {
    return `<div class="units" role="group" aria-label="Length units">
      <button type="button" data-u="ft" aria-pressed="${Ukey === "ft"}">Feet</button>
      <button type="button" data-u="m" aria-pressed="${Ukey === "m"}">Meters</button>
    </div>`;
  }
  function wireUnits(onChange) {
    app.querySelectorAll(".units button").forEach((b) =>
      b.addEventListener("click", () => {
        Ukey = b.dataset.u;
        store.set("units", Ukey);
        app.querySelectorAll(".units button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.u === Ukey));
        onChange();
      })
    );
  }

  /* ---------- Router ---------- */
  function route() {
    const id = location.hash.replace(/^#\/?/, "");
    window.scrollTo(0, 0);
    const t = byId(id);
    if (t && !t.link) return renderTool(t);
    renderHub();
  }
  window.addEventListener("hashchange", route);

  /* =======================================================================
     Hub
     ======================================================================= */
  function renderHub() {
    document.title = "Field Math · Surveying & Civil Engineering";
    const groups = [...new Set(tools.map((t) => t.group))];
    app.innerHTML = `
      <header class="hub-head">
        <div class="eyebrow">Surveying &amp; civil engineering</div>
        <h1>Field Math</h1>
        <p class="lede">
          Calculators for the math you use on site and in the office. Each one shows every step, explains the idea,
          and has a practice mode that makes up new problems for you to solve by hand.
        </p>
        <div class="hub-bar">
          <span class="pill">${icon("calculator")}${tools.length} tools</span>
          <span class="pill">${icon("pencil-simple-line")}Practice problems with instant checking</span>
          <div class="grow"></div>
          ${unitToggle()}
        </div>
      </header>
      ${groups
        .map(
          (g) => `
        <section class="group">
          <h2>${esc(g)}</h2>
          <div class="tool-grid">
            ${tools
              .filter((t) => t.group === g)
              .map(
                (t) => `
              <a class="panel tool-card" href="${t.link ? esc(t.link) : `#/${t.id}`}">
                <span class="t-ico">${icon(t.icon)}</span>
                <span class="t-txt"><b>${esc(t.title)}</b><span>${esc(t.blurb)}</span></span>
                ${icon(t.link ? "arrow-up-right" : "caret-right")}
              </a>`
              )
              .join("")}
          </div>
        </section>`
        )
        .join("")}`;
    wireUnits(() => {});
  }

  /* =======================================================================
     Tool
     ======================================================================= */
  function renderTool(t) {
    document.title = `${t.title} · Field Math`;
    const list = tools.filter((x) => !x.link);
    const i = list.indexOf(t);
    const prev = list[i - 1], next = list[i + 1];

    // Current raw values (strings / rows of strings)
    const raw = {};
    for (const inp of t.inputs) raw[inp.id] = inp.type === "rows" ? inp.rows.map((r) => r.slice()) : inp.value;

    let mode = "calc";
    let problem = null; // { ask: [...] } in practice mode
    let revealed = false;

    app.innerHTML = `
      <nav class="crumbs"><a href="#/">${icon("arrow-left")}All tools</a></nav>
      <header class="t-head">
        <div class="eyebrow">${esc(t.group)}</div>
        <h1>${esc(t.title)}</h1>
        <p class="lede">${esc(t.blurb)}</p>
        <div class="hub-bar">
          <div class="modes" role="tablist">
            <button type="button" role="tab" data-mode="calc" aria-selected="true">${icon("calculator")}Calculator</button>
            <button type="button" role="tab" data-mode="practice" aria-selected="false">${icon("pencil-simple-line")}Practice</button>
          </div>
          <div class="grow"></div>
          ${t.unitFree ? "" : unitToggle()}
        </div>
      </header>

      <div class="t-layout">
        <section class="panel inputs" aria-label="Inputs">
          <div class="p-head"><h2>Inputs</h2><span class="p-note" id="p-note"></span></div>
          <div id="form"></div>
          <div class="practice-bar" id="practice-bar" hidden>
            <button type="button" class="btn" id="new-problem">${icon("shuffle")}New problem</button>
          </div>
        </section>
        <section class="panel results" aria-label="Results" aria-live="polite">
          <div class="p-head"><h2 id="r-title">Results</h2></div>
          <div id="results"></div>
        </section>
      </div>

      <section class="panel learn">
        <h2>${icon("lightbulb")}How it works</h2>
        ${t.explain.map((p) => `<p>${esc(p)}</p>`).join("")}
        ${t.formulas ? `<div class="formulas">${t.formulas.map((f) => `<code>${esc(f)}</code>`).join("")}</div>` : ""}
        ${t.field ? `<div class="field-tip">${icon("hard-hat")}<p><strong>In the field:</strong> ${esc(t.field)}</p></div>` : ""}
      </section>

      <nav class="pager">
        ${prev ? `<a class="btn" href="#/${prev.id}">${icon("arrow-left")}${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="#/${next.id}">${esc(next.title)}${icon("arrow-right")}</a>` : ""}
      </nav>`;

    const form = app.querySelector("#form");
    const results = app.querySelector("#results");

    /* ---- Inputs ---- */
    function drawForm() {
      const locked = mode === "practice";
      form.innerHTML = t.inputs
        .map((inp) => {
          const u = unitLabel(inp.unit);
          if (inp.type === "rows") {
            return `
            <div class="f-rows" data-id="${inp.id}">
              <div class="f-label">${esc(inp.label)}</div>
              <div class="rows-wrap"><table class="rows">
                <thead><tr>${inp.cols.map((c) => `<th>${esc(c.label)}${c.unit ? ` <span>(${esc(unitLabel(c.unit))})</span>` : ""}</th>`).join("")}<th></th></tr></thead>
                <tbody>${raw[inp.id]
                  .map(
                    (row, r) => `<tr>${inp.cols
                      .map((c, j) => `<td><input type="text" ${c.type === "text" ? "" : 'inputmode="decimal"'} data-r="${r}" data-c="${j}" value="${esc(row[j] ?? "")}" aria-label="${esc(c.label)} row ${r + 1}" ${locked ? "readonly" : ""}/></td>`)
                      .join("")}<td>${locked ? "" : `<button type="button" class="row-x" data-r="${r}" aria-label="Remove row ${r + 1}">${icon("x")}</button>`}</td></tr>`
                  )
                  .join("")}</tbody>
              </table></div>
              ${locked ? "" : `<button type="button" class="linkish add-row">${icon("plus")}Add row</button>`}
            </div>`;
          }
          if (inp.type === "select") {
            return `<label class="f"><span class="f-label">${esc(inp.label)}</span>
              <select data-id="${inp.id}" ${locked ? "disabled" : ""}>${inp.options.map(([v, l]) => `<option value="${esc(v)}"${String(raw[inp.id]) === String(v) ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
          }
          const hint = inp.type === "station" ? (Ukey === "ft" ? "12+34.56" : "1+234.567") : inp.type === "angle" ? "deg min sec" : "";
          return `<label class="f"><span class="f-label">${esc(inp.label)}</span>
            <span class="f-in"><input type="text" ${inp.type === "num" ? 'inputmode="decimal"' : ""} data-id="${inp.id}" value="${esc(raw[inp.id])}" placeholder="${esc(hint)}" ${locked ? "readonly" : ""}/>${u ? `<span class="u">${esc(u)}</span>` : ""}</span>
            ${inp.help ? `<span class="f-help">${esc(inp.help)}</span>` : ""}</label>`;
        })
        .join("");
    }

    form.addEventListener("input", (e) => {
      const el = e.target;
      if (el.dataset.id) raw[el.dataset.id] = el.value;
      else if (el.dataset.r !== undefined) {
        const id = el.closest(".f-rows").dataset.id;
        raw[id][+el.dataset.r][+el.dataset.c] = el.value;
      }
      drawResults();
    });
    form.addEventListener("change", (e) => {
      if (e.target.tagName === "SELECT") { raw[e.target.dataset.id] = e.target.value; drawResults(); }
    });
    form.addEventListener("click", (e) => {
      const box = e.target.closest(".f-rows");
      if (!box) return;
      const id = box.dataset.id;
      const inp = t.inputs.find((x) => x.id === id);
      if (e.target.closest(".add-row")) {
        raw[id].push(inp.cols.map(() => ""));
        drawForm();
        form.querySelector(`.f-rows[data-id="${id}"] tbody tr:last-child input`)?.focus();
        drawResults();
      } else if (e.target.closest(".row-x")) {
        raw[id].splice(+e.target.closest(".row-x").dataset.r, 1);
        drawForm();
        drawResults();
      }
    });

    /* ---- Results ---- */
    function compute() {
      try {
        return t.compute(F.parseInputs(t, raw, Ukey), U());
      } catch (err) {
        return { error: "Those inputs can't be computed. Check each field." };
      }
    }

    function drawResults() {
      const r = compute();
      if (r.error) {
        results.innerHTML = `<div class="err">${icon("warning")}${esc(r.error)}</div>`;
        return;
      }
      if (mode === "calc" || revealed) {
        results.innerHTML = `
          <dl class="outs">${r.outputs
            .map((o) => {
              const asked = mode === "practice" && problem.ask.includes(o.id);
              return `<div class="${asked ? "asked" : ""}"><dt>${esc(o.label)}</dt><dd>${esc(F.showOutput(o, Ukey))}</dd></div>`;
            })
            .join("")}</dl>
          ${mode === "practice" ? answersBlock(r, true) : ""}
          <details class="steps" ${mode === "practice" ? "open" : ""}><summary>${icon("list-numbers")}Show the work</summary>
            <ol>${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></details>
          ${r.table ? tableBlock(r.table) : ""}`;
      } else {
        results.innerHTML = `
          <p class="muted">Work these out by hand or with a calculator, then check.</p>
          ${answersBlock(r, false)}
          <div class="toolbar">
            <button type="button" class="btn primary" id="check">${icon("check")}Check</button>
            <button type="button" class="btn" id="reveal">${icon("eye")}Show solution</button>
          </div>`;
        results.querySelector("#check").addEventListener("click", () => check(r));
        results.querySelector("#reveal").addEventListener("click", () => { revealed = true; drawResults(); });
      }
      results.querySelectorAll(".copy-table").forEach((b) => b.addEventListener("click", () => copyTable(r.table, b)));
    }

    // Practice answers: keep what the student typed across redraws
    const typed = {};
    function answersBlock(r, done) {
      const asked = r.outputs.filter((o) => problem.ask.includes(o.id));
      return `<div class="answers">${asked
        .map((o) => {
          const hint = o.kind === "angle" ? "e.g. 123 45 30" : o.kind === "bearing" ? "e.g. N 45 30 00 E" : o.kind === "station" ? (Ukey === "ft" ? "e.g. 12+34.56" : "e.g. 1+234.567") : "";
          const state = typed[o.id] === undefined ? "" : F.checkAnswer(o, typed[o.id], Ukey) ? "ok" : "no";
          return `<label class="ans ${done ? state : ""}" data-o="${o.id}">
            <span class="f-label">${esc(o.label)}</span>
            <span class="f-in"><input type="text" data-ans="${o.id}" value="${esc(typed[o.id] ?? "")}" placeholder="${esc(hint)}" ${done ? "readonly" : ""}/>${o.unit && !o.kind ? `<span class="u">${esc(o.unit)}</span>` : ""}</span>
            <span class="verdict"></span>
          </label>`;
        })
        .join("")}</div>`;
    }
    results.addEventListener("input", (e) => {
      if (e.target.dataset.ans) typed[e.target.dataset.ans] = e.target.value;
    });
    function check(r) {
      let right = 0;
      const asked = r.outputs.filter((o) => problem.ask.includes(o.id));
      asked.forEach((o) => {
        const box = results.querySelector(`.ans[data-o="${o.id}"]`);
        const ok = F.checkAnswer(o, typed[o.id] ?? "", Ukey);
        if (ok) right++;
        box.classList.toggle("ok", ok);
        box.classList.toggle("no", !ok);
        box.querySelector(".verdict").innerHTML = ok ? `${icon("check-circle")}Right` : `${icon("x-circle")}Not yet`;
      });
      if (right === asked.length) {
        const s = store.get("solved", 0) + 1;
        store.set("solved", s);
        app.querySelector("#p-note").textContent = `${s} solved`;
      }
    }

    function tableBlock(tb) {
      return `<div class="tbl">
        <div class="tbl-head"><span>${icon("table")}Table</span><button type="button" class="linkish copy-table">${icon("copy")}Copy for a spreadsheet</button></div>
        <div class="tbl-wrap"><table><thead><tr>${tb.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>${tb.rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      </div>`;
    }
    async function copyTable(tb, btn) {
      const text = [tb.head, ...tb.rows].map((r) => r.join("\t")).join("\n");
      try {
        await navigator.clipboard.writeText(text);
        btn.innerHTML = `${icon("check")}Copied`;
      } catch (_) {
        btn.textContent = "Copy failed";
      }
    }

    /* ---- Modes ---- */
    function newProblem() {
      const seed = Math.floor(Math.random() * 1e9);
      const p = t.practice(F.rng(seed), U());
      Object.assign(raw, JSON.parse(JSON.stringify(p.values)));
      // Only ask for outputs this problem actually produces
      const r = compute();
      const have = new Set((r.outputs || []).map((o) => o.id));
      problem = { ask: p.ask.filter((id) => have.has(id)) };
      if (!problem.ask.length) problem.ask = (r.outputs || []).slice(0, 1).map((o) => o.id);
      revealed = false;
      Object.keys(typed).forEach((k) => delete typed[k]);
      drawForm();
      drawResults();
    }
    function setMode(m) {
      mode = m;
      app.querySelectorAll(".modes button").forEach((b) => b.setAttribute("aria-selected", b.dataset.mode === m));
      app.querySelector("#practice-bar").hidden = m !== "practice";
      app.querySelector("#r-title").textContent = m === "practice" ? "Your answers" : "Results";
      app.querySelector("#p-note").textContent = m === "practice" ? `${store.get("solved", 0)} solved` : "";
      if (m === "practice") newProblem();
      else {
        revealed = false;
        drawForm();
        drawResults();
      }
    }
    app.querySelectorAll(".modes button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
    app.querySelector("#new-problem").addEventListener("click", newProblem);
    if (!t.unitFree) wireUnits(() => { drawForm(); drawResults(); });

    drawForm();
    drawResults();
  }

  route();
})();
