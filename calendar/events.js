/* =========================================================================
   Events for the calendar page. All times are Mountain Time.

   { title: "TA office hours", date: "2026-11-17", time: "14:00-15:00", place: "CB 230", weekly: "2026-12-10" }
   { title: "Midterm review", date: "2026-11-19", time: "18:30-20:00", place: "CB 120", note: "Chapters 1 to 8." }
   { title: "No class: Thanksgiving", date: "2026-11-25", until: "2026-11-27" }

   date     the day, "YYYY-MM-DD"
   time     "HH:MM-HH:MM" on a 24-hour clock; leave it out for an all-day event
   until    last day of a multi-day, all-day event
   weekly   repeats every week on the same weekday through this date
   place    room or building
   note     shown when someone opens the event; URLs become links
   link     { label: "Sign up", href: "https://..." }

   Talks with a full date in presentations/talks.js show up on the calendar on their own.
   ========================================================================= */

window.CAL_EVENTS = [];
