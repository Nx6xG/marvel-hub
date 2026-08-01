#!/usr/bin/env python3
"""Baut die finale Marvel-Hub-Seite aus Teilen zusammen."""
import json, re
from fetch_posters import TITLES

tpl = open("hub-template.html").read()

def between(s, start, end, incl=True):
    i = s.index(start)
    j = s.index(end, i) + (len(end) if incl else 0)
    return s[i:j]

# Aus der alten Event-Seite wiederverwenden:
old_css = between(tpl, "<style>", "</style>", incl=False).replace("<style>", "")
event_hero = between(tpl, '<header class="hero" id="top">', "</header>")
sec_saga = between(tpl, '<section class="block" id="saga">', "</section>")
sec_doom = between(tpl, '<section class="block" id="doomsday">', "</section>")
sec_lore = between(tpl, '<section class="block" id="lore">', "</section>")
sec_theo = between(tpl, '<section class="block" id="theorien">', "</section>")
sec_glos = between(tpl, '<section class="block" id="glossar">', "</section>")
films_js = between(tpl, "var FILMS = [", "];")
breaks_js = between(tpl, "var SAGA_BREAKS = {", "};")

event_hero = event_hero.replace('id="top"', 'id="event-top"')

css_extra = open("p1-extra.css").read()
shell = open("p2-shell.html").read()
data_js = open("p3-data.html").read()
app_js = open("p4-app.html").read()

posters = json.load(open("posters.json"))
wide = json.load(open("wide.json"))

# Watchlist-Sektion in den Event-Bereich einschieben (zwischen Saga und Doomsday)
wl_section = between(shell, "<!--WL-START-->", "<!--WL-END-->")
shell = shell.replace(wl_section, "")  # aus dem Shell-Fluss entfernen

event_main = sec_saga + wl_section + sec_doom + sec_lore + sec_theo + sec_glos

out = shell
out = out.replace("__OLD_CSS__", old_css)
out = out.replace("__EXTRA_CSS__", css_extra)
out = out.replace("__EVENT_HERO__", event_hero)
out = out.replace("__EVENT_MAIN__", event_main)
out = out.replace("__DATA_JS__", data_js)
out = out.replace("__APP_JS__", app_js)
out = out.replace("__FILMS_JS__", "var FILMS = [" + films_js[len("var FILMS = ["):])
out = out.replace("__BREAKS_JS__", "var SAGA_BREAKS = {" + breaks_js[len("var SAGA_BREAKS = {"):])
out = out.replace("__POSTERS_JSON__", json.dumps(posters))
out = out.replace("__CIMG_JSON__", json.dumps(json.load(open("chars.json"))))
out = out.replace("__WIDE_JSON__", json.dumps(wide))
out = out.replace("__WIKI_JSON__", json.dumps(TITLES, ensure_ascii=False))

leftover = re.findall(r"__[A-Z_]+__", out)
open("multiverse-saga-archiv.html", "w").write(out)
import os
print("final: %.0f KB" % (os.path.getsize("multiverse-saga-archiv.html") / 1024))
print("offene Platzhalter:", leftover or "keine")
