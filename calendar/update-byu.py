"""Refresh calendar/byu.js from BYU's academic calendar (academiccalendar.byu.edu).

    python3 calendar/update-byu.py            # this year and the next two
    python3 calendar/update-byu.py 2026 2029  # a range of years

BYU's export doesn't allow other sites to read it from the browser, so the
calendar page uses this saved copy. Run it again when BYU posts a new year.
"""
import datetime as dt
import html
import json
import pathlib
import re
import sys
import urllib.request

SRC = "https://academiccalendar.byu.edu"
OUT = pathlib.Path(__file__).with_name("byu.js")

# BYU's names are inconsistent from year to year; first match wins
NAMES = [
    (r"^2nd term add.?drop", "Add/drop deadline: 2nd term"),
    (r"^add.?drop deadline.*summer", "Add/drop deadline: summer term"),
    (r"^add.?drop deadline", "Add/drop deadline: full semester & 1st term"),
    (r"^1st term withdraw", "Withdraw deadline: 1st term"),
    (r"^(2nd term withdraw|withdraw deadline \(2nd term\))", "Withdraw deadline: 2nd term"),
    (r"^withdraw deadline \(full semester & 2nd term\)", "Withdraw deadline: full semester & 2nd term"),
    (r"^spring term withdraw", "Withdraw deadline: spring term"),
    (r"^summer term withdraw", "Withdraw deadline: summer term"),
    (r"^withdraw deadline.*full semester", "Withdraw deadline: full semester"),
    (r"^start of classes", "First day of classes"),
    (r"^last day of class", "Last day of classes"),
    (r"^final exam", "Final exams"),
    (r"^exam preparation", "Exam prep day"),
    (r"^convocation", "Convocations"),
    (r"^new years? day", "New Year's Day"),
    (r"^new years? eve", "New Year's Eve"),
    (r"^martin luther king", "Martin Luther King Jr. Day"),
    (r"^presidents.? day", "Presidents' Day"),
    (r"^independence day holiday \(observed\)", "Independence Day (observed)"),
    (r"^pioneer day holiday \(observed\)", "Pioneer Day (observed)"),
    (r"^thanksgiving$", "Thanksgiving Day"),
]
KEEP_CAPS = {"Education Week", "Commencement", "Independence Day", "Juneteenth", "Labor Day", "Memorial Day", "Pioneer Day", "Christmas Day", "Christmas Eve"}
HOLIDAY_NAMES = {"New Year's Day", "New Year's Eve", "Martin Luther King Jr. Day", "Presidents' Day", "Memorial Day", "Juneteenth",
                 "Independence Day", "Independence Day (observed)", "Pioneer Day", "Pioneer Day (observed)", "Labor Day",
                 "Thanksgiving Day", "Thanksgiving holiday", "Christmas Eve", "Christmas Day", "Christmas holiday"}


def tidy(title):
    t = re.sub(r"\s+", " ", title).strip()
    for pat, name in NAMES:
        if re.search(pat, t, re.I):
            return name
    if t in KEEP_CAPS:
        return t
    return t[:1].upper() + t[1:].lower()


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (calendar sync)"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8")


def events(year):
    text = get(f"{SRC}/academicCalendar/export?start={year}-01-01&end={year}-12-31")
    text = text.replace("\r\n", "\n").replace("\n ", "")  # unfold long lines
    seen = set(re.findall(r"^URL:(\S+)$", text, re.M))
    for block in re.findall(r"BEGIN:VEVENT\n(.*?)END:VEVENT", text, re.S):
        start = re.search(r"^DTSTART[^:\n]*:(\d{8})", block, re.M)
        title = re.search(r"^SUMMARY:(.*)$", block, re.M)
        if not start or not title:
            continue
        end = re.search(r"^DTEND[^:\n]*:(\d{8})", block, re.M)
        link = re.search(r"^URL:(\S+)$", block, re.M)
        d0 = dt.datetime.strptime(start.group(1), "%Y%m%d").date()
        d1 = dt.datetime.strptime(end.group(1), "%Y%m%d").date() if end else d0 + dt.timedelta(days=1)
        d = d0
        while d < max(d1, d0 + dt.timedelta(days=1)):  # DTEND is exclusive
            yield d, tidy(title.group(1)), link.group(1) if link else ""
            d += dt.timedelta(days=1)

    # the export sometimes skips an event that the year's page links to; read those pages directly
    page = html.unescape(get(f"{SRC}/?y={year}"))
    for url, slug_date in sorted(set(re.findall(r'href="(' + re.escape(SRC) + r'/[^"]+-(\d{4}-\d{2}-\d{2}))"', page))):
        if url in seen:
            continue
        seen.add(url)
        one = html.unescape(get(url))
        name = re.search(r"<title>\s*(.*?)\s*-\s*Academic Calendar\s*</title>", one, re.S)
        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", one))
        when = re.search(r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2})\b", text)
        d = dt.date.fromisoformat(slug_date)
        if when:  # the page's own date wins; the link's date can be stale
            d = dt.datetime.strptime(f"{d.year} {when.group(1)} {when.group(2)}", "%Y %B %d").date()
        if name:
            print("  added from its page:", name.group(1), d)
            yield d, tidy(name.group(1)), url


def main():
    this = dt.date.today().year
    lo, hi = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (this, this + 2)
    days = {}
    for y in range(lo, hi + 1):
        for d, title, link in events(y):
            if lo <= d.year <= hi:
                days.setdefault((title, d), link)
    # back-to-back days with the same name become one event
    rows = []
    for (title, d), link in sorted(days.items(), key=lambda kv: (kv[0][1], kv[0][0])):
        prev = next((r for r in reversed(rows[-12:]) if r[2] == title), None)
        if prev and dt.date.fromisoformat(prev[1] or prev[0]) + dt.timedelta(days=1) == d:
            prev[1] = d.isoformat()
            continue
        path = link.replace(SRC + "/", "") if link.startswith(SRC) else link
        rows.append([d.isoformat(), "", title, path, "h" if "/holidays/" in link or title in HOLIDAY_NAMES else ""])
    lines = ",\n".join("  " + json.dumps(r, ensure_ascii=False) for r in rows)
    OUT.write_text(
        f"/* BYU academic calendar, {lo} to {hi}, from {SRC}\n"
        f"   Made by update-byu.py on {dt.date.today().isoformat()}. Don't edit by hand; run the script again.\n"
        f"   [first day, last day if more than one, name, page on {SRC}, \"h\" for holidays] */\n"
        f"window.BYU_EVENTS = [\n{lines}\n];\n"
    )
    print(f"wrote {OUT.name}: {len(rows)} events, {lo}-{hi}")


if __name__ == "__main__":
    main()
