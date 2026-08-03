// Marvel Hub — Static Site Generator
// Erzeugt aus site/data/*.json + site/fragments/ die komplette Seite unter public/
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
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
const assetV = (p) => createHash("md5").update(readFileSync(p)).digest("hex").slice(0, 8);
const V_CSS = assetV("site/static/style.css");
const V_JS = assetV("site/static/app.js");
const byId = {}; FILMS.forEach((f) => (byId[f.id] = f));
const charById = {}; CHARS.forEach((c) => (charById[c.id] = c));
const teamById = {}; TEAMS.forEach((t) => (teamById[t.id] = t));

const UNI_LABEL = { mcu: "MCU", fox: "X-Men / Fox", sony: "Sony / Spider-Verse", alt: "Frühe Marvel-Ära", net: "TV-Ära" };
const PRIO_LABEL = { pflicht: "Pflicht", empfohlen: "Empfohlen", optional: "Optional", komplettist: "Komplettist", future: "Kommend" };
const UNI_LABEL_EN = { mcu: "MCU", fox: "X-Men / Fox", sony: "Sony / Spider-Verse", alt: "Early Marvel era", net: "TV era" };
const PRIO_LABEL_EN = { pflicht: "Essential", empfohlen: "Recommended", optional: "Optional", komplettist: "Completionist", future: "Upcoming" };
const uniL = (u, lang) => (lang === "en" ? UNI_LABEL_EN[u] : UNI_LABEL[u]);
const prioL = (pr, lang) => (lang === "en" ? PRIO_LABEL_EN[pr] : PRIO_LABEL[pr]);
const typeL = (t, lang) => (lang === "en" && t === "Serie" ? "Series" : t);
const REL_NAME = { verbuendet: "Verbündete", feind: "Feinde", familie: "Familie", liebe: "Liebe", komplex: "Es ist kompliziert" };
const REL_NAME_EN = { verbuendet: "Allies", feind: "Enemies", familie: "Family", liebe: "Love", komplex: "It's complicated" };
const relN = (t, lang) => (lang === "en" ? REL_NAME_EN[t] : REL_NAME[t]);

/* ================= i18n ================= */
const T = {
  de: {
    langName: "Deutsch", other: "English", tagline: "Das Marvel-Fanarchiv aller Universen",
    nav: { home: "Start", films: "Filme & Serien", chars: "Charaktere", teams: "Teams & Organisationen", multi: "Multiversum", arts: "Artefakte", paths: "Pfade", records: "Rekorde", chron: "Chronik", threads: "Offene Fäden", lex: "Lexikon", faq: "FAQ", db: "Datenbank", know: "Wissen", games: "Spiele", tier: "Tier-List", quotes: "Zitate", roadmap: "Roadmap", grave: "Der Friedhof", actors: "Schauspieler", places: "Orte & Welten", peoples: "Völker & Spezies", event: "★ Doomsday" },
    spoiler_off: "Spoiler: aus", search_ph: "Suche …",
    home_sub: "Von Iron Man bis Doomsday: Filme, Serien, Charaktere und die ganze Lore — quer durch alle Marvel-Universen.",
    home_desc: "Marvel Hub: das Fan-Wiki über alle Marvel-Film-Universen — MCU, X-Men, Sony, Klassiker und TV-Ära. Mit Doomsday-Countdown, Watchlist, Charakteren, Teams und Lore.",
    days: "Tage", radar_last: "Zuletzt erschienen", radar_now: "● Jetzt im Kino", radar_next: "Als Nächstes",
    event_k: "· Das Event ·", event_cta: "Zum Event-Hub ➤", news: "Neuigkeiten", dive: "Direkt eintauchen",
    watch: "Als gesehen markieren", watched: "✓ Gesehen", trailer: "Trailer ansehen", trailer_s: "öffnet YouTube in neuem Tab",
    plot: "Worum es geht", note_lbl: "Knowhere-Einordnung", cast: "Besetzung", cast_more: "Weitere Besetzung", figures: "Wichtige Figuren", trivia: "Trivia & Hintergrund",
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
    nav: { home: "Home", films: "Films & Shows", chars: "Characters", teams: "Teams & orgs", multi: "Multiverse", arts: "Artifacts", paths: "Storylines", records: "Records", chron: "Timeline", threads: "Loose Ends", lex: "Lexicon", faq: "FAQ", db: "Database", know: "Knowledge", games: "Games", tier: "Tier list", quotes: "Quotes", roadmap: "Roadmap", grave: "The Graveyard", actors: "Actors", places: "Places & worlds", peoples: "Peoples & species", event: "★ Doomsday" },
    spoiler_off: "Spoilers: off", search_ph: "Search …",
    home_sub: "From Iron Man to Doomsday: films, shows, characters and all the lore — across every Marvel universe. (Article texts are German-first for now.)",
    home_desc: "Marvel Hub: the fan wiki covering every Marvel movie universe — MCU, X-Men, Sony, classics and the TV era. With Doomsday countdown, watchlist, characters, teams and lore.",
    days: "Days", radar_last: "Recently released", radar_now: "● In theaters now", radar_next: "Up next",
    event_k: "· The Event ·", event_cta: "Enter the Event Hub ➤", news: "News", dive: "Dive in",
    watch: "Mark as watched", watched: "✓ Watched", trailer: "Watch the trailer", trailer_s: "opens YouTube in a new tab",
    plot: "The story", note_lbl: "Knowhere notes", cast: "Cast", cast_more: "More cast", figures: "Key characters", trivia: "Trivia & background",
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
const LEXIKON = existsSync("site/data/lexikon.json") ? JSON.parse(readFileSync("site/data/lexikon.json", "utf8")) : [];
const HOME = existsSync("site/data/home.json") ? JSON.parse(readFileSync("site/data/home.json", "utf8")) : { trending: [], upcoming: [] };
const COMICS = existsSync("site/data/comics.json") ? JSON.parse(readFileSync("site/data/comics.json", "utf8")) : {};
const SONGS = existsSync("site/data/songs.json") ? JSON.parse(readFileSync("site/data/songs.json", "utf8")) : {};
const COMPOSERS = existsSync("site/data/composers.json") ? JSON.parse(readFileSync("site/data/composers.json", "utf8")) : {};
const GAMES = existsSync("site/data/games.json") ? JSON.parse(readFileSync("site/data/games.json", "utf8")) : [];
const GRAVEYARD = existsSync("site/data/graveyard.json") ? JSON.parse(readFileSync("site/data/graveyard.json", "utf8")) : [];
const ROADMAP = existsSync("site/data/roadmap.json") ? JSON.parse(readFileSync("site/data/roadmap.json", "utf8")) : [];
const QUOTES = existsSync("site/data/quotes.json") ? JSON.parse(readFileSync("site/data/quotes.json", "utf8")) : [];
const MULTIROLE = existsSync("site/data/multirole.json") ? JSON.parse(readFileSync("site/data/multirole.json", "utf8")) : [];
const EGGS = existsSync("site/data/eggs.json") ? JSON.parse(readFileSync("site/data/eggs.json", "utf8")) : {};
const LOCATIONS = existsSync("site/data/locations.json") ? JSON.parse(readFileSync("site/data/locations.json", "utf8")) : {};
const pairL = (arr, lang) => arr.map((p2) => (lang === "en" && p2[1] ? p2[1] : p2[0]));

/* Englische Übersetzungen (site/i18n/*.json) in die Datenobjekte mischen — tr() greift auf die _en-Felder zu */
const I18N = (n) => (existsSync(`site/i18n/${n}.json`) ? JSON.parse(readFileSync(`site/i18n/${n}.json`, "utf8")) : {});
{
  const chEn = { ...I18N("chars_en_1"), ...I18N("chars_en_2") };
  for (const c of CHARS) { const e = chEn[c.id]; if (e) for (const k of ["bio", "pow", "uni", "first"]) if (e[k]) c[k + "_en"] = e[k]; }
  const relEn = I18N("chars_rel_en");
  for (const c of CHARS) { const e = relEn[c.id]; if (e) { if (e.a) c.a_en = e.a; (c.rel || []).forEach((r, i) => { if (e.rel && e.rel[i]) r[3] = e.rel[i]; }); } }
  const misc = I18N("misc_en");
  for (const t of TEAMS) { const e = (misc.teams || {})[t.id]; if (e) for (const k of ["n", "sub", "status", "desc", "mlabel"]) if (e[k]) t[k + "_en"] = e[k]; }
  const uniKeys = ["616", "828", "838", "10005", "96283", "120703", "ssu", "1610", "65", "whatif", "tva", "battleworld", "vormcu"];
  UNIVERSES.forEach((u, i) => { const e = (misc.universes || {})[uniKeys[i]]; if (e) for (const k of ["n", "status", "d"]) if (e[k]) u[k + "_en"] = e[k]; });
  (misc.threads || []).forEach((e, i) => { if (THREADS[i]) for (const k of ["n", "status", "d"]) if (e[k]) THREADS[i][k + "_en"] = e[k]; });
  (misc.chronik || []).forEach((e, i) => { if (CHRONIK[i]) for (const k of ["n", "d"]) if (e[k]) CHRONIK[i][k + "_en"] = e[k]; });
  const lex = I18N("lexikon_en");
  for (const e of LEXIKON) { const x = lex[e.id]; if (x) for (const k of ["n", "sub", "d"]) if (x[k]) e[k + "_en"] = x[k]; }
  const pg = I18N("paths_games_en");
  for (const pth of PATHS) { const e = (pg.paths || {})[pth.id]; if (e) { for (const k of ["n", "tag", "intro"]) if (e[k]) pth[k + "_en"] = e[k]; (e.notes || []).forEach((nt, i) => { if (pth.steps[i]) pth.steps[i].note_en = nt; }); } }
  for (const gm of GAMES) { if ((pg.games || {})[gm.id]) gm.d_en = pg.games[gm.id]; if ((pg.games_y || {})[gm.id]) gm.y_en = pg.games_y[gm.id]; if ((pg.games_plat || {})[gm.id]) gm.plat_en = pg.games_plat[gm.id]; }
  const nc = I18N("notes_comics_en");
  for (const f of FILMS) if ((nc.notes || {})[f.id]) f.note_en = nc.notes[f.id];
  for (const [id, arr] of Object.entries(nc.comics || {})) (COMICS[id] || []).forEach((c, i) => { if (arr[i]) c.n_en = arr[i]; });
  const fx = I18N("films_extras_en");
  (fx.variants || []).forEach((e, i) => { if (VARIANTS[i]) { VARIANTS[i].n_en = e.n; VARIANTS[i].note_en = e.note; } });
  var TRIVIA_EN = fx.trivia || {}, PC_EN = fx.pc || {}, PCNOTE_EN = fx.pcNotes || {}, CAMEO_EN = fx.cameo || {}, SONGS_EN = fx.songs || {};
}
const trivL = (id, lang) => (lang === "en" && TRIVIA_EN[id] ? TRIVIA_EN[id] : TRIVIA[id]);
const songsL = (id, lang) => (lang === "en" && SONGS_EN[id] ? SONGS_EN[id] : SONGS[id]);
const cameoL = (id, lang) => (lang === "en" && CAMEO_EN[id] ? CAMEO_EN[id] : CAMEO[id]);
const pcSceneD = (id, i, s, lang) => (lang === "en" && PC_EN[id] && PC_EN[id][i] ? PC_EN[id][i] : s.d);
const pcNoteL = (id, pc, lang) => (lang === "en" && PCNOTE_EN[id] ? PCNOTE_EN[id] : pc.note);
const fragL = (n, lang) => (lang === "en" && existsSync(`site/fragments/${n}-en.html`) ? readFileSync(`site/fragments/${n}-en.html`, "utf8") : frag(n));
const LEX_BY_CAT = (c) => LEXIKON.filter((e) => e.cat === c);
const LSLUG = {};
{ const used = new Set();
  for (const e of LEXIKON) {
    let s = slugify(e.n) || e.id;
    if (used.has(s)) s = e.id;
    used.add(s); LSLUG[e.id] = s;
  } }
const CAT_URL = { ort: "/ort/", volk: "/volk/", org: "/org/" };
const lexUrl = (e) => CAT_URL[e.cat] ? `${CAT_URL[e.cat]}${LSLUG[e.id]}/` : `/lexikon/#${e.id}`;
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
function page({ lang, path, title, desc, ogImage, body, dataPage, jsonld, noindex, crumbs }) {
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
  const dbItems = [["films", "/filme/"], ["chars", "/charaktere/"], ["actors", "/schauspieler/"], ["teams", "/teams/"], ["arts", "/artefakte/"], ["places", "/orte/"], ["peoples", "/voelker/"]];
  const knowItems = [["chron", "/chronik/"], ["paths", "/pfade/"], ["threads", "/faeden/"], ["lex", "/lexikon/"], ["games", "/spiele/"], ["tier", "/tierlist/"], ["quotes", "/zitate/"], ["roadmap", "/roadmap/"], ["grave", "/friedhof/"], ["records", "/rekorde/"], ["faq", "/faq/"]];
  const drop = (label, items) => {
    const act = items.some(([, p]) => isActive(p));
    return `<div class="nav-drop${act ? " child-active" : ""}"><button class="nav-drop-btn${act ? " active" : ""}" aria-haspopup="true" aria-expanded="false">${label} <span class="nd-arr">▾</span></button><div class="nav-drop-menu">${items.map(([k, p]) => navLink(k, p)).join("")}</div></div>`;
  };
  const evItems = lang === "de"
    ? [["Countdown & Trailer", "/event/#event-top"], ["Saga-Timeline & Watchlist", "/event/#saga"], ["Das Fox-Erbe", "/event/#foxlegacy"], ["Dossier & News", "/event/#doomsday"], ["Die Lore", "/event/#lore"], ["Der Theorien-Tisch", "/event/#theorien"], ["Das Nerd-Glossar", "/event/#glossar"], ["★ Die Event-Tier-List", "/tierlist/event/"]]
    : [["Countdown & trailer", "/event/#event-top"], ["Saga timeline & watchlist", "/event/#saga"], ["The Fox legacy", "/event/#foxlegacy"], ["Dossier & news", "/event/#doomsday"], ["The lore", "/event/#lore"], ["The theory table", "/event/#theorien"], ["The nerd glossary", "/event/#glossar"], ["★ The event tier list", "/tierlist/event/"]];
  const evDrop = `<div class="nav-drop ev-drop${isActive("/event/") ? " child-active" : ""}"><a class="nav-drop-btn ev-link${isActive("/event/") ? " active" : ""}" href="${prefix}/event/" aria-haspopup="true" aria-expanded="false">${L.nav.event} <span class="nd-arr">▾</span></a><div class="nav-drop-menu">${evItems.map(([t, p2]) => `<a href="${prefix}${p2}">${t}</a>`).join("")}</div></div>`;
  const nav =
    navLink("home", "/") +
    drop(L.nav.db, dbItems) +
    drop(L.nav.know, knowItems) +
    evDrop;
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
<meta name="theme-color" content="#07100a">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/style.css?v=${V_CSS}">
${(() => {
  const ld = [];
  if (jsonld) ld.push(jsonld);
  if (crumbs && crumbs.length) ld.push({ "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [[L.nav.home, "/"], ...crumbs].map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: stripTags(n), ...(u ? { item: SITE_URL + prefix + u } : {}) })) });
  return ld.length ? `<script type="application/ld+json">${JSON.stringify(ld.length === 1 ? ld[0] : ld)}</script>` : "";
})()}
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
  <button class="nav-burger" id="navBurger" aria-expanded="false" aria-label="Menü">☰</button>
</div></nav>
${dataPage !== "event" && dataPage !== "home" ? `<a class="promo" href="${prefix}/event/">★ <b>Avengers: Doomsday</b><span class="promo-x">${lang === "de" ? "Erfahre alles zum kommenden Film" : "Everything about the upcoming film"}</span><span class="promo-cd"><span id="promoCd">…</span> ${lang === "de" ? "Tage" : "days"}</span><span class="promo-arr">➤</span></a>` : ""}
${crumbs && crumbs.length ? `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="${prefix}/">${L.nav.home}</a>${crumbs.map(([n, u]) => u ? ` › <a href="${prefix}${u}">${n}</a>` : ` › <span>${n}</span>`).join("")}</nav></div>` : ""}
${body}
<footer>
  <p><strong style="color:var(--muted)">Knowhere</strong> · ${L.footer1}</p>
  <p>${L.footer2}</p>
  <p><a href="/impressum/">Impressum</a> · <a href="/datenschutz/">Datenschutz</a></p>
  <p class="f-sig">▚ Every Story leads to Doom ▞</p>
</footer>
<script src="/assets/app.js?v=${V_JS}" defer></script>
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
  const stream = STREAM[id] || (f.uni === "sony" ? (lang === "de" ? "Netflix / wechselnd (DE)" : "Netflix / varies") : f.uni === "alt" ? (lang === "de" ? "Wechselnd (Leihe/Disney+)" : "Varies (rent/Disney+)") : "Disney+");
  const trailerQ = encodeURIComponent(`${f.t} ${parseInt(f.y)} trailer${lang === "de" ? " deutsch" : ""}`);
  return `<main class="wrap fp" style="padding-bottom:70px">
  ${d.bd ? `<div class="fp-backdrop"><img src="/img/b/${id}.jpg" alt="" aria-hidden="true" fetchpriority="high"></div>` : ""}
  <a class="backlink" href="${prefix}/filme/">${L.back}</a>
  <div class="fp-top">
    <div class="fp-poster">${posterImgW(id, f.t)}</div>
    <div class="fp-head">
      ${x.logo ? `<h1 class="visually-hidden">${esc(f.t)}</h1><img class="fp-logo" src="/img/l/${id}.png" alt="${esc(f.t)}">` : `<h1 class="metal fp-h1">${esc(f.t)}</h1>`}
      <span class="uni-badge ub-${f.uni}">${uniL(f.uni, lang)}</span>
      <div class="fp-meta"><b>${typeL(f.type, lang)} · ${f.y}</b>${d.rt ? " · " + fmtMin(d.rt) : (d.seasons ? ` · ${d.seasons} ${d.seasons > 1 ? (lang === "de" ? "Staffeln" : "seasons") : (lang === "de" ? "Staffel" : "season")} · ${d.episodes} Ep.` : (f.min ? " · ≈ " + fmtMin(f.min) : ""))}${f.uni === "mcu" && f.ph ? ` · ${L.phase} ${f.ph}` : ""}<br>${esc(lang === "en" ? f.dir.replace("Regie:", "Director:").replace("Drehbuch:", "Writer:") : f.dir)}${d.genres && d.genres.length ? `<br><span style="color:var(--faint)">${d.genres.map(esc).join(" · ")}${x.countries ? " · " + x.countries.join("/") : ""}</span>` : ""}${x.orig ? `<br><span style="color:var(--faint)">${lang === "de" ? "Originaltitel" : "Original title"}: ${esc(x.orig)}</span>` : ""}</div>
      <div class="stream-line">📺 ${L.where}: ${d.prov && (d.prov.s.length || d.prov.r.length)
        ? d.prov.s.map((n) => `${EXTRA.providers[n] ? `<img class="prov-logo" src="/img/pr/${EXTRA.providers[n]}.png" alt="">` : ""}<b>${esc(n)}</b>`).join(" · ") + (d.prov.r.length ? ` · ${lang === "de" ? "Leihe" : "Rent"}: ${esc(d.prov.r.slice(0, 2).join(", "))}` : "")
        : `<b>${esc(stream)}</b> · ${L.asof}`}</div>
      ${(sc || d.vote) ? `<div class="scores">` +
        (sc ? `<div class="score ${scoreCls(sc[0], 60, 40)}"><div class="sv">${sc[0]} %</div><div class="sk">Rotten Tomatoes</div></div><div class="score ${scoreCls(sc[1], 7, 5.5)}"><div class="sv">${sc[1].toFixed(1)}</div><div class="sk">IMDb / 10</div></div>` : "") +
        (d.vote ? `<div class="score ${scoreCls(d.vote[0], 7, 5.5)}"><div class="sv">${d.vote[0].toFixed(1)}</div><div class="sk">TMDB · ${d.vote[1].toLocaleString(lang === "de" ? "de-DE" : "en-US")} ${lang === "de" ? "Stimmen" : "votes"}</div></div>` : "") + `</div>` : ""}
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
    (d.cert ? `<div class="fact-box"><div class="fb-k">FSK</div><div class="fb-v">${lang === "de" ? "ab " + esc(d.cert) : esc(d.cert) + "+"}</div></div>` : "") +
    (d.budget ? `<div class="fact-box"><div class="fb-k">Budget</div><div class="fb-v">${fmtMoney(d.budget)}</div></div>` : "") +
    (d.revenue ? `<div class="fact-box"><div class="fb-k">${lang === "de" ? "Einspielergebnis" : "Box office"}</div><div class="fb-v">${fmtMoney(d.revenue)}</div></div>` : "") + `</div>` : ""}
  <div class="fp-section"><div class="fp-label">${L.plot}</div><p>${esc((lang === "en" ? f.plot_en : f.plot_db) || tr(f, "plot", lang))}</p></div>
  ${inFilm.length ? `<div class="fp-section"><div class="fp-label">${L.figures}</div><div class="fp-chars">` +
    inFilm.map((c) => `<a class="fp-char" href="${prefix}${charUrl(c.id)}">${charImg(c.id, c.n, "fc-img")}<div class="fc-n">${esc(c.n)}</div><div class="fc-a">${esc(c.act.split("·")[0].split("(")[0].trim())}</div></a>`).join("") + `</div>` +
    (restCast.length ? `<details class="more-cast"><summary>${L.cast_more} · ${restCast.length}</summary><div class="fp-chars">${restHtml}</div></details>` : "") + `</div>`
  : restCast.length
    ? `<div class="fp-section"><div class="fp-label">${L.cast}</div><div class="fp-chars">${restHtml}</div></div>`
    : `<div class="fp-section"><div class="fp-label">${L.cast}</div><p>${f.cast.map(esc).join(" · ")}</p></div>`}
  ${TRIVIA[id] ? `<div class="fp-section"><div class="fp-label">${L.trivia}</div><ul>${trivL(id, lang).map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
  ${EGGS[id] ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "🥚 Easter Eggs & Referenzen" : "🥚 Easter eggs & references"}</div><ul>${pairL(EGGS[id], lang).map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
  ${LOCATIONS[id] ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "📍 Drehorte" : "📍 Filming locations"}</div><ul>${pairL(LOCATIONS[id], lang).map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
  ${(x.gal || (x.videos && x.videos.length)) ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Galerie & Videos" : "Gallery & videos"}</div><div class="gal">` +
    (x.gal ? Array.from({ length: x.gal }, (_, i) => `<button class="glight gal-item" data-img="/img/g/${id}-${i}.jpg" aria-label="Bild ${i + 1}"><img src="/img/g/${id}-${i}.jpg" alt="" loading="lazy"></button>`).join("") : "") +
    (x.videos || []).filter((v) => v.k !== TRAILERS[id]).slice(0, 4).map((v) => `<button class="glight gal-item gal-video" data-yt="${v.k}" aria-label="${esc(v.n)}"><img src="https://i.ytimg.com/vi/${v.k}/hqdefault.jpg" alt="" loading="lazy"><span class="gv-play">▶</span><span class="gv-t">${esc(v.t)}</span></button>`).join("") +
  `</div></div>` : ""}
  ${x.eps && x.eps.length ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Episoden" : "Episodes"}</div>` +
    x.eps.map((sea) => { const seaEn = lang === "en" && x.eps_en ? (x.eps_en.find((s2) => s2.s === sea.s) || {}).eps : null; return `<details class="season"${x.eps.length === 1 ? " open" : ""}><summary>${lang === "de" ? "Staffel" : "Season"} ${sea.s} · ${sea.eps.length} ${lang === "de" ? "Folgen" : "episodes"}</summary>` +
      sea.eps.map((ep, i) => { const en = seaEn && seaEn[i]; const epN = en && en.n ? en.n : ep.n; const epO = en && en.o ? en.o : ep.o; return `<div class="ep-row"><div class="ep-n">${i + 1}</div><div class="ep-main"><div class="ep-t">${esc(epN)}${ep.v ? ` <span class="ep-v">★ ${ep.v.toFixed(1)}</span>` : ""}</div>${epO ? `<div class="ep-o"><span class="spoiler">${esc(epO)}</span></div>` : ""}</div><div class="ep-d">${ep.d ? fmtDate(ep.d) : ""}</div></div>`; }).join("") +
    `</details>`; }).join("") + `</div>` : ""}
  ${(COMPOSERS[id] || SONGS[id]) ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "🎵 Musik" : "🎵 Music"}</div>` +
    (COMPOSERS[id] ? `<p><b>${lang === "de" ? "Filmmusik" : "Score"}:</b> ${COMPOSERS[id].map(esc).join(" & ")}</p>` : "") +
    (SONGS[id] ? `<ul style="margin-top:${COMPOSERS[id] ? "10px" : "0"}">${songsL(id, lang).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : "") + `</div>` : ""}
  ${COMICS[id] ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "📖 Comic-Vorlagen" : "📖 Comic sources"}</div>` +
    COMICS[id].map((c) => `<div class="comic-row"><b>${esc(c.t)}</b> <span class="comic-y">(${c.y})</span><p>${esc(tr(c, "n", lang))}</p></div>`).join("") + `</div>` : ""}
  ${(pc || f.prio !== "future") ? `<div class="fp-section"><div class="fp-label">${L.pc}${pc && pc.scenes.length ? " · " + pc.scenes.length : ""}</div>` +
    (!pc ? `<p style="color:var(--faint)">${L.pc_none}</p>` :
      (pc.note ? `<p class="pc-note">${esc(pcNoteL(id, pc, lang))}</p>` : "") +
      pc.scenes.map((s, i) => `<div class="pc-scene"><div class="pc-num">${i + 1}</div><div><p><span class="spoiler">${esc(pcSceneD(id, i, s, lang))}</span></p>` +
        (s.to && byId[s.to] ? `<a class="pc-to" href="${prefix}${filmUrl(s.to)}">→ ${L.pc_to} ${esc(byId[s.to].t)}</a>` : "") + `</div></div>`).join("")) + `</div>` : ""}
  ${CAMEO[id] ? `<div class="fp-section"><div class="fp-label">${L.cameo}</div><p>${esc(cameoL(id, lang))}</p></div>` : ""}
  ${f.uni === "mcu" && f.note ? `<div class="fp-doom"><div class="fp-label">${L.doom_note}${f.prio && f.prio !== "future" ? " · " + prioL(f.prio, lang) : ""}</div><p>${esc(tr(f, "note", lang))}</p><a href="${prefix}/event/">${L.to_event}</a></div>` : ""}
  ${(() => {
    const pool = FILMS.filter((x) => x.uni === f.uni && x.id !== id).sort((a, b) => Math.abs(parseInt(a.y) - parseInt(f.y)) - Math.abs(parseInt(b.y) - parseInt(f.y)));
    const rel = pool.slice(0, 6);
    return rel.length ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Weiter stöbern" : "Keep browsing"} · ${uniL(f.uni, lang)}</div><div class="cp-films">` +
      rel.map((x) => `<a class="radar-film" href="${prefix}${filmUrl(x.id)}" title="${esc(x.t)}">${posterImgW(x.id, x.t)}<div class="rf-t">${esc(x.t)}</div><div class="rf-d">${x.y}</div></a>`).join("") + `</div></div>` : "";
  })()}
  ${f.prio !== "future" ? `<button class="fp-watch" data-watch="${id}" data-t-on="${L.watched}" data-t-off="${L.watch}">${L.watch}</button>` : ""}
  ${adSlot(L)}
</main>`;
}

function charBody(c, lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  // Beziehungen inkl. Rückrichtung
  const seen = new Set(), rels = [];
  c.rel.forEach((r) => { if (charById[r[0]] && !seen.has(r[0])) { seen.add(r[0]); rels.push({ id: r[0], t: r[1], l: lang === "en" && r[3] ? r[3] : r[2] }); } });
  CHARS.forEach((o) => {
    if (o.id === c.id || seen.has(o.id)) return;
    o.rel.forEach((r) => { if (r[0] === c.id && !seen.has(o.id)) { seen.add(o.id); rels.push({ id: o.id, t: r[1], l: lang === "en" && r[3] ? r[3] : r[2] }); } });
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
      <span class="uni-badge ub-${c.u}">${uniL(c.u, lang)}</span>
      <div class="fp-meta"><b>${esc(tr(c, "a", lang))}</b><br>${esc(tr(c, "uni", lang))}<br>${L.first}: ${esc(tr(c, "first", lang))}</div>
    </div>
  </div>
  <div class="fp-section"><div class="fp-label">${L.played_lbl}</div><div class="fp-chars">${actorNames(c.act).map((n) => actorCard(ACTOR_IMG[n.toLowerCase()], n, "", prefix)).join("")}</div><p style="font-size:12.5px;color:var(--faint);margin-top:10px">${esc(c.act)}</p></div>
  <div class="fp-section"><div class="fp-label">${L.powers}</div><p>${esc(tr(c, "pow", lang))}</p></div>
  <div class="fp-section"><div class="fp-label">${L.who}</div><p>${esc(tr(c, "bio", lang))}</p></div>
  ${ts.length ? `<div class="fp-section"><div class="fp-label">${L.teams_lbl}</div><div class="ext-links">` +
    ts.map((t) => `<a href="${prefix}${teamUrl(t.id)}">${esc(tr(t, "n", lang))}${t.lead === c.id ? " ★" : ""}</a>`).join("") + `</div></div>` : ""}
  ${(() => {
    const mr = MULTIROLE.find((m) => m.roles.some((r) => r.c === c.id) && m.roles.length > 1);
    if (!mr) return "";
    const other = mr.roles.filter((r) => r.c !== c.id);
    return `<div class="fp-section"><div class="fp-label">${lang === "de" ? "🎭 Doppelleben" : "🎭 Double life"}</div><p>${esc(mr.actor)} ${lang === "de" ? "spielt im Marvel-Kosmos außerdem" : "also plays"}: ${other.map((r) => {
      const href = r.c && CSLUG[r.c] ? `${prefix}${charUrl(r.c)}` : r.f && FSLUG[r.f] ? `${prefix}${filmUrl(r.f)}` : null;
      return href ? `<a href="${href}" style="text-decoration:underline">${esc(r.r)}</a>` : esc(r.r);
    }).join(", ")}${lang === "de" ? "." : "."} ${esc(tr(mr, "d", lang))}</p></div>`;
  })()}
  ${vGroup ? `<div class="fp-section"><div class="fp-label">${L.variants} · ${esc(tr(vGroup, "n", lang))}</div><p style="font-size:13.5px;color:var(--muted);margin-bottom:12px">${esc(tr(vGroup, "note", lang))}</p><div class="fp-chars">` +
    vGroup.ids.filter((x) => x !== c.id).map((oid) => `<a class="fp-char" href="${prefix}${charUrl(oid)}">${charImg(oid, charById[oid].n, "fc-img")}<div class="fc-n">${esc(charById[oid].n)}</div></a>`).join("") + `</div></div>` : ""}
  ${netData ? `<div class="fp-section"><div class="fp-label">${L.net}</div><canvas id="miniNet"></canvas>
    <div class="mm-legend"><span><i style="background:#5aa9e6"></i>${L.legend[0]}</span><span><i style="background:#e8353b"></i>${L.legend[1]}</span><span><i style="background:#d9a441"></i>${L.legend[2]}</span><span><i style="background:#a06be6"></i>${L.legend[3]}</span></div>
    <script type="application/json" id="netData">${JSON.stringify(netData)}</script></div>
  <div class="fp-section"><div class="fp-label">${L.net_detail}</div><div class="cp-rel">` +
    relsCapped.map((r) => `<a href="${prefix}${charUrl(r.id)}"><span><b>${esc(charById[r.id].n)}</b> — ${relN(r.t, lang)}</span><span class="rl">${esc(r.l)}</span></a>`).join("") + `</div></div>`
    : `<div class="fp-section"><div class="fp-label">${L.net}</div><p>${L.net_none}</p></div>`}
  <div class="fp-section"><div class="fp-label">${L.seen_in}</div>${miniFilmChips(c.films, lang)}</div>
  ${(() => {
    const team = TEAMS.find((t) => t.members.includes(c.id));
    const mates = team ? team.members.filter((m) => m !== c.id) : [];
    const fill = CHARS.filter((o) => o.u === c.u && o.id !== c.id && !mates.includes(o.id)).map((o) => o.id);
    const rel = [...mates, ...fill].slice(0, 6);
    return rel.length ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Ähnliche Figuren" : "Related characters"}</div><div class="fp-chars">` +
      rel.map((oid) => `<a class="fp-char" href="${prefix}${charUrl(oid)}">${charImg(oid, charById[oid].n, "fc-img")}<div class="fc-n">${esc(charById[oid].n)}</div></a>`).join("") + `</div></div>` : "";
  })()}
  ${adSlot(L)}
</main>`;
}

function teamBody(t, lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  return `<main class="wrap fp" style="padding-bottom:70px">
  <a class="backlink" href="${prefix}/teams/">${L.back}</a>
  <h1 class="metal fp-h1">${esc(tr(t, "n", lang))}</h1>
  ${t.ev ? `<span class="uni-badge ub-ev">★ Doomsday</span>` : `<span class="uni-badge ub-${t.u}">${UNI_LABEL[t.u]}</span>`}
  <div class="fp-meta"><b>${esc(tr(t, "sub", lang))}</b><br>${L.first}: ${esc(t.first)}<br>${L.status}: ${esc(tr(t, "status", lang))}</div>
  <div class="fp-section"><div class="fp-label">${L.story}</div><p>${esc(tr(t, "desc", lang))}</p></div>
  <div class="fp-section"><div class="fp-label">${esc(tr(t, "mlabel", lang) || L.members)}</div><div class="fp-chars">` +
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
  ${a.img && existsSync(`public/img/${a.img}.jpg`) ? `<div class="fp-backdrop"><img src="/img/${a.img}.jpg" alt="" aria-hidden="true" fetchpriority="high"></div>` : ""}
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
  <h1 class="metal fp-h1">${esc(tr(p, "n", lang))}</h1>
  <div class="fp-meta"><b>${esc(tr(p, "tag", lang))}</b></div>
  <div class="fp-section"><p>${esc(tr(p, "intro", lang))}</p></div>
  <div class="fp-section"><div class="fp-label">${L.path_lbl} · ${p.steps.length} ${L.steps}</div>` +
    p.steps.map((s, i) => {
      const f = byId[s.f];
      return `<a class="ewl-row" href="${prefix}${filmUrl(s.f)}" style="text-decoration:none;color:inherit">
        <div class="ewl-num">${i + 1}</div>
        <div class="ewl-poster">${posterImgW(s.f, f.t)}</div>
        <div class="ewl-main"><div class="ewl-t">${esc(f.t)}</div><div class="ewl-sub">${esc(tr(s, "note", lang))}</div></div></a>`;
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
    <div class="seg" id="wikiSort">
      <button class="sel" data-sort="y">${lang === "de" ? "Jahr" : "Year"}</button><button data-sort="r">${lang === "de" ? "Bewertung" : "Rating"}</button><button data-sort="t">${lang === "de" ? "Titel" : "Title"}</button>
    </div>
  </div>
  <div class="wgrid" id="wikiGrid">` +
    list.map((f) => `<a class="wcard" href="${prefix}${filmUrl(f.id)}" data-uni="${f.uni}" data-type="${f.type}" data-t="${esc(f.t.toLowerCase())}" data-y="${parseInt(f.y) || 0}" data-r="${SCORES[f.id] ? SCORES[f.id][0] : -1}">
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
    CHARS.map((c) => `<a class="wcard" href="${prefix}${charUrl(c.id)}" data-uni="${c.u}" data-type="Char" data-t="${esc((c.n + " " + tr(c, "a", lang) + " " + c.act).toLowerCase())}">
      <div class="pw">${charImg(c.id, c.n)}</div>
      <div class="wt">${esc(c.n)}</div><div class="wy">${esc(c.act)}</div>
      <span class="uni-badge ub-${c.u}">${uniL(c.u, lang)}</span></a>`).join("") +
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
      <div class="cc-n">${esc(tr(t, "n", lang))}</div><div class="cc-a">${esc(tr(t, "sub", lang))}</div>
      <div class="cc-p">${t.mystery ? `${t.members.length} + ${t.mystery} ?` : total + " " + L.members} · ${esc(t.first)}</div>
      ${t.ev ? `<span class="uni-badge ub-ev">★ Doomsday</span>` : `<span class="uni-badge ub-${t.u}">${uniL(t.u, lang)}</span>`}</a>`;
  };
  const heroes = TEAMS.filter((t) => t.side !== "villain"), villains = TEAMS.filter((t) => t.side === "villain");
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Wer kämpft mit wem" : "Who fights alongside whom", "Teams", "")}
  <div class="char-grid">
    <div class="tgroup-head">${lang === "de" ? "Helden, Familien &amp; Institutionen" : "Heroes, families &amp; institutions"}</div>${heroes.map(card).join("")}
    <div class="tgroup-head vill">${lang === "de" ? "Schurken-Fraktionen" : "Villain factions"}</div>${villains.map(card).join("")}
    <div class="tgroup-head">${lang === "de" ? "Organisationen &amp; Institutionen" : "Organizations &amp; institutions"}</div>${catIndexCards("org", lang)}
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
      <div class="cc-n">${esc(a.n)}</div><div class="cc-a">${esc(tr(a, "sub", lang))}</div><div class="cc-p">${esc(tr(a, "status", lang))}</div></a>`).join("") +
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
      <div class="pstack">${stack}</div><div class="cc-n">${esc(tr(p, "n", lang))}</div><div class="cc-a">${esc(tr(p, "tag", lang))}</div><div class="cc-p">${p.steps.length} ${L.steps}</div></a>`;
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
    <div class="uni-head"><div class="uni-num metal">${esc(u.num)}</div><div><div class="uni-name">${esc(tr(u, "n", lang))}</div><div class="uni-status">${esc(tr(u, "status", lang))}</div></div></div>
    <p>${esc(tr(u, "d", lang))}</p>
    <div class="cp-films">${u.sample.map((fid) => byId[fid] ? `<a class="radar-film" href="${prefix}${filmUrl(fid)}" title="${esc(byId[fid].t)}">${posterImgW(fid, byId[fid].t)}</a>` : "").join("")}</div>
  </div>`).join("") + `</div></main>`;
}

function chronBody(lang) {
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Die Weltgeschichte des MCU" : "The in-universe history", lang === "de" ? "Die Chronik" : "The Timeline", lang === "de" ? "Nicht wann die Filme erschienen — sondern wann es passiert ist. Hover/Tippen für Details und die Filme dazu." : "Not release order — story order. Hover/tap for details and the films involved.")}
  <div class="chron">` + CHRONIK.map((e) => `<div class="chron-item">
    <div class="chron-y metal">${esc(e.y)}</div>
    <div class="chron-body"><div class="chron-n">${esc(tr(e, "n", lang))}</div>
    <div class="chron-more"><p>${esc(tr(e, "d", lang))}</p>${miniFilmChips(e.films, lang)}</div></div></div>`).join("") + `</div></main>`;
}

function threadsBody(lang) {
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(lang === "de" ? "Chekhovs Waffenkammer" : "Chekhov's armory", lang === "de" ? "Die offenen Fäden" : "The Loose Ends", lang === "de" ? "Alles, was das Marvel-Kino angeteasert und nie aufgelöst hat. <span style='color:#3fdc8c'>●</span> heiß · <span style='color:var(--gold)'>●</span> köchelt · <span style='color:#ff8a8e'>●</span> kalt." : "Everything Marvel teased and never resolved. <span style='color:#3fdc8c'>●</span> hot · <span style='color:var(--gold)'>●</span> simmering · <span style='color:#ff8a8e'>●</span> cold.")}
  <div class="threads">` + THREADS.map((t) => `<div class="thread g-${t.grade}">
    <div class="thread-head"><span class="thread-dot"></span><div><div class="thread-n">${esc(tr(t, "n", lang))}</div><div class="thread-s">${esc(t.seit)} · Status: ${esc(tr(t, "status", lang))}</div></div></div>
    <div class="chron-more"><p>${esc(tr(t, "d", lang))}</p>${miniFilmChips(t.films, lang)}</div></div>`).join("") + `</div></main>`;
}

function recordsBody(lang) {
  const L = T[lang];
  const prefix = lang === "en" ? "/en" : "";
  const scored = FILMS.filter((f) => SCORES[f.id]);
  const byRt = scored.slice().sort((a, b) => SCORES[b.id][0] - SCORES[a.id][0]);
  const recRow = (f, i, val) => `<a class="rec-row" href="${prefix}${filmUrl(f.id)}" style="text-decoration:none;color:inherit">
    <div class="rec-rank">${i + 1}</div>${existsSync(`public/img/p/${f.id}.jpg`) ? `<img src="/img/p/${f.id}.jpg" alt="" loading="lazy">` : "<span></span>"}
    <div class="rec-main"><div class="rec-t">${esc(f.t)}</div><div class="rec-s">${f.y} · ${uniL(f.uni, lang)}</div></div>
    <div class="rec-bar"><div style="width:${SCORES[f.id][0]}%"></div></div><div class="rec-val">${val}</div></a>`;
  const gap = scored.slice().sort((a, b) => Math.abs(SCORES[b.id][1] * 10 - SCORES[b.id][0]) - Math.abs(SCORES[a.id][1] * 10 - SCORES[a.id][0])).slice(0, 6);
  const filmsOnly = FILMS.filter((f) => f.type === "Film" && f.min);
  const longest = filmsOnly.slice().sort((a, b) => b.min - a.min)[0];
  const shortest = filmsOnly.slice().sort((a, b) => a.min - b.min)[0];
  const curios = lang === "de" ? [
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
  ] : [
    `Longest film: <b>${esc(longest.t)}</b> (${fmtMin(longest.min)}) — shortest: <b>${esc(shortest.t)}</b> (${fmtMin(shortest.min)}).`,
    "<b>Avengers: Endgame</b> grossed $2.799 billion and was, for a time, the most successful film of all time.",
    "<b>Deadpool & Wolverine</b> is the most successful R-rated film in history at $1.34 billion.",
    "<b>No Way Home</b> ($1.9 billion) is the most successful Spider-Man film — and the biggest pandemic-era opening.",
    "<b>Morbius</b> is the only film that flopped twice: Sony re-released it because of the memes.",
    "<b>Iron Man</b> was financed with mortgaged character rights — had it flopped, this wiki would not exist.",
    "<b>Guardians Vol. 2</b> holds the credits record with <b>5 post-credit scenes</b>.",
    "<b>X-Men '97</b> and <b>Ms. Marvel</b> (98% each) beat every theatrical film.",
    "<b>Secret Invasion</b> cost ~$212 million for 6 episodes — at 53% RT.",
    "<b>Loki</b> is the only MCU series that ever got a second season.",
    "<b>Howard the Duck</b> (1986) was the very first Marvel theatrical film. Produced by George Lucas. 13%.",
  ];
  /* Das Franchise in Zahlen: SVG-Charts aus den DB-Daten, zur Build-Zeit gerendert */
  const de2 = lang === "de";
  const withRev = FILMS.filter((f) => DETAILS[f.id] && DETAILS[f.id].revenue);
  const revByYear = {};
  withRev.forEach((f) => { const y2 = parseInt(f.y); revByYear[y2] = (revByYear[y2] || 0) + DETAILS[f.id].revenue; });
  const years = Object.keys(revByYear).map(Number).sort((a, b) => a - b);
  const maxRev = Math.max(...Object.values(revByYear));
  const BW = 26, BG = 7, CH = 170;
  const fmtB = (v) => (v / 1e9).toFixed(1).replace(".", de2 ? "," : ".");
  const revChart = `<svg class="chart" viewBox="0 0 ${years.length * (BW + BG) + 14} ${CH + 44}" role="img" aria-label="Box Office pro Jahr">` +
    years.map((y2, i) => {
      const h = Math.max(3, Math.round(revByYear[y2] / maxRev * CH));
      const x = 8 + i * (BW + BG);
      const hot = revByYear[y2] >= 3e9;
      return `<rect x="${x}" y="${CH - h + 14}" width="${BW}" height="${h}" rx="3" fill="${hot ? "#e3c56a" : "#3fdc8c"}" opacity="${hot ? "0.95" : "0.65"}"><title>${y2}: ${fmtMoney(revByYear[y2])}</title></rect>` +
        (revByYear[y2] >= 2e9 ? `<text x="${x + BW / 2}" y="${CH - h + 6}" text-anchor="middle" class="ch-v">${fmtB(revByYear[y2])}</text>` : "") +
        `<text x="${x + BW / 2}" y="${CH + 30}" text-anchor="middle" class="ch-x">${String(y2).slice(2)}</text>`;
    }).join("") + `</svg>`;
  const phAvg = [1, 2, 3, 4, 5, 6].map((ph) => {
    const ps = FILMS.filter((f) => f.uni === "mcu" && f.ph === ph && SCORES[f.id]);
    return ps.length ? Math.round(ps.reduce((s, f) => s + SCORES[f.id][0], 0) / ps.length) : 0;
  });
  const PW = 74;
  const phChart = `<svg class="chart" viewBox="0 0 ${6 * PW + 14} 214" role="img" aria-label="Kritiker-Schnitt pro MCU-Phase">` +
    phAvg.map((v, i) => {
      const h = Math.round(v / 100 * 150);
      const x = 10 + i * PW;
      const low = v > 0 && v === Math.min(...phAvg.filter(Boolean));
      return v ? `<rect x="${x}" y="${164 - h}" width="${PW - 18}" height="${h}" rx="4" fill="${low ? "#ff8a8e" : "#3fdc8c"}" opacity="${low ? "0.85" : "0.7"}"><title>Phase ${i + 1}: Ø ${v} % (Rotten Tomatoes)</title></rect>
        <text x="${x + (PW - 18) / 2}" y="${156 - h}" text-anchor="middle" class="ch-v">${v} %</text>
        <text x="${x + (PW - 18) / 2}" y="188" text-anchor="middle" class="ch-x">${de2 ? "Phase" : "Phase"} ${i + 1}</text>` : "";
    }).join("") + `</svg>`;
  const topRev = withRev.filter((f) => DETAILS[f.id].budget).sort((a, b) => DETAILS[b.id].revenue - DETAILS[a.id].revenue).slice(0, 8);
  const maxR2 = DETAILS[topRev[0].id].revenue;
  const bvChart = `<svg class="chart" viewBox="0 0 640 ${topRev.length * 44 + 8}" role="img" aria-label="Budget vs. Einspielergebnis">` +
    topRev.map((f, i) => {
      const d3 = DETAILS[f.id];
      const y2 = 6 + i * 44;
      const wR = Math.round(d3.revenue / maxR2 * 420);
      const wB = Math.round(d3.budget / maxR2 * 420);
      return `<text x="0" y="${y2 + 15}" class="ch-l">${esc(f.t.length > 26 ? f.t.slice(0, 24) + "…" : f.t)}</text>
        <rect x="200" y="${y2}" width="${wR}" height="13" rx="3" fill="#e3c56a" opacity="0.9"><title>${de2 ? "Einspielergebnis" : "Box office"}: ${fmtMoney(d3.revenue)}</title></rect>
        <rect x="200" y="${y2 + 16}" width="${Math.max(wB, 2)}" height="7" rx="2" fill="#7a8580" opacity="0.8"><title>Budget: ${fmtMoney(d3.budget)}</title></rect>
        <text x="${205 + wR}" y="${y2 + 11}" class="ch-v" text-anchor="start">${fmtB(d3.revenue)}</text>`;
    }).join("") + `</svg>`;
  const totalMin = FILMS.reduce((s, f) => s + (f.min || 0), 0);
  const totalRev = withRev.reduce((s, f) => s + DETAILS[f.id].revenue, 0);
  const allScored = FILMS.filter((f) => SCORES[f.id]);
  const avgAll = Math.round(allScored.reduce((s, f) => s + SCORES[f.id][0], 0) / allScored.length);
  const numbers = `
  <div class="fact-strip" style="margin-bottom:22px">
    <div class="fact-box"><div class="fb-k">${de2 ? "Titel im Archiv" : "Titles in the archive"}</div><div class="fb-v">${FILMS.length}</div></div>
    <div class="fact-box"><div class="fb-k">${de2 ? "Alles am Stück" : "Back to back"}</div><div class="fb-v">${Math.floor(totalMin / 1440)} ${de2 ? "Tage" : "days"} ${Math.floor((totalMin % 1440) / 60)} h</div></div>
    <div class="fact-box"><div class="fb-k">${de2 ? "Box Office gesamt" : "Total box office"}</div><div class="fb-v">${fmtMoney(totalRev)}</div></div>
    <div class="fact-box"><div class="fb-k">${de2 ? "Ø Rotten Tomatoes" : "Avg Rotten Tomatoes"}</div><div class="fb-v">${avgAll} %</div></div>
  </div>
  <div class="chart-card"><div class="chart-t">${de2 ? "Box Office pro Jahr" : "Box office per year"}</div><div class="chart-s">${de2 ? "Gold = 3-Milliarden-Jahre. Der Endgame-Gipfel 2019, das Pandemie-Tal 2020 — und die NWH-Auferstehung." : "Gold = 3-billion years. The Endgame peak of 2019, the pandemic valley of 2020 — and the NWH resurrection."}</div>${revChart}</div>
  <div class="chart-grid">
    <div class="chart-card"><div class="chart-t">${de2 ? "Kritiker-Schnitt pro MCU-Phase" : "Critics average per MCU phase"}</div><div class="chart-s">${de2 ? "Der Durchhänger der Multiverse Saga — rot markiert. Phase 6 hat die Kurve gekriegt." : "The Multiverse Saga slump — marked red. Phase 6 turned it around."}</div>${phChart}</div>
    <div class="chart-card"><div class="chart-t">${de2 ? "Budget vs. Einspielergebnis · Top 8" : "Budget vs. box office · top 8"}</div><div class="chart-s">${de2 ? "Gold = eingespielt, Grau = gekostet. Hover für Zahlen." : "Gold = earned, gray = cost. Hover for numbers."}</div>${bvChart}</div>
  </div>`;
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead("Hall of Fame & Hall of Shame", lang === "de" ? "Die Rekorde" : "The Records", lang === "de" ? "Erst das Franchise in Zahlen, dann Bestwerte, Tiefpunkte und Kuriositäten — alles direkt aus den Wiki-Daten berechnet." : "First the franchise in numbers, then highs, lows and oddities — all computed straight from the wiki data.")}
  <div class="subhead">${lang === "de" ? "Das Franchise in Zahlen" : "The franchise in numbers"}</div>
  ${numbers}
  <div class="subhead">Top 10 (Rotten Tomatoes)</div>${byRt.slice(0, 10).map((f, i) => recRow(f, i, SCORES[f.id][0] + " %")).join("")}
  <div class="subhead">Flop 10</div>${byRt.slice(-10).reverse().map((f, i) => recRow(f, i, SCORES[f.id][0] + " %")).join("")}
  <div class="subhead">${lang === "de" ? "Serien-Ranking · Top 5" : "Series ranking · top 5"}</div>${scored.filter((f) => f.type === "Serie").sort((a, b) => SCORES[b.id][0] - SCORES[a.id][0]).slice(0, 5).map((f, i) => recRow(f, i, SCORES[f.id][0] + " %")).join("")}
  <div class="subhead">${lang === "de" ? "Box Office · Top 10" : "Box office · top 10"}</div>
  ${(() => {
    const byRev = FILMS.filter((x) => DETAILS[x.id] && DETAILS[x.id].revenue).sort((a, b) => DETAILS[b.id].revenue - DETAILS[a.id].revenue).slice(0, 10);
    const max = DETAILS[byRev[0].id].revenue;
    return byRev.map((x, i) => `<a class="rec-row" href="${prefix}${filmUrl(x.id)}"><div class="rec-rank">${i + 1}</div><img src="/img/p/${x.id}.jpg" alt="" loading="lazy"><div class="rec-main"><div class="rec-t">${esc(x.t)}</div><div class="rec-s">${x.y} · ${uniL(x.uni, lang)}</div></div><div class="rec-bar"><div style="width:${Math.round(DETAILS[x.id].revenue / max * 100)}%"></div></div><div class="rec-val">${fmtMoney(DETAILS[x.id].revenue)}</div></a>`).join("");
  })()}
  <div class="subhead">${lang === "de" ? "Die Universen im Vergleich" : "Universes compared"}</div>
  ${["mcu", "fox", "sony", "net", "alt"].map((u) => {
    const us = scored.filter((f) => f.uni === u);
    if (!us.length) return "";
    const avg = Math.round(us.reduce((s, f) => s + SCORES[f.id][0], 0) / us.length);
    return `<div class="rec-row" style="cursor:default"><div class="rec-rank">Ø</div><div class="rec-main"><div class="rec-t">${uniL(u, lang)}</div><div class="rec-s">${us.length} ${lang === "de" ? "Titel" : "titles"}</div></div><div class="rec-bar"><div style="width:${avg}%"></div></div><div class="rec-val">${avg} %</div></div>`;
  }).join("")}
  <div class="subhead">${lang === "de" ? "Kritiker vs. Publikum" : "Critics vs. audience"}</div>
  ${gap.map((f, i) => { const sc = SCORES[f.id]; const d = Math.round(sc[1] * 10 - sc[0]); return recRow(f, i, (d > 0 ? "+" : "") + d); }).join("")}
  <div class="subhead">${lang === "de" ? "Kurioses & Kino-Rekorde" : "Oddities & box-office records"}</div>
  <div class="lore-wrap"><ul style="padding-left:20px">${curios.map((x) => `<li style="color:#bcb8ba;font-size:14.5px;margin-bottom:8px">${x}</li>`).join("")}</ul></div>
  <div class="subhead">🥸 Excelsior — Stan Lee</div>
  <div class="cameo-list">${Object.keys(CAMEO).map((cid) => byId[cid] ? `<a class="cameo-row" href="${prefix}${filmUrl(cid)}" style="text-decoration:none"><b>${esc(byId[cid].t)}</b><span>${esc(cameoL(cid, lang))}</span></a>` : "").join("")}</div>
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
      html += `<div class="sep">${b.saga ? `<div class="sep-saga metal">${lang === "en" ? b.saga.replace("Die ", "The ") : b.saga}</div>` : ""}<div class="sep-phase">${b.phase}</div></div>`;
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
    <a class="ewl-main" href="${prefix}${filmUrl(f.id)}" style="text-decoration:none;color:inherit"><div class="ewl-t">${esc(f.t)}</div><div class="ewl-sub">${f.y} · ${typeL(f.type, lang)} · ${prioL(f.prio, lang)}</div></a>
    <div class="ewl-side"><span class="ewl-time">≈ ${fmtMin(f.min)}</span><button class="ewl-check" data-watch="${f.id}" aria-label="gesehen">✓</button></div>
  </div>`).join("");
}
function eventBody(lang) {
  const de = lang === "de";
  const saga = fragL("event-saga", lang).replace('<div class="road" id="road"></div>', `<div class="road" id="road">${roadHtml(lang)}</div>`);
  const act = (num, t, s) => `<div class="act"><div class="act-num metal">${num}</div><div class="act-t">${t}</div><div class="act-s">${s}</div></div>`;
  const trailer = `<section class="wrap" id="ev-trailer" style="padding-top:40px">
    <div class="trailer-card ev-trailer-card" data-yt="${TRAILERS.doomsday || ""}" role="button" tabindex="0" aria-label="Trailer">
      <img src="/img/b/doomsday.jpg" alt="" aria-hidden="true" loading="lazy">
      <div class="tc-overlay"><div class="tc-play">▶</div><div class="tc-t">${de ? "Der erste Trailer" : "The first trailer"}</div><div class="tc-s">${de ? "veröffentlicht am 20. Juli 2026 · Klick lädt YouTube" : "released July 20, 2026 · click loads YouTube"}</div></div>
    </div>
  </section>`;
  const ENSEMBLE = [
    [de ? "Latveria" : "Latveria", [["Robert Downey Jr.", "Victor von Doom / Doctor Doom"]]],
    [de ? "Avengers & Verbündete" : "Avengers & allies", [["Chris Hemsworth", "Thor"], ["Anthony Mackie", "Captain America"], ["Tom Hiddleston", "Loki"], ["Paul Rudd", "Ant-Man"], ["Letitia Wright", "Shuri"], ["Winston Duke", "M'Baku"], ["Simu Liu", "Shang-Chi"], ["Danny Ramirez", "Falcon"], ["Kathryn Newton", "Cassie Lang"], ["Tenoch Huerta Mejía", "Namor"], ["Chris Evans", de ? "Rolle geheim" : "role secret"]]],
    ["New Avengers", [["Florence Pugh", "Yelena Belova"], ["Sebastian Stan", "Bucky Barnes"], ["David Harbour", "Red Guardian"], ["Wyatt Russell", "U.S. Agent"], ["Hannah John-Kamen", "Ghost"], ["Lewis Pullman", "Sentry"]]],
    ["Fantastic Four", [["Pedro Pascal", "Mister Fantastic"], ["Vanessa Kirby", "Invisible Woman"], ["Joseph Quinn", "Human Torch"], ["Ebon Moss-Bachrach", "The Thing"]]],
    ["X-Men", [["Patrick Stewart", "Professor X"], ["Ian McKellen", "Magneto"], ["Kelsey Grammer", "Beast"], ["James Marsden", "Cyclops"], ["Rebecca Romijn", "Mystique"], ["Alan Cumming", "Nightcrawler"], ["Channing Tatum", "Gambit"]]],
    [de ? "Comic-Con-Enthüllungen" : "Comic-Con reveals", [["Ryan Gosling", "Ghost Rider", 1], ["David Jonsson", "Black Panther", 1]]],
  ];
  const ensWall = `<div class="ens">` + ENSEMBLE.map(([fac, list]) =>
    `<div class="ens-group"><div class="ens-f">${fac}</div><div class="ens-row">` +
    list.map(([n, r, sp]) => {
      const pid = ACTOR_IMG[n.toLowerCase()];
      const img = pid ? `<img class="ens-img" src="/img/a/${pid}.jpg" alt="${esc(n)}" loading="lazy">` : `<div class="ens-img fc-fallback">${esc(n.charAt(0))}</div>`;
      const inner = `${img}<div class="ens-n">${esc(n)}</div><div class="ens-r">${esc(r)}</div>`;
      const card = pid && PERSONS[pid] ? `<a class="ens-card" href="${lang === "en" ? "/en" : ""}${personUrl(pid)}">${sp ? `<span class="spoiler">${inner}</span>` : inner}</a>` : `<div class="ens-card">${sp ? `<span class="spoiler">${inner}</span>` : inner}</div>`;
      return card;
    }).join("") + `</div></div>`).join("") + `</div>`;
  let doomFrag = fragL("event-doom", lang);
  const ci = doomFrag.indexOf('<div class="cast-cols">');
  if (ci !== -1) doomFrag = doomFrag.slice(0, ci) + ensWall + "</div></section>";
  const prefix = lang === "en" ? "/en" : "";
  const FOX = [
    ["xmen1", "pflicht", de ? "Der Grundstein: wer Xavier, Magneto, Mystique und Sabretooth sind." : "The foundation: who Xavier, Magneto, Mystique and Sabretooth are."],
    ["x2", "empfohlen", de ? "Der beste Teil der Trilogie — mit Nightcrawlers legendärem Auftritt (Cumming kehrt zurück)." : "The best of the trilogy — with Nightcrawler's legendary entrance (Cumming returns)."],
    ["x3", "empfohlen", de ? "Kelsey Grammers Beast debütiert — exakt die Version aus dem Doomsday-Cast." : "Kelsey Grammer's Beast debuts — exactly the version in the Doomsday cast."],
    ["logan", "pflicht", de ? "Das Anker-Wesen-Fundament: ohne Logans Ende ergibt Deadpool & Wolverine keinen Sinn." : "The anchor-being foundation: without Logan's end, Deadpool & Wolverine makes no sense."],
    ["dp1", "empfohlen", de ? "Wades Ursprung — der Vorlauf zur Fox-MCU-Brücke." : "Wade's origin — the run-up to the Fox-MCU bridge."],
    ["dp2", "optional", de ? "Vertieft Wades Welt (und Cable), fürs Verständnis verzichtbar." : "Deepens Wade's world (and Cable), skippable for understanding."],
    ["dofp", "optional", de ? "Erklärt, warum die Fox-Timeline ein Flickenteppich ist — Kür für Komplettisten." : "Explains why the Fox timeline is a patchwork — extra credit for completionists."],
  ];
  const foxRows = FOX.map(([fid, prio, why]) => { const f = byId[fid]; return `<div class="ewl-row" data-prio="${prio}">
    <a class="ewl-poster" href="${prefix}${filmUrl(fid)}">${posterImgW(fid, f.t)}</a>
    <a class="ewl-main" href="${prefix}${filmUrl(fid)}" style="text-decoration:none;color:inherit"><div class="ewl-t">${esc(f.t)}</div><div class="ewl-sub"><span class="prio-dot pd-${prio}" style="display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px"></span>${f.y} · ${prioL(prio, lang)} — ${why}</div></a>
    <div class="ewl-side"><span class="ewl-time">≈ ${fmtMin(f.min)}</span><button class="ewl-check" data-watch="${fid}" aria-label="${de ? "gesehen" : "watched"}">✓</button></div>
  </div>`; }).join("");
  const foxBlock = `<section class="block" id="foxlegacy"><div class="wrap" style="max-width:860px">
    <div class="sec-head">
      <div class="sec-kicker">${de ? "Die Hausaufgabe aus einem anderen Universum" : "Homework from another universe"}</div>
      <h2 class="metal">${de ? "Das Fox-Erbe" : "The Fox Legacy"}</h2>
      <p class="sec-sub">${de ? "Doomsday bringt den Original-Cast der X-Men-Trilogie zurück — Stewart, McKellen, Grammer, Marsden, Romijn, Cumming. Diese Filme laufen außerhalb der MCU-Timeline, sind aber plötzlich wieder Pflichtstoff. Die Haken zählen zur selben Watchlist." : "Doomsday brings back the original X-Men trilogy cast — Stewart, McKellen, Grammer, Marsden, Romijn, Cumming. These films sit outside the MCU timeline, but they are suddenly required material again. The checkmarks count toward the same watchlist."}</p>
    </div>
    ${foxRows}
  </div></section>`;
  return `<div class="event-theme"><div class="ev-progress" id="evProgress"></div>${fragL("event-hero", lang)}
  <a class="ev-sticky" id="evSticky" href="#event-top" hidden><img class="evs-logo" src="/img/l/doomsday.png" alt="Avengers: Doomsday"><span class="evs-time" id="evStickyD">…</span></a>
  <main>
    ${trailer}
    ${act("I", de ? "Der Weg" : "The Road", de ? "33 Filme & Serien. Ein Ziel. Deine Watchlist." : "33 films & shows. One destination. Your watchlist.")}
    ${saga}
    ${foxBlock}
    <div style="text-align:center;margin:6px 0 10px"><a class="hd-cta" href="${prefix}/tierlist/event/">${de ? "★ Ranke die Road to Doomsday — die Event-Tier-List" : "★ Rank the Road to Doomsday — the event tier list"}</a></div>
    ${act("II", de ? "Die Lage" : "The Situation", de ? "Fakten, News und das größte Ensemble aller Zeiten" : "Facts, news and the biggest ensemble ever")}
    ${doomFrag}
    ${act("III", de ? "Das Wissen" : "The Knowledge", de ? "Die komplette Lore hinter Doom" : "The complete lore behind Doom")}
    ${fragL("event-lore", lang)}
    <div class="ev-card rv-always"><div class="ev-card-bg"><img src="/img/g/doomsday-0.jpg" alt="" loading="lazy"></div><div class="ev-card-q metal">„New mask, same task."</div><div class="ev-card-s">— Robert Downey Jr., San Diego Comic-Con, Juli 2024</div></div>
    ${act("IV", de ? "Die Theorien" : "The Theories", de ? "Was passieren könnte — und wie wahrscheinlich es ist" : "What might happen — and how likely it is")}
    ${fragL("event-theo", lang)}
    ${act("V", de ? "Das Archiv" : "The Archive", de ? "Jeder Begriff für den Kinosaal" : "Every term you need for the theater")}
    ${fragL("event-glos", lang)}
    <div class="ev-card ev-end"><div class="ev-card-bg"><img src="/img/g/doomsday-1.jpg" alt="" loading="lazy"></div>
      <div class="ev-card-q metal">18. Dezember 2026</div>
      <div class="ev-card-s">${de ? "Every Story leads to Doom — sei bereit." : "Every story leads to Doom — be ready."}</div>
      <a class="hd-cta" href="#event-top" style="margin-top:22px">${de ? "↑ Zurück zum Countdown" : "↑ Back to the countdown"}</a>
    </div>
  </main></div>`;
}

/* ================= Home ================= */
function homeBody(lang) {
  const L = T[lang];
  const de = lang === "de";
  const prefix = lang === "en" ? "/en" : "";
  const tiles = [
    { href: "/filme/", t: L.nav.films, s: de ? "108 Einträge aus fünf Universen — mit Scores, Trivia & Post-Credits" : "108 entries across five universes", imgs: ["p/eg", "p/xmen1", "p/sv1"] },
    { href: "/charaktere/", t: L.nav.chars, s: de ? "128 Figuren mit Biografien und Beziehungs-Netz" : "128 characters with bios and relationship webs", imgs: ["c/doom", "c/wolverine", "c/wanda"] },
    { href: "/orte/", t: L.nav.places, s: de ? "Von Asgard bis Battleworld — plus alle Erde-Nummern" : "From Asgard to Battleworld", imgs: ["p/mom", "p/dw", "p/sv2"] },
    { href: "/chronik/", t: L.nav.chron, s: de ? "Die Geschichte in richtiger Reihenfolge — von 1943 bis Battleworld" : "The story in order", imgs: ["p/cap1", "p/av1", "p/f4"] },
    { href: "/faeden/", t: L.nav.threads, s: de ? "15 Cliffhanger, die nie aufgelöst wurden" : "15 unresolved cliffhangers", imgs: ["p/sc", "p/et", "p/venom3"] },
    { href: "/lexikon/", t: L.nav.lex, s: de ? "Snap, Inkursion, Vibranium — jeder Begriff erklärt" : "Every term explained", imgs: ["p/l1", "p/iw", "p/wv"] },
  ];
  // Kommende Projekte (live aus der DB)
  const upcomingRow = HOME.upcoming.map((u2) => {
    const img = u2.img && existsSync(`public/img/${u2.img}.jpg`) ? `<img src="/img/${u2.img}.jpg" alt="" loading="lazy">` : `<div class="poster-fallback"><div class="pf-t metal">${esc(u2.t)}</div></div>`;
    const [y, m, dd] = u2.d.split("-");
    const inner = `${img}<div class="rf-t">${esc(u2.t)}</div><div class="rf-d">${dd}.${m}.${y}${u2.id ? "" : de ? " · angekündigt" : " · announced"}</div>`;
    return u2.id ? `<a class="radar-film up-card" href="${prefix}${filmUrl(u2.id)}">${inner}</a>` : `<div class="radar-film up-card up-new">${inner}</div>`;
  }).join("");
  // Angesagt: echte Trends + Auffüllung mit Archiv-Favoriten
  const fillIds = FILMS.filter((f) => DETAILS[f.id] && DETAILS[f.id].vote).sort((a, b) => DETAILS[b.id].vote[1] - DETAILS[a.id].vote[1]).map((f) => f.id);
  const trendIds = [...HOME.trending, ...fillIds.filter((id) => !HOME.trending.includes(id))].slice(0, 6);
  const trendRow = trendIds.map((id, i) => `<a class="radar-film up-card" href="${prefix}${filmUrl(id)}">
    <span class="trend-rank metal">${i + 1}</span>${posterImgW(id, byId[id].t)}<div class="rf-t">${esc(byId[id].t)}</div></a>`).join("");
  // Tages-Daten (Client wählt per Datum)
  const daily = {
    film: FILMS.filter((f) => f.prio !== "future").map((f) => ({ t: f.t, u: prefix + filmUrl(f.id), i: `/img/p/${f.id}.jpg`, s: `${f.y} · ${uniL(f.uni, lang)}` })),
    char: CHARS.map((c) => ({ t: c.n, u: prefix + charUrl(c.id), i: existsSync(`public/img/c/${c.id}.jpg`) ? `/img/c/${c.id}.jpg` : null, s: c.act.split("·")[0].trim() })),
    lex: LEXIKON.map((e) => ({ t: tr(e, "n", lang), u: prefix + lexUrl(e), i: null, s: tr(e, "sub", lang) || (de ? "Lexikon" : "Lexicon") })),
    quote: QUOTES.filter((q) => q.f && byId[q.f]).map((q) => ({ t: de ? `„${q.q}“` : `“${q.q}”`, u: prefix + filmUrl(q.f), i: null, s: `${q.by} · ${byId[q.f].t}` })),
    anniversaries: FILMS.filter((f) => DETAILS[f.id] && DETAILS[f.id].deDate).map((f) => ({ d: DETAILS[f.id].deDate, t: f.t, u: prefix + filmUrl(f.id), i: `/img/p/${f.id}.jpg` })),
  };
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
        <p class="hd-s">${de ? "Lore, fokussierte Watchlist, Theorien und die komplette Saga-Timeline — alles zum größten Marvel-Film seit Endgame." : "Lore, watchlist, theories and the full saga timeline."}</p>
        <span class="hd-cta">${L.event_cta}</span>
      </div>
    </a>

    <div class="subhead">${de ? "Demnächst im Marvel-Kosmos" : "Coming up"} <span class="live-dot" title="${de ? "live aus der Datenbank" : "live from the database"}"></span></div>
    <div class="cp-films up-row">${upcomingRow}</div>

    <div class="home-cols">
      <section>
        <div class="subhead">${de ? "Heute im Archiv" : "Today in the archive"}</div>
        <div class="daily" id="dailyMod">
          <a class="daily-card" data-kind="film" href="#"><span class="daily-k">${de ? "Film des Tages" : "Film of the day"}</span><img alt="" hidden><b></b><small></small></a>
          <a class="daily-card" data-kind="char" href="#"><span class="daily-k">${de ? "Charakter des Tages" : "Character of the day"}</span><img alt="" hidden><b></b><small></small></a>
          <a class="daily-card" data-kind="lex" href="#"><span class="daily-k">${de ? "Begriff des Tages" : "Term of the day"}</span><img alt="" hidden><b></b><small></small></a>
          <a class="daily-card" data-kind="quote" href="#"><span class="daily-k">${de ? "Zitat des Tages" : "Quote of the day"}</span><img alt="" hidden><b></b><small></small></a>
        </div>
      </section>
      <section>
        <div class="subhead">${de ? "An diesem Tag" : "On this day"}</div>
        <div class="anniv" id="annivMod"><p class="anniv-empty">…</p></div>
      </section>
    </div>
    <script type="application/json" id="dailyData">${JSON.stringify(daily)}</script>

    <div class="subhead">${de ? "Angesagt & beliebt" : "Trending & popular"} <span class="live-dot"></span></div>
    <div class="cp-films up-row">${trendRow}</div>
    ${adSlot(L)}
    <div class="subhead">${L.dive}</div>
    <div class="tiles">
      ${tiles.map((t) => `<a class="tile" href="${prefix}${t.href}">
        <div class="tile-imgs">${t.imgs.map((i) => `<img src="/img/${i}.jpg" alt="" loading="lazy">`).join("")}</div>
        <div class="tile-body"><div class="tile-t">${esc(t.t)}</div><div class="tile-s">${t.s}</div></div>
        <span class="tile-arr">➤</span>
      </a>`).join("")}
    </div>
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
  emit(lang, "/multiversum/", page({ lang, path: "/multiversum/", title: "Multiversum · Knowhere", desc: "Umgezogen: Die Welten des Multiversums findest du jetzt unter Orte & Welten.", dataPage: "multi", noindex: true, body: `<main class="wrap" style="padding:100px 22px;text-align:center"><h2 class="metal">${lang === "de" ? "Umgezogen" : "Moved"}</h2><p class="sec-sub">${lang === "de" ? "Die Welten &amp; Erde-Nummern wohnen jetzt bei" : "The worlds now live at"} <a href="${lang === "en" ? "/en" : ""}/orte/">${T[lang].nav.places}</a>.</p></main>` }));
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
      name: f.t, description: stripTags(tr(f, "plot", lang)).slice(0, 300),
      datePublished: String(parseInt(f.y) || ""),
      director: { "@type": "Person", name: f.dir.split("·")[0].replace(/Regie:|Showrunner(in)?:|Creator:/g, "").trim() },
      actor: f.cast.slice(0, 4).map((n) => ({ "@type": "Person", name: n.replace(/\(.*?\)/g, "").trim() })),
      image: SITE_URL + `/img/p/${f.id}.jpg`,
    };
    emit(lang, filmUrl(f.id), page({
      lang, path: filmUrl(f.id),
      title: `${f.t} (${parseInt(f.y) || f.y}) — ${typeL(f.type, lang)}, ${lang === "de" ? "Cast, Trivia & Post-Credits" : "cast, trivia & post-credits"} · Knowhere`,
      desc: stripTags(tr(f, "plot", lang)).slice(0, 158),
      ogImage: `/img/p/${f.id}.jpg`, dataPage: "film", jsonld, crumbs: [[T[lang].nav.films, "/filme/"], [esc(f.t)]],
      body: filmBody(f, lang),
    }));
  }
  for (const c of CHARS) emit(lang, charUrl(c.id), page({ lang, path: charUrl(c.id), title: `${c.n} (${tr(c, "a", lang)}) — ${lang === "de" ? "Marvel-Charakter" : "Marvel character"} · Knowhere`, desc: stripTags(tr(c, "bio", lang)).slice(0, 158), ogImage: existsSync(`public/img/c/${c.id}.jpg`) ? `/img/c/${c.id}.jpg` : undefined, dataPage: "char", crumbs: [[T[lang].nav.chars, "/charaktere/"], [esc(c.n)]], body: charBody(c, lang) }));
  for (const t of TEAMS) emit(lang, teamUrl(t.id), page({ lang, path: teamUrl(t.id), title: `${tr(t, "n", lang)} — ${lang === "de" ? "Marvel-Team" : "Marvel team"} · Knowhere`, desc: stripTags(tr(t, "desc", lang)).slice(0, 158), dataPage: "team", crumbs: [["Teams", "/teams/"], [esc(tr(t, "n", lang))]], body: teamBody(t, lang) }));
  for (const a of ARTIFACTS) emit(lang, artUrl(a.id), page({ lang, path: artUrl(a.id), title: `${a.n} — ${lang === "de" ? "Marvel-Artefakt" : "Marvel artifact"} · Knowhere`, desc: stripTags(tr(a, "d", lang)).slice(0, 158), dataPage: "art", crumbs: [[T[lang].nav.arts, "/artefakte/"], [esc(a.n)]], body: artBody(a, lang) }));
  for (const p of PATHS) emit(lang, pathUrl(p.id), page({ lang, path: pathUrl(p.id), title: `${tr(p, "n", lang)} — ${lang === "de" ? "Storyline-Pfad" : "Storyline path"} · Knowhere`, desc: stripTags(tr(p, "intro", lang)).slice(0, 158), dataPage: "path", crumbs: [[T[lang].nav.paths, "/pfade/"], [esc(tr(p, "n", lang))]], body: pathBody(p, lang) }));
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
  ${p.bio ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Biografie" : "Biography"}</div><p>${esc(tr(p, "bio", lang))}${tr(p, "bio", lang).length >= 700 ? " …" : ""}</p></div>` : ""}
  ${(() => {
    const mr = MULTIROLE.find((m) => m.actor === p.n);
    if (!mr || mr.roles.length < 2) return "";
    return `<div class="fp-section"><div class="fp-label">${lang === "de" ? "🎭 Mehrfachrollen im Marvel-Kosmos" : "🎭 Multiple Marvel roles"}</div>
      <p style="margin-bottom:10px">${esc(tr(mr, "d", lang))}</p>
      <div class="ext-links">${mr.roles.map((r) => {
        const href = r.c && CSLUG[r.c] ? `${prefix}${charUrl(r.c)}` : r.f && FSLUG[r.f] ? `${prefix}${filmUrl(r.f)}` : null;
        const label = `${esc(r.r)}${r.note ? ` · ${esc(r.note)}` : ""}`;
        return href ? `<a href="${href}">${label}</a>` : `<span class="ext-links-static">${label}</span>`;
      }).join("")}</div></div>`;
  })()}
  ${wikiChars.length ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Figuren im Wiki" : "Characters in the wiki"}</div><div class="fp-chars">${wikiChars.map((c) => `<a class="fp-char" href="${prefix}${charUrl(c.id)}">${charImg(c.id, c.n, "fc-img")}<div class="fc-n">${esc(c.n)}</div></a>`).join("")}</div></div>` : ""}
  ${filmo.length ? `<div class="fp-section"><div class="fp-label">${lang === "de" ? "Im Marvel-Kosmos" : "In the Marvel universe"} · ${filmo.length}</div><div class="cp-films">${filmo.map(({ f, role }) => `<a class="radar-film" href="${prefix}${filmUrl(f.id)}" title="${esc(f.t)}">${posterImgW(f.id, f.t)}<div class="rf-t">${esc(f.t)}</div><div class="rf-d">${esc(role)}</div></a>`).join("")}</div></div>` : ""}
</main>`;
    emit(lang, personUrl(pid), page({
      lang, path: personUrl(pid),
      title: `${p.n} — ${lang === "de" ? "Marvel-Filmografie" : "Marvel filmography"} · Knowhere`,
      desc: (tr(p, "bio", lang) || (lang === "de" ? `${p.n}: alle Marvel-Auftritte im Überblick.` : `${p.n}: every Marvel appearance at a glance.`)).slice(0, 158),
      ogImage: existsSync(`public/img/a/${pid}.jpg`) ? `/img/a/${pid}.jpg` : undefined,
      dataPage: "person", crumbs: [[T[lang].nav.films, "/filme/"], [esc(p.n)]], body,
    }));
  }
}

/* Datenbank-Sektionen: Orte & Welten, Völker, Organisationen, Schauspieler-Index */
const CAT_META = {
  ort: { badge: "lc-ort", de: "Ort", en: "Place" },
  volk: { badge: "lc-volk", de: "Volk", en: "People" },
  org: { badge: "lc-org", de: "Organisation", en: "Organization" },
};
function lexDetailBody(e, lang, backPath, backLabel) {
  const prefix = lang === "en" ? "/en" : "";
  const m = CAT_META[e.cat];
  return `<main class="wrap fp" style="padding-bottom:70px;max-width:820px">
  ${e.img && existsSync(`public/img/${e.img}.jpg`) ? `<div class="fp-backdrop"><img src="/img/${e.img}.jpg" alt="" aria-hidden="true" fetchpriority="high"></div>` : ""}
  <a class="backlink" href="${prefix}${backPath}">${T[lang].back}</a>
  <span class="lex-cat ${m.badge}">${lang === "de" ? m.de : m.en}</span>
  <h1 class="metal fp-h1">${esc(tr(e, "n", lang))}</h1>
  ${e.sub ? `<div class="fp-meta"><b>${esc(tr(e, "sub", lang))}</b></div>` : ""}
  <div class="fp-section"><div class="fp-label">${T[lang].story}</div><p>${esc(tr(e, "d", lang))}</p></div>
  ${e.films && e.films.length ? `<div class="fp-section"><div class="fp-label">${T[lang].seen_in}</div>${miniFilmChips(e.films, lang)}</div>` : ""}
</main>`;
}
function catIndexCards(cat, lang) {
  const prefix = lang === "en" ? "/en" : "";
  return LEX_BY_CAT(cat).map((e) => `<a class="place-card" href="${prefix}${lexUrl(e)}">
    ${e.img && existsSync(`public/img/${e.img}.jpg`) ? `<img src="/img/${e.img}.jpg" alt="" loading="lazy">` : `<div class="pc-fb"></div>`}
    <div class="place-ov"><div class="place-n">${esc(tr(e, "n", lang))}</div><div class="place-s">${esc(tr(e, "sub", lang) || "")}</div></div></a>`).join("");
}
function universesGrid(lang) {
  const prefix = lang === "en" ? "/en" : "";
  return `<div class="uni-grid">` + UNIVERSES.map((u) => `<div class="uni-card${u.ev ? " ev" : ""}">
    <div class="uni-head"><div class="uni-num metal">${esc(u.num)}</div><div><div class="uni-name">${esc(tr(u, "n", lang))}</div><div class="uni-status">${esc(tr(u, "status", lang))}</div></div></div>
    <p>${esc(tr(u, "d", lang))}</p>
    <div class="cp-films">${u.sample.map((fid) => byId[fid] ? `<a class="radar-film" href="${prefix}${filmUrl(fid)}" title="${esc(byId[fid].t)}">${posterImgW(fid, byId[fid].t)}</a>` : "").join("")}</div>
  </div>`).join("") + `</div>`;
}
for (const lang of LANGS) {
  const de = lang === "de";
  emit(lang, "/orte/", page({ lang, path: "/orte/", title: (de ? "Marvel-Orte & Welten: von Asgard bis Battleworld" : "Marvel places & worlds") + " · Knowhere", desc: de ? "Alle wichtigen Orte und Welten des Marvel-Kinos: Asgard, Wakanda, das Quantenreich — plus alle Erde-Nummern des Multiversums." : "Every important place and world of Marvel cinema, plus all Earth numbers of the multiverse.", dataPage: "places", body:
    `<main class="wrap" style="padding:50px 22px 60px">
    ${secHead(de ? "Von Asgard bis Battleworld" : "From Asgard to Battleworld", de ? "Orte &amp; Welten" : "Places &amp; Worlds", de ? "Erst die Welten des Multiversums — dann die Orte, an denen die Geschichten spielen." : "First the worlds of the multiverse — then the places where the stories happen.")}
    <div class="subhead">${de ? "Die Welten · Erde-Nummern" : "The worlds · Earth numbers"}</div>
    ${universesGrid(lang)}
    <div class="subhead">${de ? "Die Orte" : "The places"}</div>
    <div class="char-grid">${catIndexCards("ort", lang)}</div>
  </main>` }));
  emit(lang, "/voelker/", page({ lang, path: "/voelker/", title: (de ? "Marvel-Völker & Spezies" : "Marvel peoples & species") + " · Knowhere", desc: de ? "Skrulle, Kree, Celestials, Mutanten & Co.: alle Völker und Spezies des Marvel-Kinos erklärt." : "Skrulls, Kree, Celestials, mutants & co: every people and species of Marvel cinema explained.", dataPage: "peoples", body:
    `<main class="wrap" style="padding:50px 22px 60px">
    ${secHead(de ? "Wer das Universum bevölkert" : "Who populates the universe", de ? "Völker &amp; Spezies" : "Peoples &amp; Species", "")}
    <div class="char-grid">${catIndexCards("volk", lang)}</div>
  </main>` }));
  for (const cat of ["ort", "volk", "org"]) {
    const backPath = cat === "ort" ? "/orte/" : cat === "volk" ? "/voelker/" : "/teams/";
    for (const e of LEX_BY_CAT(cat)) {
      emit(lang, lexUrl(e), page({ lang, path: lexUrl(e), title: `${tr(e, "n", lang)} — ${CAT_META[cat][lang === "de" ? "de" : "en"]} · Knowhere`, desc: tr(e, "d", lang).slice(0, 158), dataPage: "lexdetail",
        crumbs: [[cat === "ort" ? T[lang].nav.places : cat === "volk" ? T[lang].nav.peoples : T[lang].nav.teams, backPath], [esc(tr(e, "n", lang))]],
        body: lexDetailBody(e, lang, backPath, "") }));
    }
  }
  // Schauspieler-Index
  const actorList = Object.entries(PERSONS).sort((a, b) => a[1].n.localeCompare(b[1].n));
  emit(lang, "/schauspieler/", page({ lang, path: "/schauspieler/", title: (de ? "Alle Marvel-Schauspieler:innen" : "All Marvel actors") + " · Knowhere", desc: de ? `${actorList.length} Schauspieler:innen des Marvel-Kinos mit Biografie und kompletter Marvel-Filmografie.` : `${actorList.length} Marvel actors with bios and full Marvel filmographies.`, dataPage: "actors", body:
    `<main class="wrap" style="padding:50px 22px 60px">
    ${secHead(de ? "Das Ensemble hinter dem Ensemble" : "The ensemble behind the ensemble", de ? "Schauspieler:innen" : "Actors", de ? actorList.length + " Menschen, die das Marvel-Kino tragen — jede:r mit eigener Seite." : "")}
    <div class="wiki-tools"><input class="wiki-search" id="wikiSearch" type="search" placeholder="${de ? "Name suchen …" : "Search names …"}"></div>
    <div class="wgrid" id="wikiGrid">${actorList.map(([pid, p]) => `<a class="wcard" href="${lang === "en" ? "/en" : ""}${personUrl(pid)}" data-uni="p" data-type="P" data-t="${esc(p.n.toLowerCase())}">
      <div class="pw">${existsSync(`public/img/a/${pid}.jpg`) ? `<img src="/img/a/${pid}.jpg" class="cface" alt="${esc(p.n)}" loading="lazy">` : `<div class="poster-fallback"><div class="pf-t metal">${esc(p.n)}</div></div>`}</div>
      <div class="wt">${esc(p.n)}</div>${p.b ? `<div class="wy">*${p.b.slice(0, 4)}</div>` : ""}</a>`).join("")}</div>
  </main>` }));
}

/* Spiele */
for (const lang of LANGS) {
  const de = lang === "de";
  const prefix = lang === "en" ? "/en" : "";
  emit(lang, "/spiele/", page({ lang, path: "/spiele/", title: (de ? "Marvel-Videospiele: von Spider-Man bis Rivals" : "Marvel video games") + " · Knowhere", desc: de ? "Die wichtigsten Marvel-Spiele im Überblick — von Insomniacs Spider-Man über Marvel Rivals bis zu den legendären Tie-ins." : "The most important Marvel games — from Insomniac's Spider-Man to Marvel Rivals.", dataPage: "games", body:
    `<main class="wrap" style="padding:50px 22px 60px">
    ${secHead(de ? "Jenseits des Kinos" : "Beyond the movies", de ? "Die Spiele" : "The Games", de ? "Was sich zu spielen lohnt — und welche Filme dazu passen. Von AAA-Meisterwerken bis Kult-Tie-ins." : "What is worth playing — and which films go with it.")}
    <div class="games-grid">${GAMES.map((gm) => `<div class="game-card" id="${gm.id}">
      <div class="game-head"><div class="game-t">${esc(gm.t)}</div><div class="game-y">${esc(tr(gm, "y", lang))}</div></div>
      <div class="game-plat">${esc(tr(gm, "plat", lang))}</div>
      <p>${esc(tr(gm, "d", lang))}</p>
      ${gm.rel && gm.rel.length ? `<div class="lex-films">${gm.rel.map((fid) => byId[fid] ? `<a href="${prefix}${filmUrl(fid)}">${esc(byId[fid].t)}</a>` : "").join("")}</div>` : ""}
    </div>`).join("")}</div>
  </main>` }));
}

/* Tier-List-Builder (Filme + Charaktere, gleiche Engine) */
for (const lang of LANGS) {
  const de = lang === "de";
  const prefix = lang === "en" ? "/en" : "";
  const TIER_STR = de
    ? { copied: "Link kopiert! Schick ihn wem, der falsch liegt.", copyFail: "Konnte nicht kopieren — URL aus der Adressleiste teilen.", hint: "Poster antippen, dann eine Reihe antippen — oder einfach ziehen. Schnell-Modus: über ein Poster hovern und S, A, B, C oder D drücken (P = zurück in den Pool).", sharedTitle: "Du siehst eine geteilte Tier-List.", adopt: "Übernehmen & bearbeiten", own: "Eigene Liste erstellen", sorted: "einsortiert", share: "Teilen-Link kopieren", img: "Als Bild speichern", imgEmpty: "Erst einsortieren!", reset: "Zurücksetzen", sure: "Sicher? Nochmal klicken." }
    : { copied: "Link copied! Send it to someone who is wrong.", copyFail: "Could not copy — share the URL from the address bar.", hint: "Tap a poster, then tap a row — or just drag it. Quick mode: hover a poster and press S, A, B, C or D (P = back to the pool).", sharedTitle: "You are viewing a shared tier list.", adopt: "Adopt & edit", own: "Build your own list", sorted: "sorted", share: "Copy share link", img: "Save as image", imgEmpty: "Sort something first!", reset: "Reset", sure: "Sure? Click again." };
  const tierRowsHtml = () => [["s", "S"], ["a", "A"], ["b", "B"], ["c", "C"], ["d", "D"]].map(([k, l]) =>
    `<div class="tier-row" data-tier="${k}"><div class="tier-label tl-${k}">${l}</div><div class="tier-drop" data-tier="${k}"></div></div>`).join("");
  const tabs = (cur) => `<div class="seg tier-tabs"><a href="${prefix}/tierlist/"${cur === "f" ? ' class="sel"' : ""}>${de ? "Filme & Serien" : "Films & shows"}</a><a href="${prefix}/tierlist/charaktere/"${cur === "c" ? ' class="sel"' : ""}>${de ? "Charaktere" : "Characters"}</a><a href="${prefix}/tierlist/event/"${cur === "e" ? ' class="sel ev" ' : ' class="ev"'}>★ Doomsday</a></div>`;
  const tierPage = (cfg) => `<main class="wrap${cfg.cls ? " " + cfg.cls : ""}" style="padding:50px 22px 60px">
    ${secHead(cfg.kicker, cfg.h2, cfg.sub)}
    ${tabs(cfg.tab)}
    <div class="tier-shared" id="tierShared" hidden><span id="tierSharedT"></span> <button class="backlink" id="tierAdopt"></button> <a class="backlink" href="${prefix}${cfg.path}" id="tierOwn"></a></div>
    <div class="tier-tools">
      <button class="backlink" id="tierShare"></button>
      <button class="backlink" id="tierImg"></button>
      <button class="backlink" id="tierReset"></button>
      <span class="tier-stats" id="tierStats"></span>
    </div>
    <div class="tier-board" id="tierBoard">${tierRowsHtml()}</div>
    <div class="subhead" style="margin-top:34px">${de ? "Noch nicht einsortiert" : "Not sorted yet"}</div>
    <p class="tier-hint" id="tierHint"></p>
    <div class="tier-pool tier-drop" id="tierPool" data-tier="pool">${cfg.tiles}</div>
    ${cfg.extra || ""}
    <script type="application/json" id="tierData">${JSON.stringify(cfg.data)}</script>
    ${adSlot(T[lang])}
  </main>`;

  /* Filme & Serien */
  {
    const pool = FILMS.filter((f) => f.prio !== "future");
    const tile = (f) => `<button class="tier-item" data-id="${f.id}" draggable="true" title="${esc(f.t)} (${f.y})">${posterImgW(f.id, f.t)}<span class="ti-n">${esc(f.t)}</span></button>`;
    const rtTier = (f) => { const s = SCORES[f.id][0]; return s >= 90 ? "s" : s >= 75 ? "a" : s >= 60 ? "b" : s >= 40 ? "c" : "d"; };
    const scored = pool.filter((f) => SCORES[f.id]);
    const rtRows = [["s", "S"], ["a", "A"], ["b", "B"], ["c", "C"], ["d", "D"]].map(([k, l]) =>
      `<div class="tier-row rt"><div class="tier-label tl-${k}">${l}</div><div class="tier-drop">${scored.filter((f) => rtTier(f) === k).map((f) =>
        `<a class="tier-item rt" href="${prefix}${filmUrl(f.id)}" title="${esc(f.t)} · ${SCORES[f.id][0]} %">${posterImgW(f.id, f.t)}<span class="ti-n">${esc(f.t)} · ${SCORES[f.id][0]} %</span></a>`).join("")}</div></div>`).join("");
    emit(lang, "/tierlist/", page({ lang, path: "/tierlist/", title: (de ? "Marvel-Tier-List: erstelle dein eigenes Ranking" : "Marvel tier list: build your own ranking") + " · Knowhere", desc: de ? `Alle ${pool.length} Marvel-Filme & -Serien per Drag & Drop in S bis D einsortieren, speichern, als Link oder Bild teilen — plus die Daten-Tier-List nach Rotten Tomatoes.` : `Sort all ${pool.length} Marvel films & shows into S to D tiers, save your list and share it as a link or image — plus the data tier list based on Rotten Tomatoes.`, dataPage: "tierlist", body:
      tierPage({
        path: "/tierlist/", tab: "f",
        kicker: de ? "S-Tier oder Skip?" : "S tier or skip?", h2: de ? "Die Tier-List" : "The Tier List",
        sub: de ? "Alle Filme & Serien, dein Urteil: Poster in die Reihen ziehen (oder antippen). Deine Liste bleibt gespeichert — und lässt sich als Link oder Bild teilen." : "Every film & show, your verdict: drag posters into the rows (or tap). Your list is saved — and shareable as a link or image.",
        tiles: pool.map(tile).join(""),
        extra: `<details class="season" style="margin-top:44px"><summary>${de ? "Zum Vergleich: die Daten-Tier-List (Rotten Tomatoes)" : "For comparison: the data tier list (Rotten Tomatoes)"}</summary>
      <p class="tier-hint" style="margin:10px 0 14px">${de ? "S ≥ 90 % · A ≥ 75 % · B ≥ 60 % · C ≥ 40 % · D darunter — rein rechnerisch, ohne Meinung." : "S ≥ 90% · A ≥ 75% · B ≥ 60% · C ≥ 40% · D below — pure math, no opinion."}</p>
      <div class="tier-board">${rtRows}</div>
    </details>`,
        data: { order: pool.map((f) => f.id), key: "msa-tierlist", file: "knowhere-tierlist", heading: de ? "Meine Marvel-Tier-List" : "My Marvel tier list", str: TIER_STR },
      }) }));
  }

  /* Doomsday-Event: nur die Road-to-Doomsday-Titel */
  {
    const foxIds = ["xmen1", "x2", "x3", "logan", "dp1", "dp2", "dofp"];
    const epool = [...FILMS.filter((f) => f.uni === "mcu" && (f.prio === "pflicht" || f.prio === "empfohlen")), ...foxIds.map((id) => byId[id])];
    const tile = (f) => `<button class="tier-item" data-id="${f.id}" draggable="true" title="${esc(f.t)} (${f.y})">${posterImgW(f.id, f.t)}<span class="ti-n">${esc(f.t)}</span></button>`;
    emit(lang, "/tierlist/event/", page({ lang, path: "/tierlist/event/", title: (de ? "Doomsday-Tier-List: ranke die Road to Doomsday" : "Doomsday tier list: rank the Road to Doomsday") + " · Knowhere", desc: de ? `Die ${epool.length} Titel der Doomsday-Vorbereitung — Saga-Pflichtprogramm plus Fox-Erbe — in S bis D einsortieren, speichern und teilen.` : `The ${epool.length} titles of the Doomsday prep — saga essentials plus the Fox legacy — sorted into S to D tiers, saved and shareable.`, dataPage: "tierlist", crumbs: [[de ? "Tier-List" : "Tier list", "/tierlist/"], ["★ Doomsday"]], body:
      tierPage({
        path: "/tierlist/event/", tab: "e", cls: "tier-event",
        kicker: "Every Story leads to Doom", h2: de ? "Die Doomsday-Tier-List" : "The Doomsday Tier List",
        sub: de ? `Nur die ${epool.length} Titel, die für Doomsday zählen: das Pflicht- und Empfohlen-Programm der Saga plus das Fox-Erbe. Welcher Teil der Vorbereitung ist S-Tier — und was hältst du für Kür?` : `Only the ${epool.length} titles that matter for Doomsday: the saga's essential and recommended program plus the Fox legacy. Which part of the prep is S tier — and what do you consider optional?`,
        tiles: epool.map(tile).join(""),
        data: { order: epool.map((f) => f.id), key: "msa-tierlist-event", file: "knowhere-tierlist-doomsday", heading: de ? "Meine Road-to-Doomsday-Tier-List" : "My Road to Doomsday tier list", str: TIER_STR },
      }) }));
  }

  /* Charaktere */
  {
    const cpool = CHARS;
    const ctile = (c) => `<button class="tier-item" data-id="${c.id}" draggable="true" title="${esc(c.n)}">${charImg(c.id, c.n, "")}<span class="ti-n">${esc(c.n)}</span></button>`;
    emit(lang, "/tierlist/charaktere/", page({ lang, path: "/tierlist/charaktere/", title: (de ? "Marvel-Charaktere-Tier-List: dein Ranking" : "Marvel character tier list: your ranking") + " · Knowhere", desc: de ? `Alle ${cpool.length} Marvel-Charaktere in S bis D einsortieren — von Doom bis Howard the Duck. Speichern und als Link oder Bild teilen.` : `Sort all ${cpool.length} Marvel characters into S to D tiers — from Doom to Howard the Duck. Save and share as a link or image.`, dataPage: "tierlist", crumbs: [[de ? "Tier-List" : "Tier list", "/tierlist/"], [de ? "Charaktere" : "Characters"]], body:
      tierPage({
        path: "/tierlist/charaktere/", tab: "c", cls: "tier-chars",
        kicker: de ? "Wer trägt das Franchise?" : "Who carries the franchise?", h2: de ? "Die Charaktere-Tier-List" : "The Character Tier List",
        sub: de ? `${cpool.length} Figuren, dein Urteil — nach Liebling, Schreibqualität oder purer Power, deine Regeln.` : `${cpool.length} characters, your verdict — by favorite, writing quality or pure power, your rules.`,
        tiles: cpool.map(ctile).join(""),
        data: { order: cpool.map((c) => c.id), key: "msa-tierlist-chars", file: "knowhere-tierlist-charaktere", heading: de ? "Meine Marvel-Charaktere-Tier-List" : "My Marvel character tier list", str: TIER_STR },
      }) }));
  }
}

/* Friedhof, Roadmap, Zitate */
for (const lang of LANGS) {
  const de = lang === "de";
  const prefix = lang === "en" ? "/en" : "";

  const graveBody = `<main class="wrap" style="padding:50px 22px 60px;max-width:900px">
  ${secHead(de ? "Was fast passiert wäre" : "What almost happened", de ? "Der Friedhof" : "The Graveyard", de ? "Gecancelte Filme, beerdigte Serien, verlorene Visionen — die Marvel-Geschichte, die nie ins Kino kam. Jede Grabstelle mit dem, was von ihr übrig blieb." : "Canceled films, buried shows, lost visions — the Marvel history that never reached theaters. Every grave with what remained of it.")}
  ${GRAVEYARD.map((e) => `<div class="grave-card" id="${e.id}">
    <div class="grave-head"><div><div class="grave-t">${esc(e.t)}</div><div class="grave-y">${esc(e.y)} · ${esc(tr(e, "status", lang))}</div></div><div class="grave-cross metal">✝</div></div>
    <div class="grave-sub">${esc(tr(e, "sub", lang))}</div>
    <p>${esc(tr(e, "d", lang))}</p>
    <div class="grave-legacy"><b>${de ? "Was blieb:" : "What remained:"}</b> ${esc(tr(e, "legacy", lang))}</div>
  </div>`).join("")}
  ${adSlot(T[lang])}
</main>`;
  emit(lang, "/friedhof/", page({ lang, path: "/friedhof/", title: (de ? "Der Friedhof: Marvels gecancelte Filme & Projekte" : "The Graveyard: Marvel's canceled films & projects") + " · Knowhere", desc: de ? "Raimis Spider-Man 4, Edgar Wrights Ant-Man, die Sinister Six, Kang Dynasty: alle gecancelten Marvel-Projekte — und was von ihnen überlebte." : "Raimi's Spider-Man 4, Edgar Wright's Ant-Man, the Sinister Six, Kang Dynasty: every canceled Marvel project — and what survived of them.", dataPage: "grave", body: graveBody }));

  const RM_STATUS = de
    ? { fix: ["Termin steht", "st-fix"], sicher: ["kommt sicher", "st-sicher"], wackelt: ["wackelt", "st-wackel"], geruecht: ["Gerücht", "st-ger"] }
    : { fix: ["date locked", "st-fix"], sicher: ["definitely coming", "st-sicher"], wackelt: ["shaky", "st-wackel"], geruecht: ["rumor", "st-ger"] };
  const rmEntry = (e) => {
    const f = e.rel && byId[e.rel];
    const hasPoster = f && existsSync(`public/img/p/${e.rel}.jpg`);
    return `<div class="rmx-item">
    <span class="rmx-node ${RM_STATUS[e.status][1]}"></span>
    <div class="rmx-card${e.status === "geruecht" ? " rmx-rumor" : ""}">
      ${hasPoster ? `<a class="rmx-poster" href="${prefix}${filmUrl(e.rel)}"><img src="/img/p/${e.rel}.jpg" alt="" loading="lazy"></a>` : ""}
      <div class="rmx-main">
        <div class="rmx-t">${esc(e.t)}<span class="rm-type">${esc(tr(e, "type", lang))}</span></div>
        <div class="rm-w"><i class="rm-dot ${RM_STATUS[e.status][1]}"></i> ${esc(tr(e, "w", lang))} · ${RM_STATUS[e.status][0]}</div>
        <p>${esc(tr(e, "d", lang))}</p>
        ${f ? `<a class="rm-rel" href="${prefix}${filmUrl(e.rel)}">→ ${esc(f.t)} ${de ? "im Archiv" : "in the archive"}</a>` : ""}
      </div>
    </div></div>`;
  };
  const rmGroup = (hz, kicker, title) => {
    const items = ROADMAP.filter((e) => e.hz === hz);
    if (!items.length) return "";
    return `<div class="rmx-group"><div class="rmx-year"><span class="rmx-year-k">${kicker}</span><span class="metal rmx-year-t">${title}</span></div>${items.map(rmEntry).join("")}</div>`;
  };
  const heroCard = (id, dateIso, dateTxt, tag) => `<a class="rmx-hero" href="${prefix}${filmUrl(id)}">
    <img class="rmx-hero-bg" src="/img/b/${id}.jpg" alt="" loading="lazy">
    <div class="rmx-hero-in">
      ${existsSync(`public/img/l/${id}.png`) ? `<img class="rmx-hero-logo" src="/img/l/${id}.png" alt="${esc(byId[id].t)}">` : `<div class="rmx-hero-t metal">${esc(byId[id].t)}</div>`}
      <div class="rmx-hero-cd"><span class="rmx-hero-n metal" data-days-until="${dateIso}">···</span><span class="rmx-hero-l">${de ? "Tage" : "days"}</span></div>
      <div class="rmx-hero-d">${dateTxt} · ${tag}</div>
    </div></a>`;
  const roadmapBody = `<main class="wrap" style="padding:50px 22px 60px;max-width:960px">
  ${secHead(de ? "Was als Nächstes kommt" : "What comes next", de ? "Die Roadmap" : "The Roadmap", de ? "Zwei fixe Termine, ein Fahrplan dahinter — und die Gerüchteküche brodelt. Status-Ampel: ehrlich, nicht offiziell." : "Two locked dates, a schedule behind them — and the rumor mill is boiling. Status lights: honest, not official.")}
  <div class="rmx-heroes">
    ${heroCard("doomsday", "2026-12-18", de ? "18. Dezember 2026" : "December 18, 2026", de ? "Der Anfang vom Ende" : "The beginning of the end")}
    ${heroCard("secretwars", "2027-12-17", de ? "17. Dezember 2027" : "December 17, 2027", de ? "Das Saga-Finale" : "The saga finale")}
  </div>
  <div class="rm-legend" style="margin-top:26px">${Object.values(RM_STATUS).map(([l, c]) => `<span><i class="rm-dot ${c}"></i> ${l}</span>`).join("")}</div>
  <div class="rmx-line">
    ${rmGroup("2026", de ? "Der Countdown läuft" : "The countdown is running", "2026")}
    ${rmGroup("2027", de ? "Das Jahr dazwischen" : "The year in between", "2027")}
    ${rmGroup("2028", de ? "Die nächste Welle" : "The next wave", "2028")}
    ${rmGroup("later", de ? "Die neue Welt" : "The new world", de ? "Nach Secret Wars" : "After Secret Wars")}
    ${rmGroup("rumor", de ? "Nichts davon ist bestätigt — alles davon wird diskutiert" : "None of it confirmed — all of it debated", de ? "Die Gerüchteküche" : "The Rumor Mill")}
  </div>
  ${adSlot(T[lang])}
</main>`;
  emit(lang, "/roadmap/", page({ lang, path: "/roadmap/", title: (de ? "Marvel-Roadmap: alle kommenden Filme, Serien & Gerüchte" : "Marvel roadmap: every upcoming film, series & rumor") + " · Knowhere", desc: de ? "Von Doomsday über Secret Wars bis zum X-Men-Neustart: alle kommenden Marvel-Projekte und die heißesten Gerüchte mit Status-Einschätzung." : "From Doomsday through Secret Wars to the X-Men reboot: every upcoming Marvel project and the hottest rumors, with status ratings.", dataPage: "roadmap", body: roadmapBody }));

  const quotesBody = `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(de ? "Sätze, die blieben" : "Lines that stayed", de ? "Das Zitate-Archiv" : "The Quote Archive", de ? QUOTES.length + " ikonische Zeilen im Original — mit Sprecher:in und Film. Eines davon steht jeden Tag auf der Startseite." : QUOTES.length + " iconic lines in the original — with speaker and film. One of them is on the homepage every day.")}
  <div class="wiki-tools"><input class="wiki-search" id="quoteSearch" type="search" placeholder="${de ? "Zitat, Figur oder Film suchen …" : "Search quote, character or film …"}"></div>
  <div class="q-grid" id="quoteGrid">${QUOTES.map((q) => {
    const f = q.f && byId[q.f];
    const note = lang === "en" ? q.n_en : q.n;
    return `<div class="q-card" data-t="${esc((q.q + " " + q.by + " " + (f ? f.t : "")).toLowerCase())}">
    <div class="q-text">${de ? "„" : "“"}${esc(q.q)}${de ? "“" : "”"}</div>
    <div class="q-by">— ${q.c && CSLUG[q.c] ? `<a href="${prefix}${charUrl(q.c)}">${esc(q.by)}</a>` : esc(q.by)}${f ? ` · <a href="${prefix}${filmUrl(q.f)}">${esc(f.t)}</a>` : ""}</div>
    ${note ? `<div class="q-note">${esc(note)}</div>` : ""}
  </div>`;
  }).join("")}</div>
  ${adSlot(T[lang])}
</main>`;
  emit(lang, "/zitate/", page({ lang, path: "/zitate/", title: (de ? "Marvel-Zitate: die ikonischen Zeilen des Franchise" : "Marvel quotes: the franchise's iconic lines") + " · Knowhere", desc: de ? `${QUOTES.length} ikonische Marvel-Zitate von „I am Iron Man" bis „New mask, same task" — durchsuchbar, mit Figur und Film.` : `${QUOTES.length} iconic Marvel quotes from 'I am Iron Man' to 'New mask, same task' — searchable, with character and film.`, dataPage: "quotes", body: quotesBody }));
}

/* Lexikon & FAQ */
const LEX_CATS = { ereignis: ["Ereignisse", "Events"], konzept: ["Konzepte & Kräfte", "Concepts & powers"] };
function lexikonBody(lang) {
  const de = lang === "de";
  const prefix = lang === "en" ? "/en" : "";
  return `<main class="wrap" style="padding:50px 22px 60px">
  ${secHead(de ? "Alles, was man wissen muss" : "Everything you need to know", de ? "Das Lexikon" : "The Lexicon", de ? "Orte, Völker, Organisationen, Ereignisse und Konzepte des Marvel-Kinos — jeder Begriff erklärt, mit den Filmen dazu. Auch über die Suche oben erreichbar." : "Places, peoples, organizations, events and concepts of Marvel cinema — every term explained, with the films to match.")}
  <div class="wiki-tools">
    <input class="wiki-search" id="lexSearch" type="search" placeholder="${de ? "Begriff suchen …" : "Search terms …"}">
    <div class="seg" id="lexCat"><button class="sel" data-cat="alle">${T[lang].all}</button>${Object.entries(LEX_CATS).map(([k, v]) => `<button data-cat="${k}">${de ? v[0] : v[1]}</button>`).join("")}</div>
  </div>
  <div class="lex-grid">${LEXIKON.filter((e) => LEX_CATS[e.cat]).map((e) => `<div class="lex-card" id="${e.id}" data-cat="${e.cat}" data-t="${esc((e.n + " " + tr(e, "n", lang) + " " + tr(e, "d", lang)).toLowerCase())}">
    <span class="lex-cat lc-${e.cat}">${de ? LEX_CATS[e.cat][0] : LEX_CATS[e.cat][1]}</span>
    <div class="lex-n">${esc(tr(e, "n", lang))}</div>
    <p>${esc(tr(e, "d", lang))}</p>
    ${e.films && e.films.length ? `<div class="lex-films">${e.films.map((fid) => byId[fid] ? `<a href="${prefix}${filmUrl(fid)}">${esc(byId[fid].t)}</a>` : "").join("")}</div>` : ""}
  </div>`).join("")}</div>
</main>`;
}
const FAQ_DE = [
  ["In welcher Reihenfolge soll ich die Marvel-Filme schauen?", `Für Einsteiger: Release-Reihenfolge — so wurden die Geschichten erzählt und Überraschungen funktionieren. Wer die Geschichte in-universe erleben will, findet in der <a href="/chronik/">Chronik</a> die Ereignis-Reihenfolge und auf der <a href="/event/">Doomsday-Seite</a> die komplette Saga-Timeline zum Abhaken.`],
  ["Was muss ich vor Avengers: Doomsday gesehen haben?", `Die kurze Antwort: Loki (beide Staffeln), No Way Home, Multiverse of Madness, Deadpool & Wolverine, Thunderbolts* und First Steps. Die komplette gewichtete Liste mit Pflicht/Empfohlen-Filter steht im <a href="/event/">Event-Hub</a> — Häkchen setzen, Restzeit ablesen.`],
  ["Was ist der Unterschied zwischen MCU, X-Men-Filmen und den Sony-Filmen?", `Drei getrennt gestartete Film-Universen: das MCU (Disney/Marvel Studios, seit 2008), die Fox-X-Men-Welt (2000–2020) und Sonys Spider-Man-Kosmos. Seit dem Multiversum sind sie offiziell Parallelwelten derselben Realität — die Details erklärt die <a href="/multiversum/">Multiversum-Karte</a>.`],
  ["Sind die Netflix-Serien (Daredevil & Co.) Kanon?", `Grauzone mit klarer Tendenz: Charlie Cox' Daredevil, D'Onofrios Kingpin und Bernthals Punisher wurden ins MCU übernommen und sind damit faktisch Kanon. Der Rest (Jessica Jones, Luke Cage, Iron Fist) schwebt — nichts widerspricht ihnen, nichts bestätigt sie.`],
  ["Was sind der Snap und der Blip?", `Der Snap (2018): Thanos löscht mit den Infinity-Steinen die Hälfte allen Lebens aus. Der Blip (2023): Die Avengers holen alle zurück — fünf Jahre später, kein Tag gealtert. Das Trauma dazwischen prägt fast jede Geschichte seither. Mehr im <a href="/lexikon/#snap-lex">Lexikon</a>.`],
  ["Lohnt es sich, im Kino bis nach dem Abspann zu bleiben?", `Bei Marvel: praktisch immer. Auf jeder Filmseite hier stehen die Szenen (spoiler-geschützt) samt „Führt zu"-Verkettung — und die <a href="/pfade/">Post-Credit-Karte</a> zeigt, wie seit 2008 alles zusammenhängt.`],
  ["Was bedeutet Erde-616?", `Die offizielle Nummer des Haupt-MCU-Universums (vergeben in Multiverse of Madness). Comic-Puristen meinen mit 616 allerdings die Haupt-Comicwelt — der Nerd-Streit dazu ist selbst schon Folklore. Alle Erde-Nummern: <a href="/multiversum/">Multiversum</a>.`],
  ["Wo kann ich die Filme streamen?", `Auf jeder Filmseite steht die aktuelle Verfügbarkeit für Deutschland (Abo und Leihe), live gespeist aus TMDB/JustWatch-Daten. Kurzfassung: MCU und X-Men fast komplett auf Disney+, die Sony-Spider-Man-Ecke wechselnd bei Netflix & Co.`],
  ["Warum spielt Robert Downey Jr. jetzt Doctor Doom?", `Nach der Trennung von Jonathan Majors brauchte die Saga 2023 einen neuen Endgegner — Marvel ersetzte Kang durch den größten Marvel-Schurken überhaupt und besetzte ihn mit dem Gesicht des MCU: „New mask, same task." Ob Doom eine Stark-Variante ist, ist DIE Theorie-Frage — mehr im <a href="/event/">Event-Hub</a>.`],
  ["Wann kommen Avengers: Secret Wars und die neuen X-Men?", `Secret Wars beendet die Multiverse Saga am 17. Dezember 2027. Danach gilt ein Neustart der X-Men mit frischem Cast als sicherster offener Plan Hollywoods — vermutlich in einer durch Secret Wars neu geordneten Zeitlinie.`],
  ["Ist Deadpool jetzt im MCU?", `Ja — über die TVA: Deadpool & Wolverine verdrahtete das alte Fox-Universum (Erde-10005) offiziell mit dem MCU-Multiversum. Wade nennt sich seitdem „Marvel Jesus" und niemand kann es ihm verbieten.`],
  ["Wer ist der stärkste Charakter im Marvel-Kino?", `Ehrliche Antwort: Es gibt kein offizielles Ranking, und Drehbücher schlagen Kräftetabellen. Die üblichen Verdächtigen: Wanda (Chaosmagie), Sentry (tausend explodierende Sonnen), Captain Marvel, der Phoenix — und ab Dezember vermutlich Doom. Messbares gibt es bei den <a href="/rekorde/">Rekorden</a>.`],
];
const FAQ_EN = [
  ["In what order should I watch the Marvel films?", `For newcomers: release order — that is how the stories were told and how the surprises work. If you want to experience the story in-universe, the <a href="/en/chronik/">timeline</a> has the event order and the <a href="/en/event/">Doomsday page</a> the complete saga timeline with checkboxes.`],
  ["What do I need to have seen before Avengers: Doomsday?", `The short answer: Loki (both seasons), No Way Home, Multiverse of Madness, Deadpool & Wolverine, Thunderbolts* and First Steps. The complete weighted list with an essential/recommended filter is in the <a href="/en/event/">event hub</a> — tick things off and see your remaining runtime.`],
  ["What is the difference between the MCU, the X-Men films and the Sony films?", `Three separately launched film universes: the MCU (Disney/Marvel Studios, since 2008), the Fox X-Men world (2000–2020) and Sony's Spider-Man cosmos. Since the multiverse they are officially parallel worlds of the same reality — the details are on the <a href="/en/multiversum/">multiverse map</a>.`],
  ["Are the Netflix series (Daredevil & co.) canon?", `A gray zone with a clear trend: Charlie Cox's Daredevil, D'Onofrio's Kingpin and Bernthal's Punisher were carried over into the MCU and are de facto canon. The rest (Jessica Jones, Luke Cage, Iron Fist) floats — nothing contradicts them, nothing confirms them.`],
  ["What are the Snap and the Blip?", `The Snap (2018): Thanos erases half of all life with the Infinity Stones. The Blip (2023): the Avengers bring everyone back — five years later, not a day older. The trauma in between shapes almost every story since. More in the <a href="/en/lexikon/#snap-lex">lexicon</a>.`],
  ["Is it worth staying in the theater until after the credits?", `With Marvel: practically always. Every film page here lists the scenes (spoiler-protected) including the "leads to" chain — and the <a href="/en/pfade/">post-credit map</a> shows how everything has connected since 2008.`],
  ["What does Earth-616 mean?", `The official number of the main MCU universe (assigned in Multiverse of Madness). Comic purists, however, mean the main comics world by 616 — the nerd dispute about it is folklore in its own right. All Earth numbers: <a href="/en/multiversum/">multiverse</a>.`],
  ["Where can I stream the films?", `Every film page shows current availability for Germany (subscription and rental), fed live from TMDB/JustWatch data. Short version: MCU and X-Men almost completely on Disney+, the Sony Spider-Man corner rotating on Netflix & co.`],
  ["Why is Robert Downey Jr. playing Doctor Doom now?", `After parting ways with Jonathan Majors, the saga needed a new final boss in 2023 — Marvel replaced Kang with the greatest Marvel villain of all and cast him with the face of the MCU: "New mask, same task." Whether Doom is a Stark variant is THE theory question — more in the <a href="/en/event/">event hub</a>.`],
  ["When are Avengers: Secret Wars and the new X-Men coming?", `Secret Wars ends the Multiverse Saga on December 17, 2027. After that, an X-Men reboot with a fresh cast is considered Hollywood's safest open plan — presumably in a timeline reordered by Secret Wars.`],
  ["Is Deadpool in the MCU now?", `Yes — via the TVA: Deadpool & Wolverine officially wired the old Fox universe (Earth-10005) into the MCU multiverse. Wade has called himself "Marvel Jesus" ever since, and nobody can stop him.`],
  ["Who is the strongest character in Marvel cinema?", `Honest answer: there is no official ranking, and scripts beat power charts. The usual suspects: Wanda (chaos magic), Sentry (a thousand exploding suns), Captain Marvel, the Phoenix — and from December on, presumably Doom. For measurable things, see the <a href="/en/rekorde/">records</a>.`],
];
const FAQI = (lang) => (lang === "de" ? FAQ_DE : FAQ_EN);
function faqBody(lang) {
  const de = lang === "de";
  return `<main class="wrap" style="padding:50px 22px 60px;max-width:800px">
  ${secHead("FAQ", de ? "Häufige Fragen" : "Frequently asked questions", de ? "Die Fragen, die jeder googelt — beantwortet und verlinkt." : "The questions everyone googles — answered and linked.")}
  ${FAQI(lang).map(([q, a]) => `<details class="season faq-item"><summary>${q}</summary><div class="faq-a"><p>${a}</p></div></details>`).join("")}
</main>`;
}
const faqLd = (lang) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQI(lang).map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: stripTags(a) } })) });
for (const lang of LANGS) {
  emit(lang, "/lexikon/", page({ lang, path: "/lexikon/", title: (lang === "de" ? "Das Marvel-Lexikon: alle Begriffe erklärt" : "The Marvel lexicon") + " · Knowhere", desc: lang === "de" ? "Orte, Völker, Organisationen, Ereignisse und Konzepte des Marvel-Kinos — über 70 Begriffe erklärt, von Asgard bis Vibranium." : "Places, peoples, organizations, events and concepts of Marvel cinema — 70+ terms explained.", dataPage: "lex", body: lexikonBody(lang) }));
  emit(lang, "/faq/", page({ lang, path: "/faq/", title: (lang === "de" ? "Marvel-FAQ: die häufigsten Fragen" : "Marvel FAQ") + " · Knowhere", desc: lang === "de" ? "Reihenfolge, Kanon, Snap & Blip, Streaming, Doomsday-Vorbereitung: die häufigsten Marvel-Fragen beantwortet." : "Watch order, canon, Snap & Blip, streaming — the most common Marvel questions answered.", dataPage: "faq", jsonld: faqLd(lang), body: faqBody(lang) }));
}

/* Rechtliches */
for (const lang of LANGS) {
  const imp = `<main class="wrap fp" style="padding-bottom:70px;max-width:760px">
  <h1 class="metal fp-h1">Impressum</h1>
  <div class="fp-section"><div class="fp-label">Angaben gemäß § 5 ECG und § 25 MedienG</div>
    <p><b>Nico Grim</b><br>Max-Jellinek-Gasse 6/1<br>1210 Wien<br>Österreich</p>
    <p style="margin-top:10px">Kontakt: <a href="mailto:nicogrim12@gmail.com">nicogrim12@gmail.com</a></p>
    <p style="margin-top:14px">Offenlegung gemäß § 25 MedienG: Diese Website ist ein privates, nicht-kommerzielles Fan-Projekt. Grundlegende Richtung: Katalogisierung und Besprechung von Marvel-Verfilmungen.</p></div>
  <div class="fp-section"><div class="fp-label">Hinweis</div>
    <p>Knowhere ist ein nicht-kommerzielles Fan-Projekt und steht in keiner Verbindung zu Marvel, The Walt Disney Company, Sony Pictures oder TMDB. Alle Marken, Titel und Filmmaterialien gehören ihren jeweiligen Rechteinhabern. Poster, Szenenbilder und Filmdaten stammen von <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a> bzw. Wikipedia (Fair Use).</p></div>
</main>`;
  const ds = `<main class="wrap fp" style="padding-bottom:70px;max-width:760px">
  <h1 class="metal fp-h1">Datenschutz</h1>
  <div class="fp-section"><div class="fp-label">Kurzfassung</div>
    <p>Diese Seite verzichtet auf Tracking, Werbung und Cookies. Es werden keine personenbezogenen Daten erhoben, gespeichert oder weitergegeben.</p></div>
  <div class="fp-section"><div class="fp-label">Lokale Speicherung</div>
    <p>Watchlist-Fortschritt und Spoiler-Einstellung liegen ausschließlich im localStorage deines Browsers, verlassen dein Gerät nicht und lassen sich dort jederzeit löschen.</p></div>
  <div class="fp-section"><div class="fp-label">Hosting</div>
    <p>Gehostet bei Vercel Inc. (USA). Beim Aufruf werden technisch notwendige Verbindungsdaten (z. B. IP-Adresse) zur Auslieferung verarbeitet (Art. 6 Abs. 1 lit. f DSGVO).</p></div>
  <div class="fp-section"><div class="fp-label">YouTube (Click-to-Play)</div>
    <p>Videos laden erst nach aktivem Klick über youtube-nocookie.com. Erst dann werden Daten an Google übertragen.</p></div>
</main>`;
  emit(lang, "/impressum/", page({ lang, path: "/impressum/", title: "Impressum · Knowhere", desc: "Impressum von Knowhere.", dataPage: "legal", noindex: true, body: imp }));
  emit(lang, "/datenschutz/", page({ lang, path: "/datenschutz/", title: "Datenschutz · Knowhere", desc: "Datenschutzerklärung von Knowhere.", dataPage: "legal", noindex: true, body: ds }));
}
writeFileSync(join(OUT, "site.webmanifest"), JSON.stringify({
  name: "Knowhere — Das Marvel-Fanarchiv", short_name: "Knowhere",
  start_url: "/", display: "standalone", background_color: "#07100a", theme_color: "#07100a",
  icons: [{ src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
}, null, 1));

/* 404 */
writeFileSync(join(OUT, "404.html"), page({ lang: "de", path: "/404", title: "404 · Knowhere", desc: "Seite nicht gefunden.", dataPage: "404", noindex: true, body: `<main class="wrap fp" style="position:relative;min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
  <div class="fp-backdrop" style="height:100%"><img src="/img/b/doomsday.jpg" alt="" aria-hidden="true"></div>
  <h1 class="metal" style="font-family:var(--display);font-weight:700;font-size:clamp(90px,18vw,180px);line-height:1">404</h1>
  <p style="font-family:var(--display);font-weight:600;font-size:22px;text-transform:uppercase;letter-spacing:0.2em;color:#cfe0d4">Diese Seite wurde gesnapt.</p>
  <p style="color:var(--muted);max-width:46ch;margin-top:10px">Die Hälfte aller URLs hat es nicht geschafft. Vielleicht bringt der Blip sie zurück — bis dahin:</p>
  <div class="tl-controls" style="margin-top:26px"><a class="backlink" href="/">Zum Start</a><a class="backlink" href="/filme/">Alle Filme &amp; Serien</a><a class="backlink" href="/event/">★ Doomsday</a></div>
</main>` }));

/* Suche-Index — pro Sprache (search.json / search-en.json), Links jeweils mit Prefix */
mkdirSync(join(OUT, "assets"), { recursive: true });
let searchCount = 0;
for (const lang of LANGS) {
  const en = lang === "en";
  const search = [
    ...FILMS.map((f) => ({ t: f.t, s: `${f.y} · ${typeL(f.type, lang)} · ${uniL(f.uni, lang)}`, u: filmUrl(f.id), i: existsSync(`public/img/p/${f.id}.jpg`) ? `/img/p/${f.id}.jpg` : null, k: "f", q: f.t.toLowerCase() })),
    ...CHARS.map((c) => ({ t: c.n, s: `${tr(c, "a", lang)} · ${c.act}`, u: charUrl(c.id), i: existsSync(`public/img/c/${c.id}.jpg`) ? `/img/c/${c.id}.jpg` : null, k: "c", q: (c.n + " " + c.a + " " + c.act).toLowerCase() })),
    ...TEAMS.map((t) => ({ t: tr(t, "n", lang), s: tr(t, "sub", lang), u: teamUrl(t.id), i: null, k: "t", q: (t.n + " " + t.sub + " " + (t.sub_en || "")).toLowerCase() })),
    ...ARTIFACTS.map((a) => ({ t: a.n, s: tr(a, "sub", lang), u: artUrl(a.id), i: null, k: "a", q: (a.n + " " + a.sub + " " + (a.sub_en || "")).toLowerCase() })),
    ...Object.entries(PERSONS).map(([pid, p]) => ({ t: p.n, s: en ? "Actor" : "Schauspieler:in", u: personUrl(pid), i: existsSync(`public/img/a/${pid}.jpg`) ? `/img/a/${pid}.jpg` : null, k: "c", q: p.n.toLowerCase() })),
    ...LEXIKON.map((e) => ({ t: tr(e, "n", lang), s: tr(e, "sub", lang) || (en ? "Lexicon" : "Lexikon"), u: lexUrl(e), i: null, k: "l", q: (e.n + " " + tr(e, "n", lang) + " " + tr(e, "d", lang).slice(0, 80)).toLowerCase() })),
    ...GAMES.map((gm) => ({ t: gm.t, s: `${tr(gm, "y", lang)} · ${en ? "Game" : "Spiel"}`, u: `/spiele/#${gm.id}`, i: null, k: "g", q: (gm.t + " spiel game " + gm.plat).toLowerCase() })),
    ...GRAVEYARD.map((e) => ({ t: e.t, s: tr(e, "sub", lang), u: `/friedhof/#${e.id}`, i: null, k: "l", q: (e.t + " " + e.sub + " " + (e.sub_en || "") + " gecancelt canceled friedhof graveyard").toLowerCase() })),
  ];
  searchCount = search.length;
  writeFileSync(join(OUT, "assets", en ? "search-en.json" : "search.json"), JSON.stringify(search));
}

/* Assets, Sitemap, Robots, Favicon, vercel */
cpSync("site/static/style.css", join(OUT, "assets", "style.css"));
cpSync("site/static/app.js", join(OUT, "assets", "app.js"));
writeFileSync(join(OUT, "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#07100a"/><circle cx="50" cy="50" r="34" fill="none" stroke="#3fdc8c" stroke-width="5"/><text x="50" y="64" font-size="42" text-anchor="middle" font-family="Arial Narrow, sans-serif" font-weight="bold" fill="#eafff2">K</text></svg>`);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
writeFileSync(join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  written.map((w) => `<url><loc>${SITE_URL}${w.path}</loc></url>`).join("\n") + `\n</urlset>`);

console.log(`Seiten: ${written.length} | Such-Index: ${searchCount} Einträge x ${LANGS.length} Sprachen | Output: ${OUT}/`);
