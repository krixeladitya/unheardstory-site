/* ============================================================
   UNHEARD STORY — app logic
   ============================================================ */

"use strict";

/* ---------- helpers ---------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const VERT_CHAIN = ["oardefault", "oar2", "hq720", "hqdefault"];
const WIDE_CHAIN = ["maxresdefault", "hq720", "hqdefault"];

function thumbUrl(id, variant) {
  return `https://i.ytimg.com/vi/${id}/${variant}.jpg`;
}

/* Sets src with a graceful fallback chain. YouTube returns 404 (or a
   120px gray placeholder) for variants that don't exist on a video. */
function setThumb(img, id, chain) {
  let i = 0;
  img.onerror = () => {
    i += 1;
    if (i < chain.length) img.src = thumbUrl(id, chain[i]);
    else img.onerror = null;
  };
  img.onload = () => {
    if (img.naturalWidth <= 120 && i < chain.length - 1) {
      i += 1;
      img.src = thumbUrl(id, chain[i]);
    }
  };
  img.src = thumbUrl(id, chain[0]);
}

function fmtViews(n) {
  if (n == null) return "";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M views";
  if (n >= 1e3) return Math.round(n / 1e3) + "K views";
  return n + " views";
}

const byId = Object.fromEntries(CATALOG.map(v => [v.id, v]));

/* ---------- My List (localStorage) ---------- */

const LIST_KEY = "unheard_mylist";
let myList = [];
try { myList = JSON.parse(localStorage.getItem(LIST_KEY) || "[]"); } catch (e) { myList = []; }

function inList(id) { return myList.includes(id); }
function toggleList(id) {
  myList = inList(id) ? myList.filter(x => x !== id) : [...myList, id];
  try { localStorage.setItem(LIST_KEY, JSON.stringify(myList)); } catch (e) { /* file:// quota — ignore */ }
  renderMyListRow();
  /* refresh all +/✓ buttons for this id */
  $$(`.mini-btn[data-list-id="${id}"]`).forEach(b => {
    b.classList.toggle("in-list", inList(id));
    b.innerHTML = inList(id) ? ICONS.check : ICONS.plus;
    b.title = inList(id) ? "Remove from My List" : "Add to My List";
  });
}

/* ---------- icons ---------- */

const ICONS = {
  play: '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5M12 8v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevL: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevR: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21" stroke-linecap="round"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2.2 2.2 0 0 0 4 0" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ytPlay: '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none"/></svg>'
};

/* ---------- card builders ---------- */

function listBtn(v) {
  const b = document.createElement("button");
  b.className = "mini-btn" + (inList(v.id) ? " in-list" : "");
  b.dataset.listId = v.id;
  b.innerHTML = inList(v.id) ? ICONS.check : ICONS.plus;
  b.title = inList(v.id) ? "Remove from My List" : "Add to My List";
  b.addEventListener("click", e => { e.stopPropagation(); toggleList(v.id); });
  return b;
}

function posterCard(v) {
  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", v.title);

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = v.title;
  setThumb(img, v.id, v.type === "long" ? WIDE_CHAIN : VERT_CHAIN);
  card.appendChild(img);

  const tag = document.createElement("span");
  tag.className = "short-tag";
  tag.textContent = v.type === "long" ? "Feature" : "Short";
  card.appendChild(tag);

  const shade = document.createElement("div");
  shade.className = "card-shade";
  shade.innerHTML = `
    <div class="card-title">${v.title} ${v.emoji}</div>
    <div class="card-meta">
      ${v.views != null ? `<span class="views">${fmtViews(v.views)}</span>` : ""}
      <span>${v.tags[0]}</span>
    </div>`;
  card.appendChild(shade);

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.appendChild(listBtn(v));
  card.appendChild(actions);

  card.addEventListener("click", () => openModal(v, true));
  return card;
}

function rankCard(v, n) {
  const card = document.createElement("div");
  card.className = "rank-card";
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `#${n}: ${v.title}`);
  card.innerHTML = `<div class="rank-num">${n}</div>`;
  const poster = document.createElement("div");
  poster.className = "rank-poster";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = v.title;
  setThumb(img, v.id, VERT_CHAIN);
  poster.appendChild(img);
  card.appendChild(poster);
  card.addEventListener("click", () => openModal(v, true));
  return card;
}

function wideCard(v) {
  const card = document.createElement("div");
  card.className = "wide-card";
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", v.title);
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = v.title;
  setThumb(img, v.id, WIDE_CHAIN);
  card.appendChild(img);
  const shade = document.createElement("div");
  shade.className = "card-shade";
  shade.innerHTML = `
    <div class="card-title">${v.title}</div>
    <div class="card-meta"><span>${v.duration || ""}</span><span>${v.tags.join(" · ")}</span></div>`;
  card.appendChild(shade);
  card.addEventListener("click", () => openModal(v, true));
  return card;
}

function soonCard(s) {
  const card = document.createElement("div");
  card.className = "soon-card";
  card.style.setProperty("--h", s.hue);
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Coming soon: ${s.title}`);
  card.innerHTML = `
    <span class="soon-ribbon">Coming Soon</span>
    <div class="soon-body">
      <div class="soon-emoji">${s.emoji}</div>
      <div class="soon-title">${s.title}</div>
      <div class="soon-tag">${s.tag}</div>
    </div>`;
  card.title = s.tease;
  card.addEventListener("click", () => openSoonModal(s));
  return card;
}

/* ---------- rows ---------- */

function buildRow(def, items) {
  const row = document.createElement("section");
  row.className = "row";
  row.id = "row-" + def.key;

  const h = document.createElement("h2");
  h.className = "row-title";
  const noun = def.kind === "soon" ? (items.length === 1 ? "title" : "titles")
                                   : (items.length === 1 ? "story" : "stories");
  h.innerHTML = `${def.title} <span class="count">${items.length} ${noun}</span>`;
  row.appendChild(h);

  const outer = document.createElement("div");
  outer.className = "row-outer";
  const scroll = document.createElement("div");
  scroll.className = "row-scroll";

  items.forEach((item, i) => {
    let el;
    if (def.kind === "ranked") el = rankCard(item, i + 1);
    else if (def.kind === "wide") el = wideCard(item);
    else if (def.kind === "soon") el = soonCard(item);
    else el = posterCard(item);
    scroll.appendChild(el);
  });

  const mkArrow = (dir) => {
    const b = document.createElement("button");
    b.className = "row-arrow " + dir;
    b.setAttribute("aria-label", dir === "left" ? "Scroll left" : "Scroll right");
    b.innerHTML = dir === "left" ? ICONS.chevL : ICONS.chevR;
    b.addEventListener("click", () => {
      const dx = scroll.clientWidth * 0.85 * (dir === "left" ? -1 : 1);
      scroll.scrollBy({ left: dx, behavior: "smooth" });
    });
    return b;
  };

  outer.appendChild(mkArrow("left"));
  outer.appendChild(scroll);
  outer.appendChild(mkArrow("right"));
  row.appendChild(outer);
  return row;
}

function renderRows() {
  const host = $("#rows");
  host.innerHTML = "";

  /* My List first, when non-empty */
  const mlHost = document.createElement("div");
  mlHost.id = "mylist-host";
  host.appendChild(mlHost);
  renderMyListRow();

  ROWS.forEach(def => {
    let items;
    if (def.kind === "ranked") {
      items = [...CATALOG].filter(v => v.views != null)
        .sort((a, b) => b.views - a.views).slice(0, 10);
    } else if (def.kind === "soon") {
      items = COMING_SOON;
    } else {
      items = CATALOG.filter(def.filter);
    }
    if (items.length) host.appendChild(buildRow(def, items));
  });
}

function renderMyListRow() {
  const mlHost = $("#mylist-host");
  if (!mlHost) return;
  mlHost.innerHTML = "";
  const items = myList.map(id => byId[id]).filter(Boolean);
  if (items.length) {
    mlHost.appendChild(buildRow({ key: "mylist", title: "My List", kind: "poster" }, items));
  }
}

/* ---------- modal ---------- */

const overlay = () => $("#modal-overlay");

function embedSrc(v, autoplay) {
  return `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`;
}

function openModal(v, autoplay) {
  const ov = overlay();
  const isWide = v.type === "long";
  const related = CATALOG
    .filter(x => x.id !== v.id && x.type === "short" && x.lanes.some(l => v.lanes.includes(l)))
    .slice(0, 6);

  ov.innerHTML = `
    <div id="modal" role="dialog" aria-modal="true" aria-label="${v.title}">
      <button class="modal-close" aria-label="Close">${ICONS.x}</button>
      <div class="modal-grid ${isWide ? "wide-mode" : ""}">
        <div class="modal-player">
          <iframe src="${embedSrc(v, autoplay)}" title="${v.title}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        </div>
        <div class="modal-info">
          <h2 class="modal-title">${v.title} ${v.emoji}</h2>
          <div class="modal-meta">
            ${v.views != null ? `<span class="views">${fmtViews(v.views)}</span>` : ""}
            <span class="chip">${v.rating}</span>
            <span>${v.type === "long" ? (v.duration || "Feature") : "Short"}</span>
            <span>2026</span>
          </div>
          <p class="modal-syn">${v.synopsis}</p>
          <div class="modal-tags">${v.tags.map(t => `<span class="tag-chip">${t}</span>`).join("")}</div>
          <div class="modal-actions">
            <a class="btn btn-yt" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">
              ${ICONS.ytPlay} Watch on YouTube
            </a>
            <button class="btn btn-list" data-ml>${inList(v.id) ? "✓ In My List" : "+ My List"}</button>
          </div>
        </div>
        ${related.length ? `
        <div class="more-like">
          <h3>More Like This</h3>
          <div class="more-grid">
            ${related.map(r => `
              <div class="more-card" data-id="${r.id}" role="button" aria-label="${r.title}">
                <img loading="lazy" alt="${r.title}">
                <span>${r.title}</span>
              </div>`).join("")}
          </div>
        </div>` : ""}
      </div>
    </div>`;

  /* hydrate thumbs + handlers */
  $$(".more-card", ov).forEach(mc => {
    const r = byId[mc.dataset.id];
    setThumb($("img", mc), r.id, VERT_CHAIN);
    mc.addEventListener("click", () => openModal(r, true));
  });
  $(".modal-close", ov).addEventListener("click", closeModal);
  $("[data-ml]", ov).addEventListener("click", e => {
    toggleList(v.id);
    e.currentTarget.textContent = inList(v.id) ? "✓ In My List" : "+ My List";
  });

  ov.classList.add("open");
  document.body.style.overflow = "hidden";
}

function openSoonModal(s) {
  const ov = overlay();
  ov.innerHTML = `
    <div id="modal" role="dialog" aria-modal="true" aria-label="${s.title}">
      <button class="modal-close" aria-label="Close">${ICONS.x}</button>
      <div class="modal-grid wide-mode">
        <div class="modal-player" style="aspect-ratio:21/9; background:
          radial-gradient(120% 160% at 80% -10%, hsl(${s.hue} 80% 32% / .9), transparent 60%),
          radial-gradient(130% 160% at 10% 120%, hsl(${s.hue + 40} 70% 18% / .9), transparent 65%), #0b0b0b;">
          <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; text-align:center; padding:24px;">
            <div style="font-size:46px">${s.emoji}</div>
            <div class="soon-ribbon" style="--h:${s.hue}">In Production</div>
          </div>
        </div>
        <div class="modal-info">
          <h2 class="modal-title">${s.title}</h2>
          <div class="modal-meta"><span class="chip">U/A 13+</span><span>${s.tag}</span><span>Coming Soon</span></div>
          <p class="modal-syn">${s.tease}</p>
          <div class="modal-actions">
            <a class="btn btn-yt" href="${CHANNEL_URL}?sub_confirmation=1" target="_blank" rel="noopener">
              ${ICONS.bell} Subscribe for the drop
            </a>
          </div>
        </div>
      </div>
    </div>`;
  $(".modal-close", ov).addEventListener("click", closeModal);
  ov.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const ov = overlay();
  ov.classList.remove("open");
  ov.innerHTML = ""; /* kills the iframe = stops playback */
  document.body.style.overflow = "";
}

/* ---------- hero ---------- */

function renderHero() {
  const v = byId[HERO_ID] || CATALOG[0];
  const rank = [...CATALOG].filter(x => x.views != null)
    .sort((a, b) => b.views - a.views).findIndex(x => x.id === v.id) + 1;

  $(".hero-backdrop").style.backgroundImage =
    `url('${thumbUrl(v.id, "oardefault")}'), url('${thumbUrl(v.id, "hqdefault")}')`;

  $(".hero-rank").innerHTML =
    `<span class="badge">TOP 10</span> #${rank} on Unheard Story today`;
  $(".hero-title").textContent = v.title;
  $(".hero-meta").innerHTML = `
    <span class="views">${fmtViews(v.views)}</span>
    <span class="chip">${v.rating}</span>
    <span>Short</span><span>2026</span><span>${v.tags[0]}</span>`;
  $(".hero-syn").textContent = v.synopsis;

  const poster = $(".hero-poster");
  setThumb(poster, v.id, VERT_CHAIN);
  poster.alt = v.title;

  $(".btn-play").addEventListener("click", () => openModal(v, true));
  $(".btn-info").addEventListener("click", () => openModal(v, false));
  $(".hero-poster-wrap").addEventListener("click", () => openModal(v, true));
}

/* ---------- search ---------- */

function doSearch(q) {
  const body = document.body;
  const resHost = $("#search-results");
  q = q.trim().toLowerCase();
  if (!q) {
    body.classList.remove("searching");
    resHost.classList.remove("open");
    resHost.innerHTML = "";
    return;
  }
  const hits = CATALOG.filter(v =>
    (v.title + " " + v.tags.join(" ") + " " + v.synopsis).toLowerCase().includes(q));

  body.classList.add("searching");
  resHost.classList.add("open");
  resHost.innerHTML = `<h2>Results for "<b>${q.replace(/[<>&]/g, "")}</b>" — ${hits.length} ${hits.length === 1 ? "story" : "stories"}</h2>`;
  if (hits.length) {
    const grid = document.createElement("div");
    grid.className = "results-grid";
    hits.forEach(v => grid.appendChild(posterCard(v)));
    resHost.appendChild(grid);
  } else {
    resHost.insertAdjacentHTML("beforeend",
      `<p class="no-results">No stories match that. Try "mom", "coach", "justice", "secret"…<br>
       Or browse everything on <a href="${CHANNEL_URL}" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline">the channel</a>.</p>`);
  }
}

function wireSearch() {
  const box = $(".search-box");
  const input = $("#search-input");
  $("#search-toggle").addEventListener("click", () => {
    box.classList.toggle("open");
    if (box.classList.contains("open")) input.focus();
    else { input.value = ""; doSearch(""); }
  });
  input.addEventListener("input", () => doSearch(input.value));
  input.addEventListener("keydown", e => {
    if (e.key === "Escape") { input.value = ""; doSearch(""); box.classList.remove("open"); }
  });
}

/* ---------- nav scroll + intro + global keys ---------- */

function wireChrome() {
  const nav = $("#nav");
  addEventListener("scroll", () => nav.classList.toggle("solid", scrollY > 40), { passive: true });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && overlay().classList.contains("open")) closeModal();
  });
  overlay().addEventListener("click", e => { if (e.target === overlay()) closeModal(); });

  /* intro splash — once per session */
  const intro = $("#intro");
  if (sessionStorage.getItem("unheard_intro_seen")) {
    intro.classList.add("skip");
  } else {
    sessionStorage.setItem("unheard_intro_seen", "1");
    intro.addEventListener("animationend", e => {
      if (e.animationName === "intro-out") intro.classList.add("skip");
    });
    intro.addEventListener("click", () => intro.classList.add("skip"));
  }

  /* nav row shortcuts */
  $$("[data-jump]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    $("#search-input").value = ""; doSearch("");
    const t = $(a.dataset.jump);
    if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    $$(".nav-links a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");
  }));
}

/* ---------- boot ---------- */

document.addEventListener("DOMContentLoaded", () => {
  renderHero();
  renderRows();
  wireSearch();
  wireChrome();
});
