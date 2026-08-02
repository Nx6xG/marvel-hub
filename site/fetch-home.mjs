// Startseiten-Daten von TMDB: Trending (auf unser Archiv gemappt) + kommende Marvel-Projekte.
// Nutzung: TMDB_API_KEY=xxxx node site/fetch-home.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) { console.error("TMDB_API_KEY fehlt"); process.exit(1); }
const FILMS = JSON.parse(readFileSync("site/data/films.json", "utf8"));
const WIKI = JSON.parse(readFileSync("site/data/wiki_titles.json", "utf8"));
const EXTRA = existsSync("site/data/extra.json") ? JSON.parse(readFileSync("site/data/extra.json", "utf8")) : { films: {} };

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const titleMap = {};
for (const f of FILMS) {
  titleMap[norm(f.t)] = f.id;
  if (WIKI[f.id]) titleMap[norm(WIKI[f.id].replace(/\s*\(.*\)$/, ""))] = f.id;
  const orig = EXTRA.films[f.id]?.orig;
  if (orig) titleMap[norm(orig)] = f.id;
}

const api = async (p, params = {}) => {
  const u = new URL("https://api.themoviedb.org/3" + p);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(p + " " + r.status);
  return r.json();
};

// Trending: alles, was diese Woche angesagt ist und in unserem Archiv steht
const trending = [];
for (const page of [1, 2]) {
  const t = await api("/trending/all/week", { page });
  for (const e of t.results || []) {
    const id = titleMap[norm(e.title || e.name)];
    if (id && !trending.includes(id)) trending.push(id);
  }
}

// Kommende Marvel-Projekte (Marvel Studios = Company 420)
const today = new Date().toISOString().slice(0, 10);
mkdirSync("public/img/u", { recursive: true });
const upcoming = [];
const um = await api("/discover/movie", { with_companies: 420, "primary_release_date.gte": today, sort_by: "primary_release_date.asc", region: "DE" });
const ut = await api("/discover/tv", { with_companies: 420, "first_air_date.gte": today, sort_by: "first_air_date.asc" });
for (const e of [...(um.results || []).map((x) => ({ ...x, _tv: false })), ...(ut.results || []).map((x) => ({ ...x, _tv: true }))]) {
  const title = e.title || e.name;
  const date = e.release_date || e.first_air_date;
  if (!title || !date) continue;
  const id = titleMap[norm(title)] || null;
  let img = null;
  if (id) img = `p/${id}`;
  else if (e.poster_path) {
    const dest = `public/img/u/${e.id}.jpg`;
    if (!existsSync(dest)) {
      const r = await fetch(`https://image.tmdb.org/t/p/w342${e.poster_path}`);
      if (r.ok) writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    }
    if (existsSync(dest)) img = `u/${e.id}`;
  }
  upcoming.push({ t: title, d: date, id, img, tv: e._tv });
}
upcoming.sort((a, b) => a.d.localeCompare(b.d));

writeFileSync("site/data/home.json", JSON.stringify({ fetched: today, trending: trending.slice(0, 8), upcoming: upcoming.slice(0, 8) }, null, 1));
console.log("Trending (im Archiv):", trending.slice(0, 8).join(", "));
console.log("Kommend:", upcoming.slice(0, 8).map((u) => `${u.t} (${u.d})`).join(" | "));
