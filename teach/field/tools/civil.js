/* Earthwork, grid/ground, hydraulics and measurement error */
(function (F) {
  "use strict";
  const { fmt } = F;

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "earthwork",
    group: "Earthwork & grading",
    title: "Earthwork volumes (average end area)",
    icon: "cube",
    blurb: "Cut and fill volumes between cross sections, with a running mass total.",
    inputs: [
      {
        id: "secs",
        label: "Cross sections",
        type: "rows",
        cols: [
          { id: "sta", label: "Station", type: "station" },
          { id: "cut", label: "Cut area", type: "num", unit: "A" },
          { id: "fill", label: "Fill area", type: "num", unit: "A" },
        ],
        rows: [
          ["10+00", "120", "0"],
          ["11+00", "185", "12"],
          ["12+00", "96", "64"],
          ["13+00", "20", "148"],
          ["14+00", "0", "210"],
        ],
      },
    ],
    compute(v, U) {
      const S = v.secs.filter((s) => isFinite(s.sta)).map((s) => ({ sta: s.sta, cut: isFinite(s.cut) ? s.cut : 0, fill: isFinite(s.fill) ? s.fill : 0 }));
      if (S.length < 2) return { error: "Enter at least two cross sections." };
      for (let i = 1; i < S.length; i++) if (S[i].sta <= S[i - 1].sta) return { error: "Stations must increase down the table." };
      const conv = U.L === "ft" ? 27 : 1;
      let tc = 0, tf = 0, mass = 0;
      const rows = S.map((s, i) => {
        if (i === 0) return [F.station(s.sta, U.L), fmt(s.cut, 1), fmt(s.fill, 1), "", "", fmt(0, 1)];
        const p = S[i - 1];
        const L = s.sta - p.sta;
        const vc = (L * (p.cut + s.cut)) / 2 / conv, vf = (L * (p.fill + s.fill)) / 2 / conv;
        tc += vc; tf += vf; mass += vc - vf;
        return [F.station(s.sta, U.L), fmt(s.cut, 1), fmt(s.fill, 1), fmt(vc, 1), fmt(vf, 1), fmt(mass, 1)];
      });
      const p = S[0], q = S[1], L1 = q.sta - p.sta;
      return {
        outputs: [
          { id: "cut", label: "Total cut", value: tc, d: 1, unit: U.V, tol: 0.5 },
          { id: "fill", label: "Total fill", value: tf, d: 1, unit: U.V, tol: 0.5 },
          { id: "net", label: "Net (cut − fill)", value: tc - tf, d: 1, unit: U.V, tol: 0.5, text: `${fmt(Math.abs(tc - tf), 1)} ${U.V} ${tc >= tf ? "excess cut (waste)" : "short (borrow needed)"}` },
        ],
        steps: [
          `Volume between two sections = L × (A₁ + A₂)/2${U.L === "ft" ? ", then ÷ 27 to turn ft³ into yd³" : ""}.`,
          `First segment cut: ${fmt(L1, 2)} × (${fmt(p.cut, 1)} + ${fmt(q.cut, 1)})/2${U.L === "ft" ? " ÷ 27" : ""} = ${fmt((L1 * (p.cut + q.cut)) / 2 / conv, 1)} ${U.V}`,
          `Add up the segments: cut ${fmt(tc, 1)} ${U.V}, fill ${fmt(tf, 1)} ${U.V}.`,
          `The last column is the running total of cut minus fill (the mass diagram ordinate).`,
        ],
        table: { head: ["Station", `Cut area (${U.A})`, `Fill area (${U.A})`, `Cut vol (${U.V})`, `Fill vol (${U.V})`, `Mass (${U.V})`], rows },
      };
    },
    explain: [
      "The average end area method treats the earth between two cross sections as a prism with the average of the two end areas. It is the standard way to estimate earthwork from road or channel cross sections.",
      "It overestimates a little when one end area is much smaller than the other. The prismoidal formula corrects for that.",
    ],
    formulas: ["V = L (A₁ + A₂) / 2", "1 yd³ = 27 ft³"],
    field: "Dug soil swells and compacted fill shrinks, so a cubic yard of cut doesn't make a cubic yard of fill. Apply shrink and swell factors from the geotech report before balancing.",
    practice(r, U) {
      const rows = [];
      let c = r.int(50, 200), f = 0;
      for (let i = 0; i < 4; i++) {
        rows.push([F.station(1000 + i * 100, U.L), String(c), String(f)]);
        c = Math.max(0, c + r.int(-90, 40));
        f = Math.max(0, f + r.int(-10, 80));
      }
      return { values: { secs: rows }, ask: ["cut", "fill"] };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "grid-ground",
    group: "Grid & ground",
    title: "Grid and ground distances",
    icon: "globe-hemisphere-west",
    blurb: "Combined scale factor from the grid scale factor and elevation.",
    inputs: [
      { id: "k", label: "Grid scale factor k (from the projection or software)", type: "num", value: "0.99994521" },
      { id: "h", label: "Ellipsoid height h", type: "num", value: "4480", unit: "L", help: "h = orthometric height H + geoid height N. In Utah N is about −50 ft (−15 m)." },
      { id: "d", label: "Distance", type: "num", value: "2500.000", unit: "L" },
      { id: "dir", label: "Convert", type: "select", value: "g2grid", options: [["g2grid", "Ground → grid"], ["grid2g", "Grid → ground"]] },
    ],
    compute(v, U) {
      if (![v.k, v.h, v.d].every(isFinite)) return { error: "Fill in every field." };
      const R = U.earthR;
      const ef = R / (R + v.h);
      const cf = v.k * ef;
      const out = v.dir === "g2grid" ? v.d * cf : v.d / cf;
      const ppm = (cf - 1) * 1e6;
      return {
        outputs: [
          { id: "ef", label: "Elevation factor", value: ef, d: 8, tol: 1e-7 },
          { id: "cf", label: "Combined factor", value: cf, d: 8, tol: 1e-7 },
          { id: "out", label: v.dir === "g2grid" ? "Grid distance" : "Ground distance", value: out, d: 3, unit: U.L, tol: 0.002 },
          { id: "diff", label: "Difference", value: out - v.d, d: 3, unit: U.L, tol: 0.002, text: `${fmt(out - v.d, 3)} ${U.L} (${fmt(ppm, 1)} ppm)` },
        ],
        steps: [
          `Elevation factor = R ÷ (R + h) = ${fmt(R, 0)} ÷ (${fmt(R, 0)} + ${fmt(v.h, 1)}) = ${ef.toFixed(8)} (R = mean Earth radius)`,
          `Combined factor = k × elevation factor = ${v.k} × ${ef.toFixed(8)} = ${cf.toFixed(8)}`,
          v.dir === "g2grid" ? `Grid = ground × CF = ${fmt(v.d)} × ${cf.toFixed(8)} = ${fmt(out)}` : `Ground = grid ÷ CF = ${fmt(v.d)} ÷ ${cf.toFixed(8)} = ${fmt(out)}`,
        ],
      };
    },
    explain: [
      "State Plane and UTM coordinates live on a flat grid. Distances measured on the ground are a little different, for two reasons: the projection stretches or shrinks distances (the grid scale factor k), and the ground is above the ellipsoid (the elevation factor).",
      "At Utah elevations the elevation factor alone is about 200 ppm, or 0.2 ft per 1,000 ft. That is large enough to bust a survey if it's ignored.",
    ],
    formulas: ["EF = R / (R + h)", "CF = k × EF", "Grid = Ground × CF"],
    field: "Use the ellipsoid height, not the orthometric height (elevation), for the elevation factor. The geoid height N links them: h = H + N.",
    practice(r, U) {
      return {
        values: { k: (0.9999 + r.float(-0.0001, 0.0001, 8)).toFixed(8), h: String(r.int(1000, 2000) * (U.L === "ft" ? 3 : 1)), d: r.float(300, 5000, 3).toFixed(3), dir: r.pick(["g2grid", "grid2g"]) },
        ask: ["cf", "out"],
      };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "manning",
    group: "Hydraulics & drainage",
    title: "Open channel flow (Manning's equation)",
    icon: "waves",
    blurb: "Velocity and flow in a rectangular or trapezoidal channel.",
    inputs: [
      { id: "b", label: "Bottom width b", type: "num", value: "10", unit: "L" },
      { id: "y", label: "Flow depth y", type: "num", value: "3", unit: "L" },
      { id: "z", label: "Side slope z (H:1V, 0 = rectangular)", type: "num", value: "2" },
      { id: "n", label: "Manning's n", type: "num", value: "0.030", help: "Concrete ≈ 0.013 · clean earth ≈ 0.022 · grassy ≈ 0.030 · natural stream ≈ 0.035+" },
      { id: "S", label: "Channel slope S (ft/ft or m/m)", type: "num", value: "0.0015" },
    ],
    compute(v, U) {
      if (![v.b, v.y, v.z, v.n, v.S].every(isFinite) || v.y <= 0 || v.n <= 0 || v.S <= 0 || v.b < 0 || v.z < 0) return { error: "Enter positive values." };
      const A = (v.b + v.z * v.y) * v.y;
      const P = v.b + 2 * v.y * Math.sqrt(1 + v.z * v.z);
      const Rh = A / P;
      const k = U.manningK;
      const V = (k / v.n) * Rh ** (2 / 3) * Math.sqrt(v.S);
      const Q = V * A;
      const T = v.b + 2 * v.z * v.y;
      const Fr = V / Math.sqrt(U.g * (A / T));
      const vu = U.L === "ft" ? "ft/s" : "m/s", qu = U.L === "ft" ? "cfs" : "m³/s";
      return {
        outputs: [
          { id: "A", label: "Flow area A", value: A, d: 2, unit: U.A, tol: 0.01 },
          { id: "P", label: "Wetted perimeter P", value: P, d: 3, unit: U.L, tol: 0.005 },
          { id: "R", label: "Hydraulic radius R", value: Rh, d: 3, unit: U.L, tol: 0.005 },
          { id: "V", label: "Velocity V", value: V, d: 2, unit: vu, tol: 0.01 },
          { id: "Q", label: "Flow Q", value: Q, d: 1, unit: qu, tol: Math.max(0.05, Q * 0.002) },
          { id: "Fr", label: "Froude number", value: Fr, d: 2, tol: 0.01, text: `${fmt(Fr, 2)} (${Fr < 1 ? "subcritical" : "supercritical"})` },
        ],
        steps: [
          `A = (b + zy)y = (${v.b} + ${v.z}×${v.y})×${v.y} = ${fmt(A, 2)} ${U.A}`,
          `P = b + 2y√(1 + z²) = ${v.b} + 2×${v.y}×√(1 + ${v.z}²) = ${fmt(P)} ${U.L}`,
          `R = A/P = ${fmt(Rh)} ${U.L}`,
          `V = (${k}/n) R^(2/3) S^(1/2) = (${k}/${v.n}) × ${fmt(Rh ** (2 / 3), 4)} × ${fmt(Math.sqrt(v.S), 5)} = ${fmt(V, 2)} ${vu}`,
          `Q = V·A = ${fmt(V, 2)} × ${fmt(A, 2)} = ${fmt(Q, 1)} ${qu}`,
          `Froude = V/√(g·A/T) with top width T = ${fmt(T, 2)}: ${fmt(Fr, 2)}`,
        ],
      };
    },
    explain: [
      "Manning's equation estimates steady, uniform flow in an open channel from its shape, roughness and slope. Engineers use it to size ditches, culverts flowing partly full, and storm channels, and to estimate stream flow from a surveyed cross section.",
      "The constant is 1.49 in US units and 1.0 in SI units. The roughness n comes from tables or field judgment, and it is usually the biggest source of uncertainty.",
    ],
    formulas: ["V = (k/n) R^(2/3) S^(1/2)", "Q = V A", "R = A / P", "k = 1.49 (US), 1.0 (SI)"],
    field: "Survey the slope over a long reach, not across one riffle. A short reach can be off by a factor of two.",
    practice(r) {
      return {
        values: { b: String(r.int(2, 20)), y: r.float(0.5, 4, 1).toFixed(1), z: String(r.pick([0, 1, 1.5, 2, 3])), n: r.pick(["0.013", "0.022", "0.030", "0.035"]), S: r.pick(["0.0005", "0.001", "0.002", "0.005", "0.01"]) },
        ask: ["R", "V", "Q"],
      };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "rational",
    group: "Hydraulics & drainage",
    title: "Peak runoff (rational method)",
    icon: "cloud-rain",
    blurb: "Peak storm runoff from a small drainage area, with a weighted runoff coefficient.",
    inputs: [
      { id: "i", label: "Rainfall intensity i (in/hr in feet mode, mm/hr in meters mode)", type: "num", value: "2.4" },
      {
        id: "areas",
        label: "Sub-areas (acres in feet mode, hectares in meters mode)",
        type: "rows",
        cols: [
          { id: "name", label: "Land use", type: "text" },
          { id: "a", label: "Area", type: "num" },
          { id: "c", label: "C", type: "num" },
        ],
        rows: [
          ["Pavement and roofs", "3.2", "0.90"],
          ["Lawns", "5.5", "0.20"],
          ["Park", "2.1", "0.15"],
        ],
      },
    ],
    compute(v, U) {
      const A = v.areas.filter((x) => isFinite(x.a) && isFinite(x.c) && x.a > 0);
      if (!A.length || !isFinite(v.i)) return { error: "Enter an intensity and at least one sub-area with its C." };
      const tot = A.reduce((s, x) => s + x.a, 0);
      const cw = A.reduce((s, x) => s + x.a * x.c, 0) / tot;
      const ft = U.L === "ft";
      const Q = ft ? cw * v.i * tot : (cw * v.i * tot) / 360;
      return {
        outputs: [
          { id: "A", label: "Total area", value: tot, d: 2, unit: ft ? "ac" : "ha", tol: 0.01 },
          { id: "C", label: "Weighted C", value: cw, d: 3, tol: 0.002 },
          { id: "Q", label: "Peak flow Q", value: Q, d: ft ? 1 : 3, unit: ft ? "cfs" : "m³/s", tol: ft ? 0.1 : 0.002 },
        ],
        steps: [
          `Weighted C = Σ(C·A) ÷ ΣA = (${A.map((x) => `${x.c}×${x.a}`).join(" + ")}) ÷ ${fmt(tot, 2)} = ${cw.toFixed(3)}`,
          ft
            ? `Q = C·i·A = ${cw.toFixed(3)} × ${v.i} in/hr × ${fmt(tot, 2)} ac = ${fmt(Q, 1)} cfs (1 ac·in/hr ≈ 1.008 cfs, usually taken as 1)`
            : `Q = C·i·A ÷ 360 = ${cw.toFixed(3)} × ${v.i} mm/hr × ${fmt(tot, 2)} ha ÷ 360 = ${fmt(Q, 3)} m³/s`,
        ],
      };
    },
    explain: [
      "The rational method estimates the peak runoff from a storm on a small watershed, typically under about 200 acres. It is the usual starting point for sizing storm drains, inlets and small culverts.",
      "The rainfall intensity comes from an intensity–duration–frequency (IDF) curve for the design storm, using a duration equal to the time of concentration. NOAA Atlas 14 is the standard US source.",
    ],
    formulas: ["Q = C i A (US: cfs, in/hr, acres)", "Q = C i A / 360 (SI: m³/s, mm/hr, ha)", "C_w = Σ(CᵢAᵢ) / ΣAᵢ"],
    field: "C goes up with storm size and with how impervious the surface is. Check the local drainage manual: many cities set the C values and design storms you must use.",
    practice(r, U) {
      return {
        values: {
          i: U.L === "ft" ? r.float(0.8, 4.5, 1).toFixed(1) : String(r.int(20, 110)),
          areas: [["Impervious", r.float(0.5, 6, 1).toFixed(1), "0.90"], ["Lawn", r.float(1, 10, 1).toFixed(1), r.pick(["0.15", "0.20", "0.25"])], ["Open space", r.float(0.5, 5, 1).toFixed(1), "0.10"]],
        },
        ask: ["C", "Q"],
      };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "repeat",
    group: "Measurement error",
    title: "Repeated measurements",
    icon: "chart-bar",
    blurb: "Mean, standard deviation, standard error and a 95% interval.",
    inputs: [
      {
        id: "xs",
        label: "Measurements of the same quantity",
        type: "rows",
        cols: [{ id: "x", label: "Value", type: "num" }],
        rows: [["245.326"], ["245.331"], ["245.319"], ["245.328"], ["245.335"], ["245.322"]],
      },
    ],
    compute(v) {
      const x = v.xs.map((r) => r.x).filter(isFinite);
      const n = x.length;
      if (n < 2) return { error: "Enter at least two measurements." };
      const mean = x.reduce((a, b) => a + b, 0) / n;
      const res = x.map((xi) => xi - mean);
      const ss = res.reduce((a, b) => a + b * b, 0);
      const s = Math.sqrt(ss / (n - 1));
      const se = s / Math.sqrt(n);
      const t = F.t95(n - 1);
      return {
        outputs: [
          { id: "mean", label: "Mean", value: mean, d: 4, tol: 0.0005 },
          { id: "s", label: "Standard deviation s", value: s, d: 4, tol: 0.0005 },
          { id: "se", label: "Standard error of the mean", value: se, d: 4, tol: 0.0005 },
          { id: "ci", label: "95% interval for the true value", value: t * se, d: 4, tol: 0.0005, text: `${fmt(mean, 4)} ± ${fmt(t * se, 4)}` },
        ],
        steps: [
          `Mean = Σx ÷ n = ${fmt(x.reduce((a, b) => a + b, 0), 4)} ÷ ${n} = ${fmt(mean, 4)}`,
          `Residuals v = x − mean; Σv² = ${ss.toExponential(4)}`,
          `s = √(Σv² ÷ (n − 1)) = √(${ss.toExponential(4)} ÷ ${n - 1}) = ${fmt(s, 4)}`,
          `Standard error = s ÷ √n = ${fmt(s, 4)} ÷ ${fmt(Math.sqrt(n), 4)} = ${fmt(se, 4)}`,
          `95% interval = mean ± t·SE, with t = ${t} for ${n - 1} degrees of freedom: ± ${fmt(t * se, 4)}`,
        ],
        table: { head: ["#", "x", "v = x − mean", "v²"], rows: x.map((xi, i) => [String(i + 1), fmt(xi, 4), fmt(res[i], 4), res[i] ** 2 < 1e-4 ? (res[i] ** 2).toExponential(2) : fmt(res[i] ** 2, 6)]) },
      };
    },
    explain: [
      "Measuring the same thing several times shows how precise the measurement is. The standard deviation describes the scatter of single measurements. The standard error describes how well the mean is known, and it shrinks with more measurements.",
      "Repeating a measurement reduces random error only. A miscalibrated instrument gives the same wrong answer every time, so the mean can be precise and still inaccurate.",
    ],
    formulas: ["x̄ = Σx / n", "s = √(Σv² / (n − 1))", "SE = s / √n", "95% CI = x̄ ± t·SE"],
    field: "Throw out a reading only for a known blunder (wrong target, bumped tripod), not just because it looks far from the others.",
    practice(r) {
      const base = r.float(100, 900, 2), n = r.int(4, 7);
      return { values: { xs: Array.from({ length: n }, () => [(base + r.float(-0.012, 0.012, 3)).toFixed(3)]) }, ask: ["mean", "s"] };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "series-error",
    group: "Measurement error",
    title: "Error in a series and in an area",
    icon: "function",
    blurb: "How random errors add up along a taped line and in a computed area.",
    inputs: [
      { id: "sig", label: "Error of one measurement σ", type: "num", value: "0.02", unit: "L" },
      { id: "n", label: "Number of measurements in the series", type: "num", value: "16" },
      { id: "Lx", label: "Rectangle length", type: "num", value: "250.00", unit: "L" },
      { id: "sL", label: "σ of the length", type: "num", value: "0.03", unit: "L" },
      { id: "W", label: "Rectangle width", type: "num", value: "120.00", unit: "L" },
      { id: "sW", label: "σ of the width", type: "num", value: "0.02", unit: "L" },
    ],
    compute(v, U) {
      if (![v.sig, v.n, v.Lx, v.sL, v.W, v.sW].every(isFinite) || v.n < 1) return { error: "Fill in every field." };
      const sSeries = v.sig * Math.sqrt(v.n);
      const sA = Math.sqrt((v.W * v.sL) ** 2 + (v.Lx * v.sW) ** 2);
      return {
        outputs: [
          { id: "series", label: "Error of the whole series", value: sSeries, d: 3, unit: U.L, tol: 0.0005 },
          { id: "area", label: "Area", value: v.Lx * v.W, d: 1, unit: U.A, tol: 0.05 },
          { id: "sA", label: "Error of the area σ_A", value: sA, d: 2, unit: U.A, tol: 0.005 },
        ],
        steps: [
          `Random errors add in quadrature: σ_series = σ√n = ${v.sig} × √${v.n} = ${fmt(sSeries, 3)} ${U.L}`,
          `Area = L × W = ${fmt(v.Lx, 2)} × ${fmt(v.W, 2)} = ${fmt(v.Lx * v.W, 1)} ${U.A}`,
          `σ_A = √((W·σ_L)² + (L·σ_W)²) = √((${v.W}×${v.sL})² + (${v.Lx}×${v.sW})²) = ${fmt(sA, 2)} ${U.A}`,
        ],
      };
    },
    explain: [
      "Random errors partly cancel, so they grow with the square root of the number of measurements, not in direct proportion. Sixteen tape lengths with ±0.02 each give ±0.08 for the total, not ±0.32.",
      "Systematic errors, like a tape that is 0.01 too long, do not cancel. They add up directly with every length.",
    ],
    formulas: ["σ_series = σ √n", "σ_A = √((W σ_L)² + (L σ_W)²)"],
    field: "Use error propagation before a job to choose equipment: it tells you whether a cheaper method can still meet the required accuracy.",
    practice(r) {
      return {
        values: { sig: r.pick(["0.01", "0.02", "0.03", "0.005"]), n: String(r.int(4, 36)), Lx: r.float(50, 400, 2).toFixed(2), sL: r.pick(["0.01", "0.02", "0.03"]), W: r.float(30, 200, 2).toFixed(2), sW: r.pick(["0.01", "0.02", "0.03"]) },
        ask: ["series", "sA"],
      };
    },
  });
})(typeof window !== "undefined" ? window.FIELD : globalThis.FIELD);
