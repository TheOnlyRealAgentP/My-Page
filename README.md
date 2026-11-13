# My-Page

Teaching hub, research explainers and portfolio for Harrison Stewart: TA for BYU CCE 114 (Geomatics) and undergraduate research assistant in the BYU Hydroinformatics Lab. Plain HTML, CSS and JavaScript with no build step, so it deploys straight to GitHub Pages.

## Structure

```
index.html                  main page shell
css/style.css               theme tokens (top of file), layout, components
js/data.js                  ALL main-page content: header, sections, cards, links
js/main.js                  renders data.js, popups, share buttons, scroll effects
js/background.js            animated topographic contour background (CONFIG at top)

teach/traverse/             Module 1: traverse closure & the compass rule
  traverse-math.js          the reduction math (no DOM, testable in Node)
  traverse.js               map, controls, step-through, computation sheet
teach/vscode-ai/            Guide: VS Code for AI-assisted projects

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
