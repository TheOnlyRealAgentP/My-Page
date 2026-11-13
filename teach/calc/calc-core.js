/* =========================================================================
   Engineering calculator core
   Parser and evaluator (no eval), number formatting, statistics and
   regression, matrices, numeric calculus and solvers, polynomial roots,
   unit conversion and constants. Runs in the browser (window.CALC) and in
   Node for testing (globalThis.CALC).
   ========================================================================= */
(function (root) {
  "use strict";
  const C = {};

  class CalcError extends Error {
    constructor(msg, pos) {
      super(msg);
      this.pos = pos;
    }
  }
  C.CalcError = CalcError;
  const fail = (msg, pos) => {
    throw new CalcError(msg, pos);
  };

  // Why the last NaN/Infinity happened (set by math ops, read at the top level)
  let why = "";
  const domain = (msg) => {
    if (!why) why = msg;
    return NaN;
  };

  /* ---------------------------------------------------------------------
     Value types: number | list (Array of numbers) | matrix {mat: [[...]]}
     --------------------------------------------------------------------- */
  const isNum = (v) => typeof v === "number";
  const isList = (v) => Array.isArray(v);
  const isMat = (v) => v !== null && typeof v === "object" && Array.isArray(v.mat);
  const mat = (rows) => ({ mat: rows });
  const typeName = (v) => (isNum(v) ? "a number" : isList(v) ? "a list" : isMat(v) ? "a matrix" : "a value");
  C.isNum = isNum;
  C.isList = isList;
  C.isMat = isMat;

  /* ---------------------------------------------------------------------
     Tokenizer
     --------------------------------------------------------------------- */
  const isDigit = (c) => c >= "0" && c <= "9";
  const ID_START = /[A-Za-z_Ͱ-Ͽ]/;
  const ID_CHAR = /[A-Za-z0-9_Ͱ-Ͽ]/;
  const SINGLE = {
    "+": "+", "-": "-", "−": "-", "–": "-", "*": "*", "×": "*", "·": "*", "/": "/", "÷": "/", "^": "^",
    "(": "(", ")": ")", ",": ",", "!": "!", "%": "%", "=": "=", "<": "<", ">": ">", "[": "[", "]": "]",
    "{": "{", "}": "}", "°": "°", "'": "'", "′": "'", '"': '"', "″": '"', "√": "√", "∛": "∛", "²": "²",
    "³": "³", "ᵀ": "ᵀ", "→": "->", "≤": "<=", "≥": ">=", "≠": "!=", "Σ": "Σ", "∫": "∫",
  };

  function tokenize(src) {
    const out = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) {
        i++;
        continue;
      }
      const start = i;
      if (isDigit(c) || (c === "." && isDigit(src[i + 1] || ""))) {
        let j = i;
        while (isDigit(src[j] || "")) j++;
        if (src[j] === ".") {
          j++;
          while (isDigit(src[j] || "")) j++;
        }
        if (/[eEᴇ]/.test(src[j] || "")) {
          let k = j + 1;
          if (src[k] === "+" || src[k] === "-" || src[k] === "−") k++;
          if (isDigit(src[k] || "")) {
            j = k;
            while (isDigit(src[j] || "")) j++;
          }
        }
        const text = src.slice(i, j).replace("ᴇ", "e").replace("−", "-");
        out.push({ t: "num", v: parseFloat(text), pos: start });
        i = j;
        continue;
      }
      if (c === "Σ" || c === "∫") {
        out.push({ t: "id", v: c === "Σ" ? "sigma" : "fnInt", pos: start });
        i++;
        continue;
      }
      if (ID_START.test(c)) {
        let j = i + 1;
        while (j < src.length && ID_CHAR.test(src[j])) j++;
        out.push({ t: "id", v: src.slice(i, j), pos: start });
        i = j;
        continue;
      }
      const two = src.slice(i, i + 2);
      if (["->", "<=", ">=", "==", "!=", "**", "⁻¹"].includes(two)) {
        out.push({ t: "op", v: two === "**" ? "^" : two, pos: start });
        i += 2;
        continue;
      }
      if (SINGLE[c]) {
        out.push({ t: "op", v: SINGLE[c], pos: start });
        i++;
        continue;
      }
      fail(`Unexpected character "${c}"`, start);
    }
    return out;
  }
  C.tokenize = tokenize;

  /* ---------------------------------------------------------------------
     Parser (precedence climbing). AST nodes:
       num, var, call, neg, bin, inv, deg, list, matlit
     Statements: expr | assign | define | store | equation
     --------------------------------------------------------------------- */
  const CMP = ["<", ">", "<=", ">=", "==", "!="];

  function parse(src, isFuncOuter, opts = {}) {
    const toks = tokenize(src);
    let defining = null;
    const isFunc = (n) => n === defining || isFuncOuter(n);
    let p = 0;
    const peek = (k = 0) => toks[p + k];
    const isOp = (v, k = 0) => toks[p + k] && toks[p + k].t === "op" && toks[p + k].v === v;
    const next = () => toks[p++];
    const here = () => (toks[p] ? toks[p].pos : src.length);
    const close = (v) => {
      if (isOp(v)) {
        p++;
        return;
      }
      if (p >= toks.length) return; // missing closers at the very end are filled in
      fail(`Expected "${v}" here`, here());
    };

    function expr() {
      let a = additive();
      while (peek() && peek().t === "op" && CMP.includes(peek().v)) {
        const op = next().v;
        a = { t: "bin", op, a, b: additive() };
      }
      return a;
    }
    // Inside parentheses and function arguments, "a = b" means a − b (for solve and friends)
    function argExpr() {
      const a = expr();
      if (isOp("=")) {
        next();
        return { t: "bin", op: "-", a, b: expr() };
      }
      return a;
    }
    function additive() {
      let a = multiplicative();
      while (isOp("+") || isOp("-")) {
        const op = next().v;
        a = { t: "bin", op, a, b: multiplicative() };
      }
      return a;
    }
    function startsFactor() {
      const tk = peek();
      if (!tk) return false;
      if (tk.t === "num") return !(toks[p - 1] && toks[p - 1].t === "num");
      if (tk.t === "id") return true;
      return tk.t === "op" && ["(", "{", "[", "√", "∛"].includes(tk.v);
    }
    function multiplicative() {
      let a = unary();
      for (;;) {
        if (isOp("*") || isOp("/")) {
          const op = next().v;
          a = { t: "bin", op, a, b: unary() };
          continue;
        }
        if (startsFactor()) {
          a = { t: "bin", op: "*", a, b: power() };
          continue;
        }
        if (peek() && peek().t === "num" && toks[p - 1] && toks[p - 1].t === "num") fail("Two numbers in a row: add an operator", here());
        break;
      }
      return a;
    }
    function unary() {
      if (isOp("-")) {
        next();
        return { t: "neg", a: unary() };
      }
      if (isOp("+")) {
        next();
        return unary();
      }
      return power();
    }
    function power() {
      const base = postfix();
      if (isOp("^")) {
        next();
        return { t: "bin", op: "^", a: base, b: unary() };
      }
      return base;
    }
    function postfix() {
      let a = primary();
      for (;;) {
        if (isOp("!")) {
          next();
          a = { t: "call", name: "fact", args: [a] };
        } else if (isOp("%")) {
          next();
          a = { t: "bin", op: "/", a, b: { t: "num", v: 100 } };
        } else if (isOp("²") || isOp("³")) {
          const v = next().v === "²" ? 2 : 3;
          a = { t: "bin", op: "^", a, b: { t: "num", v } };
        } else if (isOp("⁻¹")) {
          next();
          a = { t: "inv", a };
        } else if (isOp("ᵀ")) {
          next();
          a = { t: "call", name: "trans", args: [a] };
        } else if (isOp("°")) {
          next();
          let m = null, s = null;
          if (peek() && peek().t === "num" && isOp("'", 1)) {
            m = next().v;
            next();
          }
          if (peek() && peek().t === "num" && isOp('"', 1)) {
            s = next().v;
            next();
          }
          a = { t: "deg", a, m, s };
        } else break;
      }
      return a;
    }
    function primary() {
      const tk = peek();
      if (!tk) fail("The expression ends too soon", src.length);
      if (tk.t === "num") {
        next();
        return { t: "num", v: tk.v };
      }
      if (tk.t === "id") {
        next();
        const name = tk.v === "π" ? "pi" : tk.v;
        if (isOp("(") && isFunc(name)) {
          next();
          const args = [];
          if (!isOp(")") && p < toks.length) {
            args.push(argExpr());
            while (isOp(",")) {
              next();
              args.push(argExpr());
            }
          }
          close(")");
          return { t: "call", name, args, pos: tk.pos };
        }
        return { t: "var", name, pos: tk.pos };
      }
      if (tk.v === "(") {
        next();
        const e = argExpr();
        close(")");
        return e;
      }
      if (tk.v === "{") {
        next();
        const items = [];
        if (!isOp("}")) {
          items.push(expr());
          while (isOp(",")) {
            next();
            items.push(expr());
          }
        }
        close("}");
        return { t: "list", items };
      }
      if (tk.v === "[") {
        // [A] is a stored matrix; anything else is a literal like [[1,2],[3,4]]
        if (peek(1) && peek(1).t === "id" && /^[A-J]$/.test(peek(1).v) && isOp("]", 2)) {
          p += 3;
          return { t: "var", name: `[${toks[p - 2].v}]`, pos: tk.pos };
        }
        next();
        const rows = [];
        if (isOp("[")) {
          while (isOp("[")) {
            next();
            const row = [expr()];
            while (isOp(",")) {
              next();
              row.push(expr());
            }
            close("]");
            rows.push(row);
            if (isOp(",")) next();
          }
        } else {
          const row = [expr()];
          while (isOp(",")) {
            next();
            row.push(expr());
          }
          rows.push(row);
        }
        close("]");
        return { t: "matlit", rows, pos: tk.pos };
      }
      if (tk.v === "√" || tk.v === "∛") {
        next();
        return { t: "call", name: tk.v === "√" ? "sqrt" : "cbrt", args: [power()] };
      }
      if (tk.v === ")") fail('There is a ")" without a matching "("', tk.pos);
      fail(`"${tk.v}" can't go here`, tk.pos);
    }

    // ---- statements
    if (opts.expressionOnly) {
      const e = argExpr();
      if (p < toks.length) fail(`"${peek().v}" can't go here`, here());
      return e;
    }
    // f(x, y) = body
    if (peek() && peek().t === "id" && isOp("(", 1)) {
      let k = 2;
      const params = [];
      while (toks[p + k] && toks[p + k].t === "id") {
        params.push(toks[p + k].v);
        k++;
        if (isOp(",", k)) k++;
        else break;
      }
      if (params.length && isOp(")", k) && isOp("=", k + 1)) {
        const name = peek().v;
        defining = name;
        p += k + 2;
        const bodyStart = here();
        const body = expr();
        if (p < toks.length) fail(`"${peek().v}" can't go here`, here());
        return { t: "define", name, params, body, src: src.slice(bodyStart).trim(), pos: toks[0].pos };
      }
    }
    const e = expr();
    if (isOp("=")) {
      next();
      const rhs = expr();
      if (p < toks.length) fail(`"${peek().v}" can't go here`, here());
      if (e.t === "var") return { t: "assign", name: e.name, value: rhs, pos: e.pos };
      return { t: "equation", lhs: e, rhs };
    }
    if (isOp("->")) {
      const at = next().pos;
      let name;
      if (peek() && peek().t === "id") name = next().v;
      else if (isOp("[") && peek(1) && peek(1).t === "id" && isOp("]", 2)) {
        name = `[${peek(1).v}]`;
        p += 3;
      } else fail("Store into a name, like → A, → L1 or → [A]", at);
      if (p < toks.length) fail(`"${peek().v}" can't go here`, here());
      return { t: "assign", name, value: e, pos: at };
    }
    if (p < toks.length) {
      const tk = peek();
      if (tk.t === "op" && tk.v === ")") fail('There is a ")" without a matching "("', tk.pos);
      fail(`"${tk.v}" can't go here`, tk.pos);
    }
    return e;
  }
  C.parse = parse;

  /* ---------------------------------------------------------------------
     Numeric helpers
     --------------------------------------------------------------------- */
  const EPS = 1e-15;
  const clean = (x) => (Math.abs(x) < 1e-15 ? 0 : x);
  const isInt = (x) => Number.isFinite(x) && Math.abs(x - Math.round(x)) < 1e-9 * Math.max(1, Math.abs(x));

  // Continued-fraction approximation p/q within tolerance
  function fraction(x, maxDen = 10000, tol = 1e-10) {
    if (!Number.isFinite(x)) return null;
    const sign = x < 0 ? -1 : 1;
    let v = Math.abs(x);
    let h1 = 1, h0 = 0, k1 = 0, k0 = 1;
    for (let n = 0; n < 40; n++) {
      const a = Math.floor(v);
      const h2 = a * h1 + h0, k2 = a * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (Math.abs(Math.abs(x) - h1 / k1) <= tol * Math.max(1, Math.abs(x))) return { n: sign * h1, d: k1 };
      const r = v - a;
      if (r < 1e-15) break;
      v = 1 / r;
    }
    return Math.abs(Math.abs(x) - h1 / k1) <= tol * Math.max(1, Math.abs(x)) && k1 ? { n: sign * h1, d: k1 } : null;
  }
  C.fraction = fraction;

  function realPow(a, b) {
    if (a < 0 && !Number.isInteger(b)) {
      // Odd roots of negatives are real: (-8)^(1/3) = -2
      const f = fraction(b, 99, 1e-12);
      if (f && f.d % 2 === 1) return (f.n % 2 === 0 ? 1 : -1) * Math.pow(-a, b);
      return domain("A negative number to a fractional power has no real value");
    }
    if (a === 0 && b < 0) return domain("Division by zero (zero to a negative power)");
    return Math.pow(a, b);
  }

  // Lanczos gamma
  const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function gamma(x) {
    if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
    x -= 1;
    let a = LG[0];
    const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
    return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
  }
  function factorial(n) {
    if (!Number.isFinite(n)) return NaN;
    if (n < 0 && isInt(n)) return domain("Factorial of a negative integer is undefined");
    if (isInt(n)) {
      n = Math.round(n);
      if (n > 170) return Infinity;
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    }
    return gamma(n + 1);
  }

  // erf with ~1e-15 accuracy: series for small |x|, continued fraction for erfc otherwise
  function erf(x) {
    const ax = Math.abs(x);
    if (ax < 2.5) {
      let sum = x, term = x, n = 0;
      const x2 = x * x;
      while (Math.abs(term) > 1e-17 * Math.abs(sum) && n < 200) {
        n++;
        term *= -x2 / n;
        sum += term / (2 * n + 1);
      }
      return (2 / Math.sqrt(Math.PI)) * sum;
    }
    return x > 0 ? 1 - erfc(ax) : erfc(ax) - 1;
  }
  function erfc(x) {
    if (x < 2.5) return 1 - erf(x);
    // Lentz continued fraction
    let f = x, Cc = x, D = 0;
    for (let n = 1; n < 300; n++) {
      const an = n / 2;
      D = x + an * D;
      D = D === 0 ? 1e-300 : 1 / D;
      Cc = x + an / Cc;
      const delta = Cc * D;
      f *= delta;
      if (Math.abs(delta - 1) < 1e-16) break;
    }
    return Math.exp(-x * x) / (f * Math.sqrt(Math.PI));
  }
  const normCdf = (z) => 0.5 * erfc(-z / Math.SQRT2);
  function invNormStd(pr) {
    if (pr <= 0 || pr >= 1) return domain("invNorm needs a probability between 0 and 1");
    // Acklam's algorithm, then one Halley step with the exact cdf
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    let q, r, x;
    if (pr < 0.02425) {
      q = Math.sqrt(-2 * Math.log(pr));
      x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (pr > 1 - 0.02425) {
      q = Math.sqrt(-2 * Math.log(1 - pr));
      x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else {
      q = pr - 0.5;
      r = q * q;
      x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    const e = normCdf(x) - pr;
    const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
    return x - u / (1 + (x * u) / 2);
  }
  C.erf = erf;
  C.normCdf = normCdf;
  C.invNormStd = invNormStd;

  /* ---------------------------------------------------------------------
     Matrices
     --------------------------------------------------------------------- */
  const dims = (A) => [A.length, A[0] ? A[0].length : 0];
  const copyM = (A) => A.map((r) => r.slice());
  function matMul(A, B) {
    const [n, m] = dims(A), [m2, k] = dims(B);
    if (m !== m2) fail(`Can't multiply a ${n}×${m} matrix by a ${m2}×${k} matrix`);
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push([]);
      for (let j = 0; j < k; j++) {
        let s = 0;
        for (let t = 0; t < m; t++) s += A[i][t] * B[t][j];
        out[i].push(s);
      }
    }
    return out;
  }
  const transpose = (A) => A[0].map((_, j) => A.map((r) => r[j]));
  const identity = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  function det(A) {
    const [n, m] = dims(A);
    if (n !== m) fail(`det needs a square matrix (this one is ${n}×${m})`);
    const a = copyM(A);
    let d = 1;
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[piv][c])) piv = r;
      if (a[piv][c] === 0) return 0;
      if (piv !== c) {
        [a[piv], a[c]] = [a[c], a[piv]];
        d = -d;
      }
      d *= a[c][c];
      for (let r = c + 1; r < n; r++) {
        const f = a[r][c] / a[c][c];
        for (let k = c; k < n; k++) a[r][k] -= f * a[c][k];
      }
    }
    return d;
  }
  function inverse(A) {
    const [n, m] = dims(A);
    if (n !== m) fail(`Only square matrices have inverses (this one is ${n}×${m})`);
    const a = A.map((r, i) => [...r, ...identity(n)[i]]);
    const scale = Math.max(...A.flat().map(Math.abs)) || 1;
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[piv][c])) piv = r;
      if (Math.abs(a[piv][c]) < 1e-12 * scale) fail("This matrix is singular (determinant 0), so it has no inverse");
      [a[piv], a[c]] = [a[c], a[piv]];
      const pv = a[c][c];
      for (let k = 0; k < 2 * n; k++) a[c][k] /= pv;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = a[r][c];
        if (f) for (let k = 0; k < 2 * n; k++) a[r][k] -= f * a[c][k];
      }
    }
    return a.map((r) => r.slice(n).map(clean));
  }
  function rref(A) {
    const a = copyM(A);
    const [n, m] = dims(a);
    const tol = 1e-12 * (Math.max(...a.flat().map(Math.abs)) || 1);
    let lead = 0;
    for (let r = 0; r < n && lead < m; r++) {
      let i = r;
      while (Math.abs(a[i][lead]) <= tol) {
        i++;
        if (i === n) {
          i = r;
          lead++;
          if (lead === m) return a.map((row) => row.map(clean));
        }
      }
      let best = i;
      for (let k = i; k < n; k++) if (Math.abs(a[k][lead]) > Math.abs(a[best][lead])) best = k;
      [a[best], a[r]] = [a[r], a[best]];
      const lv = a[r][lead];
      a[r] = a[r].map((x) => x / lv);
      for (let k = 0; k < n; k++) {
        if (k === r) continue;
        const f = a[k][lead];
        a[k] = a[k].map((x, j) => x - f * a[r][j]);
      }
      lead++;
    }
    return a.map((row) => row.map((x) => (Math.abs(x) <= tol ? 0 : x)));
  }
  function solveLinear(A, b) {
    const n = A.length;
    if (A.some((r) => r.length !== n) || b.length !== n) fail("The system needs n equations in n unknowns");
    const a = A.map((r, i) => [...r, b[i]]);
    const scale = Math.max(...A.flat().map(Math.abs)) || 1;
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[piv][c])) piv = r;
      if (Math.abs(a[piv][c]) < 1e-12 * scale) fail("The system has no unique solution (the coefficient matrix is singular)");
      [a[piv], a[c]] = [a[c], a[piv]];
      for (let r = c + 1; r < n; r++) {
        const f = a[r][c] / a[c][c];
        for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k];
      }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = a[i][n];
      for (let k = i + 1; k < n; k++) s -= a[i][k] * x[k];
      x[i] = s / a[i][i];
    }
    return x.map(clean);
  }
  C.matrix = { det, inverse, rref, transpose, identity, mul: matMul, solveLinear };

  /* ---------------------------------------------------------------------
     Angle mode
     --------------------------------------------------------------------- */
  const ANGLE = { deg: Math.PI / 180, rad: 1, grad: Math.PI / 200 };
  let S_ = null; // state of the evaluation in progress
  const toRad = (x) => x * ANGLE[S_ ? S_.mode.angle : "deg"];
  const fromRad = (x) => x / ANGLE[S_ ? S_.mode.angle : "deg"];
  const degToMode = (d) => (d * Math.PI) / 180 / ANGLE[S_ ? S_.mode.angle : "deg"];

  function trig(fn, x) {
    const r = toRad(x);
    if (fn === "tan" || fn === "sec") {
      if (Math.abs(Math.cos(r)) < 1e-15) return domain(`${fn} is undefined at odd multiples of 90°`);
    }
    if ((fn === "cot" || fn === "csc") && Math.abs(Math.sin(r)) < 1e-15) return domain(`${fn} is undefined at multiples of 180°`);
    const s = clean(Math.sin(r)), c = clean(Math.cos(r));
    switch (fn) {
      case "sin": return s;
      case "cos": return c;
      case "tan": return clean(s / c);
      case "sec": return 1 / c;
      case "csc": return 1 / s;
      case "cot": return clean(c / s);
    }
  }

  /* ---------------------------------------------------------------------
     Statistics
     --------------------------------------------------------------------- */
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const meanOf = (a) => (a.length ? sum(a) / a.length : domain("The list is empty"));
  function medianOf(a) {
    if (!a.length) return domain("The list is empty");
    const s = [...a].sort((x, y) => x - y), n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  function varianceOf(a, sample) {
    const n = a.length;
    if (n < (sample ? 2 : 1)) return domain(sample ? "Sample variance needs at least 2 values" : "The list is empty");
    const m = meanOf(a);
    return sum(a.map((x) => (x - m) ** 2)) / (sample ? n - 1 : n);
  }

  function oneVar(xs, fs) {
    if (!xs.length) fail("The list is empty");
    if (fs && fs.length !== xs.length) fail("The data list and the frequency list must be the same length");
    const f = fs || xs.map(() => 1);
    if (f.some((w) => w < 0)) fail("Frequencies can't be negative");
    const n = sum(f);
    const sx = sum(xs.map((x, i) => x * f[i]));
    const sx2 = sum(xs.map((x, i) => x * x * f[i]));
    const mean = sx / n;
    const ss = sum(xs.map((x, i) => f[i] * (x - mean) ** 2));
    const out = { n, mean, sum: sx, sumSq: sx2, Sx: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN, sigmaX: Math.sqrt(ss / n), min: Math.min(...xs), max: Math.max(...xs) };
    // Quartiles: median of each half (the middle value is left out of both halves when n is odd)
    if (f.every((w) => Number.isInteger(w))) {
      const all = [];
      xs.forEach((x, i) => {
        for (let k = 0; k < f[i]; k++) all.push(x);
      });
      all.sort((a, b) => a - b);
      const N = all.length, h = Math.floor(N / 2);
      out.median = medianOf(all);
      out.Q1 = N > 1 ? medianOf(all.slice(0, h)) : all[0];
      out.Q3 = N > 1 ? medianOf(all.slice(N % 2 ? h + 1 : h)) : all[0];
    }
    return out;
  }
  function twoVar(xs, ys) {
    if (xs.length !== ys.length) fail(`The x and y lists must be the same length (${xs.length} and ${ys.length})`);
    if (xs.length < 2) fail("Two-variable statistics need at least 2 points");
    const n = xs.length;
    const mx = meanOf(xs), my = meanOf(ys);
    let sxx = 0, syy = 0, sxy = 0;
    for (let i = 0; i < n; i++) {
      sxx += (xs[i] - mx) ** 2;
      syy += (ys[i] - my) ** 2;
      sxy += (xs[i] - mx) * (ys[i] - my);
    }
    return {
      n, meanX: mx, meanY: my, sumX: sum(xs), sumX2: sum(xs.map((x) => x * x)), sumY: sum(ys), sumY2: sum(ys.map((y) => y * y)),
      sumXY: sum(xs.map((x, i) => x * ys[i])), Sx: Math.sqrt(sxx / (n - 1)), Sy: Math.sqrt(syy / (n - 1)),
      sigmaX: Math.sqrt(sxx / n), sigmaY: Math.sqrt(syy / n), r: sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN,
      minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys),
    };
  }

  function polyFit(xs, ys, deg) {
    const n = xs.length;
    if (n < deg + 1) fail(`A degree-${deg} fit needs at least ${deg + 1} points`);
    // Scale x for a well-conditioned normal-equation solve, then convert back
    const mx = meanOf(xs), sx = Math.sqrt(varianceOf(xs, false)) || 1;
    const t = xs.map((x) => (x - mx) / sx);
    const A = [], b = [];
    for (let i = 0; i <= deg; i++) {
      A.push([]);
      for (let j = 0; j <= deg; j++) A[i].push(sum(t.map((v) => v ** (i + j))));
      b.push(sum(t.map((v, k) => v ** i * ys[k])));
    }
    const ct = solveLinear(A, b); // coefficients in t, ascending
    // Expand sum ct[k] ((x - mx)/sx)^k into powers of x
    const cx = new Array(deg + 1).fill(0);
    for (let k = 0; k <= deg; k++) {
      for (let j = 0; j <= k; j++) {
        cx[j] += ct[k] * binom(k, j) * (-mx) ** (k - j) / sx ** k;
      }
    }
    return cx; // ascending powers of x
  }
  function binom(n, k) {
    let r = 1;
    for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
    return Math.round(r);
  }
  const rSquared = (ys, fit) => {
    const my = meanOf(ys);
    const ssr = sum(ys.map((y, i) => (y - fit[i]) ** 2));
    const sst = sum(ys.map((y) => (y - my) ** 2));
    return sst ? 1 - ssr / sst : NaN;
  };

  const P = (x) => (Number.isFinite(x) ? String(+x.toPrecision(12)) : "NaN");
  const coefTerm = (c, pow, first) => {
    if (c === 0) return "";
    const sign = c < 0 ? "-" : first ? "" : "+";
    const body = pow === 0 ? P(Math.abs(c)) : `${P(Math.abs(c))}*${pow === 1 ? "x" : `x^${pow}`}`;
    return sign + body;
  };
  function polyExpr(cx) {
    let s = "";
    for (let k = cx.length - 1; k >= 0; k--) s += coefTerm(cx[k], k, s === "");
    return s || "0";
  }

  const REGRESSIONS = {
    linear: { label: "Linear  y = a + b·x", min: 2 },
    quadratic: { label: "Quadratic  y = a + b·x + c·x²", min: 3 },
    cubic: { label: "Cubic  y = a + b·x + c·x² + d·x³", min: 4 },
    quartic: { label: "Quartic (4th degree)", min: 5 },
    exponential: { label: "Exponential  y = a·bˣ", min: 2 },
    power: { label: "Power  y = a·xᵇ", min: 2 },
    logarithmic: { label: "Logarithmic  y = a + b·ln x", min: 2 },
  };
  function regress(type, xs, ys) {
    if (xs.length !== ys.length) fail(`The x and y lists must be the same length (${xs.length} and ${ys.length})`);
    const R = REGRESSIONS[type];
    if (!R) fail("Unknown regression type");
    if (xs.length < R.min) fail(`This fit needs at least ${R.min} points`);
    const out = { type, label: R.label };
    if (["linear", "quadratic", "cubic", "quartic"].includes(type)) {
      const deg = { linear: 1, quadratic: 2, cubic: 3, quartic: 4 }[type];
      const cx = polyFit(xs, ys, deg);
      const fit = xs.map((x) => cx.reduce((s, c, k) => s + c * x ** k, 0));
      out.coef = cx;
      out.names = ["a", "b", "c", "d", "e"].slice(0, deg + 1);
      out.r2 = rSquared(ys, fit);
      if (deg === 1) out.r = twoVar(xs, ys).r;
      out.expr = polyExpr(cx);
      out.fn = (x) => cx.reduce((s, c, k) => s + c * x ** k, 0);
      return out;
    }
    if (type === "exponential") {
      if (ys.some((y) => y <= 0)) fail("Exponential fits need every y > 0");
      const lin = polyFit(xs, ys.map(Math.log), 1);
      const a = Math.exp(lin[0]), b = Math.exp(lin[1]);
      Object.assign(out, { coef: [a, b], names: ["a", "b"], r: twoVar(xs, ys.map(Math.log)).r, expr: `${P(a)}*${P(b)}^x`, fn: (x) => a * b ** x });
    } else if (type === "power") {
      if (xs.some((x) => x <= 0) || ys.some((y) => y <= 0)) fail("Power fits need every x > 0 and y > 0");
      const lin = polyFit(xs.map(Math.log), ys.map(Math.log), 1);
      const a = Math.exp(lin[0]), b = lin[1];
      Object.assign(out, { coef: [a, b], names: ["a", "b"], r: twoVar(xs.map(Math.log), ys.map(Math.log)).r, expr: `${P(a)}*x^${P(b)}`, fn: (x) => a * x ** b });
    } else if (type === "logarithmic") {
      if (xs.some((x) => x <= 0)) fail("Logarithmic fits need every x > 0");
      const lin = polyFit(xs.map(Math.log), ys, 1);
      const [a, b] = lin;
      Object.assign(out, { coef: [a, b], names: ["a", "b"], r: twoVar(xs.map(Math.log), ys).r, expr: `${P(a)}${b < 0 ? "-" : "+"}${P(Math.abs(b))}*ln(x)`, fn: (x) => a + b * Math.log(x) });
    }
    out.r2 = out.r * out.r;
    out.linearized = true;
    return out;
  }
  C.stats = { oneVar, twoVar, regress, REGRESSIONS, mean: meanOf, median: medianOf, variance: varianceOf };

  /* ---------------------------------------------------------------------
     Calculus and root finding
     --------------------------------------------------------------------- */
  // Ridders' extrapolation of central differences
  function derivative(f, x) {
    let h = 0.1 * Math.max(1, Math.abs(x));
    const con = 1.4, con2 = con * con, ntab = 12;
    const a = Array.from({ length: ntab }, () => new Array(ntab).fill(0));
    a[0][0] = (f(x + h) - f(x - h)) / (2 * h);
    let err = Infinity, ans = a[0][0];
    for (let i = 1; i < ntab; i++) {
      h /= con;
      a[0][i] = (f(x + h) - f(x - h)) / (2 * h);
      let fac = con2;
      for (let j = 1; j <= i; j++) {
        a[j][i] = (a[j - 1][i] * fac - a[j - 1][i - 1]) / (fac - 1);
        fac *= con2;
        const errt = Math.max(Math.abs(a[j][i] - a[j - 1][i]), Math.abs(a[j][i] - a[j - 1][i - 1]));
        if (errt <= err) {
          err = errt;
          ans = a[j][i];
        }
      }
      if (Math.abs(a[i][i] - a[i - 1][i - 1]) >= 2 * err) break;
    }
    return Number.isFinite(ans) ? ans : domain("The derivative doesn't exist there");
  }

  // Adaptive Gauss–Kronrod (7–15) quadrature
  const XGK = [0.991455371120812639, 0.949107912342758525, 0.864864423359769073, 0.741531185599394440, 0.586087235467691130, 0.405845151377397167, 0.207784955007898468, 0];
  const WGK = [0.022935322010529225, 0.063092092629978553, 0.104790010322250184, 0.140653259715525919, 0.169004726639267903, 0.190350578064785410, 0.204432940075298892, 0.209482141084727828];
  const WG = [0.129484966168869693, 0.279705391489276668, 0.381830050505118945, 0.417959183673469388];
  function gk15(f, a, b) {
    const c = (a + b) / 2, h = (b - a) / 2;
    const fc = f(c);
    let k = fc * WGK[7], g = fc * WG[3];
    for (let j = 0; j < 7; j++) {
      const dx = h * XGK[j];
      const f1 = f(c - dx), f2 = f(c + dx);
      k += WGK[j] * (f1 + f2);
      if (j % 2 === 1) g += WG[(j - 1) / 2] * (f1 + f2);
    }
    return { v: k * h, err: Math.abs((k - g) * h) };
  }
  function integrate(f, a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) fail("Use finite limits of integration");
    if (a === b) return 0;
    const tol = 1e-11;
    let parts = [{ a, b, ...gk15(f, a, b) }];
    for (let it = 0; it < 2000; it++) {
      const total = parts.reduce((s, q) => s + q.v, 0);
      const errSum = parts.reduce((s, q) => s + q.err, 0);
      if (!Number.isFinite(total)) return domain("The integral doesn't converge on this interval");
      if (errSum <= Math.max(tol, tol * Math.abs(total))) return total;
      let worst = 0;
      for (let i = 1; i < parts.length; i++) if (parts[i].err > parts[worst].err) worst = i;
      const q = parts[worst], m = (q.a + q.b) / 2;
      parts.splice(worst, 1, { a: q.a, b: m, ...gk15(f, q.a, m) }, { a: m, b: q.b, ...gk15(f, m, q.b) });
    }
    return parts.reduce((s, q) => s + q.v, 0);
  }

  // Brent's method on a bracket [a, b] with f(a), f(b) of opposite sign
  function brent(f, a, b, fa, fb) {
    if (fa === undefined) fa = f(a);
    if (fb === undefined) fb = f(b);
    if (fa === 0) return a;
    if (fb === 0) return b;
    if (fa * fb > 0) return NaN;
    let c = a, fc = fa, d = b - a, e = d;
    for (let i = 0; i < 200; i++) {
      if (fb * fc > 0) {
        c = a; fc = fa; d = b - a; e = d;
      }
      if (Math.abs(fc) < Math.abs(fb)) {
        a = b; b = c; c = a;
        fa = fb; fb = fc; fc = fa;
      }
      const tol = 2 * EPS * Math.abs(b) + 1e-15, m = 0.5 * (c - b);
      if (Math.abs(m) <= tol || fb === 0) return b;
      if (Math.abs(e) >= tol && Math.abs(fa) > Math.abs(fb)) {
        let s = fb / fa, pp, q;
        if (a === c) {
          pp = 2 * m * s;
          q = 1 - s;
        } else {
          const qq = fa / fc, r = fb / fc;
          pp = s * (2 * m * qq * (qq - r) - (b - a) * (r - 1));
          q = (qq - 1) * (r - 1) * (s - 1);
        }
        if (pp > 0) q = -q;
        else pp = -pp;
        if (2 * pp < Math.min(3 * m * q - Math.abs(tol * q), Math.abs(e * q))) {
          e = d;
          d = pp / q;
        } else {
          d = m;
          e = m;
        }
      } else {
        d = m;
        e = m;
      }
      a = b;
      fa = fb;
      b += Math.abs(d) > tol ? d : m > 0 ? tol : -tol;
      fb = f(b);
    }
    return b;
  }

  // One root near a guess: search outward for a sign change, then Brent; fall back to secant
  function findRoot(f, guess = 0, lo, hi) {
    if (lo !== undefined && hi !== undefined) {
      const flo = f(lo), fhi = f(hi);
      if (flo * fhi <= 0) return brent(f, lo, hi, flo, fhi);
      const all = findRoots(f, lo, hi, 2000);
      if (all.length) return all.reduce((best, r) => (Math.abs(r - guess) < Math.abs(best - guess) ? r : best));
      return domain("No solution in that interval");
    }
    const f0 = f(guess);
    if (f0 === 0) return guess;
    let step = 0.01 * Math.max(1, Math.abs(guess));
    let aL = guess, fL = f0, aR = guess, fR = f0;
    for (let i = 0; i < 120; i++) {
      const nL = guess - step, nR = guess + step;
      const gL = f(nL), gR = f(nR);
      if (Number.isFinite(gR) && Number.isFinite(fR) && fR * gR <= 0) return brent(f, aR, nR, fR, gR);
      if (Number.isFinite(gL) && Number.isFinite(fL) && fL * gL <= 0) return brent(f, nL, aL, gL, fL);
      if (Number.isFinite(gL)) { aL = nL; fL = gL; }
      if (Number.isFinite(gR)) { aR = nR; fR = gR; }
      step *= 1.5;
      if (step > 1e12) break;
    }
    // No sign change (touching root like x² = 0): secant / Newton from the guess
    let x = guess, fx = f0;
    for (let i = 0; i < 200; i++) {
      const d = derivative(f, x);
      if (!Number.isFinite(d) || d === 0) break;
      const nx = x - fx / d;
      if (!Number.isFinite(nx)) break;
      if (Math.abs(nx - x) < 1e-14 * Math.max(1, Math.abs(x))) {
        x = nx;
        break;
      }
      x = nx;
      fx = f(x);
    }
    const scale = Math.max(1, Math.abs(f0));
    if (Number.isFinite(x) && Math.abs(f(x)) < 1e-9 * scale) return x;
    return domain("No solution found. Try another guess, or give a range: solve(expr, x, guess, low, high)");
  }

  // All sign-change roots in [lo, hi]
  function findRoots(f, lo, hi, samples = 1000) {
    const roots = [];
    let x0 = lo, f0 = f(lo);
    const step = (hi - lo) / samples;
    for (let i = 1; i <= samples; i++) {
      const x1 = lo + i * step, f1 = f(x1);
      if (Number.isFinite(f0) && Number.isFinite(f1)) {
        if (f0 === 0) roots.push(x0);
        else if (f0 * f1 < 0) {
          // Skip poles: a real root makes |f| small near it
          const r = brent(f, x0, x1, f0, f1);
          const fr = Math.abs(f(r));
          if (fr < 1e-6 * Math.max(1, Math.abs(f0), Math.abs(f1))) roots.push(r);
        }
      }
      x0 = x1;
      f0 = f1;
    }
    if (Number.isFinite(f0) && f0 === 0) roots.push(x0);
    return roots.filter((r, i) => i === 0 || Math.abs(r - roots[i - 1]) > 1e-9 * Math.max(1, Math.abs(r)));
  }

  // Minimum of f on [a, b] (Brent's method with golden-section steps), checking the endpoints too
  function minimize(f, a, b) {
    const gr = 0.3819660112501051;
    let x = a + gr * (b - a), w = x, v = x, fx = f(x), fw = fx, fv = fx, d = 0, e = 0;
    for (let i = 0; i < 300; i++) {
      const m = 0.5 * (a + b), tol = 1e-10 * Math.abs(x) + 1e-12;
      if (Math.abs(x - m) <= 2 * tol - 0.5 * (b - a)) break;
      let useGolden = true;
      if (Math.abs(e) > tol) {
        const r = (x - w) * (fx - fv);
        let q = (x - v) * (fx - fw);
        let pp = (x - v) * q - (x - w) * r;
        q = 2 * (q - r);
        if (q > 0) pp = -pp;
        else q = -q;
        if (Math.abs(pp) < Math.abs(0.5 * q * e) && pp > q * (a - x) && pp < q * (b - x)) {
          e = d;
          d = pp / q;
          useGolden = false;
        }
      }
      if (useGolden) {
        e = (x < m ? b : a) - x;
        d = gr * e;
      }
      const u = x + (Math.abs(d) >= tol ? d : d > 0 ? tol : -tol);
      const fu = f(u);
      if (fu <= fx) {
        if (u < x) b = x;
        else a = x;
        v = w; fv = fw; w = x; fw = fx; x = u; fx = fu;
      } else {
        if (u < x) a = u;
        else b = u;
        if (fu <= fw || w === x) {
          v = w; fv = fw; w = u; fw = fu;
        } else if (fu <= fv || v === x || v === w) {
          v = u; fv = fu;
        }
      }
    }
    return x;
  }
  C.calculus = { derivative, integrate, findRoot, findRoots, minimize, brent };

  /* ---------------------------------------------------------------------
     Polynomial roots (Durand–Kerner, polished), returns [{re, im}]
     --------------------------------------------------------------------- */
  function polyRoots(coefs) {
    // coefs: highest power first
    let c = coefs.map(Number);
    while (c.length && Math.abs(c[0]) < 1e-300) c.shift();
    if (c.length < 2) fail("Enter a polynomial of degree 1 or higher (the leading coefficient can't be 0)");
    const out = [];
    // Pull out roots at zero
    while (c.length > 1 && c[c.length - 1] === 0) {
      out.push({ re: 0, im: 0 });
      c.pop();
    }
    const n = c.length - 1;
    if (n === 1) out.push({ re: -c[1] / c[0], im: 0 });
    else if (n === 2) {
      const [a, b, cc] = c;
      const disc = b * b - 4 * a * cc;
      if (disc >= 0) {
        const q = -0.5 * (b + Math.sign(b || 1) * Math.sqrt(disc));
        out.push({ re: q / a, im: 0 }, { re: q !== 0 ? cc / q : 0, im: 0 });
      } else {
        const re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * Math.abs(a));
        out.push({ re, im }, { re, im: -im });
      }
    } else if (n > 2) {
      const a = c.map((x) => x / c[0]);
      const R = 1 + Math.max(...a.slice(1).map(Math.abs));
      let z = Array.from({ length: n }, (_, k) => {
        const ang = (2 * Math.PI * k) / n + 0.4;
        return { re: R * Math.cos(ang), im: R * Math.sin(ang) };
      });
      const evalP = (x) => {
        let re = 1, im = 0;
        for (let k = 1; k <= n; k++) {
          const nr = re * x.re - im * x.im + a[k];
          im = re * x.im + im * x.re;
          re = nr;
        }
        return { re, im };
      };
      for (let it = 0; it < 2000; it++) {
        let moved = 0;
        z = z.map((zi, i) => {
          const num = evalP(zi);
          let dr = 1, di = 0;
          z.forEach((zj, j) => {
            if (j === i) return;
            const xr = zi.re - zj.re, xi = zi.im - zj.im;
            const nr = dr * xr - di * xi;
            di = dr * xi + di * xr;
            dr = nr;
          });
          const den = dr * dr + di * di || 1e-300;
          const qr = (num.re * dr + num.im * di) / den, qi = (num.im * dr - num.re * di) / den;
          moved = Math.max(moved, Math.hypot(qr, qi) / Math.max(1, Math.hypot(zi.re, zi.im)));
          return { re: zi.re - qr, im: zi.im - qi };
        });
        if (moved < 1e-15) break;
      }
      // Newton polish on the original polynomial, then snap near-real roots
      const dc = c.slice(0, -1).map((v, k) => v * (n - k));
      const ev = (p, x) => {
        let re = 0, im = 0;
        for (const v of p) {
          const nr = re * x.re - im * x.im + v;
          im = re * x.im + im * x.re;
          re = nr;
        }
        return { re, im };
      };
      z = z.map((zi) => {
        let x = zi;
        for (let k = 0; k < 5; k++) {
          const f = ev(c, x), d = ev(dc, x);
          const den = d.re * d.re + d.im * d.im;
          if (!den) break;
          x = { re: x.re - (f.re * d.re + f.im * d.im) / den, im: x.im - (f.im * d.re - f.re * d.im) / den };
        }
        if (Math.abs(x.im) < 1e-9 * Math.max(1, Math.abs(x.re))) x = { re: x.re, im: 0 };
        return x;
      });
      out.push(...z);
    }
    return out
      .map((r) => ({ re: clean(r.re) || 0, im: clean(r.im) || 0 }))
      .sort((p, q) => {
        const pr = p.im === 0, qr = q.im === 0;
        if (pr !== qr) return pr ? -1 : 1;
        return p.re - q.re || q.im - p.im;
      });
  }
  C.polyRoots = polyRoots;

  /* ---------------------------------------------------------------------
     Units (factor to the SI base of each category; temperature is affine)
     --------------------------------------------------------------------- */
  const FT = 0.3048, FTUS = 1200 / 3937, GAL = 3.785411784e-3, LB = 0.45359237, LBF = 4.4482216152605;
  const UNITS = {
    length: { label: "Length", base: "m", units: {
      m: ["meter", 1], km: ["kilometer", 1000], cm: ["centimeter", 0.01], mm: ["millimeter", 0.001], um: ["micrometer", 1e-6],
      in: ["inch", 0.0254], ft: ["foot (international)", FT], ftUS: ["U.S. survey foot", FTUS], yd: ["yard", 0.9144],
      mi: ["mile", 1609.344], nmi: ["nautical mile", 1852], ch: ["chain (66 ft)", 66 * FT], rd: ["rod (16.5 ft)", 16.5 * FT] } },
    area: { label: "Area", base: "m2", units: {
      m2: ["square meter", 1], km2: ["square kilometer", 1e6], cm2: ["square centimeter", 1e-4], mm2: ["square millimeter", 1e-6],
      ha: ["hectare", 1e4], in2: ["square inch", 0.00064516], ft2: ["square foot", FT * FT], yd2: ["square yard", 0.83612736],
      ac: ["acre", 4046.8564224], mi2: ["square mile", 2589988.110336] } },
    volume: { label: "Volume", base: "m3", units: {
      m3: ["cubic meter", 1], L: ["liter", 1e-3], mL: ["milliliter", 1e-6], cm3: ["cubic centimeter", 1e-6],
      in3: ["cubic inch", 1.6387064e-5], ft3: ["cubic foot", FT ** 3], yd3: ["cubic yard", 0.764554857984],
      gal: ["U.S. gallon", GAL], acft: ["acre-foot", 4046.8564224 * FT], MG: ["million gallons", GAL * 1e6] } },
    flow: { label: "Flow rate", base: "m3s", units: {
      m3s: ["cubic meter per second", 1], Ls: ["liter per second", 1e-3], cfs: ["cubic foot per second (cfs)", FT ** 3],
      gpm: ["U.S. gallon per minute", GAL / 60], MGD: ["million gallons per day", (GAL * 1e6) / 86400],
      acftd: ["acre-foot per day", (4046.8564224 * FT) / 86400], m3d: ["cubic meter per day", 1 / 86400] } },
    velocity: { label: "Velocity", base: "mps", units: {
      mps: ["meter per second", 1], kph: ["kilometer per hour", 1 / 3.6], fps: ["foot per second", FT],
      mph: ["mile per hour", 0.44704], knot: ["knot", 1852 / 3600] } },
    mass: { label: "Mass", base: "kg", units: {
      kg: ["kilogram", 1], g: ["gram", 1e-3], t: ["metric ton (tonne)", 1000], lb: ["pound (mass)", LB],
      oz: ["ounce", LB / 16], ton: ["short ton (2000 lb)", 2000 * LB], slug: ["slug", LBF / FT] } },
    force: { label: "Force", base: "N", units: {
      N: ["newton", 1], kN: ["kilonewton", 1000], MN: ["meganewton", 1e6], lbf: ["pound-force", LBF], kip: ["kip (1000 lbf)", 1000 * LBF],
      tonf: ["short ton-force", 2000 * LBF], kgf: ["kilogram-force", 9.80665] } },
    pressure: { label: "Pressure and stress", base: "Pa", units: {
      Pa: ["pascal", 1], kPa: ["kilopascal", 1000], MPa: ["megapascal", 1e6], GPa: ["gigapascal", 1e9], bar: ["bar", 1e5],
      atm: ["standard atmosphere", 101325], psi: ["pound per square inch", LBF / 0.00064516], ksi: ["kip per square inch", (1000 * LBF) / 0.00064516],
      psf: ["pound per square foot", LBF / (FT * FT)], ksf: ["kip per square foot", (1000 * LBF) / (FT * FT)],
      mH2O: ["meter of water (4 °C)", 9806.65], ftH2O: ["foot of water (4 °C)", 9806.65 * FT], inHg: ["inch of mercury (0 °C)", 3386.389], mmHg: ["millimeter of mercury", 133.322387415] } },
    energy: { label: "Energy and work", base: "J", units: {
      J: ["joule", 1], kJ: ["kilojoule", 1000], MJ: ["megajoule", 1e6], kWh: ["kilowatt-hour", 3.6e6], cal: ["calorie (IT)", 4.1868],
      kcal: ["kilocalorie (IT)", 4186.8], BTU: ["British thermal unit (IT)", 1055.05585262], ftlbf: ["foot-pound", LBF * FT] } },
    power: { label: "Power", base: "W", units: {
      W: ["watt", 1], kW: ["kilowatt", 1000], MW: ["megawatt", 1e6], hp: ["horsepower (mechanical)", 550 * LBF * FT],
      BTUh: ["BTU per hour", 1055.05585262 / 3600], ftlbfs: ["foot-pound per second", LBF * FT] } },
    density: { label: "Density (mass per volume)", base: "kgm3", units: {
      kgm3: ["kilogram per cubic meter", 1], gcm3: ["gram per cubic centimeter", 1000], lbft3: ["pound (mass) per cubic foot", LB / FT ** 3],
      slugft3: ["slug per cubic foot", LBF / FT / FT ** 3] } },
    unitweight: { label: "Unit weight (force per volume)", base: "Nm3", units: {
      Nm3: ["newton per cubic meter", 1], kNm3: ["kilonewton per cubic meter", 1000], pcf: ["pound-force per cubic foot (pcf)", LBF / FT ** 3] } },
    angle: { label: "Angle", base: "rad", units: {
      rad: ["radian", 1], deg: ["degree", Math.PI / 180], grad: ["gradian (gon)", Math.PI / 200], arcmin: ["minute of arc", Math.PI / 10800],
      arcsec: ["second of arc", Math.PI / 648000], rev: ["revolution", 2 * Math.PI], mil: ["mil (6400 per circle)", (2 * Math.PI) / 6400] } },
    time: { label: "Time", base: "s", units: {
      s: ["second", 1], min: ["minute", 60], h: ["hour", 3600], day: ["day", 86400], wk: ["week", 604800], yr: ["year (365.25 days)", 31557600] } },
    temperature: { label: "Temperature", base: "K", units: { C: ["degree Celsius", null], F: ["degree Fahrenheit", null], K: ["kelvin", null], R: ["degree Rankine", null] } },
  };
  const unitIndex = {};
  for (const [cat, def] of Object.entries(UNITS)) for (const code of Object.keys(def.units)) unitIndex[code] = cat;
  function convert(v, from, to) {
    const cf = unitIndex[from], ct = unitIndex[to];
    if (!cf) fail(`Unknown unit "${from}". The Units tab lists every unit code.`);
    if (!ct) fail(`Unknown unit "${to}". The Units tab lists every unit code.`);
    if (cf !== ct) fail(`Can't convert ${UNITS[cf].label.toLowerCase()} (${from}) to ${UNITS[ct].label.toLowerCase()} (${to})`);
    if (cf === "temperature") {
      const toK = { C: (x) => x + 273.15, F: (x) => ((x - 32) * 5) / 9 + 273.15, K: (x) => x, R: (x) => (x * 5) / 9 }[from](v);
      return { C: (k) => k - 273.15, F: (k) => ((k - 273.15) * 9) / 5 + 32, K: (k) => k, R: (k) => (k * 9) / 5 }[to](toK);
    }
    return (v * UNITS[cf].units[from][1]) / UNITS[ct].units[to][1];
  }
  C.UNITS = UNITS;
  C.convert = convert;

  /* ---------------------------------------------------------------------
     Constants (names usable in expressions)
     --------------------------------------------------------------------- */
  const CONSTANTS = [
    ["pi", Math.PI, "", "π, ratio of a circle's circumference to its diameter"],
    ["e", Math.E, "", "Base of natural logarithms"],
    ["g", 9.80665, "m/s²", "Standard gravity"],
    ["g_ft", 9.80665 / FT, "ft/s²", "Standard gravity in feet"],
    ["gamma_w", 9.80665, "kN/m³", "Unit weight of water (4 °C, standard gravity); about 9.81"],
    ["gamma_w_ft", 62.4, "lb/ft³", "Unit weight of water, the usual design value"],
    ["rho_w", 1000, "kg/m³", "Density of water (about 4 °C)"],
    ["nu_w", 1.004e-6, "m²/s", "Kinematic viscosity of water at 20 °C"],
    ["P_atm", 101.325, "kPa", "Standard atmospheric pressure"],
    ["R_earth", 6371000, "m", "Mean radius of the Earth"],
    ["c_light", 299792458, "m/s", "Speed of light in vacuum"],
    ["R_gas", 8.314462618, "J/(mol·K)", "Universal gas constant"],
    ["ft_m", FT, "m/ft", "Meters per international foot"],
    ["ftUS_m", FTUS, "m/ft", "Meters per U.S. survey foot (1200/3937)"],
    ["k_Manning", 1.49, "", "Unit factor in Manning's equation for U.S. units (1.486)"],
  ];
  const CONST = Object.fromEntries(CONSTANTS.map(([n, v]) => [n, v]));
  CONST["π"] = Math.PI;
  C.CONSTANTS = CONSTANTS;

  /* ---------------------------------------------------------------------
     Built-in functions
     --------------------------------------------------------------------- */
  const num1 = (name, f) => (args) => {
    const x = args[0];
    if (!isNum(x)) fail(`${name} needs a number`);
    return f(x);
  };
  const listArg = (name, args) => {
    if (args.length === 1 && isList(args[0])) return args[0];
    if (args.every(isNum)) return args;
    fail(`${name} needs a list, like ${name}({1,2,3}) or ${name}(L1)`);
  };
  const intCheck = (name, ...xs) => {
    if (!xs.every((x) => isNum(x) && isInt(x) && x >= 0)) fail(`${name} needs whole numbers that are 0 or more`);
  };
  const matArg = (name, v) => {
    if (!isMat(v)) fail(`${name} needs a matrix, like ${name}([A]) or ${name}([[1,2],[3,4]])`);
    return v.mat;
  };

  // [arity min, arity max, implementation(args), map over lists?]
  const FN = {
    sin: [1, 1, (a) => trig("sin", a[0]), true], cos: [1, 1, (a) => trig("cos", a[0]), true], tan: [1, 1, (a) => trig("tan", a[0]), true],
    sec: [1, 1, (a) => trig("sec", a[0]), true], csc: [1, 1, (a) => trig("csc", a[0]), true], cot: [1, 1, (a) => trig("cot", a[0]), true],
    asin: [1, 1, (a) => (Math.abs(a[0]) > 1 ? domain("asin needs a value between -1 and 1") : fromRad(Math.asin(a[0]))), true],
    acos: [1, 1, (a) => (Math.abs(a[0]) > 1 ? domain("acos needs a value between -1 and 1") : fromRad(Math.acos(a[0]))), true],
    atan: [1, 1, (a) => fromRad(Math.atan(a[0])), true],
    atan2: [2, 2, (a) => fromRad(Math.atan2(a[0], a[1])), false],
    sinh: [1, 1, (a) => Math.sinh(a[0]), true], cosh: [1, 1, (a) => Math.cosh(a[0]), true], tanh: [1, 1, (a) => Math.tanh(a[0]), true],
    asinh: [1, 1, (a) => Math.asinh(a[0]), true],
    acosh: [1, 1, (a) => (a[0] < 1 ? domain("acosh needs a value of 1 or more") : Math.acosh(a[0])), true],
    atanh: [1, 1, (a) => (Math.abs(a[0]) >= 1 ? domain("atanh needs a value between -1 and 1") : Math.atanh(a[0])), true],
    sqrt: [1, 1, (a) => (a[0] < 0 ? domain("Square root of a negative number") : Math.sqrt(a[0])), true],
    cbrt: [1, 1, (a) => Math.cbrt(a[0]), true],
    root: [2, 2, (a) => (a[1] === 0 ? domain("The 0th root is undefined") : realPow(a[0], 1 / a[1])), false],
    exp: [1, 1, (a) => Math.exp(a[0]), true],
    ln: [1, 1, (a) => (a[0] <= 0 ? domain("ln needs a positive number") : Math.log(a[0])), true],
    log: [1, 2, (a) => {
      if (a[0] <= 0) return domain("log needs a positive number");
      if (a.length === 2) return a[1] <= 0 || a[1] === 1 ? domain("The log base must be positive and not 1") : Math.log(a[0]) / Math.log(a[1]);
      return Math.log10(a[0]);
    }, true],
    log2: [1, 1, (a) => (a[0] <= 0 ? domain("log2 needs a positive number") : Math.log2(a[0])), true],
    abs: [1, 1, (a) => Math.abs(a[0]), true],
    sign: [1, 1, (a) => Math.sign(a[0]), true],
    floor: [1, 1, (a) => Math.floor(a[0]), true], ceil: [1, 1, (a) => Math.ceil(a[0]), true],
    int: [1, 1, (a) => Math.floor(a[0]), true], ipart: [1, 1, (a) => Math.trunc(a[0]), true], fpart: [1, 1, (a) => a[0] - Math.trunc(a[0]), true],
    round: [1, 2, (a) => {
      const n = a.length > 1 ? a[1] : 0;
      if (!isInt(n) || n < 0 || n > 15) return domain("round(x, n) needs n from 0 to 15");
      const m = 10 ** n;
      return Math.round((a[0] + Math.sign(a[0]) * Number.EPSILON * Math.abs(a[0])) * m) / m;
    }, true],
    mod: [2, 2, (a) => (a[1] === 0 ? domain("mod by zero") : a[0] - a[1] * Math.floor(a[0] / a[1])), false],
    gcd: [2, 2, (a) => {
      intCheck("gcd", Math.abs(a[0]), Math.abs(a[1]));
      let x = Math.abs(a[0]), y = Math.abs(a[1]);
      while (y) [x, y] = [y, x % y];
      return x;
    }, false],
    lcm: [2, 2, (a) => {
      intCheck("lcm", Math.abs(a[0]), Math.abs(a[1]));
      if (!a[0] || !a[1]) return 0;
      let x = Math.abs(a[0]), y = Math.abs(a[1]);
      const p = x * y;
      while (y) [x, y] = [y, x % y];
      return p / x;
    }, false],
    fact: [1, 1, (a) => factorial(a[0]), true],
    gamma: [1, 1, (a) => (a[0] <= 0 && isInt(a[0]) ? domain("gamma is undefined at 0 and negative integers") : gamma(a[0])), true],
    nCr: [2, 2, (a) => {
      intCheck("nCr", a[0], a[1]);
      return a[1] > a[0] ? 0 : binom(a[0], a[1]);
    }, false],
    nPr: [2, 2, (a) => {
      intCheck("nPr", a[0], a[1]);
      if (a[1] > a[0]) return 0;
      let r = 1;
      for (let i = 0; i < a[1]; i++) r *= a[0] - i;
      return r;
    }, false],
    hypot: [1, 20, (a) => Math.hypot(...listArg("hypot", a)), false],
    toDeg: [1, 1, (a) => (a[0] * 180) / Math.PI, true],
    toRad: [1, 1, (a) => (a[0] * Math.PI) / 180, true],
    dms: [1, 3, (a) => {
      const [d, m = 0, s = 0] = a;
      const sgn = d < 0 || (d === 0 && (m < 0 || s < 0)) ? -1 : 1;
      return degToMode(sgn * (Math.abs(d) + Math.abs(m) / 60 + Math.abs(s) / 3600));
    }, false],
    min: [1, 50, (a) => Math.min(...listArg("min", a)), false],
    max: [1, 50, (a) => Math.max(...listArg("max", a)), false],
    mean: [1, 50, (a) => meanOf(listArg("mean", a)), false],
    median: [1, 50, (a) => medianOf(listArg("median", a)), false],
    stdev: [1, 50, (a) => Math.sqrt(varianceOf(listArg("stdev", a), true)), false],
    stdevp: [1, 50, (a) => Math.sqrt(varianceOf(listArg("stdevp", a), false)), false],
    var: [1, 50, (a) => varianceOf(listArg("var", a), true), false],
    varp: [1, 50, (a) => varianceOf(listArg("varp", a), false), false],
    sum: [1, 50, (a) => sum(listArg("sum", a)), false],
    prod: [1, 50, (a) => listArg("prod", a).reduce((p, x) => p * x, 1), false],
    dim: [1, 1, (a) => (isList(a[0]) ? a[0].length : isMat(a[0]) ? dims(a[0].mat) : fail("dim needs a list or a matrix")), false],
    sort: [1, 1, (a) => (isList(a[0]) ? [...a[0]].sort((x, y) => x - y) : fail("sort needs a list")), false],
    cumsum: [1, 1, (a) => {
      if (!isList(a[0])) fail("cumsum needs a list");
      let s = 0;
      return a[0].map((x) => (s += x));
    }, false],
    normpdf: [1, 3, (a) => {
      const [x, mu = 0, sd = 1] = a;
      if (sd <= 0) return domain("The standard deviation must be positive");
      return Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
    }, false],
    normcdf: [2, 4, (a) => {
      const [lo, hi, mu = 0, sd = 1] = a;
      if (sd <= 0) return domain("The standard deviation must be positive");
      return normCdf((hi - mu) / sd) - normCdf((lo - mu) / sd);
    }, false],
    invNorm: [1, 3, (a) => {
      const [pr, mu = 0, sd = 1] = a;
      return mu + sd * invNormStd(pr);
    }, false],
    erf: [1, 1, (a) => erf(a[0]), true],
    rand: [0, 0, () => Math.random(), false],
    randInt: [2, 2, (a) => {
      const lo = Math.ceil(Math.min(a[0], a[1])), hi = Math.floor(Math.max(a[0], a[1]));
      return lo + Math.floor(Math.random() * (hi - lo + 1));
    }, false],
    det: [1, 1, (a) => det(matArg("det", a[0])), false],
    inv: [1, 1, (a) => mat(inverse(matArg("inv", a[0]))), false],
    trans: [1, 1, (a) => mat(transpose(matArg("trans", a[0]))), false],
    rref: [1, 1, (a) => mat(rref(matArg("rref", a[0]))), false],
    identity: [1, 1, (a) => {
      intCheck("identity", a[0]);
      if (a[0] < 1 || a[0] > 20) fail("identity(n) needs n from 1 to 20");
      return mat(identity(a[0]));
    }, false],
    linsolve: [2, 2, (a) => {
      const A = matArg("linsolve", a[0]);
      const b = isList(a[1]) ? a[1] : isMat(a[1]) ? a[1].mat.map((r) => r[0]) : fail("linsolve(A, b) needs b as a list or a column matrix");
      return solveLinear(A, b);
    }, false],
  };
  // Lazy forms take expressions, not values
  const LAZY = new Set(["if", "nDeriv", "fnInt", "solve", "fMin", "fMax", "sigma", "seq", "cvt"]);
  const ALIASES = { arcsin: "asin", arccos: "acos", arctan: "atan", integral: "fnInt", deriv: "nDeriv", Σ: "sigma", convert: "cvt", sqr: "sqrt", factorial: "fact", choose: "nCr" };
  C.builtinNames = () => [...Object.keys(FN), ...LAZY, ...Object.keys(ALIASES)];
  const isBuiltin = (n) => n in FN || LAZY.has(n) || n in ALIASES;
  C.isBuiltin = isBuiltin;

  /* ---------------------------------------------------------------------
     Evaluator
     --------------------------------------------------------------------- */
  function lookup(name, S, scope, pos) {
    if (scope && name in scope) return scope[name];
    if (name === "ans") return S.ans;
    if (Object.prototype.hasOwnProperty.call(S.vars, name)) return S.vars[name];
    if (name in CONST) return CONST[name];
    if (/^L[1-6]$/.test(name)) return [];
    if (/^\[[A-J]\]$/.test(name)) fail(`Matrix ${name} is empty. Fill it in on the Matrix tab, or store one: [[1,2],[3,4]] → ${name}`, pos);
    if (isBuiltin(name) || S.fns[name]) fail(`${name} needs parentheses, like ${name}(…)`, pos);
    if (name.length > 1 && /^[A-Za-z]+$/.test(name)) {
      const parts = [...name];
      if (parts.every((ch) => (scope && ch in scope) || ch in S.vars || ch in CONST))
        fail(`"${name}" isn't defined. For a product, write ${parts.join("*")}`, pos);
    }
    fail(`"${name}" isn't defined yet. Give it a value first, like ${name} = 5`, pos);
  }

  const neg = (v) => (isNum(v) ? -v : isList(v) ? v.map((x) => -x) : mat(v.mat.map((r) => r.map((x) => -x))));

  function numOp(op, a, b) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? domain("Division by zero") : a / b;
      case "^": return realPow(a, b);
      case "<": return a < b ? 1 : 0;
      case ">": return a > b ? 1 : 0;
      case "<=": return a <= b ? 1 : 0;
      case ">=": return a >= b ? 1 : 0;
      case "==": return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b)) ? 1 : 0;
      case "!=": return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b)) ? 0 : 1;
    }
  }
  function binop(op, a, b) {
    if (isNum(a) && isNum(b)) return numOp(op, a, b);
    if ((isList(a) || isNum(a)) && (isList(b) || isNum(b))) {
      if (isList(a) && isList(b) && a.length !== b.length) fail(`The lists have different lengths (${a.length} and ${b.length})`);
      const n = isList(a) ? a.length : b.length;
      return Array.from({ length: n }, (_, i) => numOp(op, isList(a) ? a[i] : a, isList(b) ? b[i] : b));
    }
    if (isMat(a) || isMat(b)) {
      if (isList(a) || isList(b)) {
        // matrix × list treats the list as a column vector
        if (op === "*" && isMat(a) && isList(b)) return matMul(a.mat, b.map((x) => [x])).map((r) => r[0]);
        fail("Lists and matrices can't be combined that way");
      }
      if (op === "+" || op === "-") {
        if (!isMat(a) || !isMat(b)) fail(`Can't ${op === "+" ? "add" : "subtract"} a number and a matrix`);
        const [n, m] = dims(a.mat), [n2, m2] = dims(b.mat);
        if (n !== n2 || m !== m2) fail(`Matrix sizes don't match (${n}×${m} and ${n2}×${m2})`);
        return mat(a.mat.map((r, i) => r.map((x, j) => (op === "+" ? x + b.mat[i][j] : x - b.mat[i][j]))));
      }
      if (op === "*") {
        if (isNum(a)) return mat(b.mat.map((r) => r.map((x) => a * x)));
        if (isNum(b)) return mat(a.mat.map((r) => r.map((x) => x * b)));
        return mat(matMul(a.mat, b.mat));
      }
      if (op === "/") {
        if (isNum(b)) return b === 0 ? fail("Division by zero") : mat(a.mat.map((r) => r.map((x) => x / b)));
        fail("Can't divide by a matrix. Multiply by its inverse instead: A*inv(B)");
      }
      if (op === "^") {
        if (!isMat(a) || !isNum(b) || !isInt(b)) fail("A matrix can only be raised to a whole-number power");
        const [n, m] = dims(a.mat);
        if (n !== m) fail("Only square matrices can be raised to a power");
        let base = b < 0 ? inverse(a.mat) : a.mat, out = identity(n);
        for (let k = 0; k < Math.abs(Math.round(b)); k++) out = matMul(out, base);
        return mat(out);
      }
      fail("Comparisons work on numbers and lists, not matrices");
    }
    fail(`Can't combine ${typeName(a)} and ${typeName(b)}`);
  }

  const MAX_DEPTH = 200;
  function evaluate(node, S, scope, depth = 0) {
    switch (node.t) {
      case "num":
        return node.v;
      case "var":
        return lookup(node.name, S, scope, node.pos);
      case "neg":
        return neg(evaluate(node.a, S, scope, depth));
      case "bin":
        return binop(node.op, evaluate(node.a, S, scope, depth), evaluate(node.b, S, scope, depth));
      case "inv": {
        const v = evaluate(node.a, S, scope, depth);
        if (isMat(v)) return mat(inverse(v.mat));
        return binop("/", 1, v);
      }
      case "deg": {
        const d = evaluate(node.a, S, scope, depth);
        if (!isNum(d) && !isList(d)) fail("The ° mark goes after a number");
        const conv = (x) => {
          const extra = (node.m || 0) / 60 + (node.s || 0) / 3600;
          const total = x < 0 || Object.is(x, -0) ? x - extra : x + extra;
          return degToMode(total);
        };
        return isList(d) ? d.map(conv) : conv(d);
      }
      case "list":
        return node.items.map((it) => {
          const v = evaluate(it, S, scope, depth);
          if (!isNum(v)) fail("List items must be numbers");
          return v;
        });
      case "matlit": {
        const rows = node.rows.map((r) =>
          r.map((it) => {
            const v = evaluate(it, S, scope, depth);
            if (!isNum(v)) fail("Matrix entries must be numbers");
            return v;
          })
        );
        if (rows.some((r) => r.length !== rows[0].length)) fail("Every matrix row needs the same number of entries", node.pos);
        return mat(rows);
      }
      case "call":
        return call(node, S, scope, depth);
    }
    fail("Something went wrong reading that expression");
  }

  function bindFn(node, S, scope, depth, varArg) {
    // Turn an expression argument plus a variable name into a JS function
    const v = node.args[varArg];
    if (!v || v.t !== "var") fail(`${node.name}: the ${ordinal(varArg + 1)} argument must be a variable name, like x`);
    const body = node.args[varArg - 1];
    const name = v.name;
    return (x) => {
      const sc = Object.create(scope || null);
      sc[name] = x;
      const r = evaluate(body, S, sc, depth + 1);
      return isNum(r) ? r : NaN;
    };
  }
  const ordinal = (n) => ["first", "second", "third", "fourth", "fifth"][n - 1] || `${n}th`;
  const numArg = (node, i, S, scope, depth, def) => {
    if (node.args[i] === undefined) {
      if (def !== undefined) return def;
      fail(`${node.name} is missing its ${ordinal(i + 1)} argument`);
    }
    const v = evaluate(node.args[i], S, scope, depth);
    if (!isNum(v)) fail(`${node.name}: the ${ordinal(i + 1)} argument must be a number`);
    return v;
  };

  function call(node, S, scope, depth) {
    if (depth > MAX_DEPTH) fail("Functions call each other too deeply (is a function calling itself?)");
    let name = ALIASES[node.name] || node.name;
    const args = node.args;

    // User-defined functions
    if (S.fns[name] && !(scope && name in scope)) {
      const f = S.fns[name];
      if (args.length !== f.params.length) fail(`${name} takes ${f.params.length} argument${f.params.length === 1 ? "" : "s"}`);
      const sc = Object.create(null);
      f.params.forEach((pn, i) => (sc[pn] = evaluate(args[i], S, scope, depth)));
      return evaluate(f.ast, S, sc, depth + 1);
    }
    // Graph functions Y1…Y8
    const gm = /^Y([1-8])$/.exec(name);
    if (gm) {
      const g = S.graph && S.graph.fns[+gm[1] - 1];
      if (!g || !g.expr.trim()) fail(`${name} is empty. Enter it on the Graph tab.`);
      if (args.length !== 1) fail(`${name} takes one argument, like ${name}(2)`);
      const x = evaluate(args[0], S, scope, depth);
      const ast = cachedAst(g.expr, S);
      const ev = (xv) => {
        const sc = Object.create(null);
        sc.x = xv;
        return evaluate(ast, S, sc, depth + 1);
      };
      return isList(x) ? x.map(ev) : ev(x);
    }

    if (LAZY.has(name)) {
      switch (name) {
        case "if": {
          if (args.length < 2 || args.length > 3) fail("if(condition, value if true, value if false)");
          const c = evaluate(args[0], S, scope, depth);
          if (!isNum(c)) fail("The condition in if() must be a number (nonzero means true)");
          return c ? evaluate(args[1], S, scope, depth) : args[2] ? evaluate(args[2], S, scope, depth) : 0;
        }
        case "nDeriv": {
          if (args.length !== 3) fail("nDeriv(expression, variable, value), like nDeriv(x^3, x, 2)");
          return derivative(bindFn(node, S, scope, depth, 1), numArg(node, 2, S, scope, depth));
        }
        case "fnInt": {
          if (args.length !== 4) fail("fnInt(expression, variable, lower, upper), like fnInt(x^2, x, 0, 3)");
          return integrate(bindFn(node, S, scope, depth, 1), numArg(node, 2, S, scope, depth), numArg(node, 3, S, scope, depth));
        }
        case "solve": {
          if (args.length < 2 || args.length > 5) fail("solve(equation, variable, guess), like solve(x^2 = 2, x, 1)");
          const f = bindFn(node, S, scope, depth, 1);
          const guess = numArg(node, 2, S, scope, depth, 0);
          if (args.length === 5) return findRoot(f, guess, numArg(node, 3, S, scope, depth), numArg(node, 4, S, scope, depth));
          return findRoot(f, guess);
        }
        case "fMin":
        case "fMax": {
          if (args.length !== 4) fail(`${name}(expression, variable, low, high)`);
          const f = bindFn(node, S, scope, depth, 1);
          const lo = numArg(node, 2, S, scope, depth), hi = numArg(node, 3, S, scope, depth);
          if (!(hi > lo)) fail("The high end must be greater than the low end");
          const g = name === "fMin" ? f : (x) => -f(x);
          const x = minimize(g, lo, hi);
          // Compare with the endpoints so a boundary extreme is found too
          const cands = [lo, x, hi].filter((t) => Number.isFinite(g(t)));
          return cands.reduce((best, t) => (g(t) < g(best) ? t : best));
        }
        case "sigma": {
          if (args.length !== 4) fail("sigma(expression, variable, start, end), like sigma(k^2, k, 1, 10)");
          const f = bindFn(node, S, scope, depth, 1);
          const a = numArg(node, 2, S, scope, depth), b = numArg(node, 3, S, scope, depth);
          if (!isInt(a) || !isInt(b)) fail("sigma's start and end must be whole numbers");
          if (b - a > 1e6) fail("That sum has too many terms");
          let s = 0;
          for (let k = Math.round(a); k <= Math.round(b); k++) s += f(k);
          return s;
        }
        case "seq": {
          if (args.length < 4 || args.length > 5) fail("seq(expression, variable, start, end, step), like seq(k^2, k, 1, 5)");
          const f = bindFn(node, S, scope, depth, 1);
          const a = numArg(node, 2, S, scope, depth), b = numArg(node, 3, S, scope, depth), st = numArg(node, 4, S, scope, depth, 1);
          if (st === 0 || (b - a) / st < 0) fail("seq's step must move from the start toward the end");
          const n = Math.floor((b - a) / st + 1e-9) + 1;
          if (n > 10000) fail("seq would make more than 10,000 items");
          return Array.from({ length: n }, (_, i) => f(a + i * st));
        }
        case "cvt": {
          if (args.length !== 3) fail("cvt(value, from, to), like cvt(10, ft, m)");
          const v = evaluate(args[0], S, scope, depth);
          const unit = (n) => {
            if (n.t !== "var") fail("Write unit codes without quotes, like cvt(10, ft, m)");
            return n.name;
          };
          const from = unit(args[1]), to = unit(args[2]);
          return isList(v) ? v.map((x) => convert(x, from, to)) : isNum(v) ? convert(v, from, to) : fail("cvt converts numbers or lists");
        }
      }
    }

    const def = FN[name];
    if (!def) fail(`"${node.name}" isn't a function`, node.pos);
    const [min, max, impl, mapList] = def;
    const vals = args.map((a) => evaluate(a, S, scope, depth));
    if (vals.length < min || vals.length > max) {
      const want = min === max ? `${min}` : max >= 20 ? `at least ${min}` : `${min} to ${max}`;
      fail(`${node.name} takes ${want} argument${max === 1 ? "" : "s"}`, node.pos);
    }
    if (mapList && vals.length >= 1 && isList(vals[0])) return vals[0].map((x) => impl([x, ...vals.slice(1)]));
    if (mapList && vals.some(isMat)) fail(`${node.name} works on numbers and lists, not matrices`);
    if (!["dim", "det", "inv", "trans", "rref", "linsolve", "sort", "cumsum", "min", "max", "mean", "median", "stdev", "stdevp", "var", "varp", "sum", "prod", "hypot"].includes(name)) {
      if (!vals.every(isNum)) fail(`${node.name} needs number arguments`);
    }
    return impl(vals);
  }

  /* ---------------------------------------------------------------------
     State, statements and formatting
     --------------------------------------------------------------------- */
  C.newState = () => ({
    vars: Object.create(null),
    fns: Object.create(null),
    ans: 0,
    mode: { angle: "deg", notation: "auto", digits: 6 },
    graph: { fns: [] },
  });

  const astCache = new Map();
  function cachedAst(src, S) {
    const key = src + "\u0001" + Object.keys(S.fns || {}).join(",");
    if (astCache.has(key)) return astCache.get(key);
    const ast = parse(src, (n) => isFuncName(n, S), { expressionOnly: true });
    if (astCache.size > 200) astCache.clear();
    astCache.set(key, ast);
    return ast;
  }
  const isFuncName = (n, S) => isBuiltin(n) || !!(S && S.fns[n]) || /^Y[1-8]$/.test(n);
  C.isFuncName = isFuncName;

  function checkFinite(v) {
    const bad = (x) => !Number.isFinite(x);
    const anyBad = isNum(v) ? bad(v) : isList(v) ? v.some(bad) : isMat(v) ? v.mat.flat().some(bad) : false;
    if (anyBad) {
      const x = isNum(v) ? v : NaN;
      fail(why || (x === Infinity || x === -Infinity ? "The result is too large to show (overflow)" : "The result is undefined"));
    }
    return v;
  }

  const PROTECTED = new Set(["pi", "π", "e", "ans"]);
  function storeName(name) {
    if (PROTECTED.has(name)) fail(`"${name}" is built in and can't be changed`);
    if (isBuiltin(name)) fail(`"${name}" is a built-in function name. Pick another name.`);
    if (/^Y[1-8]$/.test(name)) fail(`${name} is a graph function. Edit it on the Graph tab.`);
  }

  // Identifiers used in an AST (for equation solving)
  function freeVars(node, out = new Set(), bound = new Set()) {
    if (!node) return out;
    switch (node.t) {
      case "var":
        if (!bound.has(node.name)) out.add(node.name);
        break;
      case "neg": case "inv": case "deg":
        freeVars(node.a, out, bound);
        break;
      case "bin":
        freeVars(node.a, out, bound);
        freeVars(node.b, out, bound);
        break;
      case "list":
        node.items.forEach((n) => freeVars(n, out, bound));
        break;
      case "matlit":
        node.rows.flat().forEach((n) => freeVars(n, out, bound));
        break;
      case "call": {
        const name = ALIASES[node.name] || node.name;
        if (LAZY.has(name) && name !== "if" && name !== "cvt" && node.args[1] && node.args[1].t === "var") {
          const b2 = new Set(bound);
          b2.add(node.args[1].name);
          freeVars(node.args[0], out, b2);
          node.args.slice(2).forEach((n) => freeVars(n, out, bound));
        } else if (name === "cvt") freeVars(node.args[0], out, bound);
        else node.args.forEach((n) => freeVars(n, out, bound));
      }
    }
    return out;
  }
  C.freeVars = freeVars;

  // Real roots of lhs = rhs in one variable, searching outward from zero
  function solveEquation(lhs, rhs, name, S) {
    const f = (x) => {
      const sc = Object.create(null);
      sc[name] = x;
      const a = evaluate(lhs, S, sc), b = evaluate(rhs, S, sc);
      return isNum(a) && isNum(b) ? a - b : NaN;
    };
    const roots = [];
    const spans = [[-10, 10, 2000], [-1000, 1000, 4000], [-1e6, 1e6, 4000]];
    for (const [lo, hi, n] of spans) {
      for (const r of findRoots(f, lo, hi, n)) if (!roots.some((q) => Math.abs(q - r) <= 1e-7 * Math.max(1, Math.abs(r)))) roots.push(r);
      if (roots.length) break;
    }
    if (!roots.length) {
      why = "";
      const r = findRoot(f, 0);
      if (Number.isFinite(r)) roots.push(r);
    }
    if (!roots.length) fail(`No real solution for ${name} found. Try solve(…, ${name}, guess) with a starting guess.`);
    return roots.sort((a, b) => a - b).map((r) => (Math.abs(r - Math.round(r)) < 1e-10 * Math.max(1, Math.abs(r)) ? Math.round(r) : r));
  }

  C.run = function (input, S) {
    why = "";
    S_ = S;
    const src = String(input).trim();
    if (!src) return null;
    try {
      const st = parse(src, (n) => isFuncName(n, S));
      if (st.t === "define") {
        storeName(st.name);
        if (st.params.some((p) => PROTECTED.has(p))) fail("Use a different parameter name");
        S.fns[st.name] = { params: st.params, ast: st.body, src: st.src };
        return { kind: "define", name: st.name, text: `${st.name}(${st.params.join(", ")}) = ${st.src}` };
      }
      if (st.t === "assign") {
        storeName(st.name);
        const v = checkFinite(evaluate(st.value, S));
        if (/^L[1-6]$/.test(st.name) && !isList(v)) fail(`Only a list can be stored in ${st.name}, like {1,2,3} → ${st.name}`);
        if (/^\[[A-J]\]$/.test(st.name) && !isMat(v)) fail(`Only a matrix can be stored in ${st.name}`);
        S.vars[st.name] = v;
        S.ans = v;
        return { kind: "assign", name: st.name, value: v };
      }
      if (st.t === "equation") {
        const used = [...freeVars(st.lhs), ...freeVars(st.rhs)].filter((n) => !(n in CONST) && n !== "ans");
        const uniq = [...new Set(used)];
        let unknown;
        if (uniq.length === 1) unknown = uniq[0];
        else {
          const undef = uniq.filter((n) => !(n in S.vars));
          if (undef.length === 1) unknown = undef[0];
          else if (!uniq.length) fail("There's no variable to solve for");
          else fail(`Which variable should I solve for? (${uniq.join(", ")}) Use solve(…) or the Solve tab.`);
        }
        const roots = solveEquation(st.lhs, st.rhs, unknown, S);
        S.ans = roots.length === 1 ? roots[0] : roots;
        return { kind: "solve", name: unknown, roots };
      }
      const v = checkFinite(evaluate(st, S));
      S.ans = v;
      return { kind: "value", value: v };
    } finally {
      S_ = null;
    }
  };

  // Evaluate a single expression with extra bindings (for graphs, tables and the Solve tab)
  C.compile = function (src, S, names = ["x"]) {
    const ast = cachedAst(src, S);
    return (...vals) => {
      const prev = S_;
      S_ = S;
      try {
        const sc = Object.create(null);
        names.forEach((n, i) => (sc[n] = vals[i]));
        const r = evaluate(ast, S, sc);
        return isNum(r) ? r : NaN;
      } catch (e) {
        return NaN;
      } finally {
        S_ = prev;
      }
    };
  };
  // Like compile, but reports the first error instead of hiding it
  C.check = function (src, S, names = ["x"], at = [0.5]) {
    const ast = cachedAst(src, S);
    const prev = S_;
    S_ = S;
    try {
      const sc = Object.create(null);
      names.forEach((n, i) => (sc[n] = at[i]));
      evaluate(ast, S, sc);
      return null;
    } catch (e) {
      return e.message;
    } finally {
      S_ = prev;
    }
  };
  C.parseExpression = (src, S) => cachedAst(src, S);
  C.solveEquation = (lhsSrc, rhsSrc, name, S) => {
    S_ = S;
    try {
      return solveEquation(cachedAst(lhsSrc, S), cachedAst(rhsSrc, S), name, S);
    } finally {
      S_ = null;
    }
  };
  C.withState = (S, fn) => {
    const prev = S_;
    S_ = S;
    try {
      return fn();
    } finally {
      S_ = prev;
    }
  };

  /* ---------- Formatting ---------- */
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const trimZeros = (s) => (s.includes(".") ? s.replace(/\.?0+$/, "") : s);
  function sci(x, sig) {
    if (x === 0) return "0";
    const [m, e] = x.toExponential(Math.max(0, sig - 1)).split("e");
    return `${trimZeros(m)}E${+e}`;
  }
  const PREFIX = { "-12": "p", "-9": "n", "-6": "µ", "-3": "m", 0: "", 3: "k", 6: "M", 9: "G", 12: "T" };
  function eng(x, sig) {
    if (x === 0) return { text: "0", prefix: "" };
    let e3 = Math.floor(Math.log10(Math.abs(x)) / 3) * 3;
    let m = x / 10 ** e3;
    let ms = trimZeros(m.toPrecision(sig));
    if (Math.abs(parseFloat(ms)) >= 1000) {
      e3 += 3;
      ms = trimZeros((x / 10 ** e3).toPrecision(sig));
    }
    return { text: e3 === 0 ? ms : `${ms}E${e3}`, prefix: PREFIX[e3] !== undefined ? `${ms} ${PREFIX[e3]}` : "" };
  }
  function formatNumber(x, mode = {}) {
    if (!Number.isFinite(x)) return x > 0 ? "∞" : x < 0 ? "-∞" : "undefined";
    if (Object.is(x, -0)) x = 0;
    const notation = mode.notation || "auto";
    const digits = mode.digits ?? 6;
    if (notation === "sci") return sci(x, Math.max(1, digits + 1));
    if (notation === "eng") return eng(x, Math.max(1, digits + 1)).text;
    if (notation === "fix") {
      if (Math.abs(x) >= 1e15) return sci(x, 10);
      return x.toFixed(Math.min(12, Math.max(0, digits)));
    }
    // auto: up to 12 significant digits, scientific for very large or small values
    const ax = Math.abs(x);
    if (ax !== 0 && (ax >= 1e12 || ax < 1e-5)) return sci(x, 12);
    let s = trimZeros(x.toPrecision(12));
    if (s.includes("e")) s = sci(x, 12);
    return s;
  }
  function formatDMS(deg, secDecimals = 2) {
    if (!Number.isFinite(deg)) return "undefined";
    const sign = deg < 0 ? "-" : "";
    let a = Math.abs(deg);
    let d = Math.floor(a), m = Math.floor((a - d) * 60);
    let s = +(((a - d) * 60 - m) * 60).toFixed(secDecimals);
    if (s >= 60) {
      s -= 60;
      m++;
    }
    if (m >= 60) {
      m -= 60;
      d++;
    }
    return `${sign}${d}°${String(m).padStart(2, "0")}'${s.toFixed(secDecimals).padStart(3 + secDecimals, "0")}"`;
  }
  function formatFraction(x) {
    const f = fraction(x, 100000, 1e-12);
    if (!f) return null;
    if (f.d === 1) return String(f.n);
    return `${f.n}/${f.d}`;
  }
  function formatValue(v, mode, as) {
    const fmt = (x) => {
      if (as === "frac") return formatFraction(x) ?? formatNumber(x, mode);
      if (as === "dms") return formatDMS(x);
      if (as === "sci") return sci(x, 12);
      if (as === "eng") return eng(x, 12).text;
      return formatNumber(x, mode);
    };
    if (isNum(v)) return fmt(v);
    if (isList(v)) return `{${v.map(fmt).join(", ")}}`;
    if (isMat(v)) return `[${v.mat.map((r) => `[${r.map(fmt).join(", ")}]`).join(", ")}]`;
    return String(v);
  }
  C.format = { number: formatNumber, value: formatValue, dms: formatDMS, fraction: formatFraction, sci, eng, SUP };

  /* ---------- Reference catalog (shown in the app) ---------- */
  C.CATALOG = [
    ["Basics", [
      ["x^y", "Power. 2^10 = 1024. Also x², x³ and x⁻¹ from the keypad."],
      ["√(x)", "Square root (sqrt). ∛(x) or cbrt(x) for a cube root; root(x, n) for an nth root."],
      ["abs(x)", "Absolute value."],
      ["x!", "Factorial. 5! = 120. Non-integers use the gamma function."],
      ["nCr(n, r)", "Combinations. nCr(5, 2) = 10."],
      ["nPr(n, r)", "Permutations. nPr(5, 2) = 20."],
      ["mod(a, b)", "Remainder with the sign of b. mod(370, 360) = 10."],
      ["round(x, n)", "Round to n decimals. round(2.4567, 2) = 2.46."],
      ["floor(x) · ceil(x) · int(x)", "Round down, round up, and the greatest integer ≤ x."],
      ["gcd(a, b) · lcm(a, b)", "Greatest common divisor and least common multiple."],
      ["x%", "Percent: 15% = 0.15."],
    ]],
    ["Trig and angles", [
      ["sin · cos · tan", "Use the current angle mode (DEG, RAD or GRAD)."],
      ["asin · acos · atan", "Inverse trig, answered in the current angle mode."],
      ["atan2(y, x)", "Angle of the point (x, y), in the right quadrant."],
      ["sec · csc · cot", "Reciprocal trig functions."],
      ["sinh · cosh · tanh", "Hyperbolic functions (and asinh, acosh, atanh)."],
      ["30°", "Degrees, whatever the mode: sin(30°) is always 0.5."],
      ["12°30'15\"", "Degrees, minutes and seconds. Same as dms(12, 30, 15)."],
      ["toDeg(x) · toRad(x)", "Convert radians to degrees and back."],
      ["hypot(a, b)", "√(a² + b²), the length of a hypotenuse."],
    ]],
    ["Exponents and logs", [
      ["ln(x)", "Natural log."],
      ["log(x)", "Base-10 log. log(x, b) for base b; log2(x) for base 2."],
      ["exp(x)", "eˣ."],
      ["2E3", "Scientific notation: 2×10³. The EE key types the E."],
    ]],
    ["Calculus and solving", [
      ["nDeriv(f, x, a)", "Derivative of f at x = a. nDeriv(x^3, x, 2) = 12."],
      ["fnInt(f, x, a, b)", "Definite integral. fnInt(sin(x), x, 0, 180) = 114.59… in DEG mode."],
      ["solve(eq, x, guess)", "A root near the guess: solve(x^2 = 2, x, 1) = 1.41421…. Add low, high for a range."],
      ["2x + 3 = 7", "Type an equation with one unknown to solve it directly."],
      ["fMin(f, x, a, b) · fMax(…)", "The x where f is smallest or largest on [a, b]."],
      ["sigma(f, k, a, b)", "Sum of f for k = a…b. sigma(k^2, k, 1, 10) = 385."],
    ]],
    ["Lists and statistics", [
      ["{1, 2, 3}", "A list. Math works item by item: {1,2,3}*2 = {2,4,6}."],
      ["L1 … L6", "The lists on the Stats tab."],
      ["mean · median · sum · prod", "List summaries. Also min and max."],
      ["stdev · var", "Sample standard deviation and variance (stdevp, varp for a population)."],
      ["seq(f, k, a, b, step)", "Build a list. seq(k^2, k, 1, 5) = {1, 4, 9, 16, 25}."],
      ["sort(L) · cumsum(L) · dim(L)", "Sort, running total, and length."],
      ["normcdf(lo, hi, μ, σ)", "Normal probability between lo and hi."],
      ["invNorm(p, μ, σ)", "Value with cumulative probability p."],
      ["normpdf(x, μ, σ)", "Normal density."],
    ]],
    ["Matrices", [
      ["[[1, 2], [3, 4]]", "A matrix, row by row."],
      ["[A] … [J]", "Stored matrices (edit them on the Matrix tab)."],
      ["det([A])", "Determinant."],
      ["inv([A]) or [A]⁻¹", "Inverse."],
      ["trans([A]) or [A]ᵀ", "Transpose."],
      ["rref([A])", "Reduced row echelon form."],
      ["linsolve([A], b)", "Solve A·x = b; b is a list."],
      ["identity(n)", "n×n identity matrix."],
    ]],
    ["Memory and functions", [
      ["A = 5  ·  5 → A", "Store a value. Any name works: Q = 2.5, area = 12*40."],
      ["f(x) = x^2 + 1", "Define a function; then f(3) = 10. Several inputs work: g(a, b) = a*b."],
      ["ans", "The last answer. Starting a line with + − × ÷ uses it automatically."],
      ["Y1(2)", "Evaluate a graph function at a value."],
      ["if(c, a, b)", "a when c is true (nonzero), otherwise b. Compare with < > <= >= == !=."],
    ]],
    ["Units and constants", [
      ["cvt(x, from, to)", "Convert units: cvt(100, cfs, m3s). The Units tab lists the codes."],
      ["g · g_ft", "Standard gravity, 9.80665 m/s² and 32.174 ft/s²."],
      ["gamma_w · gamma_w_ft", "Unit weight of water: 9.807 kN/m³ and 62.4 lb/ft³."],
      ["pi · e", "π and e. The Constants tab has the full list."],
    ]],
  ];

  root.CALC = C;
})(typeof window !== "undefined" ? window : globalThis);
