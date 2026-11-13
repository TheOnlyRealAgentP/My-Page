// Validates the GIS study content in teach/gis/data/*.js.
// Usage: node teach/gis/validate.mjs [file ...]   (defaults to every file in data/)
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "data");
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(dataDir).filter((f) => f.endsWith(".js")).map((f) => path.join(dataDir, f));

const errors = [];
const warns = [];
const err = (f, m) => errors.push(`${path.basename(f)}: ${m}`);
const warn = (f, m) => warns.push(`${path.basename(f)}: ${m}`);
const isStr = (s) => typeof s === "string" && s.trim().length > 0;

const BANNED = [
  [/\butili[sz](e|es|ed|ing|ation)\b/i, 'use "use" instead of "utilize"'],
  [/\b(all|none) of the above\b/i, '"all/none of the above" breaks when choices are shuffled'],
  [/\bdelve|tapestry|game[- ]changer|in today's world|it's important to note\b/i, "AI-sounding filler"],
];

// Pixel size of a WebP or PNG file, or null
function imageSize(p) {
  const b = fs.readFileSync(p);
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (kind === "VP8L") {
      const v = b.readUInt32LE(21);
      return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)];
    }
    if (kind === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  }
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  return null;
}

let figureCount = 0;
function checkFigure(file, at, f) {
  figureCount++;
  if (!f || !isStr(f.src) || !/^img\/[\w./-]+\.(webp|png)$/.test(f.src)) return err(file, `${at}.src must be a path like "img/qgis/x.webp"`);
  if (!isStr(f.alt)) err(file, `${at}.alt missing (describe the image for screen readers)`);
  if (!isStr(f.caption)) err(file, `${at}.caption missing`);
  const p = path.join(here, f.src);
  if (!fs.existsSync(p)) return err(file, `${at}: ${f.src} does not exist`);
  const size = imageSize(p);
  if (!size) return err(file, `${at}: cannot read the size of ${f.src}`);
  if (f.w !== size[0] || f.h !== size[1]) err(file, `${at}: w/h are ${f.w}×${f.h} but ${f.src} is ${size[0]}×${size[1]}`);
}

const ids = new Set();
let totals = { chapters: 0, sections: 0, cards: 0, questions: 0 };

for (const file of files) {
  const chapters = [];
  const ctx = { GIS: { chapter: (c) => chapters.push(c) } };
  try {
    vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  } catch (e) {
    err(file, `does not run: ${e.message}`);
    continue;
  }
  if (chapters.length !== 1) err(file, `must call GIS.chapter() exactly once (called ${chapters.length})`);

  for (const c of chapters) {
    totals.chapters++;
    const text = JSON.stringify(c);
    for (const [re, why] of BANNED) if (re.test(text)) err(file, `banned wording (${why}): ${text.match(re)[0]}`);

    if (!/^(ch\d{2}|qgis)$/.test(c.id || "")) err(file, `id must look like "ch03" or "qgis"`);
    if (c.id !== "qgis" && !(Number.isInteger(c.num) && c.num >= 1 && c.num <= 15)) err(file, "num must be 1–15");
    if (!isStr(c.title)) err(file, "missing title");
    if (!isStr(c.blurb)) err(file, "missing blurb");
    if (!Array.isArray(c.objectives) || c.objectives.length < 4 || c.objectives.length > 7)
      err(file, "objectives: 4–7 items");

    // Study guide
    if (!Array.isArray(c.guide) || c.guide.length < 5) err(file, "guide: at least 5 sections");
    (c.guide || []).forEach((s, i) => {
      totals.sections++;
      const at = `guide[${i}]`;
      if (!isStr(s.heading)) err(file, `${at}.heading missing`);
      if (!Array.isArray(s.paragraphs) || s.paragraphs.length < 1 || !s.paragraphs.every(isStr))
        err(file, `${at}.paragraphs: at least one non-empty string`);
      if (s.bullets && !(Array.isArray(s.bullets) && s.bullets.every(isStr))) err(file, `${at}.bullets must be strings`);
      if (s.formula && !(isStr(s.formula.expr) && Array.isArray(s.formula.where || [])))
        err(file, `${at}.formula needs expr (and optional where[])`);
      if (s.example && !(isStr(s.example.prompt) && Array.isArray(s.example.steps) && isStr(s.example.answer)))
        err(file, `${at}.example needs prompt, steps[], answer`);
      if (s.qgis !== undefined && !isStr(s.qgis)) err(file, `${at}.qgis must be a string`);
      if (s.figures !== undefined) {
        if (!Array.isArray(s.figures)) err(file, `${at}.figures must be an array`);
        else s.figures.forEach((f, j) => checkFigure(file, `${at}.figures[${j}]`, f));
      }
      const keys = Object.keys(s).filter((k) => !["heading", "paragraphs", "bullets", "formula", "example", "qgis", "figures"].includes(k));
      if (keys.length) err(file, `${at} has unknown keys: ${keys.join(", ")}`);
    });

    // Flashcards
    if (!Array.isArray(c.cards) || c.cards.length < 18) err(file, "cards: at least 18");
    const fronts = new Set();
    (c.cards || []).forEach((k, i) => {
      totals.cards++;
      if (!isStr(k.front) || !isStr(k.back)) err(file, `cards[${i}] needs front and back`);
      if (fronts.has((k.front || "").toLowerCase())) err(file, `cards[${i}] duplicate front "${k.front}"`);
      fronts.add((k.front || "").toLowerCase());
      if ((k.back || "").length > 260) warn(file, `cards[${i}] back is long (${k.back.length} chars)`);
    });

    // Questions
    if (!Array.isArray(c.questions) || c.questions.length < 20) err(file, "questions: at least 20");
    let tf = 0, mc = 0;
    (c.questions || []).forEach((q, i) => {
      totals.questions++;
      const at = `questions[${i}]`;
      if (!/^(ch\d{2}|qgis)-q\d{2,3}$/.test(q.id || "") || !q.id.startsWith(c.id + "-")) err(file, `${at}.id must look like "${c.id}-q01"`);
      if (ids.has(q.id)) err(file, `${at} duplicate id ${q.id}`);
      ids.add(q.id);
      if (!isStr(q.prompt)) err(file, `${at}.prompt missing`);
      if (!isStr(q.explain)) err(file, `${at}.explain missing`);
      if (q.type === "mc") {
        mc++;
        if (!Array.isArray(q.choices) || q.choices.length !== 4 || !q.choices.every(isStr)) err(file, `${at}: mc needs exactly 4 choices`);
        else if (new Set(q.choices.map((x) => x.toLowerCase())).size !== 4) err(file, `${at}: choices must be distinct`);
        if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3)) err(file, `${at}: mc answer must be index 0–3`);
      } else if (q.type === "tf") {
        tf++;
        if (typeof q.answer !== "boolean") err(file, `${at}: tf answer must be true/false`);
      } else if (q.type === "num") {
        if (typeof q.answer !== "number" || !isFinite(q.answer)) err(file, `${at}: num answer must be a number`);
        if (!(typeof q.tol === "number" && q.tol >= 0)) err(file, `${at}: num needs tol >= 0`);
      } else err(file, `${at}: type must be mc, tf or num`);
    });
    if (c.questions && tf > c.questions.length * 0.35) warn(file, `many true/false questions (${tf})`);
    if (c.questions && mc < c.questions.length * 0.5) warn(file, `fewer than half are multiple choice (${mc})`);
  }
}

console.log(`Checked ${files.length} file(s): ${totals.chapters} chapters, ${totals.sections} guide sections, ${figureCount} figures, ${totals.cards} cards, ${totals.questions} questions`);
warns.forEach((w) => console.log("warn  " + w));
errors.forEach((e) => console.log("ERROR " + e));
console.log(errors.length ? `${errors.length} error(s)` : "OK");
process.exit(errors.length ? 1 : 0);
