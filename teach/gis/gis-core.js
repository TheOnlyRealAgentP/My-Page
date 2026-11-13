/* =========================================================================
   GIS study hub: shared core
   - GIS.chapter(): content files in data/ register themselves here
   - seeded random numbers, so a shared test link reproduces the same test
   - generators: calculation questions with new numbers every time
   Works in the browser (window.GIS) and in Node (module.exports) for tests.
   ========================================================================= */
(function (root) {
  "use strict";

  const GIS = root.GIS || {};
  GIS.chapters = GIS.chapters || [];
  GIS.chapter = (c) => GIS.chapters.push(c);

  /* ---------- Seeded random ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      float: (lo, hi, d = 2) => +(lo + next() * (hi - lo)).toFixed(d),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      shuffle: (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
    };
    return r;
  }
  GIS.rng = rng;
  GIS.newSeed = () => Math.floor(Math.random() * 900000) + 100000;

  /* ---------- Number formatting ---------- */
  const fmt = (x, d = 2) =>
    Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmt0 = (x) => fmt(x, 0);
  const D2R = Math.PI / 180;
  GIS.fmt = fmt;

  function dms(deg) {
    const s = deg < 0 ? -1 : 1;
    let x = Math.abs(deg);
    let d = Math.floor(x);
    let m = Math.floor((x - d) * 60);
    let sec = +(((x - d) * 60 - m) * 60).toFixed(1);
    if (sec >= 60) { sec -= 60; m++; }
    if (m >= 60) { m -= 60; d++; }
    return { d: d * s, m, s: sec };
  }

  /* ---------- Generators ----------
     Each returns { prompt, answer, tol, unit, explain } and must give
     the same question for the same random sequence. */
  const G = {};
  const gen = (id, chapter, label, fn) => (G[id] = { id, chapter, label, make: fn });

  // ch02 — Data models
  gen("rasterCells", "ch02", "Raster cell count", (r) => {
    const c = r.pick([5, 10, 20, 25, 50, 100]);
    const w = r.int(2, 15), h = r.int(2, 12);
    const cols = (w * 1000) / c, rows = (h * 1000) / c;
    return {
      prompt: `A land-cover raster covers an area ${w} km wide (east–west) and ${h} km tall (north–south) with ${c} m square cells. How many cells does it have?`,
      answer: cols * rows, tol: 0, unit: "cells",
      explain: `Columns = ${fmt0(w * 1000)} m ÷ ${c} m = ${fmt0(cols)}. Rows = ${fmt0(h * 1000)} m ÷ ${c} m = ${fmt0(rows)}. Cells = ${fmt0(cols)} × ${fmt0(rows)} = ${fmt0(cols * rows)}.`,
    };
  });
  gen("rasterSize", "ch02", "Raster file size", (r) => {
    const rows = r.int(2, 9) * 1000, cols = r.int(2, 9) * 1000;
    const [bytes, kind] = r.pick([[1, "8-bit unsigned integer"], [2, "16-bit integer"], [4, "32-bit floating point"]]);
    const mb = (rows * cols * bytes) / 1e6;
    return {
      prompt: `An uncompressed raster has ${fmt0(rows)} rows and ${fmt0(cols)} columns, stored as ${kind} values. How large is it in megabytes (1 MB = 1,000,000 bytes)?`,
      answer: mb, tol: 0.05, unit: "MB",
      explain: `${kind} uses ${bytes} byte${bytes > 1 ? "s" : ""} per cell. ${fmt0(rows)} × ${fmt0(cols)} × ${bytes} = ${fmt0(rows * cols * bytes)} bytes = ${fmt(mb, 1)} MB.`,
    };
  });

  // ch03 — Geodesy and projections
  gen("dmsToDd", "ch03", "DMS to decimal degrees", (r) => {
    const d = r.int(25, 48), m = r.int(0, 59), s = r.float(0, 59.9, 1);
    const dd = d + m / 60 + s / 3600;
    return {
      prompt: `Convert the latitude ${d}° ${m}′ ${s}″ N to decimal degrees (4 decimal places).`,
      answer: +dd.toFixed(4), tol: 0.0001, unit: "°",
      explain: `DD = ${d} + ${m}/60 + ${s}/3600 = ${d} + ${(m / 60).toFixed(5)} + ${(s / 3600).toFixed(5)} = ${dd.toFixed(4)}°.`,
    };
  });
  gen("ddToDmsMinutes", "ch03", "Decimal degrees to DMS", (r) => {
    const dd = r.float(70, 124, 4);
    const p = dms(dd);
    return {
      prompt: `A point's longitude is ${dd.toFixed(4)}° W. In degrees, minutes and seconds, what is the **seconds** part (to 0.1″)?`,
      answer: p.s, tol: 0.15, unit: "″",
      explain: `Degrees = ${p.d}. Minutes = 0.${String(dd.toFixed(4)).split(".")[1]} × 60 = ${((dd - p.d) * 60).toFixed(4)}, so ${p.m}′. Seconds = ${(((dd - p.d) * 60 - p.m)).toFixed(4)} × 60 = ${p.s.toFixed(1)}″. Result: ${p.d}° ${p.m}′ ${p.s.toFixed(1)}″ W.`,
    };
  });
  gen("utmZone", "ch03", "UTM zone from longitude", (r) => {
    let lon;
    do lon = -r.float(68, 124, 2); while (Math.abs(((lon + 180) % 6)) < 0.05);
    const zone = Math.floor((lon + 180) / 6) + 1;
    return {
      prompt: `What UTM zone contains a point at longitude ${Math.abs(lon).toFixed(2)}° W?`,
      answer: zone, tol: 0, unit: "",
      explain: `Zones are 6° wide, starting at 180° W. Zone = floor((λ + 180) ÷ 6) + 1 = floor((${lon.toFixed(2)} + 180) ÷ 6) + 1 = floor(${((lon + 180) / 6).toFixed(3)}) + 1 = ${zone}.`,
    };
  });
  gen("degLonLength", "ch03", "Length of a degree of longitude", (r) => {
    const lat = r.int(20, 65);
    const km = 111.32 * Math.cos(lat * D2R);
    return {
      prompt: `On a spherical Earth, about how many kilometers long is 1° of longitude at latitude ${lat}° N? Use 111.32 km at the equator.`,
      answer: +km.toFixed(1), tol: 0.3, unit: "km",
      explain: `Meridians converge toward the poles, so a degree of longitude shrinks with cos φ: 111.32 × cos ${lat}° = 111.32 × ${Math.cos(lat * D2R).toFixed(4)} = ${km.toFixed(1)} km.`,
    };
  });
  gen("mapScaleGround", "ch03", "Map scale to ground distance", (r) => {
    const S = r.pick([10000, 12000, 24000, 25000, 50000, 62500, 100000]);
    const cm = r.float(1.5, 18, 1);
    const km = (cm * S) / 100000;
    return {
      prompt: `On a 1:${fmt0(S)} map, two bridges are ${cm} cm apart. How far apart are they on the ground, in kilometers?`,
      answer: +km.toFixed(3), tol: Math.max(0.002, km * 0.002), unit: "km",
      explain: `Ground = map distance × scale denominator = ${cm} cm × ${fmt0(S)} = ${fmt0(cm * S)} cm = ${fmt(km, 3)} km (100,000 cm per km).`,
    };
  });
  gen("verbalToRF", "ch03", "Verbal scale to representative fraction", (r) => {
    const ft = r.pick([100, 200, 400, 500, 1000, 2000]);
    return {
      prompt: `A site plan says "1 inch = ${ft} feet." What is the denominator of its representative fraction (1:?)`,
      answer: ft * 12, tol: 0, unit: "",
      explain: `Put both sides in the same units: 1 in = ${ft} ft × 12 in/ft = ${fmt0(ft * 12)} in, so the scale is 1:${fmt0(ft * 12)}.`,
    };
  });

  // ch04 — Data entry
  gen("digitizingError", "ch04", "Digitizing error on the ground", (r) => {
    const S = r.pick([2400, 4800, 12000, 24000, 50000, 100000]);
    const mm = r.pick([0.25, 0.5, 1]);
    const m = (mm / 1000) * S;
    return {
      prompt: `You digitize from a 1:${fmt0(S)} paper map, and your digitizing is accurate to about ${mm} mm on the map. How large is that error on the ground, in meters?`,
      answer: +m.toFixed(2), tol: Math.max(0.01, m * 0.005), unit: "m",
      explain: `Ground error = map error × scale denominator = ${mm} mm × ${fmt0(S)} = ${fmt0(mm * S)} mm = ${fmt(m, 2)} m.`,
    };
  });
  gen("georefRmse", "ch04", "Georeferencing RMSE", (r) => {
    const n = 4;
    const res = Array.from({ length: n }, () => [r.float(-2.5, 2.5, 1), r.float(-2.5, 2.5, 1)]);
    const sq = res.map(([x, y]) => x * x + y * y);
    const rmse = Math.sqrt(sq.reduce((a, b) => a + b, 0) / n);
    return {
      prompt: `After georeferencing a scanned map, four control points have these residuals (x, y) in meters: ${res.map(([x, y]) => `(${x}, ${y})`).join(", ")}. What is the total RMSE in meters?`,
      answer: +rmse.toFixed(2), tol: 0.01, unit: "m",
      explain: `Square each residual's length: ${sq.map((v) => v.toFixed(2)).join(", ")}. Mean = ${(sq.reduce((a, b) => a + b, 0) / n).toFixed(3)}. RMSE = √mean = ${rmse.toFixed(2)} m.`,
    };
  });

  // ch05 — GNSS
  gen("gnssRange", "ch05", "Range from signal travel time", (r) => {
    const ms = r.float(64, 89, 2);
    const km = 299792.458 * (ms / 1000);
    return {
      prompt: `A GNSS signal takes ${ms} milliseconds to travel from the satellite to your receiver. How far away is the satellite, in kilometers? (c = 299,792.458 km/s)`,
      answer: +km.toFixed(0), tol: 2, unit: "km",
      explain: `Range = c × t = 299,792.458 km/s × ${(ms / 1000).toFixed(5)} s = ${fmt0(km)} km.`,
    };
  });
  gen("clockError", "ch05", "Range error from clock error", (r) => {
    const ns = r.int(2, 40) * 5;
    const m = 0.299792458 * ns;
    return {
      prompt: `A receiver clock is off by ${ns} nanoseconds. About how large a range error does that cause, in meters?`,
      answer: +m.toFixed(1), tol: 0.3, unit: "m",
      explain: `Light travels about 0.2998 m per nanosecond, so ${ns} ns × 0.2998 m/ns = ${m.toFixed(1)} m. This is why receivers solve for their clock error as a fourth unknown.`,
    };
  });
  gen("dopError", "ch05", "Position error from DOP", (r) => {
    const pdop = r.float(1.2, 6, 1), uere = r.float(0.8, 5, 1);
    return {
      prompt: `Satellite geometry gives a PDOP of ${pdop}, and the user equivalent range error is about ${uere} m. Estimate the 3D position error in meters.`,
      answer: +(pdop * uere).toFixed(2), tol: 0.02, unit: "m",
      explain: `Position error ≈ DOP × range error = ${pdop} × ${uere} m = ${(pdop * uere).toFixed(2)} m. A low DOP means well-spread satellites and a smaller error.`,
    };
  });

  // ch06 — Images
  gen("photoScale", "ch06", "Aerial photo scale", (r) => {
    const f = r.pick([88, 100, 152, 153, 210]);
    const H = r.int(6, 40) * 100;
    const S = H / (f / 1000);
    return {
      prompt: `A vertical aerial photo is taken with a ${f} mm focal-length camera flying ${fmt0(H)} m above level terrain. What is the photo scale denominator (1:?)`,
      answer: Math.round(S), tol: 1, unit: "",
      explain: `Scale = f ÷ H = ${f / 1000} m ÷ ${fmt0(H)} m = 1:${fmt0(Math.round(S))}.`,
    };
  });
  gen("reliefDisplacement", "ch06", "Relief displacement", (r) => {
    const h = r.int(15, 120), H = r.int(8, 30) * 100, rr = r.float(40, 110, 1);
    const d = (rr * h) / H;
    return {
      prompt: `On a vertical photo taken ${fmt0(H)} m above the base of a tower, the top of the ${h} m tower is ${rr} mm from the photo center. How far is the top displaced from the base on the photo, in mm?`,
      answer: +d.toFixed(2), tol: 0.02, unit: "mm",
      explain: `d = r × h ÷ H = ${rr} mm × ${h} m ÷ ${fmt0(H)} m = ${d.toFixed(2)} mm. Displacement points away from the photo center and grows toward the edges.`,
    };
  });
  gen("ndvi", "ch06", "NDVI", (r) => {
    const red = r.float(0.03, 0.2, 2), nir = r.float(0.25, 0.55, 2);
    const v = (nir - red) / (nir + red);
    return {
      prompt: `A pixel has red reflectance ${red} and near-infrared reflectance ${nir}. What is its NDVI (3 decimal places)?`,
      answer: +v.toFixed(3), tol: 0.002, unit: "",
      explain: `NDVI = (NIR − Red) ÷ (NIR + Red) = (${nir} − ${red}) ÷ (${nir} + ${red}) = ${(nir - red).toFixed(2)} ÷ ${(nir + red).toFixed(2)} = ${v.toFixed(3)}. Values well above 0.3 usually mean healthy vegetation.`,
    };
  });
  gen("droneGsd", "ch06", "Drone ground sample distance", (r) => {
    const px = r.pick([2.4, 3.3, 4.4]), f = r.pick([8.8, 10.3, 24]), H = r.int(6, 12) * 10;
    const cm = ((px / 1e6) * H) / (f / 1000) * 100;
    return {
      prompt: `A drone camera has ${px} µm pixels and an ${f} mm lens. Flying ${H} m above the ground, what is the ground sample distance in centimeters?`,
      answer: +cm.toFixed(2), tol: 0.02, unit: "cm",
      explain: `GSD = pixel size × H ÷ f = ${px} µm × ${H} m ÷ ${f} mm = ${(px / 1e6).toExponential(1)} m × ${H} ÷ ${f / 1000} m = ${cm.toFixed(2)} cm.`,
    };
  });

  // ch07 — Digital data
  gen("arcsecSpacing", "ch07", "DEM arc-second spacing", (r) => {
    const [label, sec] = r.pick([["1 arc-second", 1], ["1/3 arc-second", 1 / 3]]);
    const lat = r.int(30, 48);
    const ew = 30.87 * sec * Math.cos(lat * D2R);
    return {
      prompt: `A ${label} DEM covers a site at ${lat}° N. Using 30.87 m for 1″ of latitude, about how far apart are its cells east–west, in meters?`,
      answer: +ew.toFixed(1), tol: 0.15, unit: "m",
      explain: `North–south spacing = 30.87 m × ${sec === 1 ? "1" : "1/3"} = ${(30.87 * sec).toFixed(2)} m. East–west shrinks with cos φ: ${(30.87 * sec).toFixed(2)} × cos ${lat}° = ${ew.toFixed(1)} m.`,
    };
  });

  // ch09 — Spatial analysis
  gen("pointBuffer", "ch09", "Point buffer area", (r) => {
    const rad = r.int(5, 60) * 10;
    const ha = (Math.PI * rad * rad) / 10000;
    return {
      prompt: `You buffer a well by ${rad} m to make a protection zone. What is the zone's area in hectares?`,
      answer: +ha.toFixed(2), tol: Math.max(0.01, ha * 0.003), unit: "ha",
      explain: `Area = πr² = π × ${rad}² = ${fmt0(Math.PI * rad * rad)} m² = ${fmt(ha, 2)} ha (10,000 m² per ha). GIS buffers approximate the circle with segments, so tools may differ slightly.`,
    };
  });
  gen("lineBuffer", "ch09", "Line buffer area", (r) => {
    const L = r.int(4, 30) * 50, rad = r.int(2, 10) * 5;
    const a = 2 * rad * L + Math.PI * rad * rad;
    return {
      prompt: `A straight ${fmt0(L)} m stream segment gets a ${rad} m buffer with round ends. What is the buffer area in m²?`,
      answer: Math.round(a), tol: Math.max(2, a * 0.003), unit: "m²",
      explain: `A straight-line buffer is a rectangle plus two half-circles: 2rL + πr² = 2 × ${rad} × ${fmt0(L)} + π × ${rad}² = ${fmt0(2 * rad * L)} + ${fmt0(Math.PI * rad * rad)} = ${fmt0(a)} m².`,
    };
  });

  // ch10 — Raster analysis
  gen("focalMean", "ch10", "3 × 3 focal mean", (r) => {
    const v = Array.from({ length: 9 }, () => r.int(10, 60));
    const mean = v.reduce((a, b) => a + b, 0) / 9;
    const rows = [v.slice(0, 3), v.slice(3, 6), v.slice(6, 9)];
    return {
      prompt: `A 3 × 3 focal mean filter runs over this window (rows top to bottom): ${rows.map((x) => x.join(", ")).join("; ")}. What value does the center cell get (2 decimal places)?`,
      answer: +mean.toFixed(2), tol: 0.01, unit: "",
      explain: `Sum of the nine cells = ${v.reduce((a, b) => a + b, 0)}. Mean = ${v.reduce((a, b) => a + b, 0)} ÷ 9 = ${mean.toFixed(2)}.`,
    };
  });

  // ch11 — Terrain
  gen("slopeRiseRun", "ch11", "Slope from rise and run", (r) => {
    const run = r.int(5, 40) * 10, rise = r.int(2, 60);
    const deg = Math.atan(rise / run) / D2R;
    return {
      prompt: `Ground rises ${rise} m over a horizontal distance of ${run} m. What is the slope in degrees (2 decimal places)?`,
      answer: +deg.toFixed(2), tol: 0.02, unit: "°",
      explain: `Percent slope = ${rise} ÷ ${run} × 100 = ${((rise / run) * 100).toFixed(2)}%. Degrees = arctan(${rise} ÷ ${run}) = ${deg.toFixed(2)}°.`,
    };
  });
  gen("slopeNeighbors", "ch11", "Slope from neighboring cells", (r) => {
    const c = r.pick([10, 30]);
    const z = r.int(1200, 1600);
    const E = z + r.int(-12, 12), W = z + r.int(-12, 12), N = z + r.int(-12, 12), S = z + r.int(-12, 12);
    const dzdx = (E - W) / (2 * c), dzdy = (N - S) / (2 * c);
    const deg = Math.atan(Math.hypot(dzdx, dzdy)) / D2R;
    return {
      prompt: `On a ${c} m DEM, the cells east, west, north and south of a cell have elevations ${E}, ${W}, ${N} and ${S} m. Using the four-neighbor method, what is the slope in degrees?`,
      answer: +deg.toFixed(2), tol: 0.05, unit: "°",
      explain: `dz/dx = (E − W) ÷ 2c = (${E} − ${W}) ÷ ${2 * c} = ${dzdx.toFixed(4)}. dz/dy = (N − S) ÷ 2c = (${N} − ${S}) ÷ ${2 * c} = ${dzdy.toFixed(4)}. Slope = arctan √(dz/dx² + dz/dy²) = ${deg.toFixed(2)}°.`,
    };
  });

  // ch12 — Interpolation
  gen("idw", "ch12", "Inverse distance weighting", (r) => {
    const pts = Array.from({ length: 3 }, () => ({ d: r.int(2, 30) * 10, z: r.int(1300, 1500) }));
    const w = pts.map((p) => 1 / (p.d * p.d));
    const sw = w.reduce((a, b) => a + b, 0);
    const est = pts.reduce((s, p, i) => s + w[i] * p.z, 0) / sw;
    return {
      prompt: `Estimate the elevation at an unsampled point with IDW (power 2) from three samples: ${pts.map((p) => `${p.z} m at ${p.d} m away`).join("; ")}. Answer to 0.1 m.`,
      answer: +est.toFixed(1), tol: 0.1, unit: "m",
      explain: `Weights are 1/d²: ${w.map((x) => x.toExponential(3)).join(", ")}. Estimate = Σ(w·z) ÷ Σw = ${est.toFixed(1)} m. The closest sample has the most influence.`,
    };
  });

  // ch13 — Models
  gen("weightedOverlay", "ch13", "Weighted overlay score", (r) => {
    const names = ["slope", "distance to road", "soil", "flood risk"];
    const raw = names.map(() => r.int(1, 5));
    let wts = [r.int(1, 5), r.int(1, 5), r.int(1, 5), r.int(1, 5)];
    const sum = wts.reduce((a, b) => a + b, 0);
    wts = wts.map((x) => x / sum);
    const score = raw.reduce((s, v, i) => s + v * wts[i], 0);
    return {
      prompt: `A suitability model scores each factor 1–5. One site scores ${names.map((n, i) => `${n} ${raw[i]}`).join(", ")}. The weights are ${wts.map((x) => x.toFixed(3)).join(", ")} in the same order. What is the site's weighted score (2 decimals)?`,
      answer: +score.toFixed(2), tol: 0.01, unit: "",
      explain: `Score = Σ(score × weight) = ${raw.map((v, i) => `${v}×${wts[i].toFixed(3)}`).join(" + ")} = ${score.toFixed(2)}.`,
    };
  });

  // ch14 — Data quality
  gen("rmse", "ch14", "RMSE from checkpoints", (r) => {
    const e = Array.from({ length: 5 }, () => r.float(-0.3, 0.3, 2));
    const rmse = Math.sqrt(e.reduce((s, x) => s + x * x, 0) / e.length);
    return {
      prompt: `Five checkpoints on a drone-derived surface have elevation errors of ${e.join(", ")} m. What is the vertical RMSE in meters (3 decimals)?`,
      answer: +rmse.toFixed(3), tol: 0.002, unit: "m",
      explain: `Square each error, average, then take the square root: √((${e.map((x) => `${x}²`).join(" + ")}) ÷ 5) = ${rmse.toFixed(3)} m.`,
    };
  });
  gen("nssda", "ch14", "NSSDA horizontal accuracy", (r) => {
    const rx = r.float(0.05, 1.5, 2);
    const rr = Math.SQRT2 * rx;
    const acc = 1.7308 * rr;
    return {
      prompt: `A dataset has RMSE_x = RMSE_y = ${rx} m. What horizontal accuracy at 95% confidence does NSSDA report, in meters?`,
      answer: +acc.toFixed(2), tol: 0.01, unit: "m",
      explain: `RMSE_r = √(RMSE_x² + RMSE_y²) = ${rr.toFixed(3)} m. Accuracy_r = 1.7308 × RMSE_r = ${acc.toFixed(2)} m.`,
    };
  });
  gen("overallAccuracy", "ch14", "Classification overall accuracy", (r) => {
    const m = [
      [r.int(40, 80), r.int(0, 8), r.int(0, 8)],
      [r.int(0, 8), r.int(30, 70), r.int(0, 8)],
      [r.int(0, 8), r.int(0, 8), r.int(20, 60)],
    ];
    const diag = m[0][0] + m[1][1] + m[2][2];
    const total = m.flat().reduce((a, b) => a + b, 0);
    const oa = (diag / total) * 100;
    return {
      prompt: `A land-cover classification's error matrix (rows = classified forest, water, urban; columns = reference in the same order) is: ${m.map((x) => x.join(", ")).join("; ")}. What is the overall accuracy in percent (1 decimal)?`,
      answer: +oa.toFixed(1), tol: 0.1, unit: "%",
      explain: `Overall accuracy = correct ÷ total = (${m[0][0]} + ${m[1][1]} + ${m[2][2]}) ÷ ${total} = ${diag} ÷ ${total} = ${oa.toFixed(1)}%.`,
    };
  });

  // QGIS in practice
  gen("areaAcres", "qgis", "Area units in the Field Calculator", (r) => {
    const m2 = r.int(8, 400) * 250;
    const ac = m2 / 4046.8564;
    return {
      prompt: `In the Field Calculator, \`$area\` returns ${fmt0(m2)} for a parcel in a layer whose CRS uses meters. How many acres is that (2 decimals)? (1 acre = 4,046.86 m²)`,
      answer: +ac.toFixed(2), tol: 0.01, unit: "acres",
      explain: `${fmt0(m2)} m² ÷ 4,046.86 m²/acre = ${ac.toFixed(2)} acres. In QGIS you could write \`$area / 4046.86\`.`,
    };
  });

  GIS.generators = G;

  /* ---------- Build a test ----------
     Round-robin across chapters so every chapter shows up, with
     calculation questions mixed in. Same seed → same test. */
  GIS.buildTest = function ({ chapterIds, count, seed, calc = true }) {
    const r = rng(seed);
    const pools = chapterIds
      .map((id) => {
        const ch = GIS.chapters.find((c) => c.id === id);
        if (!ch) return null;
        const items = ch.questions.map((q) => ({ kind: "static", ch, q }));
        if (calc) Object.values(G).filter((g) => g.chapter === id).forEach((g) => items.push({ kind: "gen", ch, g }));
        return r.shuffle(items);
      })
      .filter((p) => p && p.length);

    const picked = [];
    let i = 0;
    while (picked.length < count && pools.some((p) => p.length)) {
      const p = pools[i % pools.length];
      if (p.length) picked.push(p.pop());
      i++;
    }

    return r.shuffle(picked).map((it, n) => {
      if (it.kind === "gen") {
        const g = it.g.make(r);
        return { n, chapter: it.ch.id, chapterTitle: it.ch.title, type: "num", generated: true, label: it.g.label, ...g };
      }
      const q = it.q;
      const out = { n, chapter: it.ch.id, chapterTitle: it.ch.title, id: q.id, type: q.type, prompt: q.prompt, explain: q.explain };
      if (q.type === "mc") {
        const order = r.shuffle([0, 1, 2, 3]);
        out.choices = order.map((k) => q.choices[k]);
        out.answer = order.indexOf(q.answer);
      } else {
        out.answer = q.answer;
        if (q.type === "num") { out.tol = q.tol; out.unit = q.unit || ""; }
      }
      return out;
    });
  };

  GIS.grade = function (q, response) {
    if (response === undefined || response === null || response === "") return false;
    if (q.type === "mc") return Number(response) === q.answer;
    if (q.type === "tf") return String(response) === String(q.answer);
    const x = parseFloat(String(response).replace(/,/g, "").replace(/[^\d.eE+-]/g, ""));
    return isFinite(x) && Math.abs(x - q.answer) <= (q.tol || 0) + 1e-9;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = GIS;
  else root.GIS = GIS;
})(typeof window !== "undefined" ? window : globalThis);
