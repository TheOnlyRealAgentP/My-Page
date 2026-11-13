/* Leveling, distances and grades */
(function (F) {
  "use strict";
  const { fmt, D2R } = F;

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "leveling",
    group: "Leveling & distances",
    title: "Differential leveling notes",
    icon: "ruler",
    blurb: "Reduce level notes, run the arithmetic check, and adjust a loop that misses its benchmark.",
    inputs: [
      { id: "start", label: "Starting benchmark elevation", type: "num", value: "1000.000", unit: "L" },
      { id: "close", label: "Known elevation of the closing benchmark (blank if open)", type: "num", value: "1000.000", unit: "L" },
      {
        id: "rows",
        label: "Level notes (first row: BS only · turning points: FS and BS · last row: FS only)",
        type: "rows",
        cols: [
          { id: "sta", label: "Station", type: "text" },
          { id: "bs", label: "BS (+)", type: "num", unit: "L" },
          { id: "fs", label: "FS (−)", type: "num", unit: "L" },
        ],
        rows: [
          ["BM 1", "4.512", ""],
          ["TP 1", "3.876", "6.203"],
          ["TP 2", "7.402", "5.110"],
          ["BM 1", "", "4.483"],
        ],
      },
    ],
    compute(v, U) {
      const R = v.rows.filter((r) => r.sta || isFinite(r.bs) || isFinite(r.fs));
      if (!isFinite(v.start)) return { error: "Enter the starting benchmark elevation." };
      if (R.length < 2) return { error: "Enter at least a backsight row and a foresight row." };
      if (!isFinite(R[0].bs)) return { error: "The first row needs a backsight (BS) on the benchmark." };

      const out = [];
      let elev = v.start, HI = NaN, sumBS = 0, sumFS = 0;
      for (let i = 0; i < R.length; i++) {
        const r = R[i];
        if (i > 0) {
          if (!isFinite(r.fs)) return { error: `Row ${i + 1} (${r.sta || "?"}) needs a foresight (FS).` };
          if (!isFinite(HI)) return { error: `Row ${i} has no backsight, so row ${i + 1} can't be reduced.` };
          elev = HI - r.fs;
          sumFS += r.fs;
        }
        const thisHI = isFinite(r.bs) && i < R.length - 1 ? elev + r.bs : NaN;
        if (isFinite(thisHI)) sumBS += r.bs;
        out.push({ sta: r.sta || `Row ${i + 1}`, bs: isFinite(thisHI) ? r.bs : NaN, hi: thisHI, fs: i > 0 ? r.fs : NaN, elev });
        HI = thisHI;
      }
      const last = out[out.length - 1].elev;
      const setups = out.length - 1;
      const closing = isFinite(v.close);
      const mis = closing ? last - v.close : NaN;
      const adj = out.map((o, i) => (closing ? o.elev - (mis * i) / setups : NaN));

      const outputs = [
        { id: "final", label: `Elevation of ${out[out.length - 1].sta}`, value: last, d: 3, unit: U.L, tol: 0.0015 },
        { id: "check", label: "ΣBS − ΣFS", value: sumBS - sumFS, d: 3, unit: U.L, tol: 0.0015 },
      ];
      if (closing) outputs.push({ id: "mis", label: "Misclosure (computed − known)", value: mis, d: 3, unit: U.L, tol: 0.0015 });

      return {
        outputs,
        steps: [
          `HI = elevation + BS. Next elevation = HI − FS.`,
          ...out.slice(0, -1).map((o, i) => `Setup ${i + 1}: HI = ${fmt(o.elev)} + ${fmt(o.bs)} = ${fmt(o.hi)} → ${out[i + 1].sta} = ${fmt(o.hi)} − ${fmt(out[i + 1].fs)} = ${fmt(out[i + 1].elev)}`),
          `Arithmetic check: ΣBS − ΣFS = ${fmt(sumBS)} − ${fmt(sumFS)} = ${fmt(sumBS - sumFS)}, and last − first = ${fmt(last)} − ${fmt(v.start)} = ${fmt(last - v.start)}. ${Math.abs(sumBS - sumFS - (last - v.start)) < 0.0005 ? "They match." : "They don't match: check the arithmetic."}`,
          ...(closing
            ? [
                `Misclosure = ${fmt(last)} − ${fmt(v.close)} = ${fmt(mis)} ${U.L}`,
                `Spread it by setup: correction at a point = −misclosure × (setups to that point ÷ ${setups}).`,
              ]
            : []),
        ],
        table: {
          head: ["Station", "BS", "HI", "FS", "Elevation", ...(closing ? ["Adjusted"] : [])],
          rows: out.map((o, i) => [
            o.sta,
            isFinite(o.bs) ? fmt(o.bs) : "",
            isFinite(o.hi) ? fmt(o.hi) : "",
            isFinite(o.fs) ? fmt(o.fs) : "",
            fmt(o.elev),
            ...(closing ? [fmt(adj[i])] : []),
          ]),
        },
      };
    },
    explain: [
      "Differential leveling carries an elevation from a benchmark to new points. A backsight (BS) on a point of known elevation gives the height of the instrument (HI). A foresight (FS) from that HI gives the next point's elevation.",
      "Closing the loop on a known benchmark shows how much error built up. Small misclosures are spread back over the setups, since each setup adds a similar amount of error.",
    ],
    formulas: ["HI = Elev + BS", "Elev = HI − FS", "ΣBS − ΣFS = Elev(last) − Elev(first)"],
    field: "Keep backsight and foresight distances about equal at each setup. It cancels most of the error from a level that isn't perfectly adjusted, and from Earth curvature and refraction.",
    practice(r) {
      const n = r.int(3, 5);
      const rows = [["BM A", r.float(3, 9, 3).toFixed(3), ""]];
      for (let i = 1; i < n; i++) rows.push([`TP ${i}`, r.float(3, 9, 3).toFixed(3), r.float(3, 9, 3).toFixed(3)]);
      rows.push(["BM B", "", r.float(3, 9, 3).toFixed(3)]);
      return { values: { start: r.float(4300, 4700, 3).toFixed(3), close: "", rows }, ask: ["final"] };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "slope-distance",
    group: "Leveling & distances",
    title: "Slope distance reduction",
    icon: "triangle",
    blurb: "Horizontal distance and elevation difference from a total station shot.",
    inputs: [
      { id: "s", label: "Slope distance", type: "num", value: "1250.420", unit: "L" },
      { id: "z", label: "Zenith angle", type: "angle", value: "87 42 15", help: "If you have a vertical angle α above horizontal, zenith = 90° − α" },
      { id: "hi", label: "Instrument height", type: "num", value: "5.25", unit: "L" },
      { id: "ht", label: "Target (prism) height", type: "num", value: "6.00", unit: "L" },
      { id: "cr", label: "Correct for curvature and refraction", type: "select", value: "yes", options: [["yes", "Yes"], ["no", "No"]] },
    ],
    compute(v, U) {
      if (![v.s, v.z, v.hi, v.ht].every(isFinite)) return { error: "Fill in every field." };
      const H = v.s * Math.sin(v.z * D2R), V = v.s * Math.cos(v.z * D2R);
      const k = U.L === "ft" ? 0.0206 : 0.0675;
      const cr = v.cr === "yes" ? k * (H / 1000) ** 2 : 0;
      const dz = V + v.hi - v.ht + cr;
      return {
        outputs: [
          { id: "h", label: "Horizontal distance", value: H, d: 3, unit: U.L, tol: 0.005 },
          { id: "v", label: "Vertical distance (instrument to target)", value: V, d: 3, unit: U.L, tol: 0.005 },
          { id: "cr", label: "Curvature and refraction correction", value: cr, d: 4, unit: U.L, tol: 0.0005 },
          { id: "dz", label: "Elevation difference (ground to ground)", value: dz, d: 3, unit: U.L, tol: 0.005 },
        ],
        steps: [
          `H = S·sin Z = ${fmt(v.s)} × sin ${F.dms(v.z, 0)} = ${fmt(H)} ${U.L}`,
          `V = S·cos Z = ${fmt(v.s)} × cos ${F.dms(v.z, 0)} = ${fmt(V)} ${U.L}`,
          v.cr === "yes"
            ? U.L === "ft"
              ? `(c + r) = 0.0206 × (H in thousands of ft)² = 0.0206 × ${(H / 1000).toFixed(4)}² = ${cr.toFixed(4)} ft`
              : `(c + r) = 0.0675 × (H in km)² = 0.0675 × ${(H / 1000).toFixed(4)}² = ${cr.toFixed(4)} m`
            : `Curvature and refraction not applied.`,
          `ΔElev = V + hi − ht + (c + r) = ${fmt(V)} + ${fmt(v.hi, 2)} − ${fmt(v.ht, 2)} + ${cr.toFixed(4)} = ${fmt(dz)} ${U.L}`,
        ],
      };
    },
    explain: [
      "A total station measures the slope distance along the line of sight and the zenith angle down from vertical. Plans need the horizontal distance and the elevation difference.",
      "Over long sights, the Earth curves away from a level line and the atmosphere bends the line of sight back down a little. The combined effect makes distant points read low, so it is added back.",
    ],
    formulas: ["H = S·sin Z", "V = S·cos Z", "ΔElev = V + hi − ht + (c+r)", "(c+r) = 0.0206 M² ft (M in 1,000s of ft) = 0.0675 K² m (K in km)"],
    field: "Curvature and refraction is about 0.02 ft at 1,000 ft but 0.5 ft at a mile. Many total stations apply it for you; check the setting.",
    practice(r) {
      return {
        values: { s: r.float(150, 2500, 3).toFixed(3), z: `${r.int(84, 95)} ${r.int(0, 59)} ${r.int(0, 59)}`, hi: r.float(4.8, 5.6, 2).toFixed(2), ht: r.float(5, 6.5, 2).toFixed(2), cr: "yes" },
        ask: ["h", "dz"],
      };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "grade",
    group: "Earthwork & grading",
    title: "Grade and slope conversions",
    icon: "chart-line-up",
    blurb: "Percent grade, slope ratio (H:V) and angle.",
    unitFree: true,
    inputs: [
      { id: "kind", label: "I have a", type: "select", value: "pct", options: [["pct", "Percent grade"], ["ratio", "Slope ratio H:1V"], ["deg", "Angle in degrees"]] },
      { id: "x", label: "Value", type: "num", value: "4.5" },
    ],
    compute(v) {
      if (!isFinite(v.x) || v.x <= 0) return { error: "Enter a positive value." };
      const pct = v.kind === "pct" ? v.x : v.kind === "ratio" ? 100 / v.x : Math.tan(v.x * D2R) * 100;
      if (v.kind === "deg" && v.x >= 90) return { error: "Angle must be under 90°." };
      const deg = Math.atan(pct / 100) / D2R, ratio = 100 / pct;
      return {
        outputs: [
          { id: "pct", label: "Percent grade", value: pct, d: 3, unit: "%", tol: 0.005 },
          { id: "ratio", label: "Slope ratio", value: ratio, d: 3, unit: "H : 1V", tol: 0.005 },
          { id: "deg", label: "Angle", value: deg, d: 4, unit: "°", tol: 0.0005 },
          { id: "rise", label: "Rise per 100 horizontal", value: pct, d: 3, unit: "", tol: 0.005 },
        ],
        steps: [
          `Percent grade = rise ÷ run × 100 = ${fmt(pct)}%`,
          `Slope ratio = run ÷ rise = 100 ÷ ${fmt(pct)} = ${fmt(ratio)} : 1`,
          `Angle = arctan(rise ÷ run) = arctan(${(pct / 100).toFixed(5)}) = ${deg.toFixed(4)}°`,
        ],
      };
    },
    explain: [
      "Roads and pipes use percent grade. Embankments and ditches use slope ratios such as 3:1 (three horizontal to one vertical). Angles show up in geometry and on some instruments. They all describe the same thing: rise over run.",
      "A 100% grade is 45°, not vertical.",
    ],
    formulas: ["% = rise/run × 100", "H:1V = 100 / %", "θ = arctan(%/100)"],
    field: "Slope ratios are written horizontal first in US civil practice (3:1 means 3 H to 1 V). Some geotechnical reports write it the other way, so check the notation.",
    practice(r) {
      const k = r.pick(["pct", "ratio", "deg"]);
      const x = k === "pct" ? r.float(0.5, 12, 2) : k === "ratio" ? r.pick([1.5, 2, 2.5, 3, 4, 6]) : r.float(1, 30, 1);
      return { values: { kind: k, x: String(x) }, ask: k === "pct" ? ["deg", "ratio"] : k === "ratio" ? ["pct", "deg"] : ["pct"] };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "cutfill",
    group: "Earthwork & grading",
    title: "Cut or fill from a design grade",
    icon: "shovel",
    blurb: "Design elevation along a grade line and the cut or fill to mark on a stake.",
    inputs: [
      { id: "sta0", label: "Station of the known design point", type: "station", value: "10+00.00" },
      { id: "z0", label: "Design elevation there", type: "num", value: "4512.30", unit: "L" },
      { id: "g", label: "Design grade (% , negative = downhill)", type: "num", value: "-1.75", unit: "%" },
      { id: "sta", label: "Stake station", type: "station", value: "13+25.00" },
      { id: "ground", label: "Ground elevation at the stake", type: "num", value: "4509.84", unit: "L" },
    ],
    compute(v, U) {
      if (![v.sta0, v.z0, v.g, v.sta, v.ground].every(isFinite)) return { error: "Fill in every field." };
      const dx = v.sta - v.sta0;
      const zd = v.z0 + (v.g / 100) * dx;
      const cf = v.ground - zd;
      return {
        outputs: [
          { id: "zd", label: "Design elevation at the stake", value: zd, d: 2, unit: U.L, tol: 0.01 },
          { id: "cf", label: "Cut (+) or fill (−)", value: cf, d: 2, unit: U.L, tol: 0.01, text: `${cf >= 0 ? "C" : "F"} ${fmt(Math.abs(cf), 2)} ${U.L}` },
        ],
        steps: [
          `Distance from the known point = ${F.station(v.sta, U.L)} − ${F.station(v.sta0, U.L)} = ${fmt(dx, 2)} ${U.L}`,
          `Design elevation = ${fmt(v.z0, 2)} + (${v.g}/100) × ${fmt(dx, 2)} = ${fmt(zd, 2)} ${U.L}`,
          `Ground − design = ${fmt(v.ground, 2)} − ${fmt(zd, 2)} = ${fmt(cf, 2)} → ${cf >= 0 ? `CUT ${fmt(cf, 2)}: dig down` : `FILL ${fmt(-cf, 2)}: build up`}`,
        ],
      };
    },
    explain: [
      "Grade stakes tell the equipment operator how far to dig or fill at that spot. When the ground is above the design surface it's a cut; below it, a fill.",
    ],
    formulas: ["Design elev = Elev₀ + g·(Sta − Sta₀)", "Cut/fill = Ground − Design"],
    field: "Stakes are usually set off to the side of the work with an offset distance written on them, so they survive construction.",
    practice(r, U) {
      const s0 = r.int(5, 20) * 100;
      const z0 = r.float(4400, 4600, 2);
      return {
        values: {
          sta0: F.station(s0, U.L), z0: z0.toFixed(2), g: String(r.float(-4, 4, 2)),
          sta: F.station(s0 + r.int(1, 12) * 25, U.L), ground: (z0 + r.float(-4, 4, 2)).toFixed(2),
        },
        ask: ["zd", "cf"],
      };
    },
  });
})(typeof window !== "undefined" ? window.FIELD : globalThis.FIELD);
