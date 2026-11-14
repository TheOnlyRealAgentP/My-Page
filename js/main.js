/* =========================================================================
   Renders the page from window.SITE (js/data.js).
   ========================================================================= */
(function () {
  "use strict";

  const S = window.SITE;
  if (!S) return;

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  const pad = (n) => String(n).padStart(2, "0");
  const isExternal = (href) => /^https?:\/\//.test(href);
  const isPending = (href) => href === "#";

  // "#" links show a "pending completion" popup instead of navigating.
  const linkAttrs = (href, name = "") =>
    isPending(href)
      ? `href="#" data-pending="${esc(name)}"`
      : `href="${esc(href)}"` + (isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : "");

  const icon = (name, weight = "ph") => `<i class="${weight} ph-${esc(name)}" aria-hidden="true"></i>`;

  /* ---------- Header ---------- */
  function renderHero(p) {
    const avatar = p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" />` : esc(p.initials);
    const roles = (p.roles || [])
      .map((r) => `<a class="role" ${linkAttrs(r.href, r.label)}>${icon(r.icon)}${esc(r.label)}</a>`)
      .join("");
    const links = p.links
      .map((l) =>
        l.email
          ? `<a href="mailto:${esc(l.email.join("@"))}">${icon(l.icon)}${esc(l.label)}</a>`
          : `<a ${linkAttrs(l.href, l.label)}>${icon(l.icon)}${esc(l.label)}</a>`
      )
      .join("");

    $("#hero").innerHTML = `
      <div class="avatar">${avatar}</div>
      <h1>${esc(p.name)}</h1>
      <p class="title">${esc(p.title)}</p>
      ${roles ? `<div class="roles">${roles}</div>` : ""}
      <p class="bio">${esc(p.bio)}</p>
      <div class="social">${links}</div>`;
  }

  function renderPaths(paths) {
    if (!paths?.length) return "";
    return `<div class="paths">${paths
      .map(
        (p, i) => `
        <a class="path reveal" href="${esc(p.href)}" style="--d:${i * 90}ms">
          <div class="path-icon">${icon(p.icon, "ph-duotone")}</div>
          <div>
            <div class="card-kicker">${esc(p.kicker)}</div>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.desc)}</p>
          </div>
          <i class="ph ph-arrow-down-right path-arrow" aria-hidden="true"></i>
        </a>`
      )
      .join("")}</div>`;
  }

  /* ---------- Cards ---------- */
  function renderCard(c, i) {
    const hasActions = c.actions?.length;
    const isLink = !hasActions && c.href !== undefined && c.href !== "";
    const cls = ["card", "reveal", `span-${c.span || 3}`, c.featured ? "featured" : "", isLink ? "" : "is-static"].join(" ");

    const tags = c.tags?.length
      ? `<div class="tags">${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`
      : "";

    let foot = "";
    if (hasActions) {
      foot = `<div class="actions">${c.actions
        .map((a) =>
          a.share !== undefined
            ? `<button type="button" class="act" data-share="${esc(a.share)}" data-title="${esc(c.title)}">${icon(a.icon || "share-network")}${esc(a.label || "Share")}</button>`
            : `<a class="act" ${linkAttrs(a.href, `${c.title}: ${a.label}`)}>${icon(a.icon)}${esc(a.label)}</a>`
        )
        .join("")}</div>`;
    } else if (isLink) {
      foot = `<span class="card-cta">${esc(c.cta || "Open")}${icon("arrow-up-right")}</span>`;
    }

    const inner = `
      <div class="card-top">
        <div class="card-icon">${icon(c.icon, "ph-duotone")}</div>
        ${c.status ? `<span class="card-status">${esc(c.status)}</span>` : ""}
      </div>
      ${c.kicker ? `<div class="card-kicker">${esc(c.kicker)}</div>` : ""}
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.desc)}</p>
      ${tags}
      ${foot}`;

    const style = `style="--d:${i * 70}ms"`;
    return isLink
      ? `<a class="${cls}" ${linkAttrs(c.href, c.title)} ${style}>${inner}</a>`
      : `<article class="${cls}" ${style}>${inner}</article>`;
  }

  /* ---------- List rows ---------- */
  function renderList(items) {
    const rows = items
      .map((it, i) => {
        const sub = it.subHref ? `<a ${linkAttrs(it.subHref, it.sub)}>${esc(it.sub)}</a>` : esc(it.sub || "");
        const body = `
          <div class="card-icon">${icon(it.icon, "ph-duotone")}</div>
          <div>
            <div class="row-role">${esc(it.title)}</div>
            ${it.sub ? `<div class="row-org">${sub}</div>` : ""}
            ${it.desc ? `<div class="row-desc">${esc(it.desc)}</div>` : ""}
          </div>
          ${it.meta ? `<span class="row-when">${esc(it.meta)}</span>` : it.href !== undefined ? `<span class="row-go">${icon("caret-right")}</span>` : ""}`;
        return it.href !== undefined && it.href !== ""
          ? `<a class="row is-link reveal" ${linkAttrs(it.href, it.title)} style="--d:${i * 60}ms">${body}</a>`
          : `<div class="row reveal" style="--d:${i * 60}ms">${body}</div>`;
      })
      .join("");
    return `<div class="list">${rows}</div>`;
  }

  function renderBadges(items) {
    return `<div class="badges">${items
      .map((b, i) => `<span class="badge reveal" style="--d:${i * 40}ms">${icon(b.icon)}${esc(b.name)}</span>`)
      .join("")}</div>`;
  }

  /* ---------- Sections ---------- */
  function renderGroup(g) {
    const body =
      g.type === "list"
        ? renderList(g.items)
        : g.type === "badges"
          ? renderBadges(g.items)
          : `<div class="grid">${g.items.map(renderCard).join("")}</div>`;
    return `<div class="group">${g.title ? `<h3 class="group-title">${esc(g.title)}</h3>` : ""}${body}</div>`;
  }

  function renderSection(sec, n) {
    return `
      <section class="section" id="${esc(sec.id)}" aria-labelledby="${esc(sec.id)}-h">
        <div class="section-head">
          <span class="idx">${pad(n)}</span>
          <h2 id="${esc(sec.id)}-h">${icon(sec.icon)}${esc(sec.label)}</h2>
          ${sec.blurb ? `<span class="blurb">${esc(sec.blurb)}</span>` : ""}
        </div>
        ${sec.groups.map(renderGroup).join("")}
      </section>`;
  }

  function render() {
    renderHero(S.profile);
    $("#sections").innerHTML = renderPaths(S.paths) + S.sections.map((s, i) => renderSection(s, i + 1)).join("");
    const navs = S.sections.map((s) => `<a href="#${esc(s.id)}">${esc(s.navLabel || s.label.split(/[ &]/)[0])}</a>`);
    navs.splice(1, 0, ...(S.navLinks || []).map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`));
    $("#nav").innerHTML = navs.join("");

    const f = S.footer;
    $("#footer").innerHTML = `
      <span>© ${new Date().getFullYear()} ${esc(S.profile.name)}</span>
      <span>${esc(f.note)}</span>
      <span id="visits" hidden></span>
      ${f.callsign ? `<span>73 de ${esc(f.callsign)}</span>` : ""}`;
    if (f.goatcounter) visitCounter(f.goatcounter);
  }

  /* ---------- Visit counter (GoatCounter: no cookies) ---------- */
  function visitCounter(code) {
    if (!/^[a-z0-9-]+$/i.test(code)) return;
    const base = `https://${code}.goatcounter.com`;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `${base}/count`;
    document.head.appendChild(s);
    // Site-wide total; needs "Allow adding visitor counts on your website" in GoatCounter's settings
    fetch(`${base}/counter/TOTAL.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !d.count) return;
        const el = document.getElementById("visits");
        el.textContent = `${String(d.count).trim()} visits`;
        el.hidden = false;
      })
      .catch(() => {});
  }

  /* ---------- Popup (pending links, copied links) ---------- */
  const toast = (() => {
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
    let timer = 0;
    const hide = () => el.classList.remove("show");
    el.addEventListener("click", hide);
    document.addEventListener("keydown", (e) => e.key === "Escape" && hide());
    return (iconName, title, text) => {
      el.innerHTML = `${icon(iconName)}<div><strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;
      el.classList.add("show");
      clearTimeout(timer);
      timer = setTimeout(hide, 3500);
    };
  })();

  function wireClicks() {
    document.addEventListener("click", async (e) => {
      const pending = e.target.closest?.("[data-pending]");
      if (pending) {
        e.preventDefault();
        const name = pending.dataset.pending;
        toast("hourglass-medium", "Pending completion", `${name ? name + " isn't" : "This isn't"} ready yet. Check back soon.`);
        return;
      }

      const share = e.target.closest?.("[data-share]");
      if (share) {
        e.preventDefault();
        const url = new URL(share.dataset.share || "", location.href).href;
        const title = share.dataset.title || document.title;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
            return;
          } catch (err) {
            if (err && err.name === "AbortError") return;
          }
        }
        try {
          await navigator.clipboard.writeText(url);
          toast("link", "Link copied", url);
        } catch (_) {
          toast("link", "Share this link", url);
        }
      }
    });
  }

  /* ---------- Interactions ---------- */
  function spotlight() {
    // Updates --mx/--my so the card glow follows the pointer.
    document.addEventListener(
      "pointermove",
      (e) => {
        const card = e.target.closest?.(".card, .path");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      },
      { passive: true }
    );
  }

  function reveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
  }

  const phone = window.matchMedia("(max-width: 640px)");

  function setActive(id) {
    const links = [...document.querySelectorAll("#nav a")];
    let current = null;
    links.forEach((a) => {
      const on = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("active", on);
      if (on) current = a;
    });
    // keep the active pill visible on narrow screens without moving the page
    const nav = current?.parentElement;
    if (nav && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: current.offsetLeft - nav.clientWidth / 2 + current.offsetWidth / 2, behavior: "smooth" });
    }
  }

  function activeNav() {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          // phones follow the pinned section title instead (see phoneBars)
          if (en.isIntersecting && !phone.matches) setActive(en.target.id);
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll(".section").forEach((s) => io.observe(s));
  }

  /* ---------- Phones: pinned section titles + scroll progress ---------- */
  function phoneBars() {
    const root = document.documentElement;
    const nav = document.querySelector(".topnav");
    const heads = [...document.querySelectorAll(".section-head")];
    let navh = 0;
    let queued = false;
    let shown;

    const update = () => {
      queued = false;
      const max = root.scrollHeight - window.innerHeight;
      nav.style.setProperty("--p", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : "0");
      if (!phone.matches) {
        heads.forEach((h) => h.classList.remove("stuck"));
        shown = undefined;
        return;
      }
      // a title counts as pinned once it reaches the bottom of the menu bar
      let id = "";
      heads.forEach((h) => {
        const pinned = h.getBoundingClientRect().top <= navh + 1;
        h.classList.toggle("stuck", pinned);
        if (pinned) id = h.parentElement.id;
      });
      // the last section is too short to pin, so it wins at the bottom of the page
      if (last && max > 0 && window.scrollY >= max - 2) id = last.id;
      if (id !== shown) {
        shown = id;
        setActive(id);
      }
    };
    const last = heads[heads.length - 1]?.parentElement;
    const measure = () => {
      navh = nav.offsetHeight;
      root.style.setProperty("--navh", `${navh}px`);
      // let the last section scroll up far enough for its title to pin
      // (the space below it doesn't depend on its own height, so no reset is needed)
      if (last && phone.matches) {
        const after = root.scrollHeight - (last.getBoundingClientRect().bottom + window.scrollY);
        last.style.minHeight = `${Math.max(0, Math.ceil(window.innerHeight - navh - after))}px`;
      } else if (last) {
        last.style.minHeight = "";
      }
      update();
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!queued) {
          queued = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", measure);
    measure();
    // the page grew, so redo a jump like /#about that ran before it could reach the target
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (phone.matches && target) target.scrollIntoView({ behavior: "instant" });
  }

  render();
  // old links to #surveying go to the renamed Tools section
  if (location.hash === "#surveying") history.replaceState(null, "", "#tools");
  wireClicks();
  spotlight();
  reveal();
  activeNav();
  phoneBars();
})();
