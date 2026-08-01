// Holt komplette Besetzungen (Top 10, mit Rollen & Fotos) von TMDB.
// Nutzung: TMDB_API_KEY=xxxx node site/fetch-credits.mjs
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
mkdirSync("public/img/a", { recursive: true });

const credits = {}, fails = [];
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
    const cr = await api(`/${isTv ? "tv" : "movie"}/${hit.id}${isTv ? "/aggregate_credits" : "/credits"}`);
    const cast = (cr.cast || []).slice(0, 10).map((c) => ({
      n: c.name,
      r: isTv ? (c.roles?.[0]?.character || "") : (c.character || ""),
      p: c.profile_path ? c.id : null,
      _path: c.profile_path,
    }));
    for (const c of cast) {
      if (!c.p) continue;
      const dest = `public/img/a/${c.p}.jpg`;
      if (!existsSync(dest)) {
        const img = await fetch(`https://image.tmdb.org/t/p/w185${c._path}`);
        if (img.ok) writeFileSync(dest, Buffer.from(await img.arrayBuffer()));
        else c.p = null;
        await sleep(60);
      }
      delete c._path;
    }
    cast.forEach((c) => delete c._path);
    credits[f.id] = cast;
  } catch (e) { fails.push(f.id); }
  await sleep(120);
}
writeFileSync("site/data/credits.json", JSON.stringify(credits, null, 1));
console.log("Credits:", Object.keys(credits).length, "| fehlgeschlagen:", fails.join(", ") || "keine");
