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
    photo: "", // e.g. "assets/headshot.jpg". Leave empty to show initials.
    title: "Civil Engineer & Hydroinformatics Developer",
    roles: [
      { icon: "chalkboard-teacher", label: "TA · CCE 114 Geomatics", href: "#students" },
      { icon: "drop", label: "Research Assistant · BYU Hydroinformatics Lab", href: "https://hydroinformatics.byu.edu" },
    ],
    bio: "Bridging physical infrastructure and high-performance code through a first-principles engineering methodology.",
    links: [
      { icon: "github-logo", label: "GitHub", href: "https://github.com/TheOnlyRealAgentP" },
      { icon: "linkedin-logo", label: "LinkedIn", href: "#" },
      { icon: "envelope-simple", label: "Email", href: "#" },
      { icon: "file-text", label: "Résumé", href: "#" },
    ],
  },

  paths: [
    {
      icon: "student",
      kicker: "For CCE 114 & 414 students",
      title: "GIS & QGIS",
      desc: "Study guides, flashcards and randomized practice tests that follow Bolstad's GIS Fundamentals.",
      href: "#students",
    },
    {
      icon: "compass-tool",
      kicker: "For the field",
      title: "Surveying & Civil Skills",
      desc: "Twenty calculators with worked steps and practice problems, from COGO to Manning's equation.",
      href: "#surveying",
    },
    {
      icon: "flask",
      kicker: "For everyone",
      title: "Research, Explained",
      desc: "Hydroinformatics projects written up so classmates, collaborators and the public can follow them.",
      href: "#research",
    },
  ],

  sections: [
    /* ------------------------------------------------------------------ */
    {
      id: "students",
      label: "CCE 114 & 414: GIS & QGIS",
      navLabel: "GIS 114/414",
      icon: "student",
      blurb: "Follows Bolstad's GIS Fundamentals, the book for both CCE 114 and CCE 414, chapter by chapter.",
      groups: [
        {
          title: "Study the book",
          type: "cards",
          items: [
            {
              icon: "book-open-text",
              kicker: "15 chapters + QGIS",
              title: "Study guides",
              desc: "Plain-language guides for every chapter, with worked examples, key terms, QGIS how-tos and a quick check at the end.",
              tags: ["Bolstad", "Key terms", "Printable"],
              href: "teach/gis/",
              cta: "Open study hub",
              span: 2,
              status: "New",
              featured: true,
            },
            {
              icon: "cards",
              kicker: "Spaced practice",
              title: "Flashcards",
              desc: "Flip through the key terms for one chapter or all of them. The deck remembers which cards you already know.",
              tags: ["Shuffle", "Keyboard", "Progress saved"],
              href: "teach/gis/#/cards/all",
              cta: "Study cards",
              span: 2,
              featured: true,
            },
            {
              icon: "exam",
              kicker: "Never the same twice",
              title: "Randomized practice tests",
              desc: "Pick chapters and a length. Questions and answer order shuffle, and calculation problems get new numbers every time.",
              tags: ["Auto-graded", "Share a test", "Answer key"],
              href: "teach/gis/#/test?ch=ch01,ch02,ch03,ch04,ch05,ch06,ch07,ch08,ch09,ch10,ch11,ch12,ch13,ch14,ch15,qgis&n=20&calc=1",
              cta: "Take a 20-question test",
              span: 2,
              featured: true,
            },
          ],
        },
        {
          title: "QGIS",
          type: "cards",
          items: [
            {
              icon: "map-trifold",
              kicker: "Hands-on chapter",
              title: "QGIS in Practice",
              desc: "The interface, CRS settings, the Field Calculator, joins, common Processing tools, the Georeferencer and Print Layout.",
              tags: ["QGIS", "Processing", "Print Layout"],
              href: "teach/gis/#/guide/qgis",
              cta: "Open the QGIS guide",
              span: 2,
            },
            {
              icon: "polygon",
              kicker: "Course web map",
              title: "HUC8 Watershed Explorer",
              desc: "All 2,456 HUC8 subbasins with NOAA's 2026 flood events on top. Hover a basin for its details or click a flood for the full report.",
              tags: ["MapLibre", "USGS WBD", "NOAA Storm Events"],
              href: "https://theonlyrealagentp.github.io/CCE114-WebMap/",
              cta: "Open map",
              span: 2,
              status: "Live",
            },
            {
              icon: "download-simple",
              kicker: "Free and open source",
              title: "Get QGIS",
              desc: "Download QGIS for Windows, macOS or Linux. The long-term release (LTR) is the safest choice for class.",
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
              sub: "Setup, the AI offers BYU students can get, and how the coding tools compare",
              href: "teach/vscode-ai/",
            },
          ],
        },
        {
          title: "Course help",
          type: "list",
          items: [
            { icon: "books", title: "CCE 114 course site", sub: "Schedule, labs, slides and course policies", href: "https://byu-hydroinformatics.github.io/cce114-geomatics/" },
            { icon: "clock", title: "TA office hours", sub: "Hours and contact details are on Learning Suite (BYU login)", href: "https://learningsuite.byu.edu/view/uPQQjqw9-UIA.html" },
            { icon: "chat-circle-dots", title: "Ask a question", sub: "Send a question about a lab or a chapter", href: "#" },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "surveying",
      label: "Surveying & Civil Engineering Skills",
      navLabel: "Surveying",
      icon: "compass-tool",
      blurb: "The math you use on site, with every step shown.",
      groups: [
        {
          type: "cards",
          items: [
            {
              icon: "calculator",
              kicker: "20 tools · practice mode",
              title: "Field Math",
              desc: "COGO, leveling, horizontal and vertical curves, earthwork, grid-to-ground, Manning's equation, the rational method and measurement error. Each tool shows its work and makes up practice problems.",
              tags: ["Feet or meters", "Worked steps", "Practice problems"],
              href: "teach/field/",
              cta: "Open Field Math",
              span: 3,
              status: "New",
              featured: true,
            },
            {
              icon: "compass-tool",
              kicker: "Interactive module",
              title: "Traverse Closure & the Compass Rule",
              desc: "Drag the stations, add measurement error, and step through angle balancing, latitudes and departures, and the compass rule.",
              tags: ["Traverse", "Azimuths", "Compass rule"],
              href: "teach/traverse/",
              cta: "Start module",
              span: 3,
              status: "Live",
              featured: true,
            },
          ],
        },
        {
          title: "Jump to a calculator",
          type: "list",
          items: [
            { icon: "bezier-curve", title: "Horizontal curves", sub: "Curve elements, PC/PT stations and a staking table", href: "teach/field/#/hcurve" },
            { icon: "wave-sine", title: "Vertical curves", sub: "BVC/EVC, high and low points, station elevations", href: "teach/field/#/vcurve" },
            { icon: "ruler", title: "Differential leveling", sub: "Reduce notes, check the arithmetic, adjust a loop", href: "teach/field/#/leveling" },
            { icon: "globe-hemisphere-west", title: "Grid and ground distances", sub: "Combined scale factor for State Plane work", href: "teach/field/#/grid-ground" },
            { icon: "waves", title: "Open channel flow", sub: "Manning's equation for ditches and channels", href: "teach/field/#/manning" },
          ],
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    {
      id: "research",
      label: "Research, Explained",
      navLabel: "Research",
      icon: "flask",
      blurb: "Each project starts with the question it answers.",
      groups: [
        {
          type: "cards",
          items: [
            {
              icon: "waves",
              kicker: "How does a flood wave travel down a river?",
              title: "1D/2D Hydraulic Routing Engine",
              desc: "A finite-volume fluid simulation written in Rust and compiled to WebAssembly, so it runs in the browser.",
              tags: ["Rust", "WebAssembly", "Finite volume"],
              status: "In progress",
              featured: true,
              span: 2,
              actions: [
                { label: "Explainer", icon: "book-open", href: "#" },
                { label: "Code", icon: "github-logo", href: "#" },
                { label: "Share", icon: "share-network", share: "#research" },
              ],
            },
            {
              icon: "map-trifold",
              kicker: "What will the river near me do next?",
              title: "Fludd (RIVR)",
              desc: "A cross-platform Flutter and Mapbox app that shows live NOAA NWPS forecasts on top of USGS hydrography data.",
              tags: ["Flutter", "Mapbox", "NOAA NWPS", "USGS"],
              status: "Active",
              span: 2,
              actions: [
                { label: "Explainer", icon: "book-open", href: "#" },
                { label: "Demo", icon: "play", href: "#" },
                { label: "Share", icon: "share-network", share: "#research" },
              ],
            },
            {
              icon: "flow-arrow",
              kicker: "How do we route water through a river network quickly?",
              title: "Rust Routing Algorithms",
              desc: "Custom hydraulic routing algorithms and spatial data arrays written in Rust.",
              tags: ["Rust", "Hydraulic routing", "Spatial data"],
              span: 2,
              actions: [
                { label: "Explainer", icon: "book-open", href: "#" },
                { label: "Code", icon: "github-logo", href: "#" },
                { label: "Share", icon: "share-network", share: "#research" },
              ],
            },
          ],
        },
        {
          title: "Teach & share research",
          type: "list",
          items: [
            {
              icon: "layout",
              title: "Research explainer template",
              sub: "A page layout for turning a project into a short explainer, with share, cite, print and projector modes",
              href: "research/template/",
            },
            {
              icon: "article",
              title: "BYU Hydroinformatics Lab",
              sub: "Lab projects and publications",
              href: "https://hydroinformatics.byu.edu",
            },
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
      blurb: "Physical engineering outside the code.",
      groups: [
        {
          type: "cards",
          items: [
            {
              icon: "broadcast",
              kicker: "LoRa mesh",
              title: "Off-grid Meshtastic Networks",
              desc: "Off-grid LoRa mesh communication nodes on Heltec and WisBlock hardware.",
              tags: ["Meshtastic", "LoRa", "Heltec", "WisBlock"],
              href: "#",
              span: 2,
            },
            {
              icon: "briefcase",
              kicker: "Rugged computing",
              title: "Pelican 1490 Briefcase PC",
              desc: "A custom PC built into a rugged Pelican 1490 case.",
              tags: ["PC build", "Pelican 1490"],
              href: "#",
              span: 2,
            },
            {
              icon: "cube",
              kicker: "Rapid prototyping",
              title: "Advanced 3D Printing",
              desc: "FDM printing and rapid prototyping with multi-color PETG and PCTG.",
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
          title: "Experience & leadership",
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
          title: "Tech stack",
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
    note: "Static site · hosted on GitHub Pages",
    callsign: "KJ5JTS",
  },
};
