// Englische Episoden-Guides (Namen + Beschreibungen) für alle Serien mit eps in extra.json nachladen
// Nutzung: TMDB_API_KEY=xxxx node site/fetch-eps-en.mjs
import { readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) { console.error("TMDB_API_KEY fehlt"); process.exit(1); }
const FILMS = JSON.parse(readFileSync("site/data/films.json", "utf8"));
const EXTRA = JSON.parse(readFileSync("site/data/extra.json", "utf8"));
const OVERRIDE_SRC = readFileSync("site/fetch-tmdb.mjs", "utf8");
const FILM_OVERRIDE = eval("({" + OVERRIDE_SRC.split("const FILM_OVERRIDE = {")[1].split("};")[0] + "})");

const api = async (path, params = {}) => {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fails = [];
for (const f of FILMS) {
  const x = EXTRA.films[f.id];
  if (!x || !x.eps || !x.eps.length || x.eps_en) continue;
  const o = FILM_OVERRIDE[f.id] || {};
  const q = o.q || f.t.replace(/\s*\((Netflix|Raimi|TASM|\d{4})\)$/, "").replace(/ · .*$/, "");
  const y = o.y ?? (parseInt(f.y) || undefined);
  try {
    let res = await api("/search/tv", { query: q, first_air_date_year: y });
    if (!res.results?.length) res = await api("/search/tv", { query: q });
    const hit = res.results?.[0];
    if (!hit) { fails.push(f.id); continue; }
    const epsEn = [];
    for (const sea of x.eps) {
      const season = await api(`/tv/${hit.id}/season/${sea.s}`, { language: "en-US" });
      epsEn.push({ s: sea.s, eps: (season.episodes || []).map((ep) => ({ n: ep.name, o: (ep.overview || "").slice(0, 300) })) });
      await sleep(120);
    }
    x.eps_en = epsEn;
    ok++;
    console.log(`${f.id}: ${epsEn.length} Staffeln en`);
  } catch (e) { fails.push(f.id + " (" + e.message + ")"); }
  await sleep(150);
}
writeFileSync("site/data/extra.json", JSON.stringify(EXTRA, null, 1));
console.log(`fertig: ${ok} Serien, Fails: ${fails.join(", ") || "keine"}`);
