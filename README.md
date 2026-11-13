# My-Page

Teaching hub, research explainers and portfolio for Harrison Stewart: TA for BYU CCE 114 (Geomatics) and undergraduate research assistant in the BYU Hydroinformatics Lab. Plain HTML, CSS and JavaScript with no build step, so it deploys straight to GitHub Pages.

## Structure

```
index.html                  main page shell
css/style.css               theme tokens (top of file), layout, components
js/data.js                  ALL main-page content: header, sections, cards, links
js/main.js                  renders data.js, popups, share buttons, scroll effects
js/background.js            animated topographic contour background (CONFIG at top)

teach/gis/                  CCE 114 & 414 study hub: guides, flashcards, tests
  data/chNN.js, qgis.js     one content file per chapter (see below)
  gis-core.js               seeded random tests + calculation-question generators
  gis-app.js                hub, study guide, flashcard and test views
  validate.mjs              checks every content file: node teach/gis/validate.mjs
teach/field/                Field Math: 20 surveying and civil calculators
  field-core.js             parsing/formatting (angles, bearings, stations)
  tools/*.js                one F.tool({...}) per calculator
teach/calc/                 Engineering Calculator: graphing, stats, matrices, solver, units
  calc-core.js              parser, evaluator and math (no eval); runs in Node for tests
  calc-app.js               the seven tabs
teach/traverse/             interactive traverse closure & compass rule module
teach/vscode-ai/            guide: VS Code for AI-assisted projects

research/template/          research explainer template (copy this per project)
research/explainer.css|js   shared styles and behavior for explainers

assets/                     favicon, and a place for a headshot / résumé PDF
```

## Editing the main page

Everything on the main page comes from `js/data.js`:

- **Links**: `"#"` means "not ready yet". Clicking it shows a *pending completion* popup. Replace it with a real URL when the page exists.
- **Sections** are made of groups. Each group is `cards`, `list` or `badges`.
- **Research cards** use `actions` (Explainer, Code, Demo, Share) instead of a single link.
- **Icons**: any [Phosphor icon](https://phosphoricons.com) name.
- **Card width**: `span` is out of 6 columns on desktop. Cards stack on phones.

## GIS study content

Each chapter is one file in `teach/gis/data/` that calls `GIS.chapter({...})` with a study guide, flashcards and questions. The material is original and follows the chapter order of Bolstad & Manson, *GIS Fundamentals* (7th ed.), the book for both CCE 114 and CCE 414. It does not reproduce the book.

- Edit a question or card directly in its chapter file, then run `node teach/gis/validate.mjs`.
- **Screenshots**: a guide section can carry `figures: [{ src, alt, caption, w, h }]`. Images live in `teach/gis/img/qgis/` as WebP. They are real captures from **QGIS 3.44 LTR**, the release on the Clyde 234 lab machines, so they match what students see. The validator checks that each file exists and that `w`/`h` match it. Click a figure on the site to see it full size.
- Calculation questions with random numbers live in `teach/gis/gis-core.js` (`gen(...)`).
- Every test URL carries a `seed`, so a shared link rebuilds the same test. Tests print with or without an answer key.

## Field Math calculators

Each calculator in `teach/field/tools/` defines its inputs, a `compute()` that returns results plus the worked steps, an explanation, and a `practice()` that makes random problems. Add a new tool by copying an existing `F.tool({...})` block.

## Engineering Calculator

`teach/calc/` is a graphing calculator for engineering classes, written from scratch (no `eval`, no libraries):

- **Calculate**: implied multiplication, `ans`, variables (`Q = 2.5`), functions (`f(x) = x^2 + 1`), DMS input (`12°30'15"`), lists, matrices, `nDeriv`, `fnInt`, `solve`, and equations typed directly (`2x + 3 = 7`). Each result can be shown as a fraction, in scientific or engineering notation, or in DMS.
- **Graph**: eight functions, pan and zoom, trace, zeros/extrema/intersections found automatically, shaded integrals, and a table.
- **Stats**: lists L1–L6 (paste from a spreadsheet), one-variable statistics, and seven regression models that can be graphed with the data.
- **Matrix**, **Solve** (equation solver with Manning, Hazen–Williams, Darcy–Weisbach, orifice, weir, rational method and beam presets; polynomial roots; linear systems), **Units** and **Constants**.

Everything a student enters is saved in their own browser only. Add a solver preset in the `PRESETS` list in `calc-app.js`, a unit in `UNITS` in `calc-core.js`, or a constant in `CONSTANTS`.

## Writing a research explainer

1. Copy `research/template/` to `research/<project>/`.
2. Edit the JSON block at the top of its `index.html` (title, question, authors, year). The header and the citation are built from it.
3. Replace each dashed guidance box with your own text, and put a figure or embedded demo in the figure slot.
4. In `js/data.js`, set that project's **Explainer** action to `"research/<project>/"`.

Each explainer has **Share**, **Cite** (APA / BibTeX), **Present** (full-screen slides, arrow keys to move) and **Print handout** (clean black-on-white pages).

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Push to `main`.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The site appears at `https://<username>.github.io/My-Page/`.

## License

[MIT](LICENSE)
