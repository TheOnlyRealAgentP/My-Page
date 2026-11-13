/* =========================================================================
   Traverse module UI: map, controls, step-through and computation sheet.
   The math lives in traverse-math.js.
   ========================================================================= */
(function () {
  "use strict";

  const M = window.TraverseMath;
  const $ = (id) => document.getElementById(id);
  const svg = $("map");

  /* ---------- Setup ---------- */
  // Map window in world meters: E 1000–1800, N 2000–2600 → SVG 800 × 600.
  const E0 = 1000, N1 = 2600, VW = 800, VH = 600;
  const BOUNDS = { emin: 1025, emax: 1775, nmin: 2025, nmax: 2575 };
  const DEFAULT_PTS = [
    { e: 1150, n: 2120 },
    { e: 1620, n: 2170 },
    { e: 1700, n: 2440 },
    { e: 1360, n: 2540 },
    { e: 1080, n: 2370 },
  ];
  const DEFAULT_SEED = 7;
  const DEFAULT_CTRL = { angle: 10, mm: 5, ppm: 5, exag: 6 };
  const EXAG = [1, 10, 50, 100, 250, 500, 1000, 2500, 5000];
  const NAMES = "ABCDEFGH";
  const MIN_N = 3, MAX_N = 8;

  const STEPS = ["Measure", "Balance", "Azimuths", "Lat / Dep", "Adjust", "Coordinates"];

  // FGCS (1984) traverse closure standards, as relative precision.
  const CLASSES = [
    [100000, "First order"],
    [50000, "Second order, class I"],
    [20000, "Second order, class II"],
    [10000, "Third order, class I"],
    [5000, "Third order, class II"],
  ];

  const state = {
    pts: DEFAULT_PTS.map((p) => ({ ...p })),
    seed: DEFAULT_SEED,
    noise: null,
    step: 0,
    dragging: -1,
  };
  let u = 1; // SVG units per CSS pixel, so labels stay readable at any size

  /* ---------- Random measurement errors (seeded, so dragging doesn't reshuffle them) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeNoise(seed) {
    const r = mulberry32(seed);
    const g = () => {
      let v = 0;
      while (v === 0) v = r();
      return Math.sqrt(-2 * Math.log(v)) * Math.cos(2 * Math.PI * r());
    };
    return Array.from({ length: MAX_N }, () => ({ a: g(), d: g() }));
  }
  state.noise = makeNoise(state.seed);

  const sigma = () => ({ angleSec: +$("angle").value, distMm: +$("mm").value, distPpm: +$("ppm").value });

  /* ---------- Formatting ---------- */
  const MINUS = "−";
  const num = (x, d = 3) => {
    const s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
    return s.replace("-", MINUS);
  };
  const signed = (x, d = 3) => (x >= 0 ? "+" : MINUS) + Math.abs(x).toFixed(d);
  const sec = (deg, d = 1) => signed(deg * 3600, d) + "″";
  const mmOrM = (m) => (Math.abs(m) < 1 ? `${(m * 1000).toFixed(1)} mm` : `${m.toFixed(3)} m`);

  function dms(deg, dec = 1, wrap = false) {
    const neg = deg < 0;
    const x = Math.abs(deg);
    let d = Math.floor(x);
    const mm = (x - d) * 60;
    let m = Math.floor(mm);
    const f = 10 ** dec;
    let s = Math.round((mm - m) * 60 * f) / f;
    if (s >= 60) { s -= 60; m += 1; }
    if (m >= 60) { m -= 60; d += 1; }
    if (wrap && d >= 360) d -= 360;
    const ss = s.toFixed(dec).padStart(dec ? 3 + dec : 2, "0");
    return `${neg ? MINUS : ""}${d}°${String(m).padStart(2, "0")}′${ss}″`;
  }

  function ratio(p) {
    if (!isFinite(p)) return "exact";
    const r = p >= 100000 ? Math.round(p / 1000) * 1000 : Math.round(p / 100) * 100;
    return "1 : " + r.toLocaleString("en-US");
  }
  const grade = (p) => (CLASSES.find(([k]) => p >= k) || [0, null])[1];

  /* ---------- Geometry helpers ---------- */
  const D2R = Math.PI / 180;
  const X = (e) => e - E0;
  const Y = (n) => N1 - n;
  const dir = (az) => [Math.sin(az * D2R), -Math.cos(az * D2R)]; // azimuth → SVG unit vector
  const xy = (x, y) => `${x.toFixed(2)},${y.toFixed(2)}`;

  function clampPt(p) {
    const r1 = (v) => Math.round(v * 10) / 10;
    return {
      e: r1(Math.min(BOUNDS.emax, Math.max(BOUNDS.emin, p.e))),
      n: r1(Math.min(BOUNDS.nmax, Math.max(BOUNDS.nmin, p.n))),
    };
  }

  function toWorld(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { e: q.x + E0, n: N1 - q.y };
  }

  function measureScale() {
    const w = svg.getBoundingClientRect().width || VW;
    u = Math.min(2.4, Math.max(0.9, VW / w));
  }

  /* ---------- Map ---------- */
  function text(x, y, str, cls, opts = {}) {
    const fs = (opts.size || 11) * u;
    const anchor = opts.anchor || "middle";
    // Keep labels inside the map: estimate width (monospace ≈ 0.6 em per char) and shift if needed.
    const w = String(str).length * 0.6 * fs, pad = 4 * u;
    const left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
    if (left < pad) x += pad - left;
    else if (left + w > VW - pad) x -= left + w - (VW - pad);
    y = Math.min(VH - fs / 2 - pad, Math.max(fs / 2 + pad, y));
    return `<text class="halo ${cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs.toFixed(1)}"
      stroke-width="${(3 * u).toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle">${str}</text>`;
  }

  function anchorFor(dx) {
    return dx > 0.35 ? "start" : dx < -0.35 ? "end" : "middle";
  }

  function chevron(mx, my, az, cls) {
    const [dx, dy] = dir(az);
    const [px, py] = [-dy, dx];
    const s = 6 * u;
    const tip = [mx + dx * s, my + dy * s];
    const b1 = [mx - dx * s * 0.5 + px * s * 0.8, my - dy * s * 0.5 + py * s * 0.8];
    const b2 = [mx - dx * s * 0.5 - px * s * 0.8, my - dy * s * 0.5 - py * s * 0.8];
    return `<path class="${cls}" d="M${xy(...b1)}L${xy(...tip)}L${xy(...b2)}" fill="none" stroke-width="${1.6 * u}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  function drawMap(r, k) {
    const P = state.pts, n = P.length, step = state.step;
    const out = [];
    const sw = 1.7 * u;

    // Grid, north arrow, scale bar
    out.push('<g class="grid">');
    // 100 m grid lines, labeled every 200 m so labels stay clear of stations on small screens
    for (let e = 1100; e <= 1700; e += 100) {
      out.push(`<line x1="${X(e)}" y1="0" x2="${X(e)}" y2="${VH}" stroke-width="${u}"/>`);
      if (e % 200 === 0) out.push(`<text x="${X(e) + 4 * u}" y="${VH - 8 * u}" font-size="${9.5 * u}">${e} E</text>`);
    }
    for (let nn = 2100; nn <= 2500; nn += 100) {
      out.push(`<line x1="0" y1="${Y(nn)}" x2="${VW}" y2="${Y(nn)}" stroke-width="${u}"/>`);
      if (nn % 200 === 0) out.push(`<text x="${4 * u}" y="${Y(nn) - 5 * u}" font-size="${9.5 * u}">${nn} N</text>`);
    }
    out.push("</g>");
    const na = [24 * u, 30 * u];
    out.push(
      `<path d="M${xy(na[0], na[1] - 14 * u)}L${xy(na[0] + 6 * u, na[1] + 6 * u)}L${xy(na[0], na[1] + 2 * u)}L${xy(na[0] - 6 * u, na[1] + 6 * u)}Z" fill="rgba(232,237,243,.6)"/>`,
      text(na[0], na[1] + 16 * u, "N", "lbl-dim", { size: 10 })
    );
    const sb = [VW - 14 * u - 100, VH - 16 * u];
    out.push(
      `<path d="M${xy(sb[0], sb[1] - 4 * u)}V${sb[1]}H${sb[0] + 100}V${sb[1] - 4 * u}" fill="none" stroke="rgba(232,237,243,.55)" stroke-width="${1.2 * u}"/>`,
      text(sb[0] + 50, sb[1] - 10 * u, "100 m", "lbl-dim", { size: 10 })
    );

    // True traverse
    const poly = P.map((p) => xy(X(p.e), Y(p.n))).join(" ");
    if (step <= 2) {
      out.push(`<polygon class="truth fill" points="${poly}" stroke-width="${sw}" stroke-linejoin="round"/>`);
    } else {
      out.push(
        `<polygon class="truth ref" points="${poly}" stroke-width="${1.2 * u}" stroke-dasharray="${5 * u} ${4 * u}" stroke-linejoin="round"/>`
      );
    }

    // Per-leg geometry
    const legs = P.map((p, i) => {
      const q = P[(i + 1) % n];
      const az = M.azimuth(p, q);
      const outward = r.ccw ? az + 90 : az - 90;
      return { p, q, az, outward, mx: (X(p.e) + X(q.e)) / 2, my: (Y(p.n) + Y(q.n)) / 2, len: M.distance(p, q) };
    });

    // Direction of travel
    if (step <= 2) legs.forEach((L) => out.push(chevron(L.mx, L.my, L.az, "truth")));

    // Step 1–2: interior angle arcs + distances
    if (step <= 1) {
      P.forEach((p, i) => {
        const back = M.azimuth(p, P[(i - 1 + n) % n]);
        const fore = legs[i].az;
        const th = r.trueAngles[i];
        const R = Math.min(26 * u, 0.3 * Math.min(legs[i].len, legs[(i - 1 + n) % n].len));
        const [bx, by] = dir(back), [fx, fy] = dir(fore);
        const cx = X(p.e), cy = Y(p.n);
        const sweep = r.ccw ? 1 : 0;
        const large = th > 180 ? 1 : 0;
        out.push(
          `<path class="arc" stroke-width="${1.2 * u}" d="M${xy(cx, cy)}L${xy(cx + bx * R, cy + by * R)}A${R},${R} 0 ${large} ${sweep} ${xy(cx + fx * R, cy + fy * R)}Z"/>`
        );
        const mid = r.ccw ? back + th / 2 : back - th / 2;
        const [mx, my] = dir(mid);
        const val = step === 0 ? r.measAngles[i] : r.balAngles[i];
        out.push(text(cx + mx * (R + 8 * u), cy + my * (R + 8 * u), dms(val, 0), "lbl-acc", { anchor: anchorFor(mx), size: 10.5 }));
      });
    }
    if (step === 0) {
      legs.forEach((L, i) => {
        const [ox, oy] = dir(L.outward);
        out.push(text(L.mx + ox * 14 * u, L.my + oy * 14 * u, `${r.measDist[i].toFixed(3)} m`, "lbl", { anchor: anchorFor(ox), size: 10.5 }));
      });
    }

    // Step 3: north ticks + azimuth labels
    if (step === 2) {
      P.forEach((p) =>
        out.push(
          `<line x1="${X(p.e)}" y1="${Y(p.n)}" x2="${X(p.e)}" y2="${Y(p.n) - 22 * u}" stroke="rgba(232,237,243,.45)" stroke-width="${u}" stroke-dasharray="${2 * u} ${2 * u}"/>`
        )
      );
      legs.forEach((L, i) => {
        const [ox, oy] = dir(L.outward);
        const label = (i === 0 ? "known " : "") + dms(r.az[i], 0, true);
        out.push(text(L.mx + ox * 14 * u, L.my + oy * 14 * u, label, i === 0 ? "lbl" : "lbl-acc", { anchor: anchorFor(ox), size: 10.5 }));
      });
    }

    // Exaggerated estimate positions, relative to the truth
    const disp = (est, i) => {
      const t = P[i % n];
      return [X(t.e + k * (est.e - t.e)), Y(t.n + k * (est.n - t.n))];
    };

    // Step 4: lat/dep components + unadjusted traverse + misclosure
    if (step === 3) {
      legs.forEach((L) => {
        const c = [X(L.p.e), Y(L.q.n)];
        out.push(
          `<path class="latdep" d="M${xy(X(L.p.e), Y(L.p.n))}L${xy(...c)}L${xy(X(L.q.e), Y(L.q.n))}" fill="none" stroke-width="${1.2 * u}" stroke-dasharray="${3 * u} ${3 * u}" opacity=".75"/>`
        );
      });
    }
    if (step >= 3 && step <= 4) {
      const rawPts = r.raw.map((p, i) => disp(p, i));
      out.push(
        `<polyline class="raw" points="${rawPts.map((p) => xy(...p)).join(" ")}" stroke-width="${sw}" stroke-linejoin="round" opacity="${step === 4 ? 0.55 : 1}"/>`
      );
      rawPts.slice(1, n).forEach((p) => out.push(`<circle cx="${p[0]}" cy="${p[1]}" r="${2.5 * u}" style="fill:var(--raw)"/>`));
      if (r.linMisclosure > 1e-9) {
        const end = rawPts[n], a = rawPts[0];
        out.push(
          `<line class="mis" x1="${end[0]}" y1="${end[1]}" x2="${a[0]}" y2="${a[1]}" stroke-width="${2 * u}" stroke-dasharray="${4 * u} ${3 * u}"/>`,
          `<circle cx="${end[0]}" cy="${end[1]}" r="${3.5 * u}" style="fill:var(--mis)"/>`
        );
        const dx = end[0] - a[0], dy = end[1] - a[1], dl = Math.hypot(dx, dy) || 1;
        out.push(
          text(end[0] + (dx / dl) * 14 * u, end[1] + (dy / dl) * 14 * u, `misclosure ${mmOrM(r.linMisclosure)}`, "lbl-mis", {
            anchor: anchorFor(dx / dl),
            size: 10.5,
          })
        );
      }
    }

    // Step 5–6: adjusted traverse (+ corrections in step 5)
    if (step >= 4) {
      const adjPts = r.adj.slice(0, n).map((p, i) => disp(p, i));
      out.push(
        `<polygon class="adj" points="${adjPts.map((p) => xy(...p)).join(" ")}" stroke-width="${sw}" stroke-linejoin="round"/>`
      );
      if (step === 4) {
        for (let i = 1; i <= n; i++) {
          const a = disp(r.raw[i], i), b = disp(r.adj[i], i);
          if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 3 * u) continue;
          const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
          const h = 7 * u;
          out.push(
            `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" style="stroke:var(--text)" stroke-width="${1.4 * u}" opacity=".9"/>`,
            `<path d="M${xy(b[0] - h * Math.cos(ang - 0.45), b[1] - h * Math.sin(ang - 0.45))}L${xy(...b)}L${xy(b[0] - h * Math.cos(ang + 0.45), b[1] - h * Math.sin(ang + 0.45))}" fill="none" style="stroke:var(--text)" stroke-width="${1.4 * u}" opacity=".9" stroke-linecap="round"/>`
          );
        }
      }
      if (step === 5) {
        adjPts.forEach((p, i) => {
          if (i === 0) return;
          const t = P[i];
          out.push(
            `<line x1="${X(t.e)}" y1="${Y(t.n)}" x2="${p[0]}" y2="${p[1]}" style="stroke:var(--adj)" stroke-width="${u}" opacity=".5"/>`,
            `<circle cx="${p[0]}" cy="${p[1]}" r="${3 * u}" style="fill:var(--adj)"/>`
          );
        });
      }
    }

    // Station names, pushed outward from the polygon
    P.forEach((p, i) => {
      const back = M.azimuth(p, P[(i - 1 + n) % n]);
      const bis = (r.ccw ? back + r.trueAngles[i] / 2 : back - r.trueAngles[i] / 2) + 180;
      const [ox, oy] = dir(bis);
      let label = NAMES[i];
      if (step === 5 && i > 0) label += `  ${(r.posError[i] * 1000).toFixed(0)} mm`;
      out.push(text(X(p.e) + ox * 18 * u, Y(p.n) + oy * 18 * u, label, "lbl", { anchor: anchorFor(ox), size: 12 }));
    });

    $("layers").innerHTML = out.join("");
  }

  function drawHandles() {
    const g = $("handles");
    const P = state.pts;
    if (g.children.length !== P.length) {
      g.innerHTML = P.map(
        (_, i) =>
          `<g class="stn${i === 0 ? " ctrl" : ""}" data-i="${i}" tabindex="0" role="button"><circle class="hit"/><circle class="ring"/><circle class="dot"/></g>`
      ).join("");
    }
    [...g.children].forEach((h, i) => {
      const p = P[i];
      h.setAttribute("transform", `translate(${X(p.e)} ${Y(p.n)})`);
      h.setAttribute("aria-label", `Station ${NAMES[i]}, ${p.e.toFixed(1)} E, ${p.n.toFixed(1)} N. Arrow keys move it.`);
      h.classList.toggle("dragging", i === state.dragging);
      h.querySelector(".hit").setAttribute("r", 18 * u);
      const ring = h.querySelector(".ring");
      ring.setAttribute("r", 10 * u);
      ring.setAttribute("stroke-width", 1.5 * u);
      const dot = h.querySelector(".dot");
      dot.setAttribute("r", (i === 0 ? 6.5 : 5.5) * u);
      dot.setAttribute("stroke-width", 2 * u);
    });
  }

  function drawLegend(k) {
    const s = state.step;
    const item = (color, label, dash) =>
      `<span><i class="${dash ? "dash" : ""}" style="border-color:${color}"></i>${label}</span>`;
    const items = [];
    if (s <= 2) {
      items.push(item("var(--truth)", "Traverse"));
      if (s <= 1) items.push(item("var(--accent)", s === 0 ? "Measured angle" : "Balanced angle"));
      if (s === 2) items.push(item("var(--accent)", "Azimuth"));
    } else {
      items.push(item("rgba(232,237,243,.4)", "True positions", true));
      if (s === 3) items.push(item("var(--latdep)", "Latitude / departure", true));
      if (s <= 4) items.push(item("var(--raw)", "Unadjusted"));
      if (s === 3) items.push(item("var(--mis)", "Misclosure", true));
      if (s >= 4) items.push(item("var(--adj)", "Adjusted"));
      items.push(`<span>Errors drawn ×${k.toLocaleString("en-US")}</span>`);
    }
    $("legend").innerHTML = items.join("");
  }

  /* ---------- Stats + steps ---------- */
  function drawStats(r) {
    const g = grade(r.precision);
    $("stats").innerHTML = `
      <div class="stat"><div class="k">Angular misclosure</div><div class="v">${sec(r.angMisclosure)}</div><div class="s">${r.n} angles</div></div>
      <div class="stat"><div class="k">Linear misclosure</div><div class="v">${mmOrM(r.linMisclosure)}</div><div class="s">P = ${r.perimeter.toFixed(1)} m</div></div>
      <div class="stat ${g ? "good" : "bad"}"><div class="k">Precision</div><div class="v">${ratio(r.precision)}</div><div class="s">${g || "Below 1 : 5,000"}</div></div>`;
  }

  function vals(rows) {
    return `<dl class="vals">${rows.map(([k, v, c]) => `<dt>${k}</dt><dd${c ? ` class="${c}"` : ""}>${v}</dd>`).join("")}</dl>`;
  }

  const STEP_HTML = [
    // 1. Measure
    (r) => `
      <h2>1. Field measurements</h2>
      <p>A closed loop traverse starts and ends on the same station. At each of the ${r.n} stations the crew measures the
      interior angle, and along each leg they measure the horizontal distance. Every reading carries a small random error.</p>
      <p>Station A has known coordinates, and the azimuth of leg A→B is known. Everything else gets computed from the field
      measurements.</p>
      ${vals([
        ["Stations / legs", r.n],
        ["Direction of travel", r.ccw ? "counterclockwise" : "clockwise"],
        ["Measured perimeter", `${r.perimeter.toFixed(3)} m`],
      ])}
      <div class="note">Drag the stations to change the shape. <b>Measure again</b> draws a new set of random errors.</div>`,

    // 2. Balance angles
    (r) => `
      <h2>2. Balance the angles</h2>
      <p>The interior angles of any closed polygon add up to (n − 2) × 180°. The measured angles won't add up exactly,
      and the difference is the <em>angular misclosure</em>. With no reason to trust one angle more than another,
      each angle gets an equal share of the correction.</p>
      <div class="formula">Σθ = (n − 2) × 180° = (${r.n} − 2) × 180° = ${r.angleSumTheory}°<br>
      correction = −(Σθ<sub>meas</sub> − ${r.angleSumTheory}°) ÷ ${r.n}</div>
      ${vals([
        ["Sum of measured angles", dms(r.angleSumMeas)],
        ["Required sum", dms(r.angleSumTheory)],
        ["Angular misclosure", sec(r.angMisclosure), Math.abs(r.angMisclosure) > 0 ? "hot" : ""],
        ["Correction per angle", sec(r.angCorrection)],
      ])}`,

    // 3. Azimuths
    (r) => `
      <h2>3. Carry the azimuths around</h2>
      <p>Start from the known azimuth of A→B. At each station, reverse the incoming azimuth by adding 180°, then turn
      through the balanced interior angle to get the outgoing leg.</p>
      <p>The stations run ${r.ccw ? "counterclockwise" : "clockwise"}, so the interior angles are angles to the
      ${r.ccw ? "right" : "left"} and get ${r.ccw ? "added" : "subtracted"}.</p>
      <div class="formula">Az<sub>out</sub> = Az<sub>in</sub> + 180° ${r.ccw ? "+" : "−"} θ<br>
      <span class="c">then add or subtract 360° to stay between 0° and 360°</span></div>
      ${vals([
        ["Az A→B (known)", dms(r.az[0], 1, true)],
        ["Az A→B, carried around the loop", dms(r.azCheck, 1, true), "ok"],
      ])}
      <div class="note">Getting the starting azimuth back checks your arithmetic. It only works because the angles were
      balanced first.</div>`,

    // 4. Latitudes and departures
    (r) => {
      const g = grade(r.precision);
      return `
      <h2>4. Latitudes and departures</h2>
      <p>Split each leg into its north–south component (latitude) and east–west component (departure). Around a closed
      loop, both should add up to zero. They won't, because of distance errors and the angle error that balancing
      couldn't remove. What's left over is the <em>linear misclosure</em>.</p>
      <div class="formula">Lat = D · cos Az &nbsp;&nbsp; Dep = D · sin Az<br>
      e = √(ΣLat² + ΣDep²)<br>
      precision = 1 : (P ÷ e)</div>
      ${vals([
        ["ΣLat", `${signed(r.sumLat)} m`],
        ["ΣDep", `${signed(r.sumDep)} m`],
        ["Linear misclosure e", mmOrM(r.linMisclosure), "hot"],
        ["Relative precision", ratio(r.precision), g ? "ok" : "hot"],
      ])}
      <div class="note">FGCS (1984) traverse closure standards:
        <ul>${CLASSES.map(([k, name]) => `<li${name === g ? ' style="color:var(--accent-2)"' : ""}>${name}: 1 : ${k.toLocaleString("en-US")}</li>`).join("")}</ul>
      </div>`;
    },

    // 5. Compass rule
    (r) => `
      <h2>5. Compass (Bowditch) rule</h2>
      <p>The compass rule spreads the misclosure over the legs in proportion to their length, so a long leg takes a
      bigger share of the correction than a short one. It suits traverses where angles and distances were measured
      with about the same precision.</p>
      <div class="formula">C<sub>Lat,i</sub> = −ΣLat × D<sub>i</sub> ÷ P<br>
      C<sub>Dep,i</sub> = −ΣDep × D<sub>i</sub> ÷ P</div>
      ${vals([
        ["ΣLat to remove", `${signed(r.sumLat)} m`],
        ["ΣDep to remove", `${signed(r.sumDep)} m`],
        ["Perimeter P", `${r.perimeter.toFixed(3)} m`],
        ["Σ adjusted Lat", `${num(r.adjLat.reduce((a, b) => a + b, 0))} m`, "ok"],
        ["Σ adjusted Dep", `${num(r.adjDep.reduce((a, b) => a + b, 0))} m`, "ok"],
      ])}
      <div class="note">On the map, the arrows show each station moving from its unadjusted to its adjusted position.</div>`,

    // 6. Coordinates
    (r) => {
      let worst = 1;
      r.posError.forEach((e, i) => { if (e > r.posError[worst]) worst = i; });
      return `
      <h2>6. Adjusted coordinates</h2>
      <p>Starting from the known coordinates of A, add each adjusted latitude and departure in turn. The last leg lands
      exactly back on A.</p>
      <p>Now compare the adjusted stations with their true positions. The loop closes, but the stations are still off by
      a little. An adjustment makes a traverse consistent with itself. It can't remove all the error.</p>
      <div class="formula">N<sub>i+1</sub> = N<sub>i</sub> + Lat′<sub>i</sub><br>
      E<sub>i+1</sub> = E<sub>i</sub> + Dep′<sub>i</sub></div>
      ${vals([
        ["Station A (fixed)", `${r.adj[0].n.toFixed(3)} N, ${r.adj[0].e.toFixed(3)} E`],
        ["Closing back on A", `${num(r.adj[r.n].n - r.adj[0].n)}, ${num(r.adj[r.n].e - r.adj[0].e)} m`, "ok"],
        ["Largest error vs. true", `${(r.posError[worst] * 1000).toFixed(1)} mm at ${NAMES[worst]}`],
      ])}`;
    },
  ];

  function drawTabs() {
    $("tabs").innerHTML = STEPS.map(
      (s, i) =>
        `<button type="button" class="tab" role="tab" aria-selected="${i === state.step}" data-step="${i}"><span class="n">${i + 1}</span>${s}</button>`
    ).join("");
    $("prev").disabled = state.step === 0;
    $("next").disabled = state.step === STEPS.length - 1;
  }

  /* ---------- Computation sheet ---------- */
  function table(title, sub, cols, rows, sum) {
    const s = state.step;
    const hl = (c) => (c.s && c.s.includes(s) ? ' class="hl"' : "");
    const on = cols.some((c) => c.s && c.s.includes(s));
    const tr = (cells, cls = "") =>
      `<tr${cls ? ` class="${cls}"` : ""}>${cells.map((v, j) => `<td${hl(cols[j])}>${v}</td>`).join("")}</tr>`;
    return `
      <div class="panel sheet-card${on ? " on" : ""}">
        <h3>${title}<span>${sub}</span></h3>
        <div class="tbl-wrap"><table>
          <thead><tr>${cols.map((c) => `<th${hl(c)}>${c.h}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((r) => tr(r)).join("")}${sum ? tr(sum, "sum") : ""}</tbody>
        </table></div>
      </div>`;
  }

  function drawSheet(r) {
    const n = r.n;
    const leg = (i) => `${NAMES[i]}→${NAMES[(i + 1) % n]}`;
    const html = [
      table(
        "Angles",
        "steps 1–2",
        [{ h: "Station" }, { h: "Measured", s: [0, 1] }, { h: "Correction", s: [1] }, { h: "Balanced", s: [1, 2] }],
        r.measAngles.map((a, i) => [NAMES[i], dms(a), sec(r.angCorrection), dms(r.balAngles[i])]),
        ["Σ", dms(r.angleSumMeas), sec(-r.angMisclosure), dms(r.angleSumTheory)]
      ),
      table(
        "Legs",
        "steps 1, 3–4",
        [
          { h: "Leg" },
          { h: "Distance", s: [0, 3] },
          { h: "Azimuth", s: [2, 3] },
          { h: "Latitude", s: [3] },
          { h: "Departure", s: [3] },
        ],
        r.az.map((a, i) => [leg(i), r.measDist[i].toFixed(3), dms(a, 1, true), num(r.lat[i]), num(r.dep[i])]),
        ["Σ", r.perimeter.toFixed(3), "", signed(r.sumLat), signed(r.sumDep)]
      ),
      table(
        "Compass rule",
        "step 5",
        [
          { h: "Leg" },
          { h: "Corr. Lat", s: [4] },
          { h: "Corr. Dep", s: [4] },
          { h: "Adj. Lat", s: [4, 5] },
          { h: "Adj. Dep", s: [4, 5] },
        ],
        r.az.map((_, i) => [leg(i), signed(r.corrLat[i]), signed(r.corrDep[i]), num(r.adjLat[i]), num(r.adjDep[i])]),
        [
          "Σ",
          signed(r.corrLat.reduce((a, b) => a + b, 0)),
          signed(r.corrDep.reduce((a, b) => a + b, 0)),
          num(r.adjLat.reduce((a, b) => a + b, 0)),
          num(r.adjDep.reduce((a, b) => a + b, 0)),
        ]
      ),
      table(
        "Coordinates",
        "step 6",
        [{ h: "Station" }, { h: "Northing", s: [5] }, { h: "Easting", s: [5] }, { h: "Error vs. true", s: [5] }],
        [
          ...r.adj.slice(0, n).map((p, i) => [NAMES[i], p.n.toFixed(3), p.e.toFixed(3), i ? `${(r.posError[i] * 1000).toFixed(1)} mm` : "fixed"]),
          [`${NAMES[0]} (closing)`, r.adj[n].n.toFixed(3), r.adj[n].e.toFixed(3), ""],
        ]
      ),
    ];
    $("sheet").innerHTML = html.join("");
  }

  /* ---------- Render loop ---------- */
  let queued = false;
  function render() {
    queued = false;
    const r = M.reduce(state.pts, state.noise, sigma());
    const k = EXAG[+$("exag").value];
    drawMap(r, k);
    drawHandles();
    drawLegend(k);
    drawStats(r);
    $("step-body").innerHTML = STEP_HTML[state.step](r);
    drawSheet(r);
    $("warn").hidden = !M.selfIntersects(state.pts);
    $("stn-count").textContent = state.pts.length;
    $("stn-minus").disabled = state.pts.length <= MIN_N;
    $("stn-plus").disabled = state.pts.length >= MAX_N;
  }
  const schedule = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(render);
    }
  };

  function setStep(i) {
    state.step = Math.max(0, Math.min(STEPS.length - 1, i));
    try {
      history.replaceState(null, "", `#step-${state.step + 1}`);
    } catch (_) {}
    drawTabs();
    render();
  }

  /* ---------- Controls ---------- */
  function syncOutputs() {
    $("o-angle").textContent = `±${$("angle").value}″`;
    $("o-mm").textContent = `±${$("mm").value} mm`;
    $("o-ppm").textContent = `±${$("ppm").value} ppm`;
    $("o-exag").textContent = `×${EXAG[+$("exag").value].toLocaleString("en-US")}`;
    document.querySelectorAll('input[type="range"]').forEach((el) => {
      el.style.setProperty("--fill", `${((el.value - el.min) / (el.max - el.min)) * 100}%`);
    });
  }

  ["angle", "mm", "ppm", "exag"].forEach((id) =>
    $(id).addEventListener("input", () => {
      syncOutputs();
      schedule();
    })
  );

  $("remeasure").addEventListener("click", () => {
    state.seed += 1;
    state.noise = makeNoise(state.seed);
    schedule();
  });

  $("reset").addEventListener("click", () => {
    state.pts = DEFAULT_PTS.map((p) => ({ ...p }));
    state.seed = DEFAULT_SEED;
    state.noise = makeNoise(state.seed);
    Object.entries(DEFAULT_CTRL).forEach(([id, v]) => ($(id).value = v));
    syncOutputs();
    schedule();
  });

  $("stn-minus").addEventListener("click", () => {
    if (state.pts.length > MIN_N) {
      state.pts.pop();
      schedule();
    }
  });

  $("stn-plus").addEventListener("click", () => {
    const P = state.pts, n = P.length;
    if (n >= MAX_N) return;
    // Split the longest leg, nudging the new station outward so it isn't a straight 180° angle.
    let best = 0, bestLen = -1;
    P.forEach((p, i) => {
      const L = M.distance(p, P[(i + 1) % n]);
      if (L > bestLen) { bestLen = L; best = i; }
    });
    const a = P[best], b = P[(best + 1) % n];
    const dx = b.e - a.e, dy = b.n - a.n;
    const ccw = M.signedArea2(P) > 0;
    const nx = ccw ? dy : -dy, ny = ccw ? -dx : dx;
    const len = Math.hypot(nx, ny) || 1;
    const off = 0.18 * bestLen;
    P.splice(best + 1, 0, clampPt({ e: (a.e + b.e) / 2 + (nx / len) * off, n: (a.n + b.n) / 2 + (ny / len) * off }));
    schedule();
  });

  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".tab");
    if (b) setStep(+b.dataset.step);
  });
  $("tabs").addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      setStep(state.step + (e.key === "ArrowRight" ? 1 : -1));
      $("tabs").querySelector('[aria-selected="true"]')?.focus();
    }
  });
  $("prev").addEventListener("click", () => setStep(state.step - 1));
  $("next").addEventListener("click", () => setStep(state.step + 1));

  /* ---------- Dragging ---------- */
  svg.addEventListener("pointerdown", (e) => {
    const h = e.target.closest(".stn");
    if (!h) return;
    state.dragging = +h.dataset.i;
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
    schedule();
  });
  svg.addEventListener("pointermove", (e) => {
    if (state.dragging < 0) return;
    state.pts[state.dragging] = clampPt(toWorld(e));
    schedule();
  });
  const endDrag = () => {
    if (state.dragging < 0) return;
    state.dragging = -1;
    schedule();
  };
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);

  svg.addEventListener("keydown", (e) => {
    const h = e.target.closest(".stn");
    if (!h) return;
    const moves = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    const i = +h.dataset.i, step = e.shiftKey ? 25 : 5;
    const p = state.pts[i];
    state.pts[i] = clampPt({ e: p.e + m[0] * step, n: p.n + m[1] * step });
    render();
    $("handles").children[i]?.focus();
  });

  window.addEventListener("resize", () => {
    measureScale();
    schedule();
  });

  /* ---------- Start ---------- */
  const fromHash = /^#step-(\d)$/.exec(location.hash);
  if (fromHash) state.step = Math.max(0, Math.min(STEPS.length - 1, +fromHash[1] - 1));
  measureScale();
  syncOutputs();
  drawTabs();
  render();
})();
