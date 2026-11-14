/* U.S. holidays and common observances, worked out from their date rules,
   so there's nothing to update from year to year. Matches Google's
   "Holidays in United States" calendar, plus Pioneer Day for Utah.
   usHolidays(2026) -> [{ date: "2026-01-01", title: "New Year's Day", note: "Federal holiday" }, ...] */
(function () {
  "use strict";
  const iso = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 12)).toISOString().slice(0, 10);
  const shift = (k, n) => {
    const t = new Date(`${k}T12:00:00Z`);
    t.setUTCDate(t.getUTCDate() + n);
    return t.toISOString().slice(0, 10);
  };
  const weekday = (k) => new Date(`${k}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  // nth weekday of a month (n = -1 for the last one)
  const nth = (y, m, wd, n) => {
    if (n > 0) return shift(iso(y, m, 1), ((wd - weekday(iso(y, m, 1)) + 7) % 7) + (n - 1) * 7);
    const last = iso(y, m + 1, 0);
    return shift(last, -((weekday(last) - wd + 7) % 7));
  };
  // Easter Sunday (Anonymous Gregorian algorithm)
  const easter = (y) => {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return iso(y, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1);
  };

  window.usHolidays = function (y) {
    const out = [];
    const add = (date, title, note = "") => out.push({ date, title, note });
    // a fixed-date holiday on a weekend is observed on the Friday before or the Monday after
    const fixed = (date, title, note) => {
      add(date, title, note);
      const w = weekday(date);
      if (w === 6) add(shift(date, -1), `${title} (observed)`, note);
      if (w === 0) add(shift(date, 1), `${title} (observed)`, note);
    };
    const FED = "Federal holiday";

    fixed(iso(y, 1, 1), "New Year's Day", FED);
    add(nth(y, 1, 1, 3), "Martin Luther King Jr. Day", FED);
    add(iso(y, 2, 14), "Valentine's Day");
    add(nth(y, 2, 1, 3), "Presidents' Day", FED);
    add(nth(y, 3, 0, 2), "Daylight saving time starts", "Clocks go forward an hour.");
    add(iso(y, 3, 17), "St. Patrick's Day");
    const e = easter(y);
    add(e, "Easter Sunday");
    add(shift(e, 1), "Easter Monday");
    // Tax Day moves off weekends and off D.C.'s Emancipation Day (April 16, or its observed day)
    const emancipation = { 6: iso(y, 4, 15), 0: iso(y, 4, 17) }[weekday(iso(y, 4, 16))] || iso(y, 4, 16);
    let tax = iso(y, 4, 15);
    while (weekday(tax) === 0 || weekday(tax) === 6 || tax === emancipation) tax = shift(tax, 1);
    add(tax, "Tax Day");
    add(iso(y, 5, 5), "Cinco de Mayo");
    add(nth(y, 5, 0, 2), "Mother's Day");
    add(nth(y, 5, 1, -1), "Memorial Day", FED);
    add(iso(y, 6, 14), "Flag Day");
    fixed(iso(y, 6, 19), "Juneteenth", FED);
    add(nth(y, 6, 0, 3), "Father's Day");
    fixed(iso(y, 7, 4), "Independence Day", FED);
    fixed(iso(y, 7, 24), "Pioneer Day", "Utah state holiday");
    add(nth(y, 9, 1, 1), "Labor Day", FED);
    add(nth(y, 10, 1, 2), "Columbus Day", FED);
    add(iso(y, 10, 31), "Halloween");
    add(nth(y, 11, 0, 1), "Daylight saving time ends", "Clocks go back an hour.");
    add(shift(nth(y, 11, 1, 1), 1), "Election Day");
    fixed(iso(y, 11, 11), "Veterans Day", FED);
    const thanks = nth(y, 11, 4, 4);
    add(thanks, "Thanksgiving Day", FED);
    add(shift(thanks, 1), "Black Friday");
    add(iso(y, 12, 24), "Christmas Eve");
    fixed(iso(y, 12, 25), "Christmas Day", FED);
    add(iso(y, 12, 31), "New Year's Eve");
    return out;
  };
})();
