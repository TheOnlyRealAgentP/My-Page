/* =========================================================================
   Closed-loop traverse reduction
   -------------------------------------------------------------------------
   Pure functions, no DOM. Works in the browser (window.TraverseMath) and
   in Node (module.exports) so it can be tested on its own.

   Conventions
     - Coordinates are (E, N) in meters.
     - Azimuths are degrees clockwise from north, in [0, 360).
     - Leg i runs from station i to station i+1 (the last leg returns to 0).
     - Interior angle i is measured at station i between leg i-1 and leg i.
   ========================================================================= */
(function (root) {
  "use strict";

  const RHO = 180 / Math.PI;
  const mod360 = (a) => ((a % 360) + 360) % 360;

  function azimuth(p, q) {
    return mod360(Math.atan2(q.e - p.e, q.n - p.n) * RHO);
  }

  function distance(p, q) {
    return Math.hypot(q.e - p.e, q.n - p.n);
  }

  /** Twice the signed area. Positive = counterclockwise (E right, N up). */
  function signedArea2(pts) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      s += a.e * b.n - b.e * a.n;
    }
    return s;
  }

  /** True when any two non-adjacent legs cross. */
  function selfIntersects(pts) {
    const n = pts.length;
    const orient = (a, b, c) => (b.e - a.e) * (c.n - a.n) - (b.n - a.n) * (c.e - a.e);
    const cross = (p1, p2, p3, p4) => {
      const d1 = orient(p3, p4, p1), d2 = orient(p3, p4, p2);
      const d3 = orient(p1, p2, p3), d4 = orient(p1, p2, p4);
      return d1 * d2 < 0 && d3 * d4 < 0;
    };
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (j === i + 1 || (i === 0 && j === n - 1)) continue; // adjacent legs share a station
        if (cross(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return true;
      }
    }
    return false;
  }

  /** Interior angle at each station from true geometry. */
  function interiorAngles(pts, ccw) {
    const n = pts.length;
    return pts.map((p, i) => {
      const back = azimuth(p, pts[(i - 1 + n) % n]);
      const fore = azimuth(p, pts[(i + 1) % n]);
      return ccw ? mod360(fore - back) : mod360(back - fore);
    });
  }

  /**
   * Reduce a closed traverse.
   * @param {Array<{e:number,n:number}>} truth  true station positions
   * @param {Array<{a:number,d:number}>} noise  standard-normal draws per station/leg
   * @param {{angleSec:number, distMm:number, distPpm:number}} sigma  instrument precision
   */
  function reduce(truth, noise, sigma) {
    const n = truth.length;
    const ccw = signedArea2(truth) > 0;

    /* ---- 1. Field measurements (truth + random error) ---- */
    const trueAngles = interiorAngles(truth, ccw);
    const trueDist = truth.map((p, i) => distance(p, truth[(i + 1) % n]));

    const measAngles = trueAngles.map((a, i) => a + (noise[i].a * sigma.angleSec) / 3600);
    const measDist = trueDist.map(
      (d, i) => d + noise[i].d * (sigma.distMm / 1000 + (sigma.distPpm * 1e-6) * d)
    );

    /* ---- 2. Angle balancing ---- */
    const angleSumTheory = (n - 2) * 180;
    const angleSumMeas = measAngles.reduce((s, a) => s + a, 0);
    const angMisclosure = angleSumMeas - angleSumTheory; // degrees
    const angCorrection = -angMisclosure / n;
    const balAngles = measAngles.map((a) => a + angCorrection);

    /* ---- 3. Azimuths ---- */
    // The first leg's azimuth is the fixed reference (e.g. from a known mark).
    const turn = ccw ? 1 : -1;
    const az = new Array(n);
    az[0] = azimuth(truth[0], truth[1]);
    for (let i = 1; i < n; i++) az[i] = mod360(az[i - 1] + 180 + turn * balAngles[i]);
    const azCheck = mod360(az[n - 1] + 180 + turn * balAngles[0]); // should equal az[0]

    /* ---- 4. Latitudes and departures ---- */
    const lat = az.map((a, i) => measDist[i] * Math.cos(a / RHO));
    const dep = az.map((a, i) => measDist[i] * Math.sin(a / RHO));
    const sumLat = lat.reduce((s, v) => s + v, 0);
    const sumDep = dep.reduce((s, v) => s + v, 0);
    const perimeter = measDist.reduce((s, v) => s + v, 0);
    const linMisclosure = Math.hypot(sumLat, sumDep);
    const precision = linMisclosure > 0 ? perimeter / linMisclosure : Infinity;

    /* ---- 5. Compass (Bowditch) rule ---- */
    const corrLat = measDist.map((d) => (-sumLat * d) / perimeter);
    const corrDep = measDist.map((d) => (-sumDep * d) / perimeter);
    const adjLat = lat.map((v, i) => v + corrLat[i]);
    const adjDep = dep.map((v, i) => v + corrDep[i]);

    /* ---- 6. Coordinates ---- */
    const start = { e: truth[0].e, n: truth[0].n };
    const raw = [start];
    const adj = [start];
    for (let i = 0; i < n; i++) {
      raw.push({ e: raw[i].e + dep[i], n: raw[i].n + lat[i] });
      adj.push({ e: adj[i].e + adjDep[i], n: adj[i].n + adjLat[i] });
    }
    // raw[n] is where the unadjusted traverse ends (should be station 0).
    // adj[n] equals station 0 to rounding error.

    const posError = adj.slice(0, n).map((p, i) => distance(p, truth[i]));

    return {
      n, ccw,
      trueAngles, trueDist,
      measAngles, measDist,
      angleSumTheory, angleSumMeas, angMisclosure, angCorrection, balAngles,
      az, azCheck,
      lat, dep, sumLat, sumDep, perimeter, linMisclosure, precision,
      corrLat, corrDep, adjLat, adjDep,
      raw, adj, posError,
    };
  }

  const api = { reduce, azimuth, distance, signedArea2, selfIntersects, interiorAngles, mod360 };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TraverseMath = api;
})(typeof window !== "undefined" ? window : this);
