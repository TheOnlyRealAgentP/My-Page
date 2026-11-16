/* =========================================================================
   SITE CONTENT
   -------------------------------------------------------------------------
   Edit this file to change text, links, icons and layout. No other file
   needs to change for normal content updates.

   Links: use "#" for anything not ready yet. Clicking it shows a
   "pending completion" popup. Use "" when something shouldn't be a link.

   Page structure
     profile    header: name, roles, bio, contact links
     paths      the large "who is this for" tiles under the header
     sections   each has groups; each group has a type:
                  "cards"   grid of cards (span = width out of 6 columns)
                  "list"    rows with icon, title, subtitle and optional link
                  "badges"  small tags

   Card fields
     icon, kicker, title, desc, tags, status, featured, span
     href      makes the whole card a link (cta = link label)
     actions   instead of href: a row of buttons, e.g.
               [{ label: "Explainer", icon: "book-open", href: "#" },
                { label: "Share", icon: "share-network", share: "research/fludd/" }]
               share: the path or URL to share. Opens the device share sheet,
               or copies the link where that isn't available.

   Icons: any Phosphor icon name (https://phosphoricons.com)
   ========================================================================= */

window.SITE = {
  profile: {
    name: "Harrison Stewart",
    initials: "HS",
    photo: "assets/headshot.jpg", // Leave empty to show initials.
    title: "Civil engineering student · BYU",
    roles: [
      { icon: "chalkboard-teacher", label: "TA · CCE 114 Geomatics", href: "#students" },
      { icon: "drop", label: "Research Assistant · BYU Hydroinformatics Lab", href: "https://hydroinformatics.byu.edu" },
    ],
    bio: "I TA CCE 114, work in the BYU Hydroinformatics Lab, and write FIM (flood inundation map) generation software. When I'm not doing that I'm usually messing with ham radio, Meshtastic or the 3D printer.",
    links: [
      { icon: "github-logo", label: "GitHub", href: "https://github.com/TheOnlyRealAgentP" },
      { icon: "envelope-simple", label: "Email", email: ["hstew21", "byu.edu"] }, // put together in the browser so bots scanning the files don't pick it up
      { icon: "calendar-blank", label: "Calendar", href: "calendar/" },
    ],
  },

  // Extra top-menu links, shown after the first section's link
  navLinks: [{ label: "Slides", href: "presentations/" }],

  paths: [
    {
      icon: "globe-hemisphere-west",
      kicker: "Research · live",
      title: "National Flood Map",
      desc: "Where rivers flood, from the 2-year to the 100-year flood, across the lower 48.",
      href: "https://theonlyrealagentp.github.io/national-flood-map/",
      image: "research/national-flood-map/img/tile.webp",
      wide: true,
    },
    {
      icon: "cloud-lightning",
      kicker: "Personal project · live",
      title: "Watergaw",
      desc: "Free weather radar with the features other apps charge for: storm tracks, the next hour of rain and warnings.",
      href: "https://watergawradar.com",
      image: "assets/watergaw/tile.webp",
      wide: true,
    },
    {
      icon: "student",
      kicker: "CCE 114 & 414",
      title: "GIS & QGIS",
      desc: "Study guides, flashcards and practice tests for Bolstad's GIS Fundamentals.",
      href: "#students",
    },
    {
      icon: "presentation",
      kicker: "Teaching",
      title: "Presentations",
      desc: "Slides from class and talks. You can present them right from the page.",
      href: "presentations/",
    },
    {
      icon: "flask",
      kicker: "Research",
      title: "What I'm working on",
      desc: "The National Flood Map, FIMview, RIVR and a reading list on flood mapping.",
      href: "#research",
    },
    {
      icon: "compass-tool",
      kicker: "Tools",
      title: "Calculators",
      desc: "Curves, leveling, COGO, Manning's and a graphing calculator. They show the work, not just the answer.",
      href: "#tools",
    },
  ],

  sections: [
    /* ------------------------------------------------------------------ */
    {
      id: "students",
      label: "CCE 114 & 414: GIS & QGIS",
      navLabel: "GIS 114",
      icon: "student",
      blurb: "Both classes use Bolstad's GIS Fundamentals. The QGIS stuff is just for 114, since 414 uses ArcGIS Pro.",
      groups: [
        {
          title: "Study the book",
          type: "cards",
          items: [
            {
              icon: "book-open-text",
              kicker: "15 chapters + QGIS",
              title: "Study guides",
              desc: "Every chapter of the book broken down, with worked examples, the key terms and a quick quiz at the end. You can print them too.",
              tags: ["Bolstad", "Key terms", "Printable"],
              href: "teach/gis/",
              cta: "Open study hub",
              span: 2,
              status: "New",
              featured: true,
            },
            {
              icon: "cards",
              kicker: "467 cards",
              title: "Flashcards",
              desc: "Key terms by chapter, or all of them at once. It remembers which ones you already know.",
              tags: ["Shuffle", "Keyboard", "Progress saved"],
              href: "teach/gis/#/cards/ch01,ch02,ch03,ch04,ch05,ch06,ch07,ch08,ch09,ch10,ch11,ch12,ch13,ch14,ch15",
              cta: "Study cards",
              span: 2,
              featured: true,
            },
            {
              icon: "exam",
              kicker: "460+ questions",
              title: "Practice tests",
              desc: "Pick the chapters and you get a random test. The math questions get new numbers every time, so memorizing answers won't help.",
              tags: ["Auto-graded", "Share a test", "Answer key"],
              href: "teach/gis/#/test?ch=ch01,ch02,ch03,ch04,ch05,ch06,ch07,ch08,ch09,ch10,ch11,ch12,ch13,ch14,ch15&n=20&calc=1",
              cta: "Take a 20-question test",
              span: 2,
              featured: true,
            },
          ],
        },
        {
          title: "Turning in work",
          type: "cards",
          items: [
            {
              icon: "file-pdf",
              kicker: "Photos, Word, Excel, PowerPoint",
              title: "Convert to PDF",
              desc: "Turn photos of your work, Word docs, spreadsheets and slides into a PDF you can turn in. It runs in your browser, so nothing gets uploaded.",
              tags: ["Phone camera", "Office files", "No upload"],
              href: "teach/pdf/#convert",
              cta: "Convert files",
              span: 3,
              status: "New",
            },
            {
              icon: "files",
              kicker: "Merge, reorder, pick pages",
              title: "Combine PDFs",
              desc: "Put several PDFs or photos into one file, in the order you want. You can pick which pages to keep and turn sideways pages.",
              tags: ["Drag to reorder", "Page ranges", "Rotate"],
              href: "teach/pdf/#combine",
              cta: "Combine files",
              span: 3,
            },
          ],
        },
        {
          title: "QGIS (CCE 114)",
          type: "cards",
          items: [
            {
              icon: "map-trifold",
              kicker: "114 only",
              title: "QGIS in Practice",
              desc: "The QGIS side of the class, with screenshots from QGIS 3.44 so it matches the lab computers.",
              tags: ["QGIS", "Processing", "Print Layout"],
              href: "teach/gis/#/guide/qgis",
              cta: "Open the QGIS guide",
              span: 2,
            },
            {
              icon: "polygon",
              kicker: "Course web map",
              title: "HUC8 Watershed Explorer",
              desc: "The class web map. Every HUC8 watershed in the US with this year's NOAA flood events on top. Click a flood for the full report.",
              tags: ["MapLibre", "USGS WBD", "NOAA Storm Events"],
              href: "https://theonlyrealagentp.github.io/CCE114-WebMap/",
              cta: "Open map",
              span: 2,
              status: "Live",
            },
            {
              icon: "download-simple",
              kicker: "Free",
              title: "Get QGIS",
              desc: "Get 3.44 LTR so it matches the lab computers. Works on Windows, Mac and Linux.",
              tags: ["qgis.org", "LTR"],
              href: "https://qgis.org/download/",
              cta: "Download",
              span: 2,
            },
          ],
        },
        {
          title: "Guides",
          type: "list",
          items: [
            {
              icon: "terminal-window",
              title: "VS Code for AI-assisted projects",
              sub: "How I set up VS Code for coding with AI, and the free AI plans BYU students can get",
              href: "teach/vscode-ai/",
            },
            { icon: "function", title: "Engineering Calculator", sub: "A graphing calculator that also does units, matrices and stats", href: "teach/calc/" },
          ],
        },
        {
          title: "Course help",
          type: "list",
          items: [
            { icon: "presentation", title: "Class slides", sub: "Present them here or download the PDF", href: "presentations/" },
            { icon: "books", title: "CCE 114 course site", sub: "Schedule, labs and slides", href: "https://byu-hydroinformatics.github.io/cce114-geomatics/" },
            { icon: "chat-circle-dots", title: "Questions and TA office hours", sub: "On Learning Suite (BYU login)", href: "https://learningsuite.byu.edu/view/uPQQjqw9-UIA.html" },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "research",
      label: "Research",
      navLabel: "Research",
      icon: "flask",
      blurb: "What I'm working on right now.",
      groups: [
        {
          type: "cards",
          items: [
            {
              icon: "globe-hemisphere-west",
              kicker: "Flood mapping",
              title: "National Flood Map",
              desc: "Where rivers go when they flood, for 2,109 watersheds across the lower 48. Pick any flood from the 2-year to the 100-year (the 500-year in some places) and watch the floodplain grow. Built with FIMserv from NOAA's HAND data and National Water Model flows.",
              tags: ["HAND", "National Water Model", "FIMserv", "MapLibre"],
              status: "Live",
              featured: true,
              span: 6,
              image: {
                src: "research/national-flood-map/img/st-louis.webp",
                w: 1600,
                h: 943,
                alt: "Flood map of the Missouri and Mississippi rivers north of St. Louis",
                href: "https://theonlyrealagentp.github.io/national-flood-map/",
              },
              actions: [
                { label: "Open the map", icon: "map-trifold", href: "https://theonlyrealagentp.github.io/national-flood-map/", primary: true },
                { label: "How it's made", icon: "book-open-text", href: "research/national-flood-map/" },
                { label: "Data", icon: "database", href: "https://huggingface.co/datasets/TheOnlyRealAgentP/national-flood-map-data" },
                { label: "Code", icon: "github-logo", href: "https://github.com/TheOnlyRealAgentP/national-flood-map" },
              ],
            },
            {
              icon: "waves",
              kicker: "Flood mapping",
              title: "FIMview",
              desc: "A control room for HAND flood mapping across the US, built on FIMserv. It runs anything from one HUC8 up to whole basins, makes maps for return-period floods like the 100-year, and has an AI assistant (Fludd) built in.",
              tags: ["FIMserv", "HAND", "National Water Model"],
              status: "Active",
              featured: true,
              span: 2,
              actions: [{ label: "Slides", icon: "presentation", href: "presentations/2026-fimview-and-fimserv/" }],
            },
            {
              icon: "map-trifold",
              kicker: "Flutter app",
              title: "RIVR",
              desc: "A river app. Tap any river on the map to get its National Water Model forecast (short, medium and long range) with the 2- to 100-year flood lines, plus FEMA flood zones.",
              tags: ["Flutter", "Mapbox", "National Water Model", "FEMA"],
              status: "Active",
              span: 2,
            },
            {
              icon: "books",
              kicker: "Reading list",
              title: "FIM research",
              desc: "The HAND flood mapping papers I keep coming back to, plus our lab's flood mapping work.",
              tags: ["HAND", "FIM", "National Water Model"],
              href: "research/fim/",
              cta: "Open the reading list",
              span: 2,
            },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "projects",
      label: "Projects",
      navLabel: "Projects",
      icon: "rocket-launch",
      blurb: "Things I build on my own time.",
      groups: [
        {
          type: "cards",
          items: [
            {
              icon: "cloud-lightning",
              kicker: "Weather radar",
              title: "Watergaw",
              desc: "A weather radar app with the features other radar apps charge for, free for everyone. Watch storms move and where they're headed over the next hour, get warnings for the places you care about, and check the weather along a drive. It reads the National Weather Service's NEXRAD radar files right in your browser with Rust and WebAssembly, and works on a phone like an app.",
              tags: ["NEXRAD", "Rust", "WebAssembly", "MapLibre"],
              status: "Live",
              featured: true,
              span: 6,
              image: {
                src: "assets/watergaw/radar.webp",
                w: 1600,
                h: 944,
                alt: "Watergaw showing a line of storms along the Florida Panhandle, with storm tracks",
                href: "https://watergawradar.com",
              },
              actions: [
                { label: "Open Watergaw", icon: "cloud-lightning", href: "https://watergawradar.com", primary: true },
                { label: "Code", icon: "github-logo", href: "https://github.com/TheOnlyRealAgentP/watergaw" },
                { label: "Wind engine", icon: "wind", href: "https://github.com/TheOnlyRealAgentP/watergaw-wind" },
                { label: "Share", icon: "share-network", share: "https://watergawradar.com" },
              ],
            },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "tools",
      label: "Tools",
      navLabel: "Tools",
      icon: "compass-tool",
      blurb: "The math that keeps coming up in surveying and civil classes, with the steps shown.",
      groups: [
        {
          type: "cards",
          items: [
            {
              icon: "function",
              kicker: "Graphing calculator",
              title: "Engineering Calculator",
              desc: "A graphing calculator in the browser that also does units, matrices and stats, and can solve Manning's for depth.",
              tags: ["Graphing", "Solver", "Units"],
              href: "teach/calc/",
              cta: "Open the calculator",
              span: 2,
              status: "New",
              featured: true,
            },
            {
              icon: "calculator",
              kicker: "20 calculators",
              title: "Field Math",
              desc: "Curves, leveling, COGO, earthwork, grid to ground, Manning's and more. Each one shows every step and can make practice problems.",
              tags: ["Feet or meters", "Worked steps", "Practice"],
              href: "teach/field/",
              cta: "Open Field Math",
              span: 2,
              featured: true,
            },
            {
              icon: "compass-tool",
              kicker: "Interactive",
              title: "Traverse Closure & the Compass Rule",
              desc: "Drag the stations around, add some error, and watch the compass rule clean it up.",
              tags: ["Traverse", "Azimuths", "Compass rule"],
              href: "teach/traverse/",
              cta: "Start module",
              span: 2,
              status: "Live",
              featured: true,
            },
          ],
        },
        {
          title: "Jump to a calculator",
          type: "list",
          items: [
            { icon: "bezier-curve", title: "Horizontal curves", sub: "PC, PT and a staking table", href: "teach/field/#/hcurve" },
            { icon: "wave-sine", title: "Vertical curves", sub: "BVC, EVC and the high or low point", href: "teach/field/#/vcurve" },
            { icon: "ruler", title: "Differential leveling", sub: "Reduce your notes and check the math", href: "teach/field/#/leveling" },
            { icon: "globe-hemisphere-west", title: "Grid and ground distances", sub: "Combined scale factor for State Plane", href: "teach/field/#/grid-ground" },
            { icon: "waves", title: "Open channel flow", sub: "Manning's for ditches and channels", href: "teach/field/#/manning" },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "builds",
      label: "Builds & Hardware",
      navLabel: "Builds",
      icon: "cpu",
      blurb: "Stuff I build when I'm not writing code.",
      groups: [
        {
          type: "cards",
          items: [
            {
              icon: "broadcast",
              kicker: "LoRa",
              title: "Meshtastic Mesh",
              desc: "LoRa mesh radios on Heltec and WisBlock boards, for texting when there's no cell service.",
              tags: ["Meshtastic", "LoRa", "Heltec", "WisBlock"],
              href: "#",
              span: 2,
            },
            {
              icon: "briefcase",
              kicker: "PC build",
              title: "Pelican 1490 Briefcase PC",
              desc: "A full PC built into a Pelican 1490 case.",
              tags: ["PC build", "Pelican 1490"],
              href: "#",
              span: 2,
            },
            {
              icon: "cube",
              kicker: "FDM",
              title: "3D Printing",
              desc: "Mostly PETG and PCTG.",
              tags: ["FDM", "PETG", "PCTG"],
              href: "#",
              span: 2,
            },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "about",
      label: "About",
      navLabel: "About",
      icon: "identification-badge",
      groups: [
        {
          title: "Experience",
          type: "list",
          items: [
            {
              icon: "drop",
              title: "Undergraduate Research Assistant",
              sub: "BYU Hydroinformatics Lab",
              subHref: "https://hydroinformatics.byu.edu",
              meta: "",
            },
            { icon: "chalkboard", title: "Teaching Assistant", sub: "Geomatics, CCE 114 · BYU", meta: "" },
            { icon: "radio", title: "President", sub: "Amateur Radio Club · KJ5JTS", meta: "" },
          ],
        },
        {
          title: "What I use",
          type: "badges",
          items: [
            { name: "Rust", icon: "gear-six" },
            { name: "C++", icon: "brackets-curly" },
            { name: "Python", icon: "file-py" },
            { name: "Flutter", icon: "device-mobile" },
            { name: "Dart", icon: "target" },
            { name: "Linux", icon: "linux-logo" },
            { name: "Mapbox", icon: "map-pin" },
            { name: "Git", icon: "git-branch" },
            { name: "QGIS", icon: "globe-hemisphere-west" },
          ],
        },
      ],
    },
  ],

  footer: {
    note: "Hosted on GitHub Pages",
    callsign: "KJ5JTS",
    // Visit counter: your GoatCounter code (the "name" in name.goatcounter.com).
    // Leave "" to turn the counter off.
    goatcounter: "",
  },
};
