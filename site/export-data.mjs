// Einmal-Export: zieht die Daten aus den alten Build-Templates und schreibt site/data/*.json
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import vm from "node:vm";

const tpl = readFileSync("build/hub-template.html", "utf8");
const p3 = readFileSync("build/p3-data.html", "utf8");
const p2 = readFileSync("build/p2-shell.html", "utf8");

const filmsSrc = "var FILMS = [" + tpl.split("var FILMS = [")[1].split("];")[0] + "];";
const breaksSrc = "var SAGA_BREAKS = {" + tpl.split("var SAGA_BREAKS = {")[1].split("};")[0] + "};";

const ctx = {};
vm.createContext(ctx);
vm.runInContext(filmsSrc + "\n" + breaksSrc + "\n" + p3, ctx);

mkdirSync("site/data", { recursive: true });
const dump = (name, val) => writeFileSync(`site/data/${name}.json`, JSON.stringify(val, null, 1));

ctx.FILMS.forEach((f) => (f.uni = "mcu"));
dump("films", ctx.FILMS.concat(ctx.FOX, ctx.SONY, ctx.KLASSIK, ctx.NETFLIX));
dump("saga_breaks", ctx.SAGA_BREAKS);
dump("chars", ctx.CHARS);
dump("teams", ctx.TEAMS);
dump("artifacts", ctx.ARTIFACTS);
dump("paths", ctx.PATHS);
dump("threads", ctx.THREADS);
dump("chronik", ctx.CHRONIK);
dump("universes", ctx.UNIVERSES);
dump("scores", ctx.SCORES);
dump("trivia", ctx.TRIVIA);
dump("postcredits", ctx.POSTCREDITS);
dump("cameo", ctx.CAMEO);
dump("variants", ctx.VARIANTS);
dump("stream", ctx.STREAM_OVERRIDE);

console.log(
  "Filme:", ctx.FILMS.length + ctx.FOX.length + ctx.SONY.length + ctx.KLASSIK.length + ctx.NETFLIX.length,
  "| Chars:", ctx.CHARS.length,
  "| Teams:", ctx.TEAMS.length,
  "| Artefakte:", ctx.ARTIFACTS.length,
  "| Pfade:", ctx.PATHS.length
);
