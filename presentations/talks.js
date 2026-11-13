/* =========================================================================
   Presentations list. Newest first is not required; the page sorts by date.

   PDF talk (exported from PowerPoint, Google Slides, Keynote or Canva):
     put the file at presentations/<slug>/slides.pdf, then add
     { slug: "2026-ciroh-meeting", type: "pdf", title: "...", event: "...", place: "...", date: "2026-09-15" }

   Web talk (reveal.js, with speaker notes and presenter view):
     copy presentations/_web-template/ to presentations/<slug>/, edit its index.html, then add
     { slug: "2026-lab-meeting", type: "web", title: "...", event: "...", date: "2026-10-02" }

   Optional fields:
     date    "2026-09-15", or "2026-09" for just the month
     place   city or room, shown after the event
     thumb   a cover image in the talk's folder (e.g. "thumb.jpg"); PDF talks use slide 1 if left out
     file    PDF file name if it isn't slides.pdf
     pdf     for a web talk, a PDF copy in its folder to offer as a download
   ========================================================================= */

window.TALKS = [
  {
    slug: "2026-fimview-and-fimserv",
    type: "web",
    title: "FIMview and FIMserv",
    event: "Research group briefing",
    place: "BYU",
    date: "2026-10-14",
    thumb: "slides/01.webp",
    pdf: "slides.pdf",
  },
  {
    slug: "2026-web-mapping-with-ai",
    type: "web",
    title: "Web Mapping with AI",
    event: "CCE 114 · Practice Your Skills",
    place: "BYU",
    date: "2026-11",
    thumb: "slides/01.webp",
    pdf: "slides.pdf",
  },
];
