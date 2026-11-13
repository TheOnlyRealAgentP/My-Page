/* =========================================================================
   GIS study hub: views (hub, study guide, flashcards, practice test).
   Routes live in the URL hash so any view can be linked or shared:
     #/                          hub
     #/guide/ch03                study guide
     #/cards/ch03,ch04           flashcards (or #/cards/all)
     #/test?ch=ch03,ch05&n=20&seed=123456&calc=1
   ========================================================================= */
(function () {
  "use strict";

  const GIS = window.GIS;
  const app = document.getElementById("app");
  const chapters = () => GIS.chapters.slice().sort((a, b) => a.num - b.num);
  const byId = (id) => GIS.chapters.find((c) => c.id === id);
  const label = (c) => (c.id === "qgis" ? "QGIS" : `Ch ${c.num}`);

  /* ---------- Helpers ---------- */
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  // Inline markup in content: **bold** and `code`
  const md = (s) =>
    esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const icon = (n) => `<i class="ph ph-${n}" aria-hidden="true"></i>`;

  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem("gis:" + k);
        return v ? JSON.parse(v) : d;
      } catch (_) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("gis:" + k, JSON.stringify(v));
      } catch (_) {}
    },
  };
  const known = () => new Set(store.get("known", []));
  const cardKey = (c, card) => `${c.id}:${card.front}`;

  let toastTimer = 0;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }
  async function copy(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch (_) {
      toast("Copy this link: " + text);
    }
  }

  function setTitle(t) {
    document.title = t ? `${t} · GIS Study Hub` : "GIS Fundamentals Study Hub · CCE 114 & 414";
  }

  /* ---------- Router ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [path, query] = h.split("?");
    const parts = path.split("/").filter(Boolean);
    const params = new URLSearchParams(query || "");
    document.body.classList.remove("print-key");
    window.scrollTo(0, 0);
    if (!GIS.chapters.length) return renderEmpty();
    if (parts[0] === "guide" && byId(parts[1])) return renderGuide(byId(parts[1]));
    if (parts[0] === "cards") return renderCards(parts[1] || "all");
    if (parts[0] === "test") return renderTest(params);
    return renderHub();
  }
  window.addEventListener("hashchange", route);

  function renderEmpty() {
    app.innerHTML = `<div class="panel empty">${icon("hourglass-medium")}<p>Study content is still being added. Check back soon.</p></div>`;
  }

  /* =======================================================================
     Hub
     ======================================================================= */
  function renderHub() {
    setTitle("");
    const k = known();
    const scores = store.get("scores", {});
    const list = chapters();

    app.innerHTML = `
      <header class="hub-head">
        <div class="eyebrow">CCE 114 &amp; 414 · GIS &amp; QGIS</div>
        <h1>GIS Fundamentals Study Hub</h1>
        <p class="lede">
          Study guides, flashcards and practice tests that follow the chapters of Bolstad's
          <em>GIS Fundamentals</em>, plus a hands-on QGIS chapter. Calculation questions get new numbers every time.
        </p>
        <div class="meta-row">
          <span class="pill">${icon("book-open-text")}<span>Follows Bolstad &amp; Manson, <em>GIS Fundamentals</em>, 7th ed.</span></span>
          <span class="pill">${icon("pencil-line")}<span>Original study material, not text from the book</span></span>
        </div>
      </header>

      <section class="panel builder" aria-labelledby="b-h">
        <div class="builder-top">
          <h2 id="b-h">${icon("exam")}Build a practice test</h2>
          <div class="sel-links">
            <button type="button" class="linkish" data-sel="all">Select all</button>
            <button type="button" class="linkish" data-sel="none">Clear</button>
          </div>
        </div>
        <div class="chips" id="chips">
          ${list
            .map(
              (c) => `
            <label class="chip">
              <input type="checkbox" value="${c.id}" />
              <span><b>${label(c)}</b> ${esc(c.title)}</span>
            </label>`
            )
            .join("")}
        </div>
        <div class="builder-row">
          <label class="field">Questions
            <select id="b-n">
              ${[10, 20, 30, 50].map((n) => `<option value="${n}"${n === 20 ? " selected" : ""}>${n}</option>`).join("")}
            </select>
          </label>
          <label class="toggle"><input type="checkbox" id="b-calc" checked /> Include calculation problems</label>
          <div class="grow"></div>
          <button type="button" class="btn" id="b-cards">${icon("cards")}Flashcards</button>
          <button type="button" class="btn primary" id="b-start">${icon("play")}Start test</button>
        </div>
      </section>

      <section class="ch-grid" aria-label="Chapters">
        ${list
          .map((c) => {
            const kn = c.cards.filter((card) => k.has(cardKey(c, card))).length;
            const pct = c.cards.length ? Math.round((kn / c.cards.length) * 100) : 0;
            const best = scores[c.id];
            const calc = Object.values(GIS.generators).filter((g) => g.chapter === c.id).length;
            return `
            <article class="panel ch">
              <div class="ch-num">${c.id === "qgis" ? icon("map-trifold") : String(c.num).padStart(2, "0")}</div>
              <h3>${esc(c.title)}</h3>
              <p>${md(c.blurb)}</p>
              <div class="ch-stats">
                <span>${c.cards.length} cards</span>
                <span>${c.questions.length + calc} questions${calc ? ` · ${calc} with random numbers` : ""}</span>
              </div>
              <div class="meter" title="${kn} of ${c.cards.length} cards known"><i style="width:${pct}%"></i></div>
              <div class="ch-meta">
                <span>${kn}/${c.cards.length} cards known</span>
                <span>${best !== undefined ? `Last test ${best}%` : "No test yet"}</span>
              </div>
              <div class="ch-actions">
                <a class="act" href="#/guide/${c.id}">${icon("book-open")}Guide</a>
                <a class="act" href="#/cards/${c.id}">${icon("cards")}Cards</a>
                <a class="act" href="#/test?ch=${c.id}&n=15&seed=${GIS.newSeed()}&calc=1">${icon("exam")}Quiz</a>
              </div>
            </article>`;
          })
          .join("")}
      </section>

      <section class="panel tip">
        ${icon("chalkboard-teacher")}
        <div>
          <strong>Using this in class?</strong> Every test has a share link that rebuilds the exact same questions and
          numbers, so a whole section can take the same practice test. Tests also print, with or without an answer key.
        </div>
      </section>`;

    const chipInputs = [...app.querySelectorAll("#chips input")];
    const saved = new Set(store.get("lastChapters", []));
    chipInputs.forEach((i) => (i.checked = saved.has(i.value)));
    const selected = () => chipInputs.filter((i) => i.checked).map((i) => i.value);

    app.querySelectorAll("[data-sel]").forEach((b) =>
      b.addEventListener("click", () => chipInputs.forEach((i) => (i.checked = b.dataset.sel === "all")))
    );
    app.querySelector("#b-start").addEventListener("click", () => {
      const ch = selected();
      if (!ch.length) return toast("Pick at least one chapter first.");
      store.set("lastChapters", ch);
      const n = app.querySelector("#b-n").value;
      const calc = app.querySelector("#b-calc").checked ? 1 : 0;
      location.hash = `#/test?ch=${ch.join(",")}&n=${n}&seed=${GIS.newSeed()}&calc=${calc}`;
    });
    app.querySelector("#b-cards").addEventListener("click", () => {
      const ch = selected();
      store.set("lastChapters", ch);
      location.hash = `#/cards/${ch.length ? ch.join(",") : "all"}`;
    });
  }

  /* =======================================================================
     Study guide
     ======================================================================= */
  function renderGuide(c) {
    setTitle(c.title);
    const list = chapters();
    const idx = list.indexOf(c);
    const prev = list[idx - 1], next = list[idx + 1];

    // Quick check: five questions, different each visit
    const r = GIS.rng(GIS.newSeed());
    const quick = r.shuffle(c.questions.filter((q) => q.type !== "num")).slice(0, 5);

    app.innerHTML = `
      <nav class="crumbs"><a href="#/">${icon("arrow-left")}All chapters</a></nav>
      <header class="g-head">
        <div class="eyebrow">${c.id === "qgis" ? "Hands-on chapter" : `Chapter ${c.num}`} · Study guide</div>
        <h1>${esc(c.title)}</h1>
        <p class="lede">${md(c.blurb)}</p>
        <div class="toolbar">
          <a class="btn" href="#/cards/${c.id}">${icon("cards")}Flashcards</a>
          <a class="btn" href="#/test?ch=${c.id}&n=15&seed=${GIS.newSeed()}&calc=1">${icon("exam")}Chapter quiz</a>
          <button type="button" class="btn" id="print">${icon("printer")}Print guide</button>
        </div>
      </header>

      <section class="panel objectives">
        <h2>${icon("target")}After this chapter you should be able to</h2>
        <ul>${c.objectives.map((o) => `<li>${md(o)}</li>`).join("")}</ul>
      </section>

      <div class="guide">
        ${c.guide
          .map(
            (s, i) => `
          <section class="g-sec" id="s${i + 1}">
            <h2><span class="idx">${String(i + 1).padStart(2, "0")}</span>${esc(s.heading)}</h2>
            ${s.paragraphs.map((p) => `<p>${md(p)}</p>`).join("")}
            ${s.bullets ? `<ul>${s.bullets.map((b) => `<li>${md(b)}</li>`).join("")}</ul>` : ""}
            ${
              s.formula
                ? `<div class="formula"><div class="expr">${md(s.formula.expr)}</div>${
                    s.formula.where?.length ? `<ul>${s.formula.where.map((w) => `<li>${md(w)}</li>`).join("")}</ul>` : ""
                  }</div>`
                : ""
            }
            ${
              s.example
                ? `<details class="example"><summary>${icon("calculator")}Worked example</summary>
                     <p>${md(s.example.prompt)}</p>
                     <ol>${s.example.steps.map((x) => `<li>${md(x)}</li>`).join("")}</ol>
                     <p class="ans"><strong>Answer:</strong> ${md(s.example.answer)}</p>
                   </details>`
                : ""
            }
            ${s.qgis ? `<div class="qgis-note">${icon("map-trifold")}<p><strong>In QGIS:</strong> ${md(s.qgis)}</p></div>` : ""}
          </section>`
          )
          .join("")}
      </div>

      <section class="panel terms-panel">
        <h2>${icon("list-bullets")}Key terms</h2>
        <dl class="terms">${c.cards.map((k) => `<dt>${md(k.front)}</dt><dd>${md(k.back)}</dd>`).join("")}</dl>
      </section>

      <section class="panel quick">
        <h2>${icon("lightning")}Quick check</h2>
        <p class="muted">Five questions from this chapter. Pick an answer to see if you're right.</p>
        ${quick
          .map((q, i) => {
            const opts = q.type === "mc" ? q.choices.map((t, k) => [k, t]) : [[true, "True"], [false, "False"]];
            return `
            <div class="qc" data-i="${i}">
              <p class="qp"><b>${i + 1}.</b> ${md(q.prompt)}</p>
              <div class="qc-opts">${opts
                .map(([v, t]) => `<button type="button" class="opt" data-v="${v}">${md(t)}</button>`)
                .join("")}</div>
              <p class="qc-why" hidden></p>
            </div>`;
          })
          .join("")}
      </section>

      <nav class="pager">
        ${prev ? `<a class="btn" href="#/guide/${prev.id}">${icon("arrow-left")}${label(prev)}: ${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="#/guide/${next.id}">${label(next)}: ${esc(next.title)}${icon("arrow-right")}</a>` : ""}
      </nav>`;

    app.querySelector("#print").addEventListener("click", () => {
      app.querySelectorAll("details.example").forEach((d) => (d.open = true));
      window.print();
    });

    app.querySelectorAll(".qc").forEach((box) => {
      const q = quick[+box.dataset.i];
      box.querySelectorAll(".opt").forEach((b) =>
        b.addEventListener("click", () => {
          if (box.classList.contains("done")) return;
          box.classList.add("done");
          const right = String(b.dataset.v) === String(q.answer);
          b.classList.add(right ? "right" : "wrong");
          if (!right) box.querySelector(`.opt[data-v="${q.answer}"]`)?.classList.add("right");
          const why = box.querySelector(".qc-why");
          why.hidden = false;
          why.innerHTML = `<strong>${right ? "Correct." : "Not quite."}</strong> ${md(q.explain)}`;
        })
      );
    });
  }

  /* =======================================================================
     Flashcards
     ======================================================================= */
  function renderCards(arg) {
    const ids = arg === "all" ? chapters().map((c) => c.id) : arg.split(",").filter(byId);
    const chs = ids.map(byId).filter(Boolean);
    if (!chs.length) return renderHub();
    const name = chs.length === 1 ? chs[0].title : `${chs.length} chapters`;
    setTitle(`Flashcards: ${name}`);

    const all = chs.flatMap((c) => c.cards.map((card) => ({ c, card, key: cardKey(c, card) })));
    const opts = Object.assign({ shuffle: true, reverse: false, unknownOnly: false }, store.get("cardOpts", {}));
    let deck = [], pos = 0, flipped = false, sessionRight = 0, sessionWrong = [];

    function build(onlyThese) {
      const k = known();
      deck = onlyThese || all.filter((x) => !opts.unknownOnly || !k.has(x.key));
      if (opts.shuffle) deck = GIS.rng(GIS.newSeed()).shuffle(deck);
      pos = 0;
      flipped = false;
      sessionRight = 0;
      sessionWrong = [];
      draw();
    }

    app.innerHTML = `
      <nav class="crumbs"><a href="#/">${icon("arrow-left")}All chapters</a></nav>
      <header class="g-head small">
        <div class="eyebrow">Flashcards</div>
        <h1>${esc(name)}</h1>
      </header>
      <div class="fc-opts">
        <label class="toggle"><input type="checkbox" id="o-shuffle" ${opts.shuffle ? "checked" : ""}/> Shuffle</label>
        <label class="toggle"><input type="checkbox" id="o-reverse" ${opts.reverse ? "checked" : ""}/> Definition first</label>
        <label class="toggle"><input type="checkbox" id="o-unknown" ${opts.unknownOnly ? "checked" : ""}/> Only cards I don't know yet</label>
        <div class="grow"></div>
        <button type="button" class="linkish" id="o-reset">Reset progress for these cards</button>
      </div>
      <div id="fc"></div>
      <p class="kbd-hint">Keys: <kbd>Space</kbd> flip · <kbd>→</kbd> got it · <kbd>←</kbd> again</p>`;

    const fc = app.querySelector("#fc");

    function draw() {
      const k = known();
      const totalKnown = all.filter((x) => k.has(x.key)).length;
      if (!deck.length) {
        fc.innerHTML = `<div class="panel fc-done">${icon("confetti")}<h2>Nothing left in this deck</h2>
          <p>You know all ${all.length} cards here. Turn off "Only cards I don't know yet" to review them all.</p></div>`;
        return;
      }
      if (pos >= deck.length) {
        fc.innerHTML = `<div class="panel fc-done">${icon("flag-checkered")}
          <h2>Round done: ${sessionRight} of ${deck.length} right</h2>
          <p>${totalKnown} of ${all.length} cards in this deck are marked known.</p>
          <div class="toolbar center">
            ${sessionWrong.length ? `<button type="button" class="btn primary" id="again-missed">${icon("arrow-counter-clockwise")}Study the ${sessionWrong.length} I missed</button>` : ""}
            <button type="button" class="btn" id="again-all">${icon("shuffle")}Go again</button>
          </div></div>`;
        fc.querySelector("#again-missed")?.addEventListener("click", () => build(sessionWrong.slice()));
        fc.querySelector("#again-all").addEventListener("click", () => build());
        return;
      }
      const item = deck[pos];
      const front = opts.reverse ? item.card.back : item.card.front;
      const back = opts.reverse ? item.card.front : item.card.back;
      fc.innerHTML = `
        <div class="fc-bar"><span>${pos + 1} / ${deck.length}</span><span>${label(item.c)} · ${esc(item.c.title)}</span><span>${totalKnown}/${all.length} known</span></div>
        <div class="meter"><i style="width:${(pos / deck.length) * 100}%"></i></div>
        <button type="button" class="card3d${flipped ? " flipped" : ""}" id="card" aria-label="Flashcard. Press to flip.">
          <span class="face front"><span class="side">${opts.reverse ? "Definition" : "Term"}</span><span class="txt ${opts.reverse ? "long" : "big"}">${md(front)}</span><span class="hint">Click or press Space to flip</span></span>
          <span class="face back"><span class="side">${opts.reverse ? "Term" : "Definition"}</span><span class="txt ${opts.reverse ? "big" : "long"}">${md(back)}</span></span>
        </button>
        <div class="fc-actions">
          <button type="button" class="btn again" id="b-again">${icon("x")}Again</button>
          <button type="button" class="btn" id="b-flip">${icon("arrows-clockwise")}Flip</button>
          <button type="button" class="btn got" id="b-got">${icon("check")}Got it</button>
        </div>`;
      fc.querySelector("#card").addEventListener("click", flip);
      fc.querySelector("#b-flip").addEventListener("click", flip);
      fc.querySelector("#b-got").addEventListener("click", () => answer(true));
      fc.querySelector("#b-again").addEventListener("click", () => answer(false));
    }
    function flip() {
      flipped = !flipped;
      fc.querySelector("#card")?.classList.toggle("flipped", flipped);
    }
    function answer(ok) {
      const item = deck[pos];
      if (!item) return;
      const k = known();
      if (ok) {
        k.add(item.key);
        sessionRight++;
      } else {
        k.delete(item.key);
        sessionWrong.push(item);
      }
      store.set("known", [...k]);
      pos++;
      flipped = false;
      draw();
    }

    const saveOpts = () => store.set("cardOpts", opts);
    app.querySelector("#o-shuffle").addEventListener("change", (e) => { opts.shuffle = e.target.checked; saveOpts(); build(); });
    app.querySelector("#o-reverse").addEventListener("change", (e) => { opts.reverse = e.target.checked; saveOpts(); draw(); });
    app.querySelector("#o-unknown").addEventListener("change", (e) => { opts.unknownOnly = e.target.checked; saveOpts(); build(); });
    app.querySelector("#o-reset").addEventListener("click", () => {
      const k = known();
      all.forEach((x) => k.delete(x.key));
      store.set("known", [...k]);
      toast("Progress reset for this deck.");
      build();
    });

    keyHandler = (e) => {
      if (e.target.closest("input, select, textarea")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
      else if (e.key === "ArrowRight") answer(true);
      else if (e.key === "ArrowLeft") answer(false);
    };
    build();
  }

  // One keyboard handler at a time (flashcards only)
  let keyHandler = null;
  document.addEventListener("keydown", (e) => {
    if (keyHandler && location.hash.startsWith("#/cards")) keyHandler(e);
  });

  /* =======================================================================
     Practice test
     ======================================================================= */
  function renderTest(params) {
    const ids = (params.get("ch") || "").split(",").filter(byId);
    if (!ids.length) return renderHub();
    const n = Math.max(1, Math.min(100, parseInt(params.get("n"), 10) || 20));
    const seed = parseInt(params.get("seed"), 10) || GIS.newSeed();
    const calc = params.get("calc") !== "0";
    const qs = GIS.buildTest({ chapterIds: ids, count: n, seed, calc });
    const chs = ids.map(byId);
    const names = chs.length <= 3 ? chs.map((c) => `${label(c)}: ${c.title}`).join(" · ") : `${chs.length} chapters`;
    setTitle("Practice test");
    const shareUrl = location.href.split("#")[0] + `#/test?ch=${ids.join(",")}&n=${n}&seed=${seed}&calc=${calc ? 1 : 0}`;

    app.innerHTML = `
      <nav class="crumbs"><a href="#/">${icon("arrow-left")}All chapters</a></nav>
      <header class="g-head small">
        <div class="eyebrow">Practice test · ${qs.length} questions</div>
        <h1>${esc(names)}</h1>
        <p class="print-only">Name: ______________________________ &nbsp; Test code: ${seed}</p>
        <div class="toolbar">
          <button type="button" class="btn" id="t-share">${icon("link")}Copy share link</button>
          <button type="button" class="btn" id="t-new">${icon("shuffle")}New questions</button>
          <button type="button" class="btn" id="t-print">${icon("printer")}Print</button>
          <button type="button" class="btn" id="t-print-key">${icon("key")}Print with answer key</button>
        </div>
        <p class="muted small">Test code ${seed}. Anyone with the share link gets these same questions.</p>
      </header>
      <form id="test" class="test" novalidate>
        ${qs
          .map((q, i) => {
            let body = "";
            if (q.type === "mc") {
              body = q.choices
                .map(
                  (t, k) => `<label class="choice"><input type="radio" name="q${i}" value="${k}"/><span class="letter">${"ABCD"[k]}</span><span>${md(t)}</span></label>`
                )
                .join("");
            } else if (q.type === "tf") {
              body = `<label class="choice"><input type="radio" name="q${i}" value="true"/><span class="letter">T</span><span>True</span></label>
                      <label class="choice"><input type="radio" name="q${i}" value="false"/><span class="letter">F</span><span>False</span></label>`;
            } else {
              body = `<label class="num-in"><input type="text" inputmode="decimal" name="q${i}" autocomplete="off" placeholder="Your answer"/>${
                q.unit ? `<span class="unit">${esc(q.unit)}</span>` : ""
              }</label>`;
            }
            return `
            <fieldset class="panel tq" data-i="${i}">
              <legend class="sr-only">Question ${i + 1}</legend>
              <div class="tq-head"><span class="qn">${i + 1}</span><span class="tag">${label(byId(q.chapter))}${q.generated ? " · calculation" : ""}</span></div>
              <p class="qp">${md(q.prompt)}</p>
              <div class="tq-body">${body}</div>
              <div class="feedback" hidden></div>
            </fieldset>`;
          })
          .join("")}
        <div class="submit-row">
          <span class="muted" id="answered">0 of ${qs.length} answered</span>
          <button type="submit" class="btn primary">${icon("check-circle")}Submit and grade</button>
        </div>
      </form>
      <section id="result" hidden></section>
      <section class="answer-key">
        <h2>Answer key · test code ${seed}</h2>
        <ol>${qs.map((q) => `<li>${md(keyText(q))}</li>`).join("")}</ol>
      </section>`;

    const form = app.querySelector("#test");
    const responses = () => qs.map((q, i) => {
      const el = form.elements[`q${i}`];
      if (!el) return "";
      return el.value ?? "";
    });
    form.addEventListener("input", () => {
      const done = responses().filter((v) => v !== "").length;
      app.querySelector("#answered").textContent = `${done} of ${qs.length} answered`;
    });

    app.querySelector("#t-share").addEventListener("click", () => copy(shareUrl, "Share link copied"));
    app.querySelector("#t-new").addEventListener("click", () => {
      location.hash = `#/test?ch=${ids.join(",")}&n=${n}&seed=${GIS.newSeed()}&calc=${calc ? 1 : 0}`;
    });
    app.querySelector("#t-print").addEventListener("click", () => {
      document.body.classList.remove("print-key");
      window.print();
    });
    app.querySelector("#t-print-key").addEventListener("click", () => {
      document.body.classList.add("print-key");
      window.print();
      setTimeout(() => document.body.classList.remove("print-key"), 500);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const resp = responses();
      const blank = resp.filter((v) => v === "").length;
      if (blank && !confirm(`${blank} question${blank > 1 ? "s are" : " is"} blank. Grade anyway?`)) return;
      grade(resp);
    });

    function grade(resp) {
      let right = 0;
      const per = {};
      qs.forEach((q, i) => {
        const ok = GIS.grade(q, resp[i]);
        if (ok) right++;
        per[q.chapter] = per[q.chapter] || { right: 0, total: 0 };
        per[q.chapter].total++;
        if (ok) per[q.chapter].right++;

        const box = form.querySelector(`.tq[data-i="${i}"]`);
        box.classList.add(ok ? "ok" : "miss");
        box.querySelectorAll("input").forEach((x) => (x.disabled = true));
        if (q.type !== "num") {
          const correct = box.querySelector(`input[value="${q.answer}"]`);
          correct?.closest(".choice").classList.add("is-answer");
        }
        const fb = box.querySelector(".feedback");
        fb.hidden = false;
        fb.innerHTML = `<strong>${ok ? icon("check-circle") + "Correct" : icon("x-circle") + (resp[i] === "" ? "Left blank" : "Incorrect")}</strong>
          ${!ok ? `<span class="right-ans">Answer: ${md(keyText(q))}</span>` : ""}
          <p>${md(q.explain)}</p>`;
      });

      const pct = Math.round((right / qs.length) * 100);
      const scores = store.get("scores", {});
      Object.entries(per).forEach(([id, v]) => (scores[id] = Math.round((v.right / v.total) * 100)));
      store.set("scores", scores);

      const res = app.querySelector("#result");
      res.hidden = false;
      res.innerHTML = `
        <div class="panel score">
          <div class="big">${pct}%</div>
          <div>
            <h2>${right} of ${qs.length} correct</h2>
            <table class="breakdown">
              ${Object.entries(per)
                .map(([id, v]) => {
                  const c = byId(id);
                  const p = Math.round((v.right / v.total) * 100);
                  return `<tr><td>${label(c)} · ${esc(c.title)}</td><td class="num">${v.right}/${v.total}</td><td class="bar"><i style="width:${p}%"></i></td><td><a href="#/guide/${id}">Review</a></td></tr>`;
                })
                .join("")}
            </table>
            <div class="toolbar">
              <button type="button" class="btn" id="r-missed">${icon("funnel")}Show only missed</button>
              <button type="button" class="btn primary" id="r-new">${icon("shuffle")}New test, same chapters</button>
            </div>
          </div>
        </div>`;
      form.querySelector(".submit-row").hidden = true;
      res.querySelector("#r-new").addEventListener("click", () => app.querySelector("#t-new").click());
      res.querySelector("#r-missed").addEventListener("click", (e) => {
        const on = form.classList.toggle("only-missed");
        e.currentTarget.innerHTML = on ? `${icon("list")}Show all` : `${icon("funnel")}Show only missed`;
      });
      form.before(res);
      res.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function keyText(q) {
    if (q.type === "mc") return `${"ABCD"[q.answer]}. ${q.choices[q.answer]}`;
    if (q.type === "tf") return q.answer ? "True" : "False";
    const d = q.tol ? Math.max(0, Math.min(4, Math.ceil(-Math.log10(q.tol)))) : 0;
    return `${GIS.fmt(q.answer, d)}${q.unit ? " " + q.unit : ""}${q.tol ? ` (±${q.tol})` : ""}`;
  }

  route();
})();
