// Filmmusik-Komponisten aus den TMDB-Credits (Crew) für alle Titel.
import { readFileSync, writeFileSync } from "node:fs";
const KEY = process.env.TMDB_API_KEY;
if (!KEY) { console.error("TMDB_API_KEY fehlt"); process.exit(1); }
const FILMS = JSON.parse(readFileSync("site/data/films.json", "utf8"));
const FILM_OVERRIDE = eval("({" + readFileSync("site/fetch-tmdb.mjs", "utf8").split("const FILM_OVERRIDE = {")[1].split("};")[0] + "})");
const api = async (p, params = {}) => {
  const u = new URL("https://api.themoviedb.org/3" + p);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(p + " " + r.status);
  return r.json();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
for (const f of FILMS) {
  const o = FILM_OVERRIDE[f.id] || {};
  const isTv = o.tv ?? f.type !== "Film";
  const q = o.q || f.t.replace(/\s*\((Netflix|Raimi|TASM|\d{4})\)$/, "").replace(/ · .*$/, "");
  const y = o.y ?? (parseInt(f.y) || undefined);
  try {
    let res = await api(isTv ? "/search/tv" : "/search/movie", { query: q, [isTv ? "first_air_date_year" : "year"]: y });
    if (!res.results?.length) res = await api(isTv ? "/search/tv" : "/search/movie", { query: q });
    const hit = res.results?.[0];
    if (!hit) continue;
    const cr = await api(`/${isTv ? "tv" : "movie"}/${hit.id}/credits`);
    const comps = [...new Set((cr.crew || []).filter((c) => /composer|original music/i.test(c.job)).map((c) => c.name))].slice(0, 2);
    if (comps.length) out[f.id] = comps;
  } catch (e) {}
  await sleep(120);
}
writeFileSync("site/data/composers.json", JSON.stringify(out, null, 1));
console.log("Komponisten:", Object.keys(out).length, "/", FILMS.length);
