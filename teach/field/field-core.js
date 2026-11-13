/* =========================================================================
   Field math: shared core
   - FIELD.tool(): tool files register themselves here
   - parsing and formatting for angles, bearings and stations
   Works in the browser (window.FIELD) and in Node (module.exports) for tests.
   ========================================================================= */
(function (root) {
  "use strict";

  const F = root.FIELD || {};
  F.tools = F.tools || [];
  F.tool = (t) => F.tools.push(t);

  const D2R = Math.PI / 180;
  F.D2R = D2R;
  F.mod360 = (a) => ((a % 360) + 360) % 360;

  /* ---------- Units ----------
     Length unit is global: "ft" (US practice) or "m". Stations are 100 ft
     apart in feet and 1,000 m apart in meters (1+234.567). */
  F.UNITS = {
    ft: { L: "ft", A: "ft²", V: "yd³", station: 100, g: 32.174, manningK: 1.49, earthR: 6371000 / 0.3048 },
    m: { L: "m", A: "m²", V: "m³", station: 1000, g: 9.80665, manningK: 1.0, earthR: 6371000 },
  };

  /* ---------- Numbers ---------- */
  F.fmt = (x, d = 3) =>
    isFinite(x)
      ? Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
      : "—";
  F.num = (s) => {
    if (typeof s === "number") return s;
    const t = String(s ?? "").replace(/,/g, "").trim();
    if (t === "") return NaN;
    return Number(t);
  };

  /* ---------- Angles ----------
     Accepts 123.4567 · 123 45 30 · 123°45'30" · 123-45-30 · 123d45m30s */
  F.parseAngle = (s) => {
    if (typeof s === "number") return s;
    const t = String(s ?? "").trim();
    if (!t) return NaN;
    const neg = /^\s*-/.test(t);
    const parts = t.match(/\d+(?:\.\d+)?/g);
    if (!parts || parts.length > 3) return NaN;
    const [d, m = 0, sec = 0] = parts.map(Number);
    if (parts.length > 1 && (m >= 60 || sec >= 60)) return NaN;
    const v = d + m / 60 + sec / 3600;
    return neg ? -v : v;
  };
  F.dms = (deg, dec = 1) => {
    if (!isFinite(deg)) return "—";
    const neg = deg < 0;
    const x = Math.abs(deg);
    let d = Math.floor(x);
    let m = Math.floor((x - d) * 60);
    const f = 10 ** dec;
    let s = Math.round(((x - d) * 60 - m) * 60 * f) / f;
    if (s >= 60) { s -= 60; m++; }
    if (m >= 60) { m -= 60; d++; }
    const ss = s.toFixed(dec).padStart(dec ? 3 + dec : 2, "0");
    return `${neg ? "−" : ""}${d}°${String(m).padStart(2, "0")}′${ss}″`;
  };
  F.azText = (az, dec = 1) => {
    const s = F.dms(F.mod360(az), dec);
    return s.startsWith("360°") ? s.replace("360°", "0°") : s;
  };

  /* ---------- Bearings ---------- */
  F.parseBearing = (s) => {
    const m = String(s ?? "").trim().match(/^([NS])\s*(.+?)\s*([EW])$/i);
    if (!m) return NaN;
    const th = F.parseAngle(m[2]);
    if (!isFinite(th) || th > 90) return NaN;
    const ns = m[1].toUpperCase(), ew = m[3].toUpperCase();
    if (ns === "N" && ew === "E") return th;
    if (ns === "S" && ew === "E") return 180 - th;
    if (ns === "S" && ew === "W") return 180 + th;
    return F.mod360(360 - th);
  };
  // Azimuth or bearing text → azimuth in degrees
  F.parseDirection = (s) => (/[NSns]/.test(String(s)) ? F.parseBearing(s) : F.parseAngle(s));
  F.bearing = (az, dec = 0) => {
    const a = F.mod360(az);
    let ns, ew, th;
    if (a <= 90) { ns = "N"; ew = "E"; th = a; }
    else if (a <= 180) { ns = "S"; ew = "E"; th = 180 - a; }
    else if (a <= 270) { ns = "S"; ew = "W"; th = a - 180; }
    else { ns = "N"; ew = "W"; th = 360 - a; }
    return `${ns} ${F.dms(th, dec)} ${ew}`;
  };

  /* ---------- Stations ---------- */
  F.parseStation = (s, U = "ft") => {
    if (typeof s === "number") return s;
    const t = String(s ?? "").replace(/\s/g, "");
    if (!t) return NaN;
    const m = t.match(/^(-?\d+)\+(\d+(?:\.\d+)?)$/);
    if (m) return Number(m[1]) * F.UNITS[U].station + Number(m[2]);
    return F.num(t);
  };
  F.station = (x, U = "ft") => {
    if (!isFinite(x)) return "—";
    const S = F.UNITS[U].station;
    const dec = U === "ft" ? 2 : 3;
    const r = Math.round(x * 10 ** dec) / 10 ** dec;
    const big = Math.floor(r / S);
    const rest = r - big * S;
    const w = String(S).length - 1 + dec + 1; // digits before point + point + decimals
    return `${big}+${rest.toFixed(dec).padStart(w, "0")}`;
  };

  /* ---------- Inputs ----------
     raw: { inputId: string, rowsInputId: [[cell strings]] } → parsed values */
  const parseOne = (type, x, Ukey) => {
    if (type === "num") return F.num(x);
    if (type === "angle") return F.parseAngle(x);
    if (type === "direction") return F.parseDirection(x);
    if (type === "station") return F.parseStation(x, Ukey);
    return String(x ?? "").trim();
  };
  F.parseInputs = (tool, raw, Ukey) => {
    const v = {};
    for (const inp of tool.inputs || []) {
      const x = raw[inp.id] !== undefined ? raw[inp.id] : inp.type === "rows" ? inp.rows : inp.value;
      v[inp.id] =
        inp.type === "rows"
          ? x.map((row) => Object.fromEntries(inp.cols.map((c, j) => [c.id, parseOne(c.type, row[j], Ukey)])))
          : parseOne(inp.type, x, Ukey);
    }
    return v;
  };
  // How an output is shown, and how a typed practice answer is read
  F.showOutput = (o, Ukey) => {
    if (o.text) return o.text;
    if (o.kind === "angle") return F.azText(o.value, 1);
    if (o.kind === "bearing") return F.bearing(o.value, 1);
    if (o.kind === "station") return F.station(o.value, Ukey);
    return `${F.fmt(o.value, o.d ?? 3)}${o.unit ? " " + o.unit : ""}`;
  };
  F.checkAnswer = (o, answer, Ukey) => {
    let x;
    if (o.kind === "angle") x = F.parseAngle(answer);
    else if (o.kind === "bearing") x = F.parseDirection(answer);
    else if (o.kind === "station") x = F.parseStation(answer, Ukey);
    else {
      const m = String(answer).replace(/,/g, "").match(/-?\d*\.?\d+(?:e[+-]?\d+)?/i);
      x = m ? Number(m[0]) : NaN;
    }
    if (!isFinite(x)) return false;
    let diff = x - o.value;
    if (o.kind === "angle" || o.kind === "bearing") diff = ((diff % 360) + 540) % 360 - 180;
    return Math.abs(diff) <= (o.tol ?? 0) + 1e-9;
  };

  /* ---------- Statistics ---------- */
  // Two-sided 95% Student t critical values, df 1–30
  const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131,
    2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042];
  F.t95 = (df) => (df < 1 ? NaN : df <= 30 ? T95[df - 1] : 1.96 + 2.4 / df);

  /* ---------- Seeded random for practice problems ---------- */
  F.rng = (seed) => {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      float: (lo, hi, d = 2) => +(lo + next() * (hi - lo)).toFixed(d),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
    };
  };

  if (typeof module !== "undefined" && module.exports) module.exports = F;
  else root.FIELD = F;
})(typeof window !== "undefined" ? window : globalThis);
