/* Coordinate geometry */
(function (F) {
  "use strict";
  const { fmt, D2R } = F;

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "inverse",
    group: "Coordinate geometry",
    title: "Inverse",
    icon: "arrows-left-right",
    blurb: "Distance, azimuth and bearing between two coordinate points.",
    inputs: [
      { id: "n1", label: "Point 1 northing", type: "num", value: "5000.000", unit: "L" },
      { id: "e1", label: "Point 1 easting", type: "num", value: "2000.000", unit: "L" },
      { id: "n2", label: "Point 2 northing", type: "num", value: "5342.118", unit: "L" },
      { id: "e2", label: "Point 2 easting", type: "num", value: "2419.736", unit: "L" },
    ],
    compute(v, U) {
      if (![v.n1, v.e1, v.n2, v.e2].every(isFinite)) return { error: "Enter both points." };
      const dN = v.n2 - v.n1, dE = v.e2 - v.e1;
      const d = Math.hypot(dN, dE);
      if (d === 0) return { error: "The two points are the same." };
      const az = F.mod360(Math.atan2(dE, dN) / D2R);
      return {
        outputs: [
          { id: "d", label: "Horizontal distance", value: d, d: 3, unit: U.L, tol: 0.005 },
          { id: "az", label: "Azimuth 1 → 2", value: az, kind: "angle", tol: 2 / 3600 },
          { id: "brg", label: "Bearing 1 → 2", value: az, kind: "bearing", tol: 2 / 3600 },
        ],
        steps: [
          `ΔN = N₂ − N₁ = ${fmt(v.n2)} − ${fmt(v.n1)} = ${fmt(dN)}`,
          `ΔE = E₂ − E₁ = ${fmt(v.e2)} − ${fmt(v.e1)} = ${fmt(dE)}`,
          `Distance = √(ΔN² + ΔE²) = √(${fmt(dN)}² + ${fmt(dE)}²) = ${fmt(d)} ${U.L}`,
          `Azimuth = atan2(ΔE, ΔN) = ${F.azText(az)} (atan2 puts it in the right quadrant: ΔN ${dN >= 0 ? "+" : "−"}, ΔE ${dE >= 0 ? "+" : "−"})`,
          `Bearing = ${F.bearing(az, 1)}`,
        ],
      };
    },
    explain: [
      "An inverse turns two coordinates back into the distance and direction between them. You use it to check a traverse, to stake a point from a known control point, or to write a legal description from coordinates.",
      "Use atan2(ΔE, ΔN), or work out the quadrant from the signs of ΔN and ΔE. A plain arctan(ΔE/ΔN) gives the wrong answer in three of the four quadrants.",
    ],
    formulas: ["d = √(ΔN² + ΔE²)", "Az = atan2(ΔE, ΔN)"],
    field: "Northing comes first in survey notation (N, E), but x is easting in most software. Mixing the order rotates your answer.",
    practice(r) {
      return {
        values: {
          n1: r.float(4000, 6000, 3).toFixed(3), e1: r.float(1000, 3000, 3).toFixed(3),
          n2: r.float(4000, 6000, 3).toFixed(3), e2: r.float(1000, 3000, 3).toFixed(3),
        },
        ask: ["d", "az"],
      };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "forward",
    group: "Coordinate geometry",
    title: "Forward (radial stakeout)",
    icon: "arrow-up-right",
    blurb: "New coordinates from a known point, a direction and a distance.",
    inputs: [
      { id: "n1", label: "Known point northing", type: "num", value: "5000.000", unit: "L" },
      { id: "e1", label: "Known point easting", type: "num", value: "2000.000", unit: "L" },
      { id: "dir", label: "Azimuth or bearing", type: "direction", value: "N 50 52 10 E" },
      { id: "dist", label: "Horizontal distance", type: "num", value: "542.700", unit: "L" },
    ],
    compute(v, U) {
      if (![v.n1, v.e1, v.dir, v.dist].every(isFinite)) return { error: "Enter the point, a direction and a distance." };
      const lat = v.dist * Math.cos(v.dir * D2R), dep = v.dist * Math.sin(v.dir * D2R);
      return {
        outputs: [
          { id: "n2", label: "New northing", value: v.n1 + lat, d: 3, unit: U.L, tol: 0.005 },
          { id: "e2", label: "New easting", value: v.e1 + dep, d: 3, unit: U.L, tol: 0.005 },
          { id: "lat", label: "Latitude (ΔN)", value: lat, d: 3, unit: U.L, tol: 0.005 },
          { id: "dep", label: "Departure (ΔE)", value: dep, d: 3, unit: U.L, tol: 0.005 },
        ],
        steps: [
          `Azimuth = ${F.azText(v.dir)}`,
          `Latitude = d·cos Az = ${fmt(v.dist)} × ${Math.cos(v.dir * D2R).toFixed(6)} = ${fmt(lat)}`,
          `Departure = d·sin Az = ${fmt(v.dist)} × ${Math.sin(v.dir * D2R).toFixed(6)} = ${fmt(dep)}`,
          `N₂ = ${fmt(v.n1)} + ${fmt(lat)} = ${fmt(v.n1 + lat)}`,
          `E₂ = ${fmt(v.e1)} + ${fmt(dep)} = ${fmt(v.e1 + dep)}`,
        ],
      };
    },
    explain: [
      "The forward computation is the inverse in reverse: start at a known point, go a known distance in a known direction, and find where you land. It is how you compute property corners from a deed and how a total station computes each shot.",
    ],
    formulas: ["Lat = d·cos Az", "Dep = d·sin Az", "N₂ = N₁ + Lat", "E₂ = E₁ + Dep"],
    field: "Distances must be horizontal and on the same grid as your coordinates. See the grid-to-ground tool for State Plane work.",
    practice(r) {
      const az = r.int(0, 359) + r.int(0, 59) / 60;
      return {
        values: { n1: "5000.000", e1: "2000.000", dir: F.azText(az, 0).replace(/[°′″]/g, " ").trim(), dist: r.float(100, 900, 3).toFixed(3) },
        ask: ["n2", "e2"],
      };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "area-coords",
    group: "Coordinate geometry",
    title: "Area by coordinates",
    icon: "polygon",
    blurb: "Parcel area and perimeter from corner coordinates (the shoelace method).",
    inputs: [
      {
        id: "pts",
        label: "Corners, in order around the parcel",
        type: "rows",
        cols: [
          { id: "pt", label: "Point", type: "text" },
          { id: "n", label: "Northing", type: "num", unit: "L" },
          { id: "e", label: "Easting", type: "num", unit: "L" },
        ],
        rows: [
          ["1", "1000.00", "1000.00"],
          ["2", "1320.50", "1045.20"],
          ["3", "1295.75", "1410.85"],
          ["4", "1010.40", "1388.10"],
        ],
      },
    ],
    compute(v, U) {
      const P = v.pts.filter((p) => isFinite(p.n) && isFinite(p.e));
      if (P.length < 3) return { error: "Enter at least three corners with northing and easting." };
      const n = P.length;
      let s1 = 0, s2 = 0, per = 0;
      const rows = P.map((p, i) => {
        const q = P[(i + 1) % n];
        const a = p.e * q.n, b = q.e * p.n;
        s1 += a; s2 += b; per += Math.hypot(q.n - p.n, q.e - p.e);
        return [p.pt || String(i + 1), fmt(p.n), fmt(p.e), fmt(a, 2), fmt(b, 2)];
      });
      const area = Math.abs(s1 - s2) / 2;
      const big = U.L === "ft" ? { v: area / 43560, u: "acres", id: "ac" } : { v: area / 10000, u: "ha", id: "ha" };
      return {
        outputs: [
          { id: "area", label: "Area", value: area, d: 2, unit: U.A, tol: 0.5 },
          { id: big.id, label: U.L === "ft" ? "Area in acres" : "Area in hectares", value: big.v, d: 4, unit: big.u, tol: 0.0005 },
          { id: "per", label: "Perimeter", value: per, d: 3, unit: U.L, tol: 0.01 },
        ],
        steps: [
          `Multiply each easting by the next point's northing, and each next easting by this northing (see table).`,
          `Σ Eᵢ·Nᵢ₊₁ = ${fmt(s1, 2)}`,
          `Σ Eᵢ₊₁·Nᵢ = ${fmt(s2, 2)}`,
          `Area = |${fmt(s1, 2)} − ${fmt(s2, 2)}| ÷ 2 = ${fmt(area, 2)} ${U.A}`,
          U.L === "ft" ? `${fmt(area, 2)} ÷ 43,560 = ${fmt(area / 43560, 4)} acres` : `${fmt(area, 2)} ÷ 10,000 = ${fmt(area / 10000, 4)} ha`,
          `The sign of (Σ₁ − Σ₂) tells direction: ${s1 - s2 > 0 ? "positive, so the points run counterclockwise" : "negative, so the points run clockwise"}.`,
        ],
        table: { head: ["Point", "N", "E", "Eᵢ·Nᵢ₊₁", "Eᵢ₊₁·Nᵢ"], rows },
      };
    },
    explain: [
      "The coordinate (shoelace) method finds the area of any simple polygon from its corners. It is how survey software and GIS compute parcel areas.",
      "The corners must be in order around the boundary, either direction, and the boundary must not cross itself.",
    ],
    formulas: ["2A = |Σ (Eᵢ·Nᵢ₊₁ − Eᵢ₊₁·Nᵢ)|", "1 acre = 43,560 ft²; 1 ha = 10,000 m²"],
    field: "Large coordinates make huge cross products. Subtract a round number from every N and E first; the area doesn't change.",
    practice(r) {
      const c = [[1000, 1000], [1000 + r.int(200, 400), 1000 + r.int(-50, 80)], [1000 + r.int(200, 400), 1000 + r.int(300, 500)], [1000 + r.int(-30, 30), 1000 + r.int(300, 500)]];
      return { values: { pts: c.map(([n, e], i) => [String(i + 1), n.toFixed(2), e.toFixed(2)]) }, ask: ["area", "per"] };
    },
  });

  /* ------------------------------------------------------------------ */
  F.tool({
    id: "traverse",
    group: "Coordinate geometry",
    title: "Traverse closure & compass rule",
    icon: "compass-tool",
    blurb: "The full interactive module: drag stations, add error, step through the adjustment.",
    link: "../traverse/",
  });
})(typeof window !== "undefined" ? window.FIELD : globalThis.FIELD);
