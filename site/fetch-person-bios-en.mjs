// Englische Biografien für alle Personen nachladen (TMDB liefert en-US als Default)
import { readFileSync, writeFileSync } from "node:fs";
const KEY = process.env.TMDB_API_KEY;
if (!KEY) { console.error("TMDB_API_KEY fehlt"); process.exit(1); }
const P = JSON.parse(readFileSync("site/data/persons.json", "utf8"));
const ids = Object.keys(P);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let done = 0, got = 0, fail = 0;
for (const pid of ids) {
  if (P[pid].bio_en) { done++; continue; }
  try {
    const r = await fetch(`https://api.themoviedb.org/3/person/${pid}?api_key=${KEY}&language=en-US`);
    if (r.status === 429) { await wait(4000); ids.push(pid); continue; }
    const d = await r.json();
    if (d.biography) { P[pid].bio_en = d.biography.split("\n\n").slice(0, 2).join("\n\n").slice(0, 700); got++; }
  } catch { fail++; }
  done++;
  if (done % 50 === 0) { console.log(`${done}/${ids.length} (en-Bios: ${got})`); writeFileSync("site/data/persons.json", JSON.stringify(P, null, 1)); }
  await wait(60);
}
writeFileSync("site/data/persons.json", JSON.stringify(P, null, 1));
console.log(`fertig: ${done} geprüft, ${got} englische Bios, ${fail} Fehler`);
