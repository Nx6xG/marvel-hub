// Holt Zusatz-Metadaten von TMDB: Streaming (DE), Backdrops, Box Office, FSK, Laufzeiten, IMDb-IDs.
// Nutzung: TMDB_API_KEY=xxxx node site/fetch-details.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) { console.error("TMDB_API_KEY fehlt"); process.exit(1); }
const FILMS = JSON.parse(readFileSync("site/data/films.json", "utf8"));
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

const api = async (path, params = {}) => {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync("public/img/b", { recursive: true });

const out = {}, fails = [];
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
    const app = isTv ? "content_ratings,external_ids,watch/providers,images" : "release_dates,external_ids,watch/providers,images";
    const d = await api(`/${isTv ? "tv" : "movie"}/${hit.id}`, { language: "de-DE", append_to_response: app, include_image_language: "null,en" });
    const e = { imdb: d.external_ids?.imdb_id || null, genres: (d.genres || []).map((g) => g.name).slice(0, 4) };
    if (isTv) {
      e.seasons = d.number_of_seasons; e.episodes = d.number_of_episodes;
      e.cert = d.content_ratings?.results?.find((r) => r.iso_3166_1 === "DE")?.rating || null;
    } else {
      e.rt = d.runtime || null; e.budget = d.budget || null; e.revenue = d.revenue || null;
      const de = d.release_dates?.results?.find((r) => r.iso_3166_1 === "DE");
      const rel = de?.release_dates?.find((x) => x.type === 3) || de?.release_dates?.[0];
      e.deDate = rel?.release_date?.slice(0, 10) || null;
      e.cert = rel?.certification || null;
    }
    if (d.vote_count > 50) e.vote = [Math.round(d.vote_average * 10) / 10, d.vote_count];
    const de2 = d["watch/providers"]?.results?.DE;
    if (de2) {
      const names = (arr) => (arr || []).map((p) => p.provider_name).slice(0, 4);
      e.prov = { s: names(de2.flatrate), r: [...new Set([...names(de2.rent), ...names(de2.buy)])].slice(0, 3) };
    }
    const bd = (d.images?.backdrops || [])[0];
    if (bd) {
      const img = await fetch(`https://image.tmdb.org/t/p/w780${bd.file_path}`);
      if (img.ok) { writeFileSync(`public/img/b/${f.id}.jpg`, Buffer.from(await img.arrayBuffer())); e.bd = 1; }
    }
    out[f.id] = e;
  } catch (err) { fails.push(f.id); }
  await sleep(120);
}
writeFileSync("site/data/details.json", JSON.stringify(out, null, 1));
console.log("Details:", Object.keys(out).length, "| Backdrops:", Object.values(out).filter((e) => e.bd).length, "| fehlgeschlagen:", fails.join(", ") || "keine");
