// Holt einheitliche 2:3-Poster (Filme/Serien) und Darsteller-Porträts von TMDB.
// Nutzung:  TMDB_API_KEY=xxxx node site/fetch-tmdb.mjs
// Danach:   node site/generate.mjs  (und committen)
import { readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) {
  console.error("Bitte TMDB_API_KEY setzen (kostenlos: themoviedb.org → Einstellungen → API).");
  process.exit(1);
}

const FILMS = JSON.parse(readFileSync("site/data/films.json", "utf8"));
const CHARS = JSON.parse(readFileSync("site/data/chars.json", "utf8"));

// Suchbegriffe, wo der Wiki-Titel nicht 1:1 passt
const FILM_OVERRIDE = {
  dd1: { q: "Daredevil", tv: true, y: 2015 }, jj: { q: "Jessica Jones", tv: true, y: 2015 },
  lc: { q: "Luke Cage", tv: true }, if1: { q: "Iron Fist", tv: true }, pun: { q: "The Punisher", tv: true, y: 2017 },
  def: { q: "The Defenders", tv: true, y: 2017 }, agentcarter: { q: "Agent Carter", tv: true },
  aos: { q: "Agents of S.H.I.E.L.D.", tv: true }, inhumans: { q: "Inhumans", tv: true, y: 2017 },
  l1: { q: "Loki", tv: true }, l2: { q: "Loki", tv: true }, wi: { q: "What If...?", tv: true },
  wv: { q: "WandaVision", tv: true }, fws: { q: "The Falcon and the Winter Soldier", tv: true },
  hk: { q: "Hawkeye", tv: true, y: 2021 }, mk: { q: "Moon Knight", tv: true }, msm: { q: "Ms. Marvel", tv: true },
  shk: { q: "She-Hulk: Attorney at Law", tv: true }, si: { q: "Secret Invasion", tv: true },
  ec: { q: "Echo", tv: true, y: 2024 }, x97: { q: "X-Men '97", tv: true }, ag: { q: "Agatha All Along", tv: true },
  dba: { q: "Daredevil: Born Again", tv: true }, ih: { q: "Ironheart", tv: true },
  eow: { q: "Eyes of Wakanda", tv: true }, wm: { q: "Wonder Man", tv: true }, vq: { q: "Vision Quest", tv: true },
  wbn: { q: "Werewolf by Night", y: 2022 }, ghs: { q: "The Guardians of the Galaxy Holiday Special", y: 2022 },
  sc: { q: "Shang-Chi and the Legend of the Ten Rings" }, f4: { q: "The Fantastic Four: First Steps" },
  f415: { q: "Fantastic Four", y: 2015 }, f405: { q: "Fantastic Four", y: 2005 },
  raimi1: { q: "Spider-Man", y: 2002 }, hulk03: { q: "Hulk", y: 2003 }, hulk: { q: "The Incredible Hulk", y: 2008 },
  daredevil03: { q: "Daredevil", y: 2003 }, elektra05: { q: "Elektra", y: 2005 },
  punisher04: { q: "The Punisher", y: 2004 }, ghostrider07: { q: "Ghost Rider", y: 2007 },
  ghostrider12: { q: "Ghost Rider: Spirit of Vengeance" }, howard: { q: "Howard the Duck", y: 1986 },
  blade1: { q: "Blade", y: 1998 }, bnd: { q: "Spider-Man: Brand New Day" },
  doomsday: { q: "Avengers: Doomsday" }, secretwars: { q: "Avengers: Secret Wars" },
};

const api = async (path, params) => {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(path + " → " + r.status);
  return r.json();
};
const download = async (tmdbPath, size, dest) => {
  const r = await fetch(`https://image.tmdb.org/t/p/${size}${tmdbPath}`);
  if (!r.ok) return false;
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  return true;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const okPosters = [], failPosters = [], trailers = {};
for (const f of FILMS) {
  const o = FILM_OVERRIDE[f.id] || {};
  const isTv = o.tv ?? f.type !== "Film";
  const q = o.q || f.t.replace(/\s*\((Netflix|Raimi|TASM|\d{4})\)$/, "").replace(/ · .*$/, "");
  const y = o.y ?? (parseInt(f.y) || undefined);
  try {
    let res = await api(isTv ? "/search/tv" : "/search/movie", { query: q, [isTv ? "first_air_date_year" : "year"]: y });
    if (!res.results?.length) res = await api(isTv ? "/search/tv" : "/search/movie", { query: q });
    const hit = res.results?.find((r) => r.poster_path);
    if (hit && (await download(hit.poster_path, "w342", `public/img/p/${f.id}.jpg`))) okPosters.push(f.id);
    else failPosters.push(f.id);
    // Offiziellen YouTube-Trailer mitnehmen (für Click-to-Play-Embed)
    if (hit) {
      const vids = await api(`/${isTv ? "tv" : "movie"}/${hit.id}/videos`, {});
      const yt = (vids.results || []).filter((v) => v.site === "YouTube");
      const pick = yt.find((v) => v.type === "Trailer" && v.official) || yt.find((v) => v.type === "Trailer") || yt.find((v) => v.type === "Teaser");
      if (pick) trailers[f.id] = pick.key;
    }
  } catch (e) { failPosters.push(f.id); }
  await sleep(120);
}
writeFileSync("site/data/trailers.json", JSON.stringify(trailers, null, 1));

const okChars = [], failChars = [];
for (const c of CHARS) {
  const name = c.act.split("·")[0].split("(")[0].replace(/\(Stimme\)|zuvor.*$/g, "").trim();
  if (!name || name === "—") { failChars.push(c.id); continue; }
  try {
    const res = await api("/search/person", { query: name });
    const hit = res.results?.find((r) => r.profile_path);
    if (hit && (await download(hit.profile_path, "w185", `public/img/c/${c.id}.jpg`))) okChars.push(c.id);
    else failChars.push(c.id);
  } catch (e) { failChars.push(c.id); }
  await sleep(120);
}

// Breitformat-Liste: alles, was jetzt ein echtes TMDB-Poster hat, braucht kein Letterboxing mehr
const wide = JSON.parse(readFileSync("build/wide.json", "utf8"));
writeFileSync("build/wide.json", JSON.stringify(wide.filter((id) => !okPosters.includes(id))));

console.log(`Poster: ${okPosters.length} OK, fehlgeschlagen: ${failPosters.join(", ") || "keine"}`);
console.log(`Trailer-IDs: ${Object.keys(trailers).length}`);
console.log(`Porträts: ${okChars.length} OK, fehlgeschlagen: ${failChars.join(", ") || "keine"}`);
console.log("Jetzt: node site/generate.mjs && git add -A && git commit && git push");
