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
      kicker: "For students",
      title: "CCE 114 Student Hub",
      desc: "Interactive geomatics modules, course tools and setup guides.",
      href: "#students",
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
      label: "CCE 114 Student Hub",
      navLabel: "Students",
      icon: "student",
      blurb: "Work through these at your own pace. Nothing to install.",
      groups: [
        {
          title: "Interactive modules",
          type: "cards",
          items: [
            {
              icon: "compass-tool",
              kicker: "Module 1",
              title: "Traverse Closure & the Compass Rule",
              desc: "Drag the stations, add measurement error, and step through angle balancing, latitudes and departures, and the compass rule.",
              tags: ["Traverse", "Azimuths", "Compass rule"],
              href: "teach/traverse/",
              cta: "Start module",
              span: 3,
              status: "Live",
              featured: true,
            },
            {
              icon: "plus-circle",
              kicker: "Coming next",
              title: "More geomatics modules",
              desc: "Further modules for CCE 114 topics are in progress.",
              href: "#",
              cta: "See what's planned",
              span: 3,
            },
          ],
        },
        {
          title: "Course tools & guides",
          type: "cards",
          items: [
            {
              icon: "polygon",
              kicker: "Web map",
              title: "HUC8 Watershed Explorer",
              desc: "All 2,456 HUC8 subbasins with NOAA's 2026 flood events on top. Hover a basin for its details or click a flood for the full report.",
              tags: ["MapLibre", "USGS WBD", "NOAA Storm Events"],
              href: "https://theonlyrealagentp.github.io/CCE114-WebMap/",
              cta: "Open map",
              span: 3,
              status: "Live",
            },
            {
              icon: "terminal-window",
              kicker: "Setup guide",
              title: "VS Code for AI-Assisted Projects",
              desc: "Set up VS Code for Python projects with AI assistants, find the free student AI offers, and see how the tools compare on published benchmarks.",
              tags: ["VS Code", "Copilot", "Student offers"],
              href: "teach/vscode-ai/",
              cta: "Open guide",
              span: 3,
              status: "Guide",
            },
          ],
        },
        {
          title: "Course help",
          type: "list",
          items: [
            { icon: "clock", title: "Office hours", sub: "When and where to find me", href: "#" },
            { icon: "chat-circle-dots", title: "Ask a question", sub: "Send a question about a lab or module", href: "#" },
            { icon: "books", title: "Course resources", sub: "Lab handouts, formula sheets and references", href: "#" },
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
