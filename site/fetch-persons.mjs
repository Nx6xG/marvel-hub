// Holt Schauspieler-Details (Bio DE/EN, Geburtstag, Geburtsort, IMDb) für alle Personen aus credits.json.
// Nutzung: TMDB_API_KEY=xxxx node site/fetch-persons.mjs
import { readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.TMDB_API_KEY;
if (!KEY) { console.error("TMDB_API_KEY fehlt"); process.exit(1); }
const CREDITS = JSON.parse(readFileSync("site/data/credits.json", "utf8"));
const ids = [...new Set(Object.values(CREDITS).flat().filter((c) => c.p).map((c) => c.p))];

const api = async (path, params = {}) => {
  const u = new URL("https://api.themoviedb.org/3" + path);
  u.searchParams.set("api_key", KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const out = {};
let done = 0;
for (const pid of ids) {
  try {
    const d = await api(`/person/${pid}`, { language: "de-DE", append_to_response: "translations,external_ids" });
    let bio = d.biography || "";
    if (!bio) {
      const en = d.translations?.translations?.find((t) => t.iso_639_1 === "en");
      bio = en?.data?.biography || "";
    }
    out[pid] = {
      n: d.name,
      bio: bio.slice(0, 700),
      b: d.birthday || null,
      pb: d.place_of_birth || null,
      imdb: d.external_ids?.imdb_id || null,
    };
  } catch (e) {}
  if (++done % 100 === 0) console.log(done + "/" + ids.length);
  await sleep(90);
}
writeFileSync("site/data/persons.json", JSON.stringify(out, null, 1));
console.log("Personen:", Object.keys(out).length, "/", ids.length);
