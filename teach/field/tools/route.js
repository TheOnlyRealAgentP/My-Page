/* Route surveying: horizontal and vertical curves */
(function (F) {
  "use strict";
  const { fmt, D2R } = F;

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "hcurve",
    group: "Route surveying",
    title: "Horizontal circular curve",
    icon: "bezier-curve",
    blurb: "Curve elements, PC and PT stations, and a deflection-angle staking table.",
    inputs: [
      { id: "R", label: "Radius R", type: "num", value: "1000.00", unit: "L" },
      { id: "delta", label: "Intersection angle Δ", type: "angle", value: "24 30 00" },
      { id: "pi", label: "PI station", type: "station", value: "12+50.00" },
      { id: "step", label: "Staking interval", type: "num", value: "50", unit: "L" },
    ],
    compute(v, U) {
      if (![v.R, v.delta, v.pi, v.step].every(isFinite) || v.R <= 0 || v.step <= 0) return { error: "Enter a radius, Δ, the PI station and an interval." };
      if (v.delta <= 0 || v.delta >= 180) return { error: "Δ must be between 0° and 180°." };
      const d = v.delta * D2R;
      const T = v.R * Math.tan(d / 2);
      const L = v.R * d;
      const LC = 2 * v.R * Math.sin(d / 2);
      const E = v.R * (1 / Math.cos(d / 2) - 1);
      const M = v.R * (1 - Math.cos(d / 2));
      const pc = v.pi - T, pt = pc + L;

      // Staking table: PC, each interval station, PT
      const pts = [pc];
      for (let s = Math.ceil((pc + 1e-6) / v.step) * v.step; s < pt - 1e-6; s += v.step) pts.push(s);
      pts.push(pt);
      if (pts.length > 200) return { error: "That interval gives too many stakes; use a larger one." };
      let prev = pc;
      const rows = pts.map((s) => {
        const l = s - pc;
        const defl = l / (2 * v.R) / D2R;
        const chord = 2 * v.R * Math.sin(l / (2 * v.R));
        const inc = 2 * v.R * Math.sin((s - prev) / (2 * v.R));
        prev = s;
        const name = s === pc ? " (PC)" : s === pt ? " (PT)" : "";
        return [F.station(s, U.L) + name, fmt(l, 2), F.dms(defl, 0), fmt(chord, 2), s === pc ? "" : fmt(inc, 2)];
      });

      const outputs = [
        { id: "T", label: "Tangent length T", value: T, d: 2, unit: U.L, tol: 0.01 },
        { id: "L", label: "Curve length L", value: L, d: 2, unit: U.L, tol: 0.01 },
        { id: "LC", label: "Long chord LC", value: LC, d: 2, unit: U.L, tol: 0.01 },
        { id: "E", label: "External distance E", value: E, d: 2, unit: U.L, tol: 0.01 },
        { id: "M", label: "Middle ordinate M", value: M, d: 2, unit: U.L, tol: 0.01 },
        { id: "pc", label: "PC station", value: pc, kind: "station", tol: 0.01 },
        { id: "pt", label: "PT station", value: pt, kind: "station", tol: 0.01 },
      ];
      if (U.L === "ft") outputs.push({ id: "D", label: "Degree of curve (arc, per 100 ft)", value: 5729.578 / v.R, kind: "angle", tol: 1 / 3600 });

      return {
        outputs,
        steps: [
          `Δ = ${F.dms(v.delta, 0)} = ${d.toFixed(6)} rad`,
          `T = R·tan(Δ/2) = ${fmt(v.R, 2)} × tan ${F.dms(v.delta / 2, 0)} = ${fmt(T, 2)}`,
          `L = R·Δ(rad) = ${fmt(v.R, 2)} × ${d.toFixed(6)} = ${fmt(L, 2)}`,
          `LC = 2R·sin(Δ/2) = ${fmt(LC, 2)}; E = R(sec(Δ/2) − 1) = ${fmt(E, 2)}; M = R(1 − cos(Δ/2)) = ${fmt(M, 2)}`,
          `PC = PI − T = ${F.station(v.pi, U.L)} − ${fmt(T, 2)} = ${F.station(pc, U.L)}`,
          `PT = PC + L = ${F.station(pc, U.L)} + ${fmt(L, 2)} = ${F.station(pt, U.L)} (add L to the PC, not T to the PI)`,
          `Deflection to a point l along the curve = l/(2R) radians. Total deflection at the PT = Δ/2 = ${F.dms(v.delta / 2, 0)}.`,
        ],
        table: { head: ["Station", "Arc from PC", "Deflection", "Chord from PC", "Sub-chord"], rows },
      };
    },
    explain: [
      "A circular curve joins two straight tangents that meet at the PI with an intersection angle Δ. The curve starts at the PC and ends at the PT.",
      "To stake the curve, set up on the PC, sight the PI (back along the tangent), turn the deflection angle for each stake and measure the chord. The deflection to any point is half the central angle to that point.",
    ],
    formulas: ["T = R tan(Δ/2)", "L = R Δ (Δ in radians)", "LC = 2R sin(Δ/2)", "E = R [sec(Δ/2) − 1]", "M = R [1 − cos(Δ/2)]", "deflection = l / 2R"],
    field: "Stationing runs along the curve, not the tangents. A classic exam mistake is PT = PI + T.",
    practice(r, U) {
      return {
        values: {
          R: String(r.pick([400, 500, 600, 750, 800, 1000, 1200, 1500, 2000])),
          delta: `${r.int(8, 70)} ${r.int(0, 59)} ${r.pick([0, 15, 30, 45])}`,
          pi: F.station(r.int(800, 4000) + r.pick([0, 0.25, 0.5, 0.75]) * 10, U.L),
          step: U.L === "ft" ? "50" : "20",
        },
        ask: ["T", "L", "pc", "pt"],
      };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "vcurve",
    group: "Route surveying",
    title: "Vertical curve (equal tangent)",
    icon: "wave-sine",
    blurb: "BVC and EVC, the high or low point, and curve elevations at each station.",
    inputs: [
      { id: "g1", label: "Entering grade g₁", type: "num", value: "3.00", unit: "%" },
      { id: "g2", label: "Exiting grade g₂", type: "num", value: "-2.50", unit: "%" },
      { id: "L", label: "Curve length L", type: "num", value: "600", unit: "L" },
      { id: "pvi", label: "PVI station", type: "station", value: "25+00.00" },
      { id: "zpvi", label: "PVI elevation", type: "num", value: "4520.00", unit: "L" },
      { id: "step", label: "Table interval", type: "num", value: "50", unit: "L" },
    ],
    compute(v, U) {
      if (![v.g1, v.g2, v.L, v.pvi, v.zpvi, v.step].every(isFinite) || v.L <= 0 || v.step <= 0) return { error: "Fill in every field." };
      if (v.g1 === v.g2) return { error: "The grades are equal, so there is no curve." };
      const A = v.g2 - v.g1;
      const bvc = v.pvi - v.L / 2, evc = v.pvi + v.L / 2;
      const zb = v.zpvi - (v.g1 / 100) * (v.L / 2);
      const ze = v.zpvi + (v.g2 / 100) * (v.L / 2);
      const z = (x) => zb + (v.g1 / 100) * x + (A / (200 * v.L)) * x * x;
      const xt = (-v.g1 * v.L) / A;
      const hasTurn = xt > 0 && xt < v.L;
      const K = v.L / Math.abs(A);

      const xs = [0];
      for (let s = Math.ceil((bvc + 1e-6) / v.step) * v.step; s < evc - 1e-6; s += v.step) xs.push(s - bvc);
      xs.push(v.L);
      if (hasTurn) xs.push(xt);
      xs.sort((a, b) => a - b);
      if (xs.length > 300) return { error: "That interval gives too many rows; use a larger one." };
      const rows = xs.map((x) => {
        const tag = x === 0 ? " (BVC)" : Math.abs(x - v.L) < 1e-9 ? " (EVC)" : hasTurn && Math.abs(x - xt) < 1e-9 ? (A < 0 ? " (high point)" : " (low point)") : Math.abs(x - v.L / 2) < 1e-9 ? " (PVI)" : "";
        const tan = zb + (v.g1 / 100) * x;
        return [F.station(bvc + x, U.L) + tag, fmt(x, 2), fmt(tan, 3), fmt((A / (200 * v.L)) * x * x, 3), fmt(z(x), 3)];
      });

      const outputs = [
        { id: "bvc", label: "BVC station", value: bvc, kind: "station", tol: 0.01 },
        { id: "zb", label: "BVC elevation", value: zb, d: 3, unit: U.L, tol: 0.005 },
        { id: "evc", label: "EVC station", value: evc, kind: "station", tol: 0.01 },
        { id: "ze", label: "EVC elevation", value: ze, d: 3, unit: U.L, tol: 0.005 },
        { id: "K", label: "K value (length per % change in grade)", value: K, d: 1, unit: "", tol: 0.05 },
      ];
      if (hasTurn) {
        outputs.push({ id: "st", label: A < 0 ? "High point station" : "Low point station", value: bvc + xt, kind: "station", tol: 0.05 });
        outputs.push({ id: "zt", label: A < 0 ? "High point elevation" : "Low point elevation", value: z(xt), d: 3, unit: U.L, tol: 0.005 });
      }

      return {
        outputs,
        steps: [
          `A = g₂ − g₁ = ${v.g2} − ${v.g1} = ${fmt(A, 2)}% → ${A < 0 ? "crest" : "sag"} curve`,
          `BVC = PVI − L/2 = ${F.station(bvc, U.L)}; elevation = ${fmt(v.zpvi, 2)} − (${v.g1}/100)(${fmt(v.L / 2, 2)}) = ${fmt(zb, 3)}`,
          `EVC = PVI + L/2 = ${F.station(evc, U.L)}; elevation = ${fmt(v.zpvi, 2)} + (${v.g2}/100)(${fmt(v.L / 2, 2)}) = ${fmt(ze, 3)}`,
          `Curve elevation x from BVC: y = ${fmt(zb, 3)} + ${(v.g1 / 100).toFixed(4)}x + (${fmt(A, 2)} ÷ ${fmt(200 * v.L, 0)})x²`,
          hasTurn
            ? `${A < 0 ? "High" : "Low"} point where the slope is zero: x = −g₁L/A = ${fmt(xt, 2)} → station ${F.station(bvc + xt, U.L)}, elevation ${fmt(z(xt), 3)}`
            : `The grades have the same sign, so there is no high or low point inside the curve.`,
          `K = L/|A| = ${fmt(K, 1)}`,
        ],
        table: { head: ["Station", "x from BVC", "Tangent elev.", "Offset", "Curve elev."], rows },
      };
    },
    explain: [
      "Vertical curves are parabolas, which change grade at a constant rate. That keeps the ride smooth and makes elevations easy to compute: each point is the tangent elevation plus an offset that grows with x².",
      "The high or low point is not at the PVI unless the two grades are equal and opposite. Drainage inlets go at the low point of a sag curve.",
    ],
    formulas: ["y = y_BVC + g₁x + (A / 200L) x²", "x_turn = −g₁L / A", "K = L / |A|"],
    field: "Design standards set the minimum K for a speed, from stopping sight distance on crests and headlight distance on sags.",
    practice(r, U) {
      let g1 = r.float(-5, 5, 1), g2 = r.float(-5, 5, 1);
      if (Math.sign(g1) === Math.sign(g2)) g2 = -g2;
      if (g1 === g2) g2 = g1 + 2;
      return {
        values: {
          g1: g1.toFixed(2), g2: g2.toFixed(2), L: String(r.pick([200, 300, 400, 500, 600, 800])),
          pvi: F.station(r.int(10, 60) * 100, U.L), zpvi: r.float(4300, 4700, 2).toFixed(2), step: U.L === "ft" ? "50" : "20",
        },
        ask: ["bvc", "zb", "st", "zt"],
      };
    },
  });
})(typeof window !== "undefined" ? window.FIELD : globalThis.FIELD);
