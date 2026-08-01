// Marvel Hub — Static Site Generator
// Erzeugt aus site/data/*.json + site/fragments/ die komplette Seite unter public/
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";

/* ================= Konfiguration ================= */
const SITE_URL = process.env.SITE_URL || "https://marvel-hub.vercel.app";
const SITE_NAME = "Knowhere"; // nach Domain-Wechsel anpassen
const OUT = "public";
const LANGS = ["de", "en"];

const D = (n) => JSON.parse(readFileSync(`site/data/${n}.json`, "utf8"));
const FILMS = D("films"), CHARS = D("chars"), TEAMS = D("teams"), ARTIFACTS = D("artifacts"),
  PATHS = D("paths"), THREADS = D("threads"), CHRONIK = D("chronik"), UNIVERSES = D("universes"),
  SCORES = D("scores"), TRIVIA = D("trivia"), PC = D("postcredits"), CAMEO = D("cameo"),
  VARIANTS = D("variants"), STREAM = D("stream"), WIKI = D("wiki_titles"), BREAKS = D("saga_breaks");

const frag = (n) => readFileSync(`site/fragments/${n}.html`, "utf8");
const byId = {}; FILMS.forEach((f) => (byId[f.id] = f));
const charById = {}; CHARS.forEach((c) => (charById[c.id] = c));
const teamById = {}; TEAMS.forEach((t) => (teamById[t.id] = t));

const UNI_LABEL = { mcu: "MCU", fox: "X-Men / Fox", sony: "Sony / Spider-Verse", alt: "Frühe Marvel-Ära", net: "TV-Ära" };
const PRIO_LABEL = { pflicht: "Pflicht", empfohlen: "Empfohlen", optional: "Optional", komplettist: "Komplettist", future: "Kommend" };
const REL_NAME = { verbuendet: "Verbündete", feind: "Feinde", familie: "Familie", liebe: "Liebe", komplex: "Es ist kompliziert" };

/* ================= i18n ================= */
const T = {
  de: {
    langName: "Deutsch", other: "English", tagline: "Das Marvel-Fanarchiv aller Universen",
    nav: { home: "Start", films: "Filme & Serien", chars: "Charaktere", teams: "Teams", multi: "Multiversum", arts: "Artefakte", paths: "Pfade", records: "Rekorde", chron: "Chronik", threads: "Offene Fäden", event: "★ Doomsday" },
    spoiler_off: "Spoiler: aus", search_ph: "Suche …",
    home_sub: "Von Iron Man bis Doomsday: Filme, Serien, Charaktere und die ganze Lore — quer durch alle Marvel-Universen.",
    home_desc: "Marvel Hub: das Fan-Wiki über alle Marvel-Film-Universen — MCU, X-Men, Sony, Klassiker und TV-Ära. Mit Doomsday-Countdown, Watchlist, Charakteren, Teams und Lore.",
    days: "Tage", radar_last: "Zuletzt erschienen", radar_now: "● Jetzt im Kino", radar_next: "Als Nächstes",
    event_k: "· Das Event ·", event_cta: "Zum Event-Hub ➤", news: "Neuigkeiten", dive: "Direkt eintauchen",
    watch: "Als gesehen markieren", watched: "✓ Gesehen", trailer: "Trailer ansehen", trailer_s: "öffnet YouTube in neuem Tab",
    plot: "Worum es geht", cast: "Besetzung", cast_more: "Weitere Besetzung", figures: "Wichtige Figuren", trivia: "Trivia & Hintergrund",
    pc: "Post-Credit-Szenen", pc_none: "Keine (nennenswerte) Post-Credit-Szene verzeichnet.", pc_to: "Führt zu:",
    cameo: "🥸 Stan-Lee-Cameo", doom_note: "Bedeutung für Doomsday", to_event: "Zum Doomsday-Event-Hub →",
    where: "Wo schauen", asof: "Stand 08/2026", back: "← Zurück", phase: "Phase",
    powers: "Kräfte", played_lbl: "Gespielt von", who: "Wer ist das?", teams_lbl: "Teams", net: "Das Beziehungs-Netz", net_detail: "Im Detail",
    net_none: "Einzelgänger — (noch) keine kartierten Verbindungen.", seen_in: "Zu sehen in", first: "Erster Auftritt",
    played: "gespielt von", variants: "Varianten & Doppelgänger",
    legend: ["Verbündete", "Feinde", "Familie & Liebe", "Es ist kompliziert"],
    story: "Die Geschichte", members: "Mitglieder", status: "Status", stations: "Stationen", stones: "Die sechs Steine",
    path_lbl: "Der Pfad", steps: "Stationen", unknown: "Unbekannt",
    footer1: "Fan-Projekt, kein offizielles Marvel-Angebot · Stand: August 2026.",
    footer2: 'Filmdaten & Bilder: <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a> (diese Seite wird von TMDB weder unterstützt noch zertifiziert) · Streaming-Verfügbarkeiten via JustWatch · Charakterbilder: Wikipedia (Fair Use) · Scores: RT/IMDb, gerundet. Fortschritt & Einstellungen bleiben lokal.',
    ad: "Anzeige", nothing: "Nichts gefunden.", all: "Alle", only_series: "Nur Serien", classics: "Klassiker", tv_era: "TV-Ära",
  },
  en: {
    langName: "English", other: "Deutsch", tagline: "The Marvel fan archive of every universe",
    nav: { home: "Home", films: "Films & Shows", chars: "Characters", teams: "Teams", multi: "Multiverse", arts: "Artifacts", paths: "Storylines", records: "Records", chron: "Timeline", threads: "Loose Ends", event: "★ Doomsday" },
    spoiler_off: "Spoilers: off", search_ph: "Search …",
    home_sub: "From Iron Man to Doomsday: films, shows, characters and all the lore — across every Marvel universe. (Article texts are German-first for now.)",
    home_desc: "Marvel Hub: the fan wiki covering every Marvel movie universe — MCU, X-Men, Sony, classics and the TV era. With Doomsday countdown, watchlist, characters, teams and lore.",
    days: "Days", radar_last: "Recently released", radar_now: "● In theaters now", radar_next: "Up next",
    event_k: "· The Event ·", event_cta: "Enter the Event Hub ➤", news: "News", dive: "Dive in",
    watch: "Mark as watched", watched: "✓ Watched", trailer: "Watch the trailer", trailer_s: "opens YouTube in a new tab",
    plot: "The story", cast: "Cast", cast_more: "More cast", figures: "Key characters", trivia: "Trivia & background",
    pc: "Post-credit scenes", pc_none: "No (notable) post-credit scene on record.", pc_to: "Leads to:",
    cameo: "🥸 Stan Lee cameo", doom_note: "Why it matters for Doomsday", to_event: "To the Doomsday event hub →",
    where: "Where to watch", asof: "as of 08/2026", back: "← Back", phase: "Phase",
    powers: "Powers", played_lbl: "Played by", who: "Who is this?", teams_lbl: "Teams", net: "The relationship web", net_detail: "In detail",
    net_none: "A loner — no mapped connections (yet).", seen_in: "Appears in", first: "First appearance",
    played: "played by", variants: "Variants & doppelgangers",
    legend: ["Allies", "Enemies", "Family & love", "It's complicated"],
    story: "The story", members: "Members", status: "Status", stations: "Milestones", stones: "The six stones",
    path_lbl: "The path", steps: "steps", unknown: "Unknown",
    footer1: "Fan project, not an official Marvel product · Updated: August 2026.",
    footer2: 'Film data & images: <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a> (this site is not endorsed or certified by TMDB) · streaming availability via JustWatch · character images: Wikipedia (fair use) · scores: RT/IMDb, rounded. Progress & settings stay local.',
    ad: "Ad", nothing: "Nothing found.", all: "All", only_series: "Series only", classics: "Classics", tv_era: "TV era",
  },
};

/* ================= Helpers ================= */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const stripTags = (s) => String(s).replace(/<[^>]+>/g, "");
const fmtMin = (m) => { const h = Math.floor(m / 60); return h + " h" + (m % 60 ? " " + (m % 60) + " min" : ""); };

function slugify(s) {
  return s.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/['’.]/g, "").replace(/&/g, "und")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function makeSlugs(items, key) {
  const used = new Set(), out = {};
  items.forEach((it) => {
    let s = slugify(it[key]) || it.id;
    if (used.has(s)) s = s + "-" + (it.y ? String(it.y).slice(0, 4) : it.id);
    while (used.has(s)) s += "-x";
    used.add(s); out[it.id] = s;
  });
  return out;
}
const FSLUG = makeSlugs(FILMS, "t");
const CSLUG = makeSlugs(CHARS, "n");

const filmUrl = (id) => `/film/${FSLUG[id]}/`;
const charUrl = (id) => `/charakter/${CSLUG[id]}/`;
const teamUrl = (id) => `/team/${id}/`;
const artUrl = (id) => `/artefakt/${id}/`;
const pathUrl = (id) => `/pfad/${id}/`;

const posterImg = (id, alt, cls = "", lazy = true) => {
  if (!existsSync(`public/img/p/${id}.jpg`)) return `<div class="poster-fallback"><div class="pf-t metal">${esc(alt)}</div></div>`;
  return `<img src="/img/p/${id}.jpg" ${cls ? `class="${cls}"` : ""} alt="Poster: ${esc(alt)}" width="173" height="260" ${lazy ? 'loading="lazy" decoding="async"' : 'fetchpriority="high"'}>`;
};
const charImg = (id, alt, cls = "cface") =>
  existsSync(`public/img/c/${id}.jpg`)
    ? `<img src="/img/c/${id}.jpg" class="${cls}" alt="${esc(alt)}" loading="lazy" decoding="async">`
    : `<div class="poster-fallback"><div class="pf-t metal">${esc(alt)}</div></div>`;

// Breitformat-Bilder (Serien-Titelkarten): Letterbox mit geblurrtem Hintergrund statt gequetscht
const WIDE = JSON.parse(readFileSync("build/wide.json", "utf8"));
const posterImgW = (id, alt) => {
  if (!existsSync(`public/img/p/${id}.jpg`)) return `<div class="poster-fallback"><div class="pf-t metal">${esc(alt)}</div></div>`;
  if (!WIDE.includes(id)) return posterImg(id, alt);
  return `<span class="lbox"><img class="lbox-bg" src="/img/p/${id}.jpg" alt="" aria-hidden="true" loading="lazy"><img class="lbox-fg" src="/img/p/${id}.jpg" alt="Poster: ${esc(alt)}" loading="lazy"></span>`;
};

// i18n: Feld mit _en-Suffix bevorzugen, sonst deutscher Fallback
const tr = (o, f, lang) => (lang === "en" && o[f + "_en"] != null ? o[f + "_en"] : o[f]);

// YouTube-Trailer-IDs (von fetch-tmdb.mjs erzeugt; ohne Key: leere Map → externer Link als Fallback)
const TRAILERS = existsSync("site/data/trailers.json") ? JSON.parse(readFileSync("site/data/trailers.json", "utf8")) : {};
const CREDITS = existsSync("site/data/credits.json") ? JSON.parse(readFileSync("site/data/credits.json", "utf8")) : {};
const DETAILS = existsSync("site/data/details.json") ? JSON.parse(readFileSync("site/data/details.json", "utf8")) : {};
const EXTRA = existsSync("site/data/extra.json") ? JSON.parse(readFileSync("site/data/extra.json", "utf8")) : { films: {}, collections: {}, providers: {} };
const PERSONS = existsSync("site/data/persons.json") ? JSON.parse(readFileSync("site/data/persons.json", "utf8")) : {};
const PSLUG = {};
{ const used = new Set();
  for (const [pid, p] of Object.entries(PERSONS)) {
    let s = slugify(p.n) || pid;
    if (used.has(s)) s = s + "-" + pid;
    used.add(s); PSLUG[pid] = s;
  } }
const personUrl = (pid) => `/schauspieler/${PSLUG[pid]}/`;
const actorCard = (pid, name, sub, prefix) => {
  const img = pid && existsSync(`public/img/a/${pid}.jpg`)
    ? `<img class="fc-img" src="/img/a/${pid}.jpg" alt="${esc(name)}" loading="lazy">`
    : `<div class="fc-img fc-fallback">${esc(name.charAt(0))}</div>`;
  const inner = img + `<div class="fc-n">${esc(name)}</div>` + (sub ? `<div class="fc-a">${esc(sub)}</div>` : "");
  return pid && PERSONS[pid] ? `<a class="fp-char" href="${prefix}${personUrl(pid)}">${inner}</a>` : `<div class="fp-char">${inner}</div>`;
};
const fmtMoney = (v) => v >= 1e9 ? (v / 1e9).toFixed(2).replace(".", ",") + " Mrd. $" : Math.round(v / 1e6) + " Mio. $";
const fmtDate = (s) => { const [y, m, dd] = s.split("-"); return `${dd}.${m}.${y}`; };
const ACTOR_IMG = {};
Object.values(CREDITS).forEach((list) => list.forEach((c) => { if (c.p) ACTOR_IMG[c.n.trim().toLowerCase()] = c.p; }));
const actorNames = (act) => act.split("·").map((p) => p.replace(/\(.*?\)/g, "").replace(/zuvor.*$/i, "").trim()).filter((n) => n && n !== "—" && !/^und /.test(n));

const adSlot = (L) => `<div class="ad-slot" data-ad><span>${L.ad}</span></div>`;

/* ================= Layout ================= */
function page({ lang, path, title, desc, ogImage, body, dataPage, jsonld, noindex }) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  const altLang = lang === "en" ? "de" : "en";
  const altPrefix = altLang === "en" ? "/en" : "";
  const canonical = SITE_URL + prefix + path;
  const isActive = (p) => (p !== "/" && path.startsWith(p)) || (p === "/" && path === "/");
  const navLink = (k, p, extra = "") => {
    const cls = [];
    if (isActive(p)) cls.push("active");
    if (extra) cls.push(extra);
    return `<a href="${prefix}${p}"${cls.length ? ` class="${cls.join(" ")}"` : ""}>${L.nav[k]}</a>`;
  };
  const loreItems = [["chron", "/chronik/"], ["multi", "/multiversum/"], ["arts", "/artefakte/"], ["paths", "/pfade/"], ["threads", "/faeden/"], ["records", "/rekorde/"]];
  const loreActive = loreItems.some(([, p]) => isActive(p));
  const nav =
    navLink("home", "/") + navLink("films", "/filme/") + navLink("chars", "/charaktere/") + navLink("teams", "/teams/") +
    `<div class="nav-drop${loreActive ? " child-active" : ""}">
      <button class="nav-drop-btn${loreActive ? " active" : ""}" aria-haspopup="true" aria-expanded="false">${lang === "de" ? "Lore" : "Lore"} <span class="nd-arr">▾</span></button>
      <div class="nav-drop-menu">${loreItems.map(([k, p]) => navLink(k, p)).join("")}</div>
    </div>` +
    navLink("event", "/event/", "ev-link");
  return `<!doctype html>
<html lang="${lang}" data-prefix="${prefix}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${lang}" href="${canonical}">
<link rel="alternate" hreflang="${altLang}" href="${SITE_URL}${altPrefix}${path}">
<link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Knowhere">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE_URL}${ogImage || "/img/og-default.jpg"}">
<meta name="twitter:card" content="summary${ogImage ? "" : ""}">
${noindex ? '<meta name="robots" content="noindex">' : ""}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body class="${dataPage === "event" ? "" : "neutral"}" data-page="${dataPage || ""}">
<nav class="nav"><div class="nav-inner">
  <a class="nav-brand" href="${prefix}/">Know<b>·</b>here</a>
  <div class="nav-links" id="navLinks">${nav}</div>
  <div class="nav-tools">
    <div class="nav-search"><input id="globalSearch" type="search" placeholder="${L.search_ph}" aria-label="${L.search_ph}" autocomplete="off"><div class="search-drop" id="searchDrop" hidden></div></div>
    <a class="tool-btn lang-btn" href="${altPrefix}${path}" hreflang="${altLang}" title="${L.other}">${lang === "de" ? "EN" : "DE"}</a>
    <button class="tool-btn" id="spoilerToggle" aria-pressed="false" title="${L.spoiler_off}">◉ Spoiler</button>
  </div>
</div></nav>
${dataPage !== "event" && dataPage !== "home" ? `<a class="promo" href="${prefix}/event/">★ <b>Avengers: Doomsday</b><span class="promo-x">${lang === "de" ? "Erfahre alles zum kommenden Film" : "Everything about the upcoming film"}</span><span class="promo-cd"><span id="promoCd">…</span> ${lang === "de" ? "Tage" : "days"}</span><span class="promo-arr">➤</span></a>` : ""}
${body}
<footer>
  <p><strong style="color:var(--muted)">Knowhere</strong> · ${L.footer1}</p>
  <p>${L.footer2}</p>
  <p class="f-sig">▚ Every Story leads to Doom ▞</p>
</footer>
<script src="/assets/app.js" defer></script>
</body></html>`;
}

const secHead = (kicker, h2, sub) => `<div class="sec-head"><div class="sec-kicker">${kicker}</div><h2 class="metal">${h2}</h2>${sub ? `<p class="sec-sub">${sub}</p>` : ""}</div>`;

/* ================= Seiten-Renderer ================= */
function miniFilmChips(ids, lang) {
  const prefix = lang === "en" ? "/en" : "";
  return `<div class="cp-films">` + ids.map((fid) => {
    const f = byId[fid];
    return f ? `<a class="radar-film" href="${prefix}${filmUrl(fid)}" title="${esc(f.t)}">${posterImgW(fid, f.t)}<div class="rf-t">${esc(f.t)}</div></a>` : "";
  }).join("") + `</div>`;
}

function scoreCls(v, good, mid) { return v >= good ? "good" : v >= mid ? "mid" : "bad"; }

function filmBody(f, lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  const id = f.id, sc = SCORES[id];
  const d = DETAILS[id] || {};
  const x = EXTRA.films[id] || {};
  const wt = WIKI[id] || WIKI[id === "l2" ? "l1" : ""] || f.t;
  const q = encodeURIComponent(f.t + (f.type === "Film" ? " film" : " series"));
  const inFilm = CHARS.filter((c) => c.films.includes(id));
  const figActors = new Set();
  inFilm.forEach((c) => c.act.split("·").forEach((p) => {
    const n = p.replace(/\(.*?\)/g, "").replace(/zuvor.*$/i, "").trim().toLowerCase();
    if (n && n !== "—") figActors.add(n);
  }));
  const restCast = (CREDITS[id] || []).filter((c) => !figActors.has(c.n.trim().toLowerCase()));
  const restHtml = restCast.map((c) => actorCard(c.p, c.n, c.r, prefix)).join("");
  const pc = PC[id];
  const stream = STREAM[id] || (f.uni === "sony" ? "Netflix / wechselnd (DE)" : f.uni === "alt" ? "Wechselnd (Leihe/Disney+)" : "Disney+");
  const trailerQ = encodeURIComponent(`${f.t} ${parseInt(f.y)} trailer${lang === "de" ? " deutsch" : ""}`);
  return `<main class="wrap fp" style="padding-bottom:70px">
  ${d.bd ? `<div class="fp-backdrop"><img src="/img/b/${id}.jpg" alt="" aria-hidden="true" fetchpriority="high"></div>` : ""}
  <a class="backlink" href="${prefix}/filme/">${L.back}</a>
  <div class="fp-top">
    <div class="fp-poster">${posterImgW(id, f.t)}</div>
    <div class="fp-head">
      ${x.logo ? `<h1 class="visually-hidden">${esc(f.t)}</h1><img class="fp-logo" src="/img/l/${id}.png" alt="${esc(f.t)}">` : `<h1 class="metal fp-h1">${esc(f.t)}</h1>`}
      <span class="uni-badge ub-${f.uni}">${UNI_LABEL[f.uni]}</span>
      <div class="fp-meta"><b>${f.type} · ${f.y}</b>${d.rt ? " · " + fmtMin(d.rt) : (d.seasons ? ` · ${d.seasons} ${d.seasons > 1 ? (lang === "de" ? "Staffeln" : "seasons") : (lang === "de" ? "Staffel" : "season")} · ${d.episodes} Ep.` : (f.min ? " · ≈ " + fmtMin(f.min) : ""))}${f.uni === "mcu" && f.ph ? ` · ${L.phase} ${f.ph}` : ""}<br>${esc(f.dir)}${d.genres && d.genres.length ? `<br><span style="color:var(--faint)">${d.genres.map(esc).join(" · ")}${x.countries ? " · " + x.countries.join("/") : ""}</span>` : ""}${x.orig ? `<br><span style="color:var(--faint)">Originaltitel: ${esc(x.orig)}</span>` : ""}</div>
      <div class="stream-line">📺 ${L.where}: ${d.prov && (d.prov.s.length || d.prov.r.length)
        ? d.prov.s.map((n) => `${EXTRA.providers[n] ? `<img class="prov-logo" src="/img/pr/${EXTRA.providers[n]}.png" alt="">` : ""}<b>${esc(n)}</b>`).join(" · ") + (d.prov.r.length ? ` · ${lang === "de" ? "Leihe" : "Rent"}: ${esc(d.prov.r.slice(0, 2).join(", "))}` : "")
        : `<b>${esc(stream)}</b> · ${L.asof}`}</div>
      ${(sc || d.vote) ? `<div class="scores">` +
        (sc ? `<div class="score ${scoreCls(sc[0], 60, 40)}"><div class="sv">${sc[0]} %</div><div class="sk">Rotten Tomatoes</div></div><div class="score ${scoreCls(sc[1], 7, 5.5)}"><div class="sv">${sc[1].toFixed(1)}</div><div class="sk">IMDb / 10</div></div>` : "") +
        (d.vote ? `<div class="score ${scoreCls(d.vote[0], 7, 5.5)}"><div class="sv">${d.vote[0].toFixed(1)}</div><div class="sk">TMDB · ${d.vote[1].toLocaleString("de-DE")} Stimmen</div></div>` : "") + `</div>` : ""}
      <div class="ext-links">
        <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(wt.replace(/ /g, "_"))}" target="_blank" rel="noopener">Wikipedia</a>
        <a href="https://de.wikipedia.org/w/index.php?search=${q}" target="_blank" rel="noopener">Wikipedia (DE)</a>
        <a href="${d.imdb ? `https://www.imdb.com/title/${d.imdb}/` : `https://www.imdb.com/find/?q=${q}`}" target="_blank" rel="noopener">IMDb</a>
        <a href="https://www.rottentomatoes.com/search?search=${encodeURIComponent(f.t)}" target="_blank" rel="noopener">Rotten Tomatoes</a>
      </div>
    </div>
  </div>
  ${TRAILERS[id]
    ? `<div class="trailer-card" data-yt="${TRAILERS[id]}" role="button" tabindex="0" aria-label="${L.trailer}">
    ${existsSync(`public/img/p/${id}.jpg`) ? `<img src="/img/p/${id}.jpg" alt="" aria-hidden="true" loading="lazy">` : ""}
    <div class="tc-overlay"><div class="tc-play">▶</div><div class="tc-t">${L.trailer}</div><div class="tc-s">${lang === "de" ? "Klick lädt den YouTube-Player" : "Click loads the YouTube player"}</div></div>
  </div>`
    : `<a class="trailer-card" href="https://www.youtube.com/results?search_query=${trailerQ}" target="_blank" rel="noopener">
    ${existsSync(`public/img/p/${id}.jpg`) ? `<img src="/img/p/${id}.jpg" alt="" aria-hidden="true" loading="lazy">` : ""}
    <div class="tc-overlay"><div class="tc-play">▶</div><div class="tc-t">${L.trailer}</div><div class="tc-s">${L.trailer_s}</div></div>
  </a>`}
  ${x.coll && EXTRA.collections[x.coll] && EXTRA.collections[x.coll].ids.length > 1 ? (() => {
    const c = EXTRA.collections[x.coll];
    const parts = c.ids.slice().sort((a, b) => parseInt(byId[a].y) - parseInt(byId[b].y));
    return `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Filmreihe" : "Film series"} · ${esc(c.n)} · ${lang === "de" ? "Teil" : "Part"} ${parts.indexOf(id) + 1}/${parts.length}</div><div class="cp-films">` +
      parts.map((pid2) => `<a class="radar-film${pid2 === id ? " current" : ""}" href="${prefix}${filmUrl(pid2)}" title="${esc(byId[pid2].t)}">${posterImgW(pid2, byId[pid2].t)}<div class="rf-t">${esc(byId[pid2].t)}</div></a>`).join("") + `</div></div>`;
  })() : ""}
  ${(d.deDate || d.cert || d.budget || d.revenue) ? `<div class="fact-strip">` +
    (d.deDate ? `<div class="fact-box"><div class="fb-k">${lang === "de" ? "Kinostart (DE)" : "DE release"}</div><div class="fb-v">${fmtDate(d.deDate)}</div></div>` : "") +
    (d.cert ? `<div class="fact-box"><div class="fb-k">FSK</div><div class="fb-v">ab ${esc(d.cert)}</div></div>` : "") +
    (d.budget ? `<div class="fact-box"><div class="fb-k">Budget</div><div class="fb-v">${fmtMoney(d.budget)}</div></div>` : "") +
    (d.revenue ? `<div class="fact-box"><div class="fb-k">${lang === "de" ? "Einspielergebnis" : "Box office"}</div><div class="fb-v">${fmtMoney(d.revenue)}</div></div>` : "") + `</div>` : ""}
  <div class="fp-section"><div class="fp-label">${L.plot}</div><p>${esc(f.plot)}</p></div>
  ${inFilm.length ? `<div class="fp-section"><div class="fp-label">${L.figures}</div><div class="fp-chars">` +
    inFilm.map((c) => `<a class="fp-char" href="${prefix}${charUrl(c.id)}">${charImg(c.id, c.n, "fc-img")}<div class="fc-n">${esc(c.n)}</div><div class="fc-a">${esc(c.act.split("·")[0].split("(")[0].trim())}</div></a>`).join("") + `</div>` +
    (restCast.length ? `<details class="more-cast"><summary>${L.cast_more} · ${restCast.length}</summary><div class="fp-chars">${restHtml}</div></details>` : "") + `</div>`
  : restCast.length
    ? `<div class="fp-section"><div class="fp-label">${L.cast}</div><div class="fp-chars">${restHtml}</div></div>`
    : `<div class="fp-section"><div class="fp-label">${L.cast}</div><p>${f.cast.map(esc).join(" · ")}</p></div>`}
  ${TRIVIA[id] ? `<div class="fp-section"><div class="fp-label">${L.trivia}</div><ul>${TRIVIA[id].map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
  ${(x.gal || (x.videos && x.videos.length)) ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Galerie & Videos" : "Gallery & videos"}</div><div class="gal">` +
    (x.gal ? Array.from({ length: x.gal }, (_, i) => `<button class="glight gal-item" data-img="/img/g/${id}-${i}.jpg" aria-label="Bild ${i + 1}"><img src="/img/g/${id}-${i}.jpg" alt="" loading="lazy"></button>`).join("") : "") +
    (x.videos || []).filter((v) => v.k !== TRAILERS[id]).slice(0, 4).map((v) => `<button class="glight gal-item gal-video" data-yt="${v.k}" aria-label="${esc(v.n)}"><img src="https://i.ytimg.com/vi/${v.k}/hqdefault.jpg" alt="" loading="lazy"><span class="gv-play">▶</span><span class="gv-t">${esc(v.t)}</span></button>`).join("") +
  `</div></div>` : ""}
  ${x.eps && x.eps.length ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Episoden" : "Episodes"}</div>` +
    x.eps.map((sea) => `<details class="season"${x.eps.length === 1 ? " open" : ""}><summary>${lang === "de" ? "Staffel" : "Season"} ${sea.s} · ${sea.eps.length} ${lang === "de" ? "Folgen" : "episodes"}</summary>` +
      sea.eps.map((ep, i) => `<div class="ep-row"><div class="ep-n">${i + 1}</div><div class="ep-main"><div class="ep-t">${esc(ep.n)}${ep.v ? ` <span class="ep-v">★ ${ep.v.toFixed(1)}</span>` : ""}</div>${ep.o ? `<div class="ep-o"><span class="spoiler">${esc(ep.o)}</span></div>` : ""}</div><div class="ep-d">${ep.d ? fmtDate(ep.d) : ""}</div></div>`).join("") +
    `</details>`).join("") + `</div>` : ""}
  ${(pc || f.prio !== "future") ? `<div class="fp-section"><div class="fp-label">${L.pc}${pc && pc.scenes.length ? " · " + pc.scenes.length : ""}</div>` +
    (!pc ? `<p style="color:var(--faint)">${L.pc_none}</p>` :
      (pc.note ? `<p class="pc-note">${esc(pc.note)}</p>` : "") +
      pc.scenes.map((s, i) => `<div class="pc-scene"><div class="pc-num">${i + 1}</div><div><p><span class="spoiler">${esc(s.d)}</span></p>` +
        (s.to && byId[s.to] ? `<a class="pc-to" href="${prefix}${filmUrl(s.to)}">→ ${L.pc_to} ${esc(byId[s.to].t)}</a>` : "") + `</div></div>`).join("")) + `</div>` : ""}
  ${CAMEO[id] ? `<div class="fp-section"><div class="fp-label">${L.cameo}</div><p>${esc(CAMEO[id])}</p></div>` : ""}
  ${f.uni === "mcu" && f.note ? `<div class="fp-doom"><div class="fp-label">${L.doom_note}${f.prio && f.prio !== "future" ? " · " + PRIO_LABEL[f.prio] : ""}</div><p>${esc(f.note)}</p><a href="${prefix}/event/">${L.to_event}</a></div>` : ""}
  ${f.prio !== "future" ? `<button class="fp-watch" data-watch="${id}" data-t-on="${L.watched}" data-t-off="${L.watch}">${L.watch}</button>` : ""}
  ${adSlot(L)}
</main>`;
}

function charBody(c, lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  // Beziehungen inkl. Rückrichtung
  const seen = new Set(), rels = [];
  c.rel.forEach((r) => { if (charById[r[0]] && !seen.has(r[0])) { seen.add(r[0]); rels.push({ id: r[0], t: r[1], l: r[2] }); } });
  CHARS.forEach((o) => {
    if (o.id === c.id || seen.has(o.id)) return;
    o.rel.forEach((r) => { if (r[0] === c.id && !seen.has(o.id)) { seen.add(o.id); rels.push({ id: o.id, t: r[1], l: r[2] }); } });
  });
  const relsCapped = rels.slice(0, 10);
  const ts = TEAMS.filter((t) => t.members.includes(c.id));
  const vGroup = VARIANTS.find((v) => v.ids.includes(c.id));
  const netData = relsCapped.length ? {
    center: { id: c.id, n: c.n, u: c.u, img: existsSync(`public/img/c/${c.id}.jpg`) ? `/img/c/${c.id}.jpg` : null },
    nodes: relsCapped.map((r) => { const o = charById[r.id]; return { id: r.id, n: o.n, u: o.u, t: r.t, url: prefix + charUrl(r.id), img: existsSync(`public/img/c/${r.id}.jpg`) ? `/img/c/${r.id}.jpg` : null }; }),
  } : null;
  return `<main class="wrap fp" style="padding-bottom:70px">
  <a class="backlink" href="${prefix}/charaktere/">${L.back}</a>
  <div class="fp-top">
    <div class="fp-poster">${charImg(c.id, c.n)}</div>
    <div class="fp-head">
      <h1 class="metal fp-h1">${esc(c.n)}</h1>
      <span class="uni-badge ub-${c.u}">${UNI_LABEL[c.u]}</span>
      <div class="fp-meta"><b>${esc(c.a)}</b><br>${esc(c.uni)}<br>${L.first}: ${esc(c.first)}</div>
    </div>
  </div>
  <div class="fp-section"><div class="fp-label">${L.played_lbl}</div><div class="fp-chars">${actorNames(c.act).map((n) => actorCard(ACTOR_IMG[n.toLowerCase()], n, "", prefix)).join("")}</div><p style="font-size:12.5px;color:var(--faint);margin-top:10px">${esc(c.act)}</p></div>
  <div class="fp-section"><div class="fp-label">${L.powers}</div><p>${esc(c.pow)}</p></div>
  <div class="fp-section"><div class="fp-label">${L.who}</div><p>${esc(c.bio)}</p></div>
  ${ts.length ? `<div class="fp-section"><div class="fp-label">${L.teams_lbl}</div><div class="ext-links">` +
    ts.map((t) => `<a href="${prefix}${teamUrl(t.id)}">${esc(t.n)}${t.lead === c.id ? " ★" : ""}</a>`).join("") + `</div></div>` : ""}
  ${vGroup ? `<div class="fp-section"><div class="fp-label">${L.variants} · ${esc(vGroup.n)}</div><p style="font-size:13.5px;color:var(--muted);margin-bottom:12px">${esc(vGroup.note)}</p><div class="fp-chars">` +
    vGroup.ids.filter((x) => x !== c.id).map((oid) => `<a class="fp-char" href="${prefix}${charUrl(oid)}">${charImg(oid, charById[oid].n, "fc-img")}<div class="fc-n">${esc(charById[oid].n)}</div></a>`).join("") + `</div></div>` : ""}
  ${netData ? `<div class="fp-section"><div class="fp-label">${L.net}</div><canvas id="miniNet"></canvas>
    <div class="mm-legend"><span><i style="background:#5aa9e6"></i>${L.legend[0]}</span><span><i style="background:#e8353b"></i>${L.legend[1]}</span><span><i style="background:#d9a441"></i>${L.legend[2]}</span><span><i style="background:#a06be6"></i>${L.legend[3]}</span></div>
    <script type="application/json" id="netData">${JSON.stringify(netData)}</script></div>
  <div class="fp-section"><div class="fp-label">${L.net_detail}</div><div class="cp-rel">` +
    relsCapped.map((r) => `<a href="${prefix}${charUrl(r.id)}"><span><b>${esc(charById[r.id].n)}</b> — ${REL_NAME[r.t]}</span><span class="rl">${esc(r.l)}</span></a>`).join("") + `</div></div>`
    : `<div class="fp-section"><div class="fp-label">${L.net}</div><p>${L.net_none}</p></div>`}
  <div class="fp-section"><div class="fp-label">${L.seen_in}</div>${miniFilmChips(c.films, lang)}</div>
  ${adSlot(L)}
</main>`;
}

function teamBody(t, lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  return `<main class="wrap fp" style="padding-bottom:70px">
  <a class="backlink" href="${prefix}/teams/">${L.back}</a>
  <h1 class="metal fp-h1">${esc(t.n)}</h1>
  ${t.ev ? `<span class="uni-badge ub-ev">★ Doomsday</span>` : `<span class="uni-badge ub-${t.u}">${UNI_LABEL[t.u]}</span>`}
  <div class="fp-meta"><b>${esc(t.sub)}</b><br>${L.first}: ${esc(t.first)}<br>${L.status}: ${esc(t.status)}</div>
  <div class="fp-section"><div class="fp-label">${L.story}</div><p>${esc(t.desc)}</p></div>
  <div class="fp-section"><div class="fp-label">${esc(t.mlabel || L.members)}</div><div class="fp-chars">` +
    t.members.map((m) => `<a class="fp-char" href="${prefix}${charUrl(m)}">${charImg(m, charById[m].n, "fc-img")}<div class="fc-n">${esc(charById[m].n)}${t.lead === m ? " ★" : ""}</div></a>`).join("") +
    (t.extras || []).map((name) => `<div class="fp-char"><div class="fc-img fc-fallback">${esc(name.charAt(0))}</div><div class="fc-n">${esc(name)}</div></div>`).join("") +
    (t.mystery ? Array.from({ length: t.mystery }, () => `<div class="fp-char"><div class="fc-img fc-fallback fc-mystery">?</div><div class="fc-n">${L.unknown}</div></div>`).join("") : "") +
  `</div></div>
  <div class="fp-section"><div class="fp-label">${L.seen_in}</div>${miniFilmChips(t.films, lang)}</div>
  ${adSlot(L)}
</main>`;
}

function artBody(a, lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  return `<main class="wrap fp" style="padding-bottom:70px">
  <a class="backlink" href="${prefix}/artefakte/">${L.back}</a>
  <div class="art-sym metal" style="font-size:64px">${a.sym}</div>
  <h1 class="metal fp-h1">${esc(a.n)}</h1>
  <div class="fp-meta"><b>${esc(tr(a, "sub", lang))}</b><br>${L.status}: ${esc(tr(a, "status", lang))}</div>
  <div class="fp-section"><div class="fp-label">${L.story}</div><p>${esc(tr(a, "d", lang))}</p></div>
  ${a.stones ? `<div class="fp-section"><div class="fp-label">${L.stones}</div><div class="cp-rel">` +
    tr(a, "stones", lang).map((s) => `<a style="cursor:default"><span><b>${esc(s.n)}</b></span><span class="rl" style="text-align:right;max-width:60%">${esc(s.d)}</span></a>`).join("") + `</div></div>` : ""}
  <div class="fp-section"><div class="fp-label">${L.stations}</div><ul>${tr(a, "stations", lang).map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
  <div class="fp-section"><div class="fp-label">${L.seen_in}</div>${miniFilmChips(a.films, lang)}</div>
</main>`;
}

function pathBody(p, lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  return `<main class="wrap fp" style="padding-bottom:70px">
  <a class="backlink" href="${prefix}/pfade/">${L.back}</a>
  <h1 class="metal fp-h1">${esc(p.n)}</h1>
  <div class="fp-meta"><b>${esc(p.tag)}</b></div>
  <div class="fp-section"><p>${esc(p.intro)}</p></div>
  <div class="fp-section"><div class="fp-label">${L.path_lbl} · ${p.steps.length} ${L.steps}</div>` +
    p.steps.map((s, i) => {
      const f = byId[s.f];
      return `<a class="ewl-row" href="${prefix}${filmUrl(s.f)}" style="text-decoration:none;color:inherit">
        <div class="ewl-num">${i + 1}</div>
        <div class="ewl-poster">${posterImgW(s.f, f.t)}</div>
        <div class="ewl-main"><div class="ewl-t">${esc(f.t)}</div><div class="ewl-sub">${esc(s.note)}</div></div></a>`;
    }).join("") + `</div>
</main>`;
}

/* ================= Index-Seiten ================= */
function wikiIndexBody(lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  const list = FILMS.slice().sort((a, b) => parseInt(a.y) - parseInt(b.y) || a.t.localeCompare(b.t));
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Das Archiv" : "The archive", lang === "de" ? "Filme &amp; Serien" : "Films &amp; Shows", lang === "de" ? "Jeder Eintrag ist eine eigene Seite: Story, Cast, Scores, Trivia, Post-Credits und Links." : "Every entry is its own page: story, cast, scores, trivia, post-credits and links.")}
  <div class="wiki-tools">
    <input class="wiki-search" id="wikiSearch" type="search" placeholder="${lang === "de" ? "Titel suchen …" : "Search titles …"}">
    <div class="seg" id="wikiUni">
      <button class="sel" data-uni="alle">${L.all}</button><button data-uni="mcu">MCU</button><button data-uni="fox">X-Men &amp; Fox</button><button data-uni="sony">Sony</button><button data-uni="alt">${L.classics}</button><button data-uni="net">${L.tv_era}</button><button data-uni="serie">${L.only_series}</button>
    </div>
  </div>
  <div class="wgrid" id="wikiGrid">` +
    list.map((f) => `<a class="wcard" href="${prefix}${filmUrl(f.id)}" data-uni="${f.uni}" data-type="${f.type}" data-t="${esc(f.t.toLowerCase())}">
      <div class="pw">${posterImgW(f.id, f.t)}</div>
      <div class="wt">${esc(f.t)}</div><div class="wy">${f.y} · ${f.type}</div>
      <span class="uni-badge ub-${f.uni}">${UNI_LABEL[f.uni]}</span></a>`).join("") +
  `</div>${adSlot(L)}</main>`;
}

function charIndexBody(lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Helden · Schurken · alles dazwischen" : "Heroes · villains · everything in between", lang === "de" ? "Charaktere" : "Characters", lang === "de" ? "Jede Figur hat ihre eigene Seite — mit Biografie, Kräften und Beziehungs-Netz." : "Every character has their own page — bio, powers and relationship web.")}
  <div class="wiki-tools">
    <input class="wiki-search" id="wikiSearch" type="search" placeholder="${lang === "de" ? "Charakter suchen …" : "Search characters …"}">
    <div class="seg" id="wikiUni"><button class="sel" data-uni="alle">${L.all}</button><button data-uni="mcu">MCU</button><button data-uni="fox">X-Men &amp; Fox</button><button data-uni="sony">Sony</button></div>
  </div>
  <div class="wgrid" id="wikiGrid">` +
    CHARS.map((c) => `<a class="wcard" href="${prefix}${charUrl(c.id)}" data-uni="${c.u}" data-type="Char" data-t="${esc((c.n + " " + c.a + " " + c.act).toLowerCase())}">
      <div class="pw">${charImg(c.id, c.n)}</div>
      <div class="wt">${esc(c.n)}</div><div class="wy">${esc(c.act)}</div>
      <span class="uni-badge ub-${c.u}">${UNI_LABEL[c.u]}</span></a>`).join("") +
  `</div>${adSlot(L)}</main>`;
}

function teamsIndexBody(lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  const card = (t) => {
    const stack = t.members.slice(0, 6).map((m) =>
      existsSync(`public/img/c/${m}.jpg`) ? `<img src="/img/c/${m}.jpg" alt="" loading="lazy">` : `<span>${esc(charById[m].n.charAt(0))}</span>`).join("") +
      (t.mystery ? '<span class="mystery">?</span><span class="mystery">?</span>' : "");
    const total = t.members.length + (t.extras ? t.extras.length : 0);
    return `<a class="char-card${t.ev ? " ev-team" : ""}" href="${prefix}${teamUrl(t.id)}" style="text-decoration:none;color:inherit">
      <div class="tstack">${stack}</div>
      <div class="cc-n">${esc(t.n)}</div><div class="cc-a">${esc(t.sub)}</div>
      <div class="cc-p">${t.mystery ? `${t.members.length} + ${t.mystery} ?` : total + " " + L.members} · ${esc(t.first)}</div>
      ${t.ev ? `<span class="uni-badge ub-ev">★ Doomsday</span>` : `<span class="uni-badge ub-${t.u}">${UNI_LABEL[t.u]}</span>`}</a>`;
  };
  const heroes = TEAMS.filter((t) => t.side !== "villain"), villains = TEAMS.filter((t) => t.side === "villain");
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Wer kämpft mit wem" : "Who fights alongside whom", "Teams", "")}
  <div class="char-grid">
    <div class="tgroup-head">${lang === "de" ? "Helden, Familien &amp; Institutionen" : "Heroes, families &amp; institutions"}</div>${heroes.map(card).join("")}
    <div class="tgroup-head vill">${lang === "de" ? "Schurken-Fraktionen" : "Villain factions"}</div>${villains.map(card).join("")}
  </div></main>`;
}

function artsIndexBody(lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Waffen, Bücher, Wundermetalle" : "Weapons, books, wonder metals", lang === "de" ? "Die Artefakte" : "The Artifacts", "")}
  <div class="char-grid">` + ARTIFACTS.map((a) =>
    `<a class="char-card${a.ev ? " ev-team" : ""}" href="${prefix}${artUrl(a.id)}" style="text-decoration:none;color:inherit">
      <div class="art-sym metal">${a.sym}</div>
      <div class="cc-n">${esc(a.n)}</div><div class="cc-a">${esc(a.sub)}</div><div class="cc-p">${esc(a.status)}</div></a>`).join("") +
  `</div></main>`;
}

function pcMapHtml(lang) {
  const prefix = lang === "en" ? "/en" : "";
  const links = [];
  Object.keys(PC).forEach((k) => PC[k].scenes.forEach((s) => { if (s.to && byId[k] && byId[s.to]) links.push({ from: k, to: s.to }); }));
  const involved = new Set(); links.forEach((l) => { involved.add(l.from); involved.add(l.to); });
  const nodes = FILMS.filter((f) => involved.has(f.id)).sort((a, b) => parseInt(a.y) - parseInt(b.y) || FILMS.indexOf(a) - FILMS.indexOf(b));
  const idx = {}; nodes.forEach((n, i) => (idx[n.id] = i));
  const ROW = 42, H = nodes.length * ROW, ARCW = 170;
  const rows = nodes.map((n) => `<div class="pcm-row" data-id="${n.id}" data-url="${prefix}${filmUrl(n.id)}">` +
    (existsSync(`public/img/p/${n.id}.jpg`) ? `<img src="/img/p/${n.id}.jpg" alt="" loading="lazy">` : "<span></span>") +
    `<div class="pcm-t">${esc(n.t)}</div><div class="pcm-y">${n.y}</div></div>`).join("");
  const paths = links.map((l) => {
    const y1 = idx[l.from] * ROW + ROW / 2, y2 = idx[l.to] * ROW + ROW / 2;
    const cx = Math.min(30 + Math.abs(idx[l.to] - idx[l.from]) * 6, ARCW - 12);
    return `<path data-from="${l.from}" data-to="${l.to}" d="M0 ${y1} C ${cx} ${y1}, ${cx} ${y2}, 0 ${y2}"/>`;
  }).join("");
  return `<div class="pcmap" id="pcMap"><div class="pcm-rows">${rows}</div>` +
    `<svg class="pcm-svg" width="${ARCW}" height="${H}" viewBox="0 0 ${ARCW} ${H}" aria-hidden="true">${paths}</svg></div>` +
    `<script type="application/json" id="pcLinks">${JSON.stringify({ links, titles: Object.fromEntries(nodes.map((n) => [n.id, n.t])) })}</script>`;
}

function pathsIndexBody(lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Der rote Faden" : "The red thread", lang === "de" ? "Pfade &amp; Verkettungen" : "Storylines &amp; Chains", lang === "de" ? "Kuratierte Handlungsstränge — und darunter die komplette Post-Credit-Kette. Klick pinnt einen Film fest und zeigt seine Verbindungen als Sprungliste." : "Curated story threads — plus the full post-credit chain below. Click pins a film and lists its connections.")}
  <div class="char-grid">` + PATHS.map((p) => {
    const stack = p.steps.slice(0, 5).map((s) => existsSync(`public/img/p/${s.f}.jpg`) ? `<img src="/img/p/${s.f}.jpg" alt="" loading="lazy">` : "").join("");
    return `<a class="char-card" href="${prefix}${pathUrl(p.id)}" style="text-decoration:none;color:inherit">
      <div class="pstack">${stack}</div><div class="cc-n">${esc(p.n)}</div><div class="cc-a">${esc(p.tag)}</div><div class="cc-p">${p.steps.length} ${L.steps}</div></a>`;
  }).join("") + `</div>
  <div class="subhead" style="margin-top:64px">${lang === "de" ? "Die Post-Credit-Kette" : "The post-credit chain"}</div>
  ${pcMapHtml(lang)}
</main>`;
}

function multiBody(lang) {
  const prefix = lang === "en" ? "/en" : "";
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Die Landkarte der Realitäten" : "The map of realities", lang === "de" ? "Das Multiversum" : "The Multiverse", lang === "de" ? "Jede Erde hat eine Nummer, jede Nummer eine Geschichte." : "Every Earth has a number, every number a story.")}
  <div class="uni-grid">` + UNIVERSES.map((u) => `<div class="uni-card${u.ev ? " ev" : ""}">
    <div class="uni-head"><div class="uni-num metal">${esc(u.num)}</div><div><div class="uni-name">${esc(u.n)}</div><div class="uni-status">${esc(u.status)}</div></div></div>
    <p>${esc(u.d)}</p>
    <div class="cp-films">${u.sample.map((fid) => byId[fid] ? `<a class="radar-film" href="${prefix}${filmUrl(fid)}" title="${esc(byId[fid].t)}">${posterImgW(fid, byId[fid].t)}</a>` : "").join("")}</div>
  </div>`).join("") + `</div></main>`;
}

function chronBody(lang) {
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Die Weltgeschichte des MCU" : "The in-universe history", lang === "de" ? "Die Chronik" : "The Timeline", lang === "de" ? "Nicht wann die Filme erschienen — sondern wann es passiert ist. Hover/Tippen für Details und die Filme dazu." : "Not release order — story order. Hover/tap for details and the films involved.")}
  <div class="chron">` + CHRONIK.map((e) => `<div class="chron-item">
    <div class="chron-y metal">${esc(e.y)}</div>
    <div class="chron-body"><div class="chron-n">${esc(e.n)}</div>
    <div class="chron-more"><p>${esc(e.d)}</p>${miniFilmChips(e.films, lang)}</div></div></div>`).join("") + `</div></main>`;
}

function threadsBody(lang) {
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead("Chekhovs Waffenkammer", lang === "de" ? "Die offenen Fäden" : "The Loose Ends", lang === "de" ? "Alles, was das Marvel-Kino angeteasert und nie aufgelöst hat. <span style='color:#3fdc8c'>●</span> heiß · <span style='color:var(--gold)'>●</span> köchelt · <span style='color:#ff8a8e'>●</span> kalt." : "Everything Marvel teased and never resolved. <span style='color:#3fdc8c'>●</span> hot · <span style='color:var(--gold)'>●</span> simmering · <span style='color:#ff8a8e'>●</span> cold.")}
  <div class="threads">` + THREADS.map((t) => `<div class="thread g-${t.grade}">
    <div class="thread-head"><span class="thread-dot"></span><div><div class="thread-n">${esc(t.n)}</div><div class="thread-s">${esc(t.seit)} · Status: ${esc(t.status)}</div></div></div>
    <div class="chron-more"><p>${esc(t.d)}</p>${miniFilmChips(t.films, lang)}</div></div>`).join("") + `</div></main>`;
}

function recordsBody(lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  const scored = FILMS.filter((f) => SCORES[f.id]);
  const byRt = scored.slice().sort((a, b) => SCORES[b.id][0] - SCORES[a.id][0]);
  const recRow = (f, i, val) => `<a class="rec-row" href="${prefix}${filmUrl(f.id)}" style="text-decoration:none;color:inherit">
    <div class="rec-rank">${i + 1}</div>${existsSync(`public/img/p/${f.id}.jpg`) ? `<img src="/img/p/${f.id}.jpg" alt="" loading="lazy">` : "<span></span>"}
    <div class="rec-main"><div class="rec-t">${esc(f.t)}</div><div class="rec-s">${f.y} · ${UNI_LABEL[f.uni]}</div></div>
    <div class="rec-bar"><div style="width:${SCORES[f.id][0]}%"></div></div><div class="rec-val">${val}</div></a>`;
  const gap = scored.slice().sort((a, b) => Math.abs(SCORES[b.id][1] * 10 - SCORES[b.id][0]) - Math.abs(SCORES[a.id][1] * 10 - SCORES[a.id][0])).slice(0, 6);
  const filmsOnly = FILMS.filter((f) => f.type === "Film" && f.min);
  const longest = filmsOnly.slice().sort((a, b) => b.min - a.min)[0];
  const shortest = filmsOnly.slice().sort((a, b) => a.min - b.min)[0];
  const curios = [
    `Längster Film: <b>${esc(longest.t)}</b> (${fmtMin(longest.min)}) — kürzester: <b>${esc(shortest.t)}</b> (${fmtMin(shortest.min)}).`,
    "<b>Avengers: Endgame</b> spielte 2,799 Mrd. Dollar ein und war zeitweise der erfolgreichste Film aller Zeiten.",
    "<b>Deadpool & Wolverine</b> ist mit 1,34 Mrd. der erfolgreichste R-Rated-Film der Geschichte.",
    "<b>No Way Home</b> (1,9 Mrd.) ist der erfolgreichste Spider-Man-Film — und der größte Pandemie-Kinostart.",
    "<b>Morbius</b> ist der einzige Film, der zweimal floppte: Sony brachte ihn wegen der Memes erneut ins Kino.",
    "<b>Iron Man</b> wurde mit verpfändeten Figurenrechten finanziert — wäre er gefloppt, gäbe es dieses Wiki nicht.",
    "<b>Guardians Vol. 2</b> hält mit <b>5 Post-Credit-Szenen</b> den Abspann-Rekord.",
    "<b>X-Men '97</b> und <b>Ms. Marvel</b> (je 98 %) schlagen jeden Kinofilm.",
    "<b>Secret Invasion</b> kostete ~212 Mio. Dollar für 6 Episoden — bei 53 % RT.",
    "<b>Loki</b> ist die einzige MCU-Serie, die je eine zweite Staffel bekam.",
    "<b>Howard the Duck</b> (1986) war der allererste Marvel-Kinofilm. Produziert von George Lucas. 13 %.",
  ];
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead("Hall of Fame & Hall of Shame", lang === "de" ? "Die Rekorde" : "The Records", lang === "de" ? "Bestwerte, Tiefpunkte und Kuriositäten — direkt aus den Wiki-Daten berechnet." : "Highs, lows and oddities — computed straight from the wiki data.")}
  <div class="subhead">Top 10 (Rotten Tomatoes)</div>${byRt.slice(0, 10).map((f, i) => recRow(f, i, SCORES[f.id][0] + " %")).join("")}
  <div class="subhead">Flop 10</div>${byRt.slice(-10).reverse().map((f, i) => recRow(f, i, SCORES[f.id][0] + " %")).join("")}
  <div class="subhead">${lang === "de" ? "Serien-Ranking · Top 5" : "Series ranking · top 5"}</div>${scored.filter((f) => f.type === "Serie").sort((a, b) => SCORES[b.id][0] - SCORES[a.id][0]).slice(0, 5).map((f, i) => recRow(f, i, SCORES[f.id][0] + " %")).join("")}
  <div class="subhead">${lang === "de" ? "Box Office · Top 10" : "Box office · top 10"}</div>
  ${(() => {
    const byRev = FILMS.filter((x) => DETAILS[x.id] && DETAILS[x.id].revenue).sort((a, b) => DETAILS[b.id].revenue - DETAILS[a.id].revenue).slice(0, 10);
    const max = DETAILS[byRev[0].id].revenue;
    return byRev.map((x, i) => `<a class="rec-row" href="${prefix}${filmUrl(x.id)}"><div class="rec-rank">${i + 1}</div><img src="/img/p/${x.id}.jpg" alt="" loading="lazy"><div class="rec-main"><div class="rec-t">${esc(x.t)}</div><div class="rec-s">${x.y} · ${UNI_LABEL[x.uni]}</div></div><div class="rec-bar"><div style="width:${Math.round(DETAILS[x.id].revenue / max * 100)}%"></div></div><div class="rec-val">${fmtMoney(DETAILS[x.id].revenue)}</div></a>`).join("");
  })()}
  <div class="subhead">${lang === "de" ? "Die Universen im Vergleich" : "Universes compared"}</div>
  ${["mcu", "fox", "sony", "net", "alt"].map((u) => {
    const us = scored.filter((f) => f.uni === u);
    if (!us.length) return "";
    const avg = Math.round(us.reduce((s, f) => s + SCORES[f.id][0], 0) / us.length);
    return `<div class="rec-row" style="cursor:default"><div class="rec-rank">Ø</div><div class="rec-main"><div class="rec-t">${UNI_LABEL[u]}</div><div class="rec-s">${us.length} Titel</div></div><div class="rec-bar"><div style="width:${avg}%"></div></div><div class="rec-val">${avg} %</div></div>`;
  }).join("")}
  <div class="subhead">${lang === "de" ? "Kritiker vs. Publikum" : "Critics vs. audience"}</div>
  ${gap.map((f, i) => { const sc = SCORES[f.id]; const d = Math.round(sc[1] * 10 - sc[0]); return recRow(f, i, (d > 0 ? "+" : "") + d); }).join("")}
  <div class="subhead">${lang === "de" ? "Kurioses & Kino-Rekorde" : "Oddities & box-office records"}</div>
  <div class="lore-wrap"><ul style="padding-left:20px">${curios.map((x) => `<li style="color:#bcb8ba;font-size:14.5px;margin-bottom:8px">${x}</li>`).join("")}</ul></div>
  <div class="subhead">🥸 Excelsior — Stan Lee</div>
  <div class="cameo-list">${Object.keys(CAMEO).map((cid) => byId[cid] ? `<a class="cameo-row" href="${prefix}${filmUrl(cid)}" style="text-decoration:none"><b>${esc(byId[cid].t)}</b><span>${esc(CAMEO[cid])}</span></a>` : "").join("")}</div>
  ${adSlot(L)}
</main>`;
}

/* ================= Event-Seite ================= */
function roadHtml(lang) {
  const prefix = lang === "en" ? "/en" : "";
  let html = "";
  FILMS.filter((f) => f.uni === "mcu").forEach((f, i) => {
    if (BREAKS[f.id]) {
      const b = BREAKS[f.id];
      html += `<div class="sep">${b.saga ? `<div class="sep-saga metal">${b.saga}</div>` : ""}<div class="sep-phase">${b.phase}</div></div>`;
    }
    html += `<div class="stop${f.prio === "future" ? " future" : ""}" data-id="${f.id}" data-rel="${i}" data-chrono="${f.chrono}" data-prio="${f.prio}" data-min="${f.min || 0}">
      <a class="poster-wrap" href="${prefix}${filmUrl(f.id)}" aria-label="${esc(f.t)}"><div class="chrono-n" hidden>${f.chrono}</div>${posterImgW(f.id, f.t)}<span class="arrow">➤</span></a>
      ${f.prio !== "future" ? `<button class="check" data-watch="${f.id}" aria-label="gesehen">✓</button>` : ""}
      ${EXTRA.films[f.id] && EXTRA.films[f.id].logo ? `<img class="s-logo" src="/img/l/${f.id}.png" alt="${esc(f.t)}" loading="lazy">` : `<div class="s-title">${esc(f.t)}</div>`}<div class="s-year"><span class="prio-dot pd-${f.prio}"></span>${f.y}</div>
    </div>`;
  });
  html += `<div class="finale"><div class="f-tag">18. Dezember 2026</div><div class="f-title metal">Every Story leads to Doom</div></div>`;
  return html;
}
function ewlHtml(lang) {
  const prefix = lang === "en" ? "/en" : "";
  const PR = { pflicht: 0, empfohlen: 1 };
  const base = FILMS.filter((f) => f.prio === "pflicht" || f.prio === "empfohlen");
  const list = base.slice().sort((a, b) => PR[a.prio] - PR[b.prio] || FILMS.indexOf(a) - FILMS.indexOf(b));
  return list.map((f) => `<div class="ewl-row" data-id="${f.id}" data-rel="${FILMS.indexOf(f)}" data-chrono="${f.chrono}" data-prio="${f.prio}" data-min="${f.min}">
    <div class="ewl-num"></div>
    <a class="ewl-poster" href="${prefix}${filmUrl(f.id)}">${posterImgW(f.id, f.t)}</a>
    <a class="ewl-main" href="${prefix}${filmUrl(f.id)}" style="text-decoration:none;color:inherit"><div class="ewl-t">${esc(f.t)}</div><div class="ewl-sub">${f.y} · ${f.type} · ${PRIO_LABEL[f.prio]}</div></a>
    <div class="ewl-side"><span class="ewl-time">≈ ${fmtMin(f.min)}</span><button class="ewl-check" data-watch="${f.id}" aria-label="gesehen">✓</button></div>
  </div>`).join("");
}
function eventBody(lang) {
  let saga = frag("event-saga").replace('<div class="road" id="road"></div>', `<div class="road" id="road">${roadHtml(lang)}</div>`);
  let wl = frag("event-wl").replace('<div class="ewl" id="ewlList"></div>', `<div class="ewl" id="ewlList">${ewlHtml(lang)}</div>`);
  return `<div class="event-theme">${frag("event-hero")}<main>${saga}${wl}${frag("event-doom")}${frag("event-lore")}${frag("event-theo")}${frag("event-glos")}</main></div>`;
}

/* ================= Home ================= */
function homeBody(lang) {
  const L = T[lang];
  const de = lang === "de";
  const prefix = lang === "en" ? "/en" : "";
  const tiles = [
    { href: "/filme/", t: L.nav.films, s: de ? "108 Einträge aus fünf Universen — mit Scores, Trivia & Post-Credits" : "108 entries across five universes — scores, trivia & post-credits", imgs: ["p/eg", "p/xmen1", "p/sv1"] },
    { href: "/charaktere/", t: L.nav.chars, s: de ? "128 Figuren mit Biografien und Beziehungs-Netz" : "128 characters with bios and relationship webs", imgs: ["c/doom", "c/wolverine", "c/wanda"] },
    { href: "/chronik/", t: L.nav.chron, s: de ? "Die Geschichte in richtiger Reihenfolge — von 1943 bis Battleworld" : "The story in order — from 1943 to Battleworld", imgs: ["p/cap1", "p/av1", "p/f4"] },
    { href: "/faeden/", t: L.nav.threads, s: de ? "15 Cliffhanger, die nie aufgelöst wurden" : "15 cliffhangers that were never resolved", imgs: ["p/sc", "p/et", "p/venom3"] },
    { href: "/rekorde/", t: L.nav.records, s: de ? "Top 10, Flop 10 — und jeder Stan-Lee-Cameo" : "Top 10, flop 10 — and every Stan Lee cameo", imgs: ["p/logan", "p/howard", "p/morbius"] },
    { href: "/multiversum/", t: L.nav.multi, s: de ? "Erde-616, 828, 838 … wo welcher Film spielt" : "Earth-616, 828, 838 … which film happens where", imgs: ["p/mom", "p/dw", "p/sv2"] },
  ];
  const strip = (id, label, sub, featured) => `<a class="strip-card${featured ? " now" : ""}" href="${prefix}${filmUrl(id)}">
    <img src="/img/p/${id}.jpg" alt="" loading="lazy">
    <div><div class="sc-k">${esc(label)}</div><div class="sc-t">${esc(byId[id].t)}</div><div class="sc-s">${sub}</div></div></a>`;
  return `<header class="hub-hero">
    <div class="hero-rule">${L.tagline}</div>
    <h1 class="metal">Knowhere</h1>
    <p class="hub-sub">${L.home_sub}</p>
  </header>
  <main class="wrap" style="padding-bottom:50px">

    <a class="home-doom" href="${prefix}/event/">
      <div class="hd-poster"><img src="/img/p/doomsday.jpg" alt="Avengers: Doomsday" fetchpriority="high"></div>
      <div class="hd-body">
        <div class="hd-k">${de ? "Das Event · 18. Dezember 2026" : "The Event · December 18, 2026"}</div>
        <div class="hd-title metal">Avengers:<br>Doomsday</div>
        <div class="hd-cd"><span class="hd-cd-n metal" id="hubCd">···</span><span class="hd-cd-l">${L.days}</span><span class="hd-clock" id="hubClock"></span></div>
        <p class="hd-s">${de ? "Lore, fokussierte Watchlist, Theorien und die komplette Saga-Timeline — alles zum größten Marvel-Film seit Endgame." : "Lore, a focused watchlist, theories and the full saga timeline — everything on the biggest Marvel film since Endgame."}</p>
        <span class="hd-cta">${L.event_cta}</span>
      </div>
    </a>

    <div class="strip">
      ${strip("bnd", de ? "Jetzt im Kino" : "In theaters now", de ? "seit 31. Juli 2026" : "since July 31, 2026", true)}
      ${strip("f4", de ? "Zuletzt im Kino" : "Recently", "Juli 2025")}
      ${strip("ih", de ? "Zuletzt auf Disney+" : "Recently on Disney+", "Juni 2025")}
      ${strip("secretwars", de ? "Danach" : "After that", de ? `Dez 2027 · in <span id="hubCdSW">…</span> Tagen` : `Dec 2027 · <span id="hubCdSW">…</span> days`)}
    </div>

    <div class="tiles">
      ${tiles.map((t) => `<a class="tile" href="${prefix}${t.href}">
        <div class="tile-imgs">${t.imgs.map((i) => `<img src="/img/${i}.jpg" alt="" loading="lazy">`).join("")}</div>
        <div class="tile-body"><div class="tile-t">${esc(t.t)}</div><div class="tile-s">${t.s}</div></div>
        <span class="tile-arr">➤</span>
      </a>`).join("")}
    </div>
    ${adSlot(L)}
    <div class="subhead">${L.news}</div>
    ${frag("hub-news")}
  </main>`;
}

/* ================= Generierung ================= */
const written = [];
function emit(lang, path, html) {
  const prefix = lang === "en" ? "/en" : "";
  const dir = join(OUT, prefix, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  written.push({ lang, path: prefix + path });
}

for (const lang of LANGS) {
  const L = T[lang];
  const site = lang === "de" ? "Knowhere — Das Marvel-Fanarchiv: Filme, Serien, Charaktere & Lore" : "Knowhere — the Marvel fan archive: films, shows, characters & lore";
  emit(lang, "/", page({ lang, path: "/", title: site, desc: L.home_desc, dataPage: "home", ogImage: "/img/p/doomsday.jpg", body: homeBody(lang) }));
  emit(lang, "/filme/", page({ lang, path: "/filme/", title: (lang === "de" ? "Alle Marvel-Filme & -Serien" : "All Marvel films & shows") + " · Knowhere", desc: lang === "de" ? "108 Marvel-Filme und -Serien aus MCU, X-Men, Sony, Klassikern und TV-Ära — mit Scores, Trivia und Post-Credit-Szenen." : "108 Marvel films and shows across the MCU, X-Men, Sony, classics and the TV era.", dataPage: "wiki", body: wikiIndexBody(lang) }));
  emit(lang, "/charaktere/", page({ lang, path: "/charaktere/", title: (lang === "de" ? "Marvel-Charaktere" : "Marvel characters") + " · Knowhere", desc: lang === "de" ? "128 Marvel-Charaktere mit Biografien, Kräften und Beziehungs-Netzen." : "128 Marvel characters with bios, powers and relationship webs.", dataPage: "wiki", body: charIndexBody(lang) }));
  emit(lang, "/teams/", page({ lang, path: "/teams/", title: "Marvel-Teams · Knowhere", desc: lang === "de" ? "Von den Avengers bis Haus Doom: 21 Marvel-Teams und Schurken-Fraktionen." : "From the Avengers to House Doom: 21 Marvel teams and villain factions.", dataPage: "teams", body: teamsIndexBody(lang) }));
  emit(lang, "/multiversum/", page({ lang, path: "/multiversum/", title: (lang === "de" ? "Das Marvel-Multiversum: alle Erde-Nummern" : "The Marvel multiverse: every Earth number") + " · Knowhere", desc: lang === "de" ? "Erde-616, 828, 838, 10005 & Co.: Welche Marvel-Filme in welchem Universum spielen." : "Earth-616, 828, 838, 10005 & co: which Marvel films happen in which universe.", dataPage: "multi", body: multiBody(lang) }));
  emit(lang, "/artefakte/", page({ lang, path: "/artefakte/", title: (lang === "de" ? "Marvel-Artefakte" : "Marvel artifacts") + " · Knowhere", desc: lang === "de" ? "Infinity-Steine, Mjölnir, Darkhold & Co. — 26 legendäre Marvel-Objekte." : "Infinity Stones, Mjölnir, the Darkhold & more — 26 legendary Marvel objects.", dataPage: "arts", body: artsIndexBody(lang) }));
  emit(lang, "/pfade/", page({ lang, path: "/pfade/", title: (lang === "de" ? "Storyline-Pfade & Post-Credit-Kette" : "Storylines & the post-credit chain") + " · Knowhere", desc: lang === "de" ? "16 kuratierte Handlungsstränge durchs Marvel-Universum plus die komplette Post-Credit-Verkettung." : "16 curated story threads plus the complete post-credit chain.", dataPage: "paths", body: pathsIndexBody(lang) }));
  emit(lang, "/rekorde/", page({ lang, path: "/rekorde/", title: (lang === "de" ? "Marvel-Rekorde: Top & Flop" : "Marvel records: top & flop") + " · Knowhere", desc: lang === "de" ? "Die besten und schlechtesten Marvel-Filme, Kino-Rekorde und alle Stan-Lee-Cameos." : "The best and worst Marvel films, box-office records and every Stan Lee cameo.", dataPage: "records", body: recordsBody(lang) }));
  emit(lang, "/chronik/", page({ lang, path: "/chronik/", title: (lang === "de" ? "Die MCU-Chronik: die Geschichte in richtiger Reihenfolge" : "The MCU timeline: the story in order") + " · Knowhere", desc: lang === "de" ? "Die Weltgeschichte des MCU von der Urzeit bis Battleworld — nach Ereignissen statt Kinostarts." : "The in-universe history of the MCU from prehistory to Battleworld.", dataPage: "chron", body: chronBody(lang) }));
  emit(lang, "/faeden/", page({ lang, path: "/faeden/", title: (lang === "de" ? "Die offenen Fäden des Marvel-Universums" : "Marvel's loose ends") + " · Knowhere", desc: lang === "de" ? "15 Cliffhanger, die Marvel nie aufgelöst hat — vom Zehn-Ringe-Signal bis Knull." : "15 cliffhangers Marvel never resolved — from the Ten Rings signal to Knull.", dataPage: "threads", body: threadsBody(lang) }));
  emit(lang, "/event/", page({ lang, path: "/event/", title: "Avengers: Doomsday — Event-Hub · Knowhere", desc: lang === "de" ? "Countdown, Saga-Timeline, Watchlist, Lore und Theorien zu Avengers: Doomsday (18. Dezember 2026)." : "Countdown, saga timeline, watchlist, lore and theories for Avengers: Doomsday (December 18, 2026).", dataPage: "event", ogImage: "/img/p/doomsday.jpg", body: eventBody(lang) }));

  for (const f of FILMS) {
    const sc = SCORES[f.id];
    const jsonld = {
      "@context": "https://schema.org",
      "@type": f.type === "Film" ? "Movie" : "TVSeries",
      name: f.t, description: stripTags(f.plot).slice(0, 300),
      datePublished: String(parseInt(f.y) || ""),
      director: { "@type": "Person", name: f.dir.split("·")[0].replace(/Regie:|Showrunner(in)?:|Creator:/g, "").trim() },
      actor: f.cast.slice(0, 4).map((n) => ({ "@type": "Person", name: n.replace(/\(.*?\)/g, "").trim() })),
      image: SITE_URL + `/img/p/${f.id}.jpg`,
    };
    emit(lang, filmUrl(f.id), page({
      lang, path: filmUrl(f.id),
      title: `${f.t} (${parseInt(f.y) || f.y}) — ${f.type}, Cast, Trivia & Post-Credits · Knowhere`,
      desc: stripTags(f.plot).slice(0, 158),
      ogImage: `/img/p/${f.id}.jpg`, dataPage: "film", jsonld,
      body: filmBody(f, lang),
    }));
  }
  for (const c of CHARS) emit(lang, charUrl(c.id), page({ lang, path: charUrl(c.id), title: `${c.n} (${c.a}) — Marvel-Charakter · Knowhere`, desc: stripTags(c.bio).slice(0, 158), ogImage: existsSync(`public/img/c/${c.id}.jpg`) ? `/img/c/${c.id}.jpg` : undefined, dataPage: "char", body: charBody(c, lang) }));
  for (const t of TEAMS) emit(lang, teamUrl(t.id), page({ lang, path: teamUrl(t.id), title: `${t.n} — Marvel-Team · Knowhere`, desc: stripTags(t.desc).slice(0, 158), dataPage: "team", body: teamBody(t, lang) }));
  for (const a of ARTIFACTS) emit(lang, artUrl(a.id), page({ lang, path: artUrl(a.id), title: `${a.n} — Marvel-Artefakt · Knowhere`, desc: stripTags(a.d).slice(0, 158), dataPage: "art", body: artBody(a, lang) }));
  for (const p of PATHS) emit(lang, pathUrl(p.id), page({ lang, path: pathUrl(p.id), title: `${p.n} — Storyline-Pfad · Knowhere`, desc: stripTags(p.intro).slice(0, 158), dataPage: "path", body: pathBody(p, lang) }));
}

/* Schauspieler-Seiten */
for (const lang of LANGS) {
  for (const [pid, p] of Object.entries(PERSONS)) {
    const prefix = lang === "en" ? "/en" : "";
    const filmo = FILMS.filter((f) => (CREDITS[f.id] || []).some((c) => String(c.p) === String(pid)))
      .map((f) => ({ f, role: (CREDITS[f.id] || []).find((c) => String(c.p) === String(pid)).r }));
    const wikiChars = CHARS.filter((c) => c.act.toLowerCase().includes(p.n.toLowerCase()));
    const body = `<main class="wrap fp" style="padding-bottom:70px">
  <a class="backlink" href="${prefix}/filme/">${T[lang].back}</a>
  <div class="fp-top">
    <div class="fp-poster">${existsSync(`public/img/a/${pid}.jpg`) ? `<img src="/img/a/${pid}.jpg" alt="${esc(p.n)}">` : `<div class="poster-fallback"><div class="pf-t metal">${esc(p.n)}</div></div>`}</div>
    <div class="fp-head">
      <h1 class="metal fp-h1">${esc(p.n)}</h1>
      <div class="fp-meta">${p.b ? `${lang === "de" ? "Geboren" : "Born"}: <b>${fmtDate(p.b)}</b>` : ""}${p.pb ? `<br>${esc(p.pb)}` : ""}</div>
      ${p.imdb ? `<div class="ext-links"><a href="https://www.imdb.com/name/${p.imdb}/" target="_blank" rel="noopener">IMDb</a><a href="https://www.themoviedb.org/person/${pid}" target="_blank" rel="noopener">TMDB</a></div>` : ""}
    </div>
  </div>
  ${p.bio ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Biografie" : "Biography"}</div><p>${esc(p.bio)}${p.bio.length >= 700 ? " …" : ""}</p></div>` : ""}
  ${wikiChars.length ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Figuren im Wiki" : "Characters in the wiki"}</div><div class="fp-chars">${wikiChars.map((c) => `<a class="fp-char" href="${prefix}${charUrl(c.id)}">${charImg(c.id, c.n, "fc-img")}<div class="fc-n">${esc(c.n)}</div></a>`).join("")}</div></div>` : ""}
  ${filmo.length ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Im Marvel-Kosmos" : "In the Marvel universe"} · ${filmo.length}</div><div class="cp-films">${filmo.map(({ f, role }) => `<a class="radar-film" href="${prefix}${filmUrl(f.id)}" title="${esc(f.t)}">${posterImgW(f.id, f.t)}<div class="rf-t">${esc(f.t)}</div><div class="rf-d">${esc(role)}</div></a>`).join("")}</div></div>` : ""}
</main>`;
    emit(lang, personUrl(pid), page({
      lang, path: personUrl(pid),
      title: `${p.n} — Marvel-Filmografie · Knowhere`,
      desc: (p.bio || `${p.n}: alle Marvel-Auftritte im Überblick.`).slice(0, 158),
      ogImage: existsSync(`public/img/a/${pid}.jpg`) ? `/img/a/${pid}.jpg` : undefined,
      dataPage: "person", body,
    }));
  }
}

/* 404 */
writeFileSync(join(OUT, "404.html"), page({ lang: "de", path: "/404", title: "404 · Knowhere", desc: "Seite nicht gefunden.", dataPage: "404", noindex: true, body: `<main class="wrap" style="padding:120px 22px;text-align:center"><h1 class="metal" style="font-size:80px">404</h1><p class="hub-sub">Diese Seite wurde gesnapt. <a href="/">Zurück zum Hub</a> — oder frag die TVA.</p></main>` }));

/* Suche-Index */
const search = [
  ...FILMS.map((f) => ({ t: f.t, s: `${f.y} · ${f.type} · ${UNI_LABEL[f.uni]}`, u: filmUrl(f.id), i: existsSync(`public/img/p/${f.id}.jpg`) ? `/img/p/${f.id}.jpg` : null, k: "f", q: f.t.toLowerCase() })),
  ...CHARS.map((c) => ({ t: c.n, s: `${c.a} · ${c.act}`, u: charUrl(c.id), i: existsSync(`public/img/c/${c.id}.jpg`) ? `/img/c/${c.id}.jpg` : null, k: "c", q: (c.n + " " + c.a + " " + c.act).toLowerCase() })),
  ...TEAMS.map((t) => ({ t: t.n, s: t.sub, u: teamUrl(t.id), i: null, k: "t", q: (t.n + " " + t.sub).toLowerCase() })),
  ...ARTIFACTS.map((a) => ({ t: a.n, s: a.sub, u: artUrl(a.id), i: null, k: "a", q: (a.n + " " + a.sub).toLowerCase() })),
  ...Object.entries(PERSONS).map(([pid, p]) => ({ t: p.n, s: "Schauspieler:in", u: personUrl(pid), i: existsSync(`public/img/a/${pid}.jpg`) ? `/img/a/${pid}.jpg` : null, k: "c", q: p.n.toLowerCase() })),
];
mkdirSync(join(OUT, "assets"), { recursive: true });
writeFileSync(join(OUT, "assets", "search.json"), JSON.stringify(search));

/* Assets, Sitemap, Robots, Favicon, vercel */
cpSync("site/static/style.css", join(OUT, "assets", "style.css"));
cpSync("site/static/app.js", join(OUT, "assets", "app.js"));
writeFileSync(join(OUT, "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="#0a0f0c"/><text x="50" y="66" font-size="52" text-anchor="middle" font-family="Arial Narrow, sans-serif" font-weight="bold" fill="#3fdc8c">M·H</text></svg>`);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
writeFileSync(join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  written.map((w) => `<url><loc>${SITE_URL}${w.path}</loc></url>`).join("\n") + `\n</urlset>`);

console.log(`Seiten: ${written.length} | Such-Index: ${search.length} Einträge | Output: ${OUT}/`);
