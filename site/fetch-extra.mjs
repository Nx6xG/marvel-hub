// Holt Zusatzinhalte von TMDB: Episoden-Guides, Titel-Logos, Galerie-Stills, Videos, Collections, Provider-Logos.
// Nutzung: TMDB_API_KEY=xxxx node site/fetch-extra.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) { console.error("TMDB_API_KEY fehlt"); process.exit(1); }
const FILMS = JSON.parse(readFileSync("site/data/films.json", "utf8"));
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
const dl = async (tmdbPath, size, dest) => {
  if (existsSync(dest)) return true;
  const r = await fetch(`https://image.tmdb.org/t/p/${size}${tmdbPath}`);
  if (!r.ok) return false;
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  return true;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const d of ["public/img/l", "public/img/g", "public/img/pr"]) mkdirSync(d, { recursive: true });

const out = {}, collections = {}, providers = {}, fails = [];
for (const f of FILMS) {
  const o = FILM_OVERRIDE[f.id] || {};
  const isTv = o.tv ?? f.type !== "Film";
  const q = o.q || f.t.replace(/\s*\((Netflix|Raimi|TASM|\d{4})\)$/, "").replace(/ · .*$/, "");
  const y = o.y ?? (parseInt(f.y) || undefined);
  try {
    let res = await api(isTv ? "/search/tv" : "/search/movie", { query: q, [isTv ? "first_air_date_year" : "year"]: y });
    if (!res.results?.length) res = await api(isTv ? "/search/tv" : "/search/movie", { query: q });
    const hit = res.results?.[0];
    if (!hit) { fails.push(f.id); continue; }
    const d = await api(`/${isTv ? "tv" : "movie"}/${hit.id}`, {
      append_to_response: "images,videos,watch/providers",
      include_image_language: "en,null", include_video_language: "en,de",
    });
    const e = {};
    // Originaltitel & Länder
    const orig = isTv ? d.original_name : d.original_title;
    if (orig && orig !== f.t && orig !== q) e.orig = orig;
    const countries = (d.production_countries || d.origin_country?.map((c) => ({ iso_3166_1: c })) || []).map((c) => c.iso_3166_1);
    if (countries.length) e.countries = countries.slice(0, 3);
    // Titel-Logo
    const logo = (d.images?.logos || []).find((l) => l.file_path.endsWith(".png")) || d.images?.logos?.[0];
    if (logo && (await dl(logo.file_path, "w500", `public/img/l/${f.id}.png`))) e.logo = 1;
    // Galerie: 4 Stills (das erste Backdrop ist schon der Seiten-Hero)
    const stills = (d.images?.backdrops || []).slice(1, 5);
    let gi = 0;
    for (const s of stills) if (await dl(s.file_path, "w780", `public/img/g/${f.id}-${gi}.jpg`)) gi++;
    if (gi) e.gal = gi;
    // Videos: Trailer, Teaser, Clips, Featurettes
    const vids = (d.videos?.results || []).filter((v) => v.site === "YouTube" && ["Trailer", "Teaser", "Clip", "Featurette"].includes(v.type));
    vids.sort((a, b) => (a.type === "Trailer" ? 0 : 1) - (b.type === "Trailer" ? 0 : 1) || (b.official ? 1 : 0) - (a.official ? 1 : 0));
    if (vids.length) e.videos = vids.slice(0, 6).map((v) => ({ k: v.key, n: v.name.slice(0, 60), t: v.type }));
    // Collection (Filmreihe)
    if (!isTv && d.belongs_to_collection) {
      const c = d.belongs_to_collection;
      e.coll = c.id;
      (collections[c.id] ||= { n: c.name.replace(/ Collection| \[Filmreihe\]/g, ""), ids: [] }).ids.push(f.id);
    }
    // Provider-Logos
    const de = d["watch/providers"]?.results?.DE;
    for (const arr of [de?.flatrate, de?.rent, de?.buy]) for (const p of arr || []) {
      if (!providers[p.provider_name] && p.logo_path) {
        if (await dl(p.logo_path, "w92", `public/img/pr/${p.provider_id}.png`)) providers[p.provider_name] = p.provider_id;
      }
    }
    // Episoden-Guide (Serien)
    if (isTv && d.number_of_seasons) {
      e.eps = [];
      for (let s = 1; s <= Math.min(d.number_of_seasons, 8); s++) {
        const season = await api(`/tv/${hit.id}/season/${s}`, { language: "de-DE" });
        e.eps.push({
          s,
          eps: (season.episodes || []).map((ep) => ({
            n: ep.name, d: ep.air_date,
            o: (ep.overview || "").slice(0, 180),
            v: ep.vote_count > 10 ? Math.round(ep.vote_average * 10) / 10 : null,
          })),
        });
        await sleep(80);
      }
    }
    out[f.id] = e;
  } catch (err) { fails.push(f.id); }
  await sleep(150);
}
writeFileSync("site/data/extra.json", JSON.stringify({ films: out, collections, providers }, null, 1));
const logos = Object.values(out).filter((e) => e.logo).length;
const eps = Object.values(out).filter((e) => e.eps).length;
console.log(`Extra: ${Object.keys(out).length} Titel | Logos: ${logos} | Episoden-Guides: ${eps} | Collections: ${Object.keys(collections).length} | Provider-Logos: ${Object.keys(providers).length}`);
console.log("fehlgeschlagen:", fails.join(", ") || "keine");
