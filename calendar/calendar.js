/* Calendar page. Settings live in config.js.
   With an API key it draws the events itself (list + month);
   with only a calendar ID it shows Google's embedded calendar. */
(function () {
  "use strict";
  const C = window.CALENDAR || {};
  const TZ = C.timeZone || "America/Denver";
  const box = document.getElementById("cal");
  const bar = document.getElementById("bar");
  document.getElementById("yr").textContent = new Date().getFullYear();

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const icon = (n) => `<i class="ph ph-${n}" aria-hidden="true"></i>`;

  if (!C.id) {
    box.innerHTML = `<p class="empty">Nothing posted yet.</p>`;
    return;
  }

  const enc = encodeURIComponent(C.id);
  const ics = `https://calendar.google.com/calendar/ical/${enc}/public/basic.ics`;
  document.getElementById("sub-google").href = `https://calendar.google.com/calendar/u/0?cid=${btoa(C.id).replace(/=+$/, "")}`;
  document.getElementById("sub-ics").href = ics.replace(/^https:/, "webcal:");
  bar.hidden = false;

  /* ---------- view switch (remembered per visitor) ---------- */
  let view = "list";
  try {
    view = localStorage.getItem("cal-view") === "month" ? "month" : "list";
  } catch (_) {}
  const buttons = [...bar.querySelectorAll("[data-view]")];
  const mark = () => buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (!b || b.dataset.view === view) return;
    view = b.dataset.view;
    try {
      localStorage.setItem("cal-view", view);
    } catch (_) {}
    mark();
    show();
  });
  mark();

  let native = Boolean(C.apiKey);
  const show = () => (native ? (view === "month" ? month() : list()) : embed());

  /* ---------- Google's embed (ID only, or if the API fails) ---------- */
  function embed() {
    const q = new URLSearchParams({ src: C.id, ctz: TZ, mode: view === "month" ? "MONTH" : "AGENDA", showTitle: "0", showPrint: "0", showCalendars: "0", showTz: "0", showTabs: "0", wkst: "1" });
    box.innerHTML = `<div class="embed ${view}"><iframe src="https://calendar.google.com/calendar/embed?${q}" title="Calendar" loading="lazy"></iframe></div>`;
  }

  /* ---------- dates, all in the calendar's time zone ---------- */
  const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  const dayKey = (d) => keyFmt.format(d); // "2026-11-13"
  const fromKey = (k) => new Date(`${k}T12:00:00Z`); // noon UTC: safe for date-only math
  const addDays = (k, n) => {
    const d = fromKey(k);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const keyLabel = (k, opts) => fromKey(k).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
  const today = () => dayKey(new Date());

  const timeRange = (e) => {
    if (e.allDay) return "All day";
    const a = timeFmt.format(e.start);
    const b = timeFmt.format(e.end);
    // "2:00 – 3:00 PM" when both are AM or both PM
    return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
  };
  const shortTime = (d) => timeFmt.format(d).replace(":00", "").replace(" AM", "a").replace(" PM", "p");

  /* ---------- events from the Calendar API ---------- */
  const cache = new Map();
  async function events(fromK, toK) {
    const id = `${fromK}/${toK}`;
    if (cache.has(id)) return cache.get(id);
    const q = new URLSearchParams({
      key: C.apiKey,
      // a day of slack on each side covers any time-zone offset; filtered by day key below
      timeMin: fromKey(addDays(fromK, -1)).toISOString(),
      timeMax: fromKey(addDays(toK, 1)).toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
      timeZone: TZ,
    });
    const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${enc}/events?${q}`);
    if (!r.ok) throw new Error(`Calendar API ${r.status}`);
    const items = ((await r.json()).items || []).filter((it) => it.status !== "cancelled").map(norm);
    cache.set(id, items);
    return items;
  }
  function norm(it) {
    const allDay = Boolean(it.start?.date);
    const start = allDay ? fromKey(it.start.date) : new Date(it.start?.dateTime);
    const end = allDay ? fromKey(it.end?.date || it.start.date) : new Date(it.end?.dateTime || it.start?.dateTime);
    // which days it shows on (all-day end dates are exclusive)
    const days = [];
    if (allDay) {
      for (let k = it.start.date; k < (it.end?.date || addDays(it.start.date, 1)) && days.length < 62; k = addDays(k, 1)) days.push(k);
    } else days.push(dayKey(start));
    return { title: it.summary || "Busy", allDay, start, end, days, location: it.location || "", description: it.description || "", link: it.htmlLink || "" };
  }
  const byDay = (items, fromK, toK) => {
    const m = new Map();
    for (const e of items) for (const k of e.days) if (k >= fromK && k <= toK) (m.get(k) || m.set(k, []).get(k)).push(e);
    for (const list of m.values()) list.sort((a, b) => (a.allDay === b.allDay ? a.start - b.start : a.allDay ? -1 : 1));
    return m;
  };

  // Google descriptions can hold HTML: keep the text and line breaks, then link URLs
  function descHTML(html) {
    const withBreaks = String(html).replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n");
    const text = new DOMParser().parseFromString(withBreaks, "text/html").body.textContent.trim();
    return esc(text)
      .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`)
      .replace(/\n{2,}/g, "\n")
      .replace(/\n/g, "<br />");
  }

  const eventHTML = (e) => `
    <li>
      <details class="ev">
        <summary>
          <span class="ev-time">${esc(timeRange(e))}</span>
          <span class="ev-title">${esc(e.title)}</span>
          ${e.location ? `<span class="ev-loc">${icon("map-pin")}${esc(e.location)}</span>` : ""}
        </summary>
        <div class="ev-body">
          ${e.description ? `<p>${descHTML(e.description)}</p>` : ""}
          ${e.link ? `<a class="act" href="${esc(e.link)}" target="_blank" rel="noopener noreferrer">${icon("arrow-square-out")}Open in Google Calendar</a>` : ""}
        </div>
      </details>
    </li>`;

  const dayHTML = (k, list) => `
    <section class="day${k === today() ? " is-today" : ""}">
      <h2><span class="d-name">${esc(keyLabel(k, { weekday: "long" }))}</span><span class="d-date">${esc(keyLabel(k, { month: "short", day: "numeric" }))}</span>${k === today() ? `<span class="d-today">Today</span>` : ""}</h2>
      <ul class="evs">${list.map(eventHTML).join("")}</ul>
    </section>`;

  // only says "Loading" if the fetch is slow, so flipping between loaded months doesn't flash
  async function load(fromK, toK) {
    const wait = setTimeout(() => (box.innerHTML = `<p class="empty">Loading…</p>`), 150);
    try {
      return await events(fromK, toK);
    } catch (err) {
      console.warn(err);
      native = false; // bad key, quota, or the calendar isn't public yet: use Google's view
      embed();
      return null;
    } finally {
      clearTimeout(wait);
    }
  }

  /* ---------- list: today onward, eight weeks at a time ---------- */
  let horizon = 56;
  async function list() {
    const from = today();
    const to = addDays(from, horizon - 1);
    const items = await load(from, to);
    if (!items) return;
    if (view !== "list") return;
    const days = [...byDay(items, from, to)].sort(([a], [b]) => a.localeCompare(b));
    const until = keyLabel(to, { month: "long", day: "numeric" });
    box.innerHTML = `
      ${days.length ? days.map(([k, l]) => dayHTML(k, l)).join("") : `<p class="empty">Nothing scheduled through ${esc(until)}.</p>`}
      <div class="more"><span>Showing through ${esc(until)}</span><button type="button" class="act" id="later">${icon("caret-down")}Later</button></div>`;
    document.getElementById("later").onclick = () => {
      horizon += 56;
      list();
    };
  }

  /* ---------- month grid; tap a day to see it below ---------- */
  let cursor = today().slice(0, 7); // "2026-11"
  let picked = today();
  async function month(refocus) {
    const first = `${cursor}-01`;
    const lastK = addDays(addDays(first, 32).slice(0, 7) + "-01", -1);
    const gridStart = addDays(first, -fromKey(first).getUTCDay());
    const gridEnd = addDays(lastK, 6 - fromKey(lastK).getUTCDay());
    if (picked.slice(0, 7) !== cursor) picked = cursor === today().slice(0, 7) ? today() : first;

    const items = await load(gridStart, gridEnd);
    if (!items) return;
    if (view !== "month") return;
    const map = byDay(items, gridStart, gridEnd);
    const cells = [];
    for (let k = gridStart; k <= gridEnd; k = addDays(k, 1)) {
      const evs = map.get(k) || [];
      const cls = ["cell", k.slice(0, 7) !== cursor ? "out" : "", k === today() ? "is-today" : "", k === picked ? "picked" : "", evs.length ? "has" : ""].join(" ");
      const chips = evs
        .slice(0, 3)
        .map((e) => `<span class="chip">${e.allDay ? "" : `<b>${esc(shortTime(e.start))}</b> `}${esc(e.title)}</span>`)
        .join("");
      const more = evs.length > 3 ? `<span class="chip more">+${evs.length - 3} more</span>` : "";
      const label = `${keyLabel(k, { weekday: "long", month: "long", day: "numeric" })}, ${evs.length ? `${evs.length} event${evs.length > 1 ? "s" : ""}` : "nothing scheduled"}`;
      cells.push(`<button type="button" class="${cls}" data-k="${k}" aria-label="${esc(label)}" aria-pressed="${k === picked}"><span class="n">${Number(k.slice(8))}</span>${chips}${more}</button>`);
    }
    const pickedEvs = map.get(picked) || [];
    box.innerHTML = `
      <div class="m-head">
        <button type="button" class="act icon" data-step="-1" aria-label="Previous month">${icon("caret-left")}</button>
        <h2>${esc(keyLabel(first, { month: "long", year: "numeric" }))}</h2>
        <button type="button" class="act icon" data-step="1" aria-label="Next month">${icon("caret-right")}</button>
        ${cursor !== today().slice(0, 7) ? `<button type="button" class="act" data-step="0">Today</button>` : ""}
      </div>
      <div class="m-grid">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => `<span class="wd">${d}</span>`).join("")}
        ${cells.join("")}
      </div>
      <div class="m-day">${pickedEvs.length ? dayHTML(picked, pickedEvs) : `<p class="empty">${esc(keyLabel(picked, { weekday: "long", month: "long", day: "numeric" }))}: nothing scheduled.</p>`}</div>`;

    if (refocus) box.querySelector(refocus)?.focus();
    box.querySelectorAll("[data-step]").forEach((b) =>
      b.addEventListener("click", () => {
        const s = Number(b.dataset.step);
        cursor = s === 0 ? today().slice(0, 7) : addDays(`${cursor}-15`, s * 30).slice(0, 7);
        month(s ? `[data-step="${s}"]` : ".cell.picked");
      })
    );
    box.querySelector(".m-grid").addEventListener("click", (e) => {
      const c = e.target.closest(".cell");
      if (!c) return;
      picked = c.dataset.k;
      if (picked.slice(0, 7) !== cursor) cursor = picked.slice(0, 7);
      month(".cell.picked");
    });
  }

  show();
})();
