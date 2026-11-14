/* Calendar page.
   Events come from events.js, dated talks in ../presentations/talks.js, BYU's
   academic calendar (byu.js), U.S. holidays (holidays.js) and, once config.js
   has a calendar ID and API key, a public Google Calendar.
   With only a calendar ID (no key) it shows Google's embedded calendar instead. */
(function () {
  "use strict";
  const C = window.CALENDAR || {};
  const TZ = C.timeZone || "America/Denver";
  const box = document.getElementById("cal");
  const bar = document.getElementById("bar");
  document.getElementById("yr").textContent = new Date().getFullYear();

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const icon = (n) => `<i class="ph ph-${n}" aria-hidden="true"></i>`;
  const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");

  const enc = encodeURIComponent(C.id || "");
  if (C.id) {
    const ics = `https://calendar.google.com/calendar/ical/${enc}/public/basic.ics`;
    document.getElementById("sub-google").href = `https://calendar.google.com/calendar/u/0?cid=${btoa(C.id).replace(/=+$/, "")}`;
    document.getElementById("sub-ics").href = ics.replace(/^https:/, "webcal:");
    document.getElementById("subs").hidden = false;
  }
  bar.hidden = false;

  /* ---------- view switch (remembered per visitor) ---------- */
  let view = "month";
  try {
    view = localStorage.getItem("cal-view") === "list" ? "list" : "month";
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

  // which kinds of events to show (also remembered); the buttons double as the legend
  const hidden = new Set();
  try {
    (localStorage.getItem("cal-hide") || "").split(",").filter(Boolean).forEach((k) => hidden.add(k));
  } catch (_) {}
  const kindButtons = [...bar.querySelectorAll("[data-kind]")];
  const markKinds = () => kindButtons.forEach((b) => b.setAttribute("aria-pressed", String(!hidden.has(b.dataset.kind))));
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-kind]");
    if (!b) return;
    const k = b.dataset.kind;
    hidden.has(k) ? hidden.delete(k) : hidden.add(k);
    try {
      localStorage.setItem("cal-hide", [...hidden].join(","));
    } catch (_) {}
    markKinds();
    if (native) show();
  });
  markKinds();

  // a calendar ID without a key can only use Google's embed
  let native = !(C.id && !C.apiKey);
  const show = () => (native ? (view === "month" ? month() : list()) : embed());

  /* ---------- Google's embed (ID only, or if the API fails) ---------- */
  function embed() {
    bar.querySelector(".kinds").hidden = true; // Google's view has its own events only
    const q = new URLSearchParams({ src: C.id, ctz: TZ, mode: view === "month" ? "MONTH" : "AGENDA", showTitle: "0", showPrint: "0", showCalendars: "0", showTz: "0", showTabs: "0", wkst: "1" });
    box.innerHTML = `<div class="embed ${view}"><iframe src="https://calendar.google.com/calendar/embed?${q}" title="Calendar" loading="lazy"></iframe></div>`;
  }

  /* ---------- dates, all in the calendar's time zone ---------- */
  const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  const partsFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
  const dayKey = (d) => keyFmt.format(d); // "2026-11-13"
  const fromKey = (k) => new Date(`${k}T12:00:00Z`); // noon UTC: safe for date-only math
  const addDays = (k, n) => {
    const d = fromKey(k);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const keyLabel = (k, opts) => fromKey(k).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
  const today = () => dayKey(new Date());
  // wall-clock time in TZ (e.g. 2:00 PM Mountain on a date) -> the actual moment
  const offsetAt = (ms) => {
    const p = {};
    for (const x of partsFmt.formatToParts(new Date(ms))) p[x.type] = Number(x.value);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - ms;
  };
  const zoned = (k, h, mi) => {
    const [y, m, d] = k.split("-").map(Number);
    const guess = Date.UTC(y, m - 1, d, h, mi);
    return new Date(guess - offsetAt(guess - offsetAt(guess)));
  };

  const timeRange = (e) => {
    if (e.allDay) return "All day";
    const a = timeFmt.format(e.start);
    const b = timeFmt.format(e.end);
    // "2:00 – 3:00 PM" when both are AM or both PM
    return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`;
  };
  const shortTime = (d) => timeFmt.format(d).replace(":00", "").replace(" AM", "a").replace(" PM", "p");

  /* ---------- events on this site: events.js and dated talks ---------- */
  const local = [];
  for (const ev of window.CAL_EVENTS || []) {
    if (!ev || !ev.title || !isDate(ev.date)) continue;
    const t = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(ev.time || "");
    const dates = [ev.date];
    if (isDate(ev.weekly)) for (let k = addDays(ev.date, 7); k <= ev.weekly && dates.length < 60; k = addDays(k, 7)) dates.push(k);
    for (const k of dates) {
      const lastK = !t && !ev.weekly && isDate(ev.until) && ev.until > k ? ev.until : k;
      const days = [];
      for (let d = k; d <= lastK && days.length < 62; d = addDays(d, 1)) days.push(d);
      local.push({
        title: ev.title,
        allDay: !t,
        start: t ? zoned(k, +t[1], +t[2]) : fromKey(k),
        end: t ? zoned(k, +t[3], +t[4]) : fromKey(addDays(lastK, 1)),
        days,
        location: ev.place || "",
        note: ev.note || "",
        links: ev.link && ev.link.href ? [{ label: ev.link.label || "Link", href: ev.link.href }] : [],
        kind: "mine",
        addable: true,
      });
    }
  }
  for (const t of window.TALKS || []) {
    if (!t || !t.title || !t.slug || !isDate(t.date)) continue;
    local.push({
      title: t.title,
      allDay: true,
      start: fromKey(t.date),
      end: fromKey(addDays(t.date, 1)),
      days: [t.date],
      location: ["Talk", t.event, t.place].filter(Boolean).join(" · "),
      note: "",
      links: [{ label: "Slides", icon: "presentation", href: t.type === "pdf" ? `../presentations/view.html?talk=${encodeURIComponent(t.slug)}` : `../presentations/${encodeURIComponent(t.slug)}/` }],
      kind: "mine",
    });
  }

  /* ---------- BYU academic calendar (byu.js) and U.S. holidays (holidays.js) ---------- */
  const BYU = "https://academiccalendar.byu.edu/";
  // "Thanksgiving Day (observed)" -> "thanksgiving", to spot the same holiday in both lists
  const nameKey = (t) => t.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z]/g, "").replace(/(holiday|day)+$/, "");
  const byuHolidays = new Map(); // "date|name" -> BYU page
  for (const [first, last, title, path, flag] of window.BYU_EVENTS || []) {
    if (!isDate(first) || !title) continue;
    const lastK = isDate(last) && last > first ? last : first;
    const days = [];
    for (let d = first; d <= lastK && days.length < 62; d = addDays(d, 1)) days.push(d);
    const href = /^https?:\/\//.test(path || "") ? path : BYU + (path || "");
    if (flag === "h") days.forEach((d) => byuHolidays.set(`${d}|${nameKey(title)}`, href));
    local.push({ title, allDay: true, start: fromKey(first), end: fromKey(addDays(lastK, 1)), days, location: "", note: "", links: [{ label: "BYU academic calendar", href }], kind: "byu", byuKey: flag === "h" ? nameKey(title) : "" });
  }
  // holidays are worked out a year at a time as the calendar needs them
  const merged = new Set(); // BYU holiday days already shown as a U.S. holiday
  const holidayYears = new Set();
  function holidays(fromK, toK) {
    if (!window.usHolidays) return;
    for (let y = +fromK.slice(0, 4); y <= +toK.slice(0, 4) + 1; y++) {
      if (holidayYears.has(y)) continue;
      holidayYears.add(y);
      for (const h of window.usHolidays(y)) {
        const id = `${h.date}|${nameKey(h.title)}`;
        const byu = byuHolidays.get(id);
        if (byu) merged.add(id);
        local.push({ title: h.title, allDay: true, start: fromKey(h.date), end: fromKey(addDays(h.date, 1)), days: [h.date], location: "", note: h.note, links: byu ? [{ label: "BYU academic calendar", href: byu }] : [], kind: "holiday" });
      }
    }
  }

  // "Add to Google Calendar" link for an event on this site
  const gStamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const addLink = (e) => {
    const dates = e.allDay ? `${e.days[0].replace(/-/g, "")}/${addDays(e.days[e.days.length - 1], 1).replace(/-/g, "")}` : `${gStamp(e.start)}/${gStamp(e.end)}`;
    const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates, ctz: TZ });
    if (e.location) q.set("location", e.location);
    if (e.note) q.set("details", e.note);
    return `https://calendar.google.com/calendar/render?${q}`;
  };

  /* ---------- events from Google (needs config.js id + apiKey) ---------- */
  const cache = new Map();
  async function events(fromK, toK) {
    const id = `${fromK}/${toK}`;
    if (cache.has(id)) return cache.get(id);
    holidays(fromK, toK);
    let items = local;
    if (C.id && C.apiKey) {
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
      items = local.concat(((await r.json()).items || []).filter((it) => it.status !== "cancelled").map(fromGoogle));
    }
    cache.set(id, items);
    return items;
  }
  function fromGoogle(it) {
    const allDay = Boolean(it.start?.date);
    const start = allDay ? fromKey(it.start.date) : new Date(it.start?.dateTime);
    const end = allDay ? fromKey(it.end?.date || it.start.date) : new Date(it.end?.dateTime || it.start?.dateTime);
    // which days it shows on (all-day end dates are exclusive)
    const days = [];
    if (allDay) {
      for (let k = it.start.date; k < (it.end?.date || addDays(it.start.date, 1)) && days.length < 62; k = addDays(k, 1)) days.push(k);
    } else days.push(dayKey(start));
    return {
      title: it.summary || "Busy",
      allDay,
      start,
      end,
      days,
      location: it.location || "",
      note: it.description || "",
      links: it.htmlLink ? [{ label: "Open in Google Calendar", href: it.htmlLink }] : [],
      kind: "mine",
    };
  }
  const ORDER = { mine: 0, byu: 1, holiday: 2 };
  const byDay = (items, fromK, toK) => {
    const m = new Map();
    for (const e of items) {
      if (hidden.has(e.kind)) continue;
      for (const k of e.days) {
        if (k < fromK || k > toK) continue;
        // a BYU holiday that's also on the U.S. list shows once, as the holiday (with BYU's link)
        if (e.byuKey && merged.has(`${k}|${e.byuKey}`) && !hidden.has("holiday")) continue;
        (m.get(k) || m.set(k, []).get(k)).push(e);
      }
    }
    for (const list of m.values())
      list.sort((a, b) => (a.allDay !== b.allDay ? (a.allDay ? -1 : 1) : a.allDay ? ORDER[a.kind] - ORDER[b.kind] || a.title.localeCompare(b.title) : a.start - b.start));
    return m;
  };

  // notes can hold HTML (Google descriptions): keep the text and line breaks, then link URLs
  function noteHTML(html) {
    const withBreaks = String(html).replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li)>/gi, "\n");
    const text = new DOMParser().parseFromString(withBreaks, "text/html").body.textContent.trim();
    return esc(text)
      .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`)
      .replace(/\n{2,}/g, "\n")
      .replace(/\n/g, "<br />");
  }

  const linkHTML = (l) => {
    const ext = /^https?:\/\//.test(l.href) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a class="act" href="${esc(l.href)}"${ext}>${icon(l.icon || (ext ? "arrow-square-out" : "arrow-right"))}${esc(l.label)}</a>`;
  };
  const eventHTML = (e) => {
    const links = e.links.slice();
    if (e.addable && e.end > new Date()) links.push({ label: "Add to Google Calendar", icon: "calendar-plus", href: addLink(e) });
    const body = `${e.note ? `<p>${noteHTML(e.note)}</p>` : ""}${links.length ? `<div class="ev-links">${links.map(linkHTML).join("")}</div>` : ""}`;
    const head = `
          <span class="ev-time">${esc(timeRange(e))}</span>
          <span class="ev-title">${esc(e.title)}</span>
          ${e.location ? `<span class="ev-loc">${icon("map-pin")}${esc(e.location)}</span>` : ""}`;
    // nothing to expand: show it as a plain row
    return body
      ? `<li class="k-${e.kind}"><details class="ev"><summary>${head}</summary><div class="ev-body">${body}</div></details></li>`
      : `<li class="k-${e.kind}"><div class="ev"><div class="ev-row">${head}</div></div></li>`;
  };

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
    if (!items || view !== "list") return;
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
    if (!items || view !== "month") return;
    const map = byDay(items, gridStart, gridEnd);
    const cells = [];
    for (let k = gridStart; k <= gridEnd; k = addDays(k, 1)) {
      const evs = map.get(k) || [];
      const cls = ["cell", k.slice(0, 7) !== cursor ? "out" : "", k === today() ? "is-today" : "", k === picked ? "picked" : "", evs.length ? "has" : ""].join(" ");
      const chips = evs
        .slice(0, 3)
        .map((e) => `<span class="chip k-${e.kind}">${e.allDay ? "" : `<b>${esc(shortTime(e.start))}</b> `}${esc(e.title)}</span>`)
        .join("");
      const dots = evs.length ? `<span class="dots">${[...new Set(evs.map((e) => e.kind))].map((k) => `<i class="k-${k}"></i>`).join("")}</span>` : "";
      const more = evs.length > 3 ? `<span class="chip more">+${evs.length - 3} more</span>` : "";
      const label = `${keyLabel(k, { weekday: "long", month: "long", day: "numeric" })}, ${evs.length ? `${evs.length} event${evs.length > 1 ? "s" : ""}` : "nothing scheduled"}`;
      cells.push(`<button type="button" class="${cls}" data-k="${k}" aria-label="${esc(label)}" aria-pressed="${k === picked}"><span class="n">${Number(k.slice(8))}</span>${chips}${more}${dots}</button>`);
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
