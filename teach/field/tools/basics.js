/* Angles, directions and units */
(function (F) {
  "use strict";
  const { fmt, D2R } = F;

  const dmsParts = (deg) => {
    const x = Math.abs(deg);
    let d = Math.floor(x), m = Math.floor((x - d) * 60);
    let s = +(((x - d) * 60 - m) * 60).toFixed(2);
    if (s >= 60) { s -= 60; m++; }
    if (m >= 60) { m -= 60; d++; }
    return { d, m, s };
  };

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "angles",
    group: "Angles & units",
    title: "Angle converter",
    icon: "angle",
    blurb: "Degrees–minutes–seconds, decimal degrees, radians and gons.",
    inputs: [{ id: "a", label: "Angle", type: "angle", value: "123 45 30", help: "Type 123.4583, 123 45 30 or 123°45′30″" }],
    compute(v) {
      const a = v.a;
      if (!isFinite(a)) return { error: "Enter an angle." };
      const p = dmsParts(a);
      return {
        outputs: [
          { id: "dd", label: "Decimal degrees", value: a, d: 6, unit: "°", tol: 0.00005 },
          { id: "dms", label: "Degrees, minutes, seconds", value: a, kind: "angle", tol: 0.6 / 3600 },
          { id: "rad", label: "Radians", value: a * D2R, d: 6, tol: 0.000005 },
          { id: "gon", label: "Gons (grads)", value: (a * 400) / 360, d: 5, tol: 0.0001 },
        ],
        steps: [
          `Decimal degrees = D + M/60 + S/3600 = ${p.d} + ${p.m}/60 + ${p.s}/3600 = ${a.toFixed(6)}°`,
          `Radians = degrees × π/180 = ${a.toFixed(6)} × 0.0174533 = ${(a * D2R).toFixed(6)}`,
          `Gons = degrees × 400/360 = ${((a * 400) / 360).toFixed(5)} gon`,
        ],
      };
    },
    explain: [
      "Survey instruments and plans use degrees, minutes and seconds. Spreadsheets, calculators and code need decimal degrees or radians. A slip here is one of the most common sources of field errors.",
      "One second of arc is tiny: it subtends about 0.5 mm at 100 m, or 0.03 ft at 1,000 ft.",
    ],
    formulas: ["DD = D + M/60 + S/3600", "rad = DD × π/180", "gon = DD × 400/360"],
    field: "When you key an angle into a calculator, check whether it expects DMS or decimal degrees. 45.30 is 45.3°, not 45°30′.",
    practice(r) {
      if (r.next() < 0.5) {
        const d = r.int(0, 359), m = r.int(0, 59), s = r.int(0, 59);
        return { values: { a: `${d} ${m} ${s}` }, ask: ["dd", "rad"] };
      }
      return { values: { a: r.float(0, 359.999, 4).toFixed(4) }, ask: ["dms"] };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "bearings",
    group: "Angles & units",
    title: "Azimuths and bearings",
    icon: "compass",
    blurb: "Convert between azimuths and quadrant bearings, and find back directions.",
    inputs: [
      { id: "dir", label: "Azimuth or bearing", type: "direction", value: "S 35 20 15 E", help: "Azimuth like 144 39 45, or bearing like S 35 20 15 E" },
    ],
    compute(v) {
      const az = v.dir;
      if (!isFinite(az)) return { error: "Enter an azimuth (0–360°) or a bearing such as N 45 30 00 E." };
      const a = F.mod360(az);
      const back = F.mod360(a + 180);
      const q = a <= 90 ? "NE" : a <= 180 ? "SE" : a <= 270 ? "SW" : "NW";
      const rule = { NE: "bearing angle = azimuth", SE: "bearing angle = 180° − azimuth", SW: "bearing angle = azimuth − 180°", NW: "bearing angle = 360° − azimuth" }[q];
      return {
        outputs: [
          { id: "az", label: "Azimuth (from north, clockwise)", value: a, kind: "angle", tol: 1 / 3600 },
          { id: "brg", label: "Bearing", value: a, kind: "bearing", tol: 1 / 3600 },
          { id: "baz", label: "Back azimuth", value: back, kind: "angle", tol: 1 / 3600 },
          { id: "bbrg", label: "Back bearing", value: back, kind: "bearing", tol: 1 / 3600 },
        ],
        steps: [
          `The direction ${F.azText(a)} falls in the ${q} quadrant, so ${rule}.`,
          `Bearing = ${F.bearing(a, 1)}`,
          `Back azimuth = azimuth ± 180° = ${F.azText(back)}`,
          `Back bearing: swap N↔S and E↔W, keep the angle: ${F.bearing(back, 1)}`,
        ],
      };
    },
    explain: [
      "An azimuth is measured clockwise from north, from 0° to 360°. A bearing gives the angle from north or south toward east or west, never more than 90°, with a quadrant such as S 35°20′15″ E.",
      "Azimuths are easier for computing. Bearings are what you read on most plats and legal descriptions.",
    ],
    formulas: ["NE: Az = θ", "SE: Az = 180° − θ", "SW: Az = 180° + θ", "NW: Az = 360° − θ", "Back Az = Az ± 180°"],
    field: "Sketch the quadrant before converting. Most mistakes put the angle in the wrong quadrant.",
    practice(r) {
      const a = r.int(0, 359) + r.int(0, 59) / 60 + r.int(0, 59) / 3600;
      if (r.next() < 0.5) return { values: { dir: F.bearing(a, 0).replace(/[°′″]/g, " ").replace(/\s+/g, " ") }, ask: ["az", "baz"] };
      return { values: { dir: F.azText(a, 0).replace(/[°′″]/g, " ").trim() }, ask: ["brg", "bbrg"] };
    },
  });

  /* ------------------------------------------------------------------ */
  const LEN = {
    ift: ["International feet", 0.3048],
    usft: ["US survey feet", 1200 / 3937],
    m: ["Meters", 1],
    ch: ["Gunter's chains (66 US survey ft)", (66 * 1200) / 3937],
    rd: ["Rods (16.5 US survey ft)", (16.5 * 1200) / 3937],
    mi: ["Miles (international)", 1609.344],
  };
  F.tool({
    id: "length-units",
    group: "Angles & units",
    title: "Survey foot vs. international foot",
    icon: "ruler",
    blurb: "Length conversions, including the 2 ppm difference that matters on State Plane coordinates.",
    unitFree: true,
    inputs: [
      { id: "x", label: "Value", type: "num", value: "2000000" },
      { id: "from", label: "Units", type: "select", value: "usft", options: Object.entries(LEN).map(([k, [l]]) => [k, l]) },
    ],
    compute(v) {
      if (!isFinite(v.x)) return { error: "Enter a value." };
      const m = v.x * LEN[v.from][1];
      const diff = v.x * (1200 / 3937 - 0.3048);
      return {
        outputs: [
          { id: "m", label: "Meters", value: m, d: 4, unit: "m", tol: 0.001 },
          { id: "ift", label: "International feet", value: m / 0.3048, d: 4, unit: "ft", tol: 0.001 },
          { id: "usft", label: "US survey feet", value: m / (1200 / 3937), d: 4, unit: "US ft", tol: 0.001 },
          { id: "ch", label: "Chains", value: m / LEN.ch[1], d: 4, unit: "ch", tol: 0.001 },
          { id: "diff", label: `If ${fmt(v.x, 0)} were read as the other kind of foot, the error would be`, value: Math.abs(diff), d: 4, unit: "m", tol: 0.0005 },
        ],
        steps: [
          `${fmt(v.x, 4)} ${LEN[v.from][0].toLowerCase()} × ${LEN[v.from][1].toPrecision(10)} m each = ${fmt(m, 4)} m`,
          `1 international ft = 0.3048 m exactly. 1 US survey ft = 1200/3937 m = 0.3048006096 m.`,
          `Difference per foot = 0.0000006096 m, about 2 parts per million. × ${fmt(v.x, 0)} = ${fmt(Math.abs(diff), 4)} m`,
        ],
      };
    },
    explain: [
      "The US survey foot is slightly longer than the international foot: 2 parts per million. That is nothing over a building lot, but State Plane eastings are often in the millions of feet, so mixing them up shifts coordinates by a meter or more.",
      "NIST and NOAA's National Geodetic Survey retired the US survey foot at the end of 2022. New work uses the international foot, but older plats, deeds and coordinate files may still be in survey feet.",
    ],
    formulas: ["1 ft (international) = 0.3048 m", "1 US survey ft = 1200/3937 m", "1 chain = 66 ft = 4 rods; 80 chains = 1 mile"],
    field: "Before combining coordinate files, check which foot each one uses. The CRS name in QGIS often says (for example \"ftUS\" vs \"ft\").",
    practice(r) {
      return { values: { x: String(r.int(1000, 3000) * 1000), from: r.pick(["usft", "ift"]) }, ask: ["m", "diff"] };
    },
  });

  /* ------------------------------------------------------------------ */
  const AREA = {
    ft2: ["Square feet", 0.09290304],
    ac: ["Acres", 4046.8564224],
    ha: ["Hectares", 10000],
    m2: ["Square meters", 1],
    mi2: ["Square miles", 2589988.110336],
  };
  F.tool({
    id: "area-units",
    group: "Angles & units",
    title: "Area units",
    icon: "square-half",
    blurb: "Square feet, acres, hectares, square meters and square miles.",
    unitFree: true,
    inputs: [
      { id: "x", label: "Area", type: "num", value: "87120" },
      { id: "from", label: "Units", type: "select", value: "ft2", options: Object.entries(AREA).map(([k, [l]]) => [k, l]) },
    ],
    compute(v) {
      if (!isFinite(v.x)) return { error: "Enter an area." };
      const m2 = v.x * AREA[v.from][1];
      return {
        outputs: [
          { id: "ft2", label: "Square feet", value: m2 / AREA.ft2[1], d: 2, unit: "ft²", tol: 0.5 },
          { id: "ac", label: "Acres", value: m2 / AREA.ac[1], d: 4, unit: "ac", tol: 0.0005 },
          { id: "ha", label: "Hectares", value: m2 / AREA.ha[1], d: 4, unit: "ha", tol: 0.0005 },
          { id: "m2", label: "Square meters", value: m2, d: 2, unit: "m²", tol: 0.5 },
        ],
        steps: [
          `${fmt(v.x, 4)} ${AREA[v.from][0].toLowerCase()} = ${fmt(m2, 2)} m²`,
          `1 acre = 43,560 ft² = 4,046.86 m². 1 hectare = 10,000 m² = 2.471 acres.`,
        ],
      };
    },
    explain: [
      "Parcels in the US are usually described in acres, while metric plans use hectares. An acre is 43,560 square feet; a hectare is a 100 m × 100 m square, about 2.47 acres.",
    ],
    formulas: ["1 ac = 43,560 ft²", "1 ha = 10,000 m²", "1 mi² = 640 ac"],
    practice(r) {
      return { values: { x: String(r.int(5, 400) * 1000), from: "ft2" }, ask: ["ac", "ha"] };
    },
  });
})(typeof window !== "undefined" ? window.FIELD : globalThis.FIELD);
