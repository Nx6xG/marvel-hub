#!/usr/bin/env python3
"""Charakter-Bilder von en.wikipedia (Kandidaten-Titel, erster Treffer gewinnt) -> chars.json"""
import json, base64, os, subprocess, time
from fetch_posters2 import get, thumb_url

CAND = {
    "tony": ["Tony Stark (Marvel Cinematic Universe)"],
    "steve": ["Steve Rogers (Marvel Cinematic Universe)"],
    "sam": ["Sam Wilson (Marvel Cinematic Universe)"],
    "bucky": ["Bucky Barnes (Marvel Cinematic Universe)"],
    "thor": ["Thor (Marvel Cinematic Universe)"],
    "loki": ["Loki (Marvel Cinematic Universe)"],
    "wanda": ["Wanda Maximoff (Marvel Cinematic Universe)"],
    "vision": ["Vision (Marvel Cinematic Universe)"],
    "strange": ["Doctor Strange (Marvel Cinematic Universe)"],
    "spidey": ["Spider-Man (Marvel Cinematic Universe)"],
    "natasha": ["Natasha Romanoff (Marvel Cinematic Universe)"],
    "yelena": ["Yelena Belova (Marvel Cinematic Universe)", "Yelena Belova"],
    "shuri": ["Shuri (Marvel Cinematic Universe)"],
    "sentry": ["Sentry (Robert Reynolds)", "Sentry (comics)"],
    "thanos": ["Thanos (Marvel Cinematic Universe)"],
    "kang": ["Kang the Conqueror (Marvel Cinematic Universe)", "Kang the Conqueror"],
    "doom": ["Doctor Doom in other media", "Doctor Doom"],
    "deadpool": ["Deadpool (film character)", "Deadpool"],
    "wolverine": ["Wolverine (film character)", "Wolverine (character)"],
    "xavier": ["Professor X (film character)", "Professor X"],
    "magneto": ["Magneto (film character)", "Magneto"],
    "reed": ["Reed Richards (Marvel Cinematic Universe)", "Mister Fantastic"],
    "sue": ["Susan Storm (Marvel Cinematic Universe)", "Invisible Woman"],
    "franklin": ["Franklin Richards (comics)", "Franklin Richards"],
    "venom": ["Venom (Sony's Spider-Man Universe)", "Eddie Brock", "Venom (character)"],
    "hulk": ["Bruce Banner (Marvel Cinematic Universe)", "Hulk"],
    "clint": ["Clint Barton (Marvel Cinematic Universe)", "Hawkeye (Clint Barton)"],
    "kamala": ["Kamala Khan (Marvel Cinematic Universe)", "Ms. Marvel (Kamala Khan)"],
    "carol": ["Carol Danvers (Marvel Cinematic Universe)", "Carol Danvers"],
    "tchalla": ["T'Challa (Marvel Cinematic Universe)", "Black Panther (character)"],
    "namor": ["Namor (Marvel Cinematic Universe)", "Namor"],
    "redguardian": ["Red Guardian (Marvel Cinematic Universe)", "Red Guardian"],
    "usagent": ["John Walker (Marvel Cinematic Universe)", "U.S. Agent (character)", "U.S. Agent"],
    "valentina": ["Valentina Allegra de Fontaine (Marvel Cinematic Universe)", "Valentina Allegra de Fontaine"],
    "wiccan": ["Billy Maximoff (Marvel Cinematic Universe)", "Wiccan (character)"],
    "agatha": ["Agatha Harkness (Marvel Cinematic Universe)", "Agatha Harkness"],
    "galactus": ["Galactus"],
    "mephisto": ["Mephisto (Marvel Comics)", "Mephisto (comics)"],
    "miles": ["Miles Morales (Spider-Verse)", "Miles Morales"],
    "cyclops": ["Cyclops (Marvel Comics)", "Cyclops (comics)"],
    "jean": ["Jean Grey"],
    "storm": ["Storm (Marvel Comics)", "Storm (comics)"],
    "beast": ["Beast (Marvel Comics)", "Beast (comics)"],
    "mystique": ["Mystique (Marvel Comics)", "Mystique (comics)"],
    "gambit": ["Gambit (Marvel Comics)", "Gambit (comics)"],
    "scott": ["Scott Lang (Marvel Cinematic Universe)", "Ant-Man (Scott Lang)"],
    "quill": ["Peter Quill (Marvel Cinematic Universe)", "Star-Lord"],
    "rocket": ["Rocket Raccoon (Marvel Cinematic Universe)", "Rocket Raccoon"],
    "nick": ["Nick Fury (Marvel Cinematic Universe)", "Nick Fury"],
    "monica": ["Monica Rambeau (Marvel Cinematic Universe)", "Monica Rambeau"],
    "kate": ["Kate Bishop (Marvel Cinematic Universe)", "Kate Bishop"],
    "america": ["America Chavez (Marvel Cinematic Universe)", "America Chavez"],
    "cassie": ["Cassie Lang (Marvel Cinematic Universe)", "Cassie Lang"],
    "mbaku": ["M'Baku (Marvel Cinematic Universe)", "M'Baku"],
    "daredevil": ["Matt Murdock (Marvel Cinematic Universe)", "Daredevil (Marvel Comics character)"],
    "kingpin": ["Wilson Fisk (Marvel Cinematic Universe)", "Kingpin (character)"],
    "punisher": ["Frank Castle (Marvel Cinematic Universe)", "Punisher"],
    "johnny": ["Johnny Storm (Marvel Cinematic Universe)", "Human Torch"],
    "ben": ["Ben Grimm (Marvel Cinematic Universe)", "Thing (comics)"],
    "nightcrawler": ["Nightcrawler (Marvel Comics)", "Nightcrawler (comics)", "Nightcrawler (character)"],
    "cassandra": ["Cassandra Nova"],
    "gwen": ["Spider-Woman (Gwen Stacy)", "Spider-Gwen"],
    "goblin": ["Norman Osborn (Spider-Man film series)", "Green Goblin"],
    "hope": ["Hope van Dyne", "Wasp (Marvel Cinematic Universe)"],
    "hank": ["Hank Pym (Marvel Cinematic Universe)", "Hank Pym"],
    "janet": ["Janet van Dyne (Marvel Cinematic Universe)", "Janet van Dyne", "Wasp (Janet van Dyne)"],
    "gamora": ["Gamora (Marvel Cinematic Universe)", "Gamora"],
    "drax": ["Drax the Destroyer (Marvel Cinematic Universe)", "Drax the Destroyer"],
    "mantis": ["Mantis (Marvel Cinematic Universe)", "Mantis (Marvel Comics)"],
    "groot": ["Groot (Marvel Cinematic Universe)", "Groot"],
    "nebula": ["Nebula (Marvel Cinematic Universe)", "Nebula (character)"],
    "hela": ["Hela (Marvel Cinematic Universe)", "Hela (character)", "Hela (comics)"],
    "valkyrie": ["Valkyrie (Marvel Cinematic Universe)"],
    "peggy": ["Peggy Carter"],
    "pepper": ["Pepper Potts"],
    "rhodey": ["James Rhodes (Marvel Cinematic Universe)", "War Machine"],
    "ultron": ["Ultron (Marvel Cinematic Universe)", "Ultron"],
    "mj": ["Michelle Jones-Watson", "MJ (Marvel Cinematic Universe)"],
    "ned": ["Ned Leeds"],
    "shangchi": ["Shang-Chi (Marvel Cinematic Universe)", "Shang-Chi"],
    "moonknight": ["Marc Spector (Marvel Cinematic Universe)", "Moon Knight"],
    "shehulk": ["Jennifer Walters (Marvel Cinematic Universe)", "She-Hulk"],
    "riri": ["Riri Williams (Marvel Cinematic Universe)", "Riri Williams"],
    "redhulk": ["Thaddeus Ross (Marvel Cinematic Universe)", "Thunderbolt Ross"],
    "zemo": ["Helmut Zemo (Marvel Cinematic Universe)", "Baron Zemo"],
    "ghostmcu": ["Ghost (Marvel Cinematic Universe)"],
    "watcher": ["The Watcher (Marvel Cinematic Universe)", "Uatu"],
    "gorr": ["Gorr the God Butcher"],
    "wong": ["Wong (Marvel Cinematic Universe)", "Wong (comics)"],
    "clea": ["Clea (Marvel Cinematic Universe)", "Clea (character)", "Clea (comics)"],
    "echo": ["Maya Lopez (Marvel Cinematic Universe)", "Echo (Marvel Comics)"],
    "sylvie": ["Sylvie (Marvel Cinematic Universe)"],
    "mobius": ["Mobius M. Mobius (Marvel Cinematic Universe)", "Mobius M. Mobius"],
    "yondu": ["Yondu (Marvel Cinematic Universe)", "Yondu"],
    "rogue": ["Rogue (Marvel Comics)", "Rogue (comics)"],
    "colossus": ["Colossus (Marvel Comics)", "Colossus (comics)", "Colossus (character)"],
    "cable": ["Cable (Marvel Comics)", "Cable (comics)"],
    "quicksilver": ["Quicksilver (film character)", "Quicksilver (Marvel Comics)"],
    "x23": ["X-23"],
    "juggernaut": ["Juggernaut (character)", "Juggernaut (Marvel Comics)"],
    "tobey": ["Peter Parker (Sam Raimi film series)", "Spider-Man in film"],
    "andrew": ["Peter Parker (The Amazing Spider-Man film series)"],
    "docock": ["Otto Octavius (Sam Raimi film series)", "Doctor Octopus"],
    "electro": ["Electro (Marvel Comics)"],
    "carnage": ["Carnage (character)", "Carnage (comics)"],
    "peterb": ["Peter B. Parker", "Spider-Man (Spider-Verse character)"],
    "spiderman2099": ["Spider-Man 2099", "Miguel O'Hara"],
    "mysterio": ["Quentin Beck (Marvel Cinematic Universe)", "Mysterio"],
    "vulture": ["Adrian Toomes (Marvel Cinematic Universe)", "Vulture (Marvel Comics)"],
    "ghostrider": ["Ghost Rider (Johnny Blaze)", "Ghost Rider"],
    "odin": ["Odin (Marvel Cinematic Universe)", "Odin (Marvel Comics)", "Odin (comics)"],
    "jane": ["Jane Foster (Marvel Cinematic Universe)", "Jane Foster (character)"],
    "korg": ["Korg (Marvel Cinematic Universe)", "Korg (character)"],
    "okoye": ["Okoye (Marvel Cinematic Universe)", "Okoye"],
    "killmonger": ["Erik Killmonger (Marvel Cinematic Universe)", "Erik Killmonger"],
    "wenwu": ["Wenwu (Marvel Cinematic Universe)", "Mandarin (character)"],
    "highevo": ["High Evolutionary (Marvel Cinematic Universe)", "High Evolutionary"],
    "dormammu": ["Dormammu"],
    "ego": ["Ego (Marvel Cinematic Universe)", "Ego the Living Planet"],
    "stane": ["Obadiah Stane"],
    "ronan": ["Ronan the Accuser"],
    "leader": ["Leader (character)", "Leader (comics)"],
    "apocalypse": ["Apocalypse (character)", "Apocalypse (comics)"],
    "silversurfer": ["Silver Surfer (Marvel Cinematic Universe)", "Silver Surfer"],
    "may": ["May Parker (Marvel Cinematic Universe)", "Aunt May"],
    "happy": ["Happy Hogan (Marvel Cinematic Universe)", "Happy Hogan (character)"],
    "sersi": ["Sersi"],
    "blade": ["Blade (Marvel Cinematic Universe)", "Blade (character)"],
}

RAW, SMALL = "craw", "csmall"
os.makedirs(RAW, exist_ok=True)
os.makedirs(SMALL, exist_ok=True)

missing = []
for cid, titles in CAND.items():
    if [p for p in os.listdir(RAW) if p.startswith(cid + ".")]:
        continue
    got = False
    for title in titles:
        try:
            url = thumb_url(title)
            if not url:
                continue
            data = get(url)
            ext = "png" if url.lower().endswith(".png") else "jpg"
            with open(os.path.join(RAW, cid + "." + ext), "wb") as f:
                f.write(data)
            print("geladen: %s <- %s (%d KB)" % (cid, title, len(data) // 1024))
            got = True
            time.sleep(1.3)
            break
        except Exception as e:
            print("  Fehler bei %s: %s" % (title, e))
    if not got:
        missing.append(cid)

imgs = {}
for fn in sorted(os.listdir(RAW)):
    cid = fn.rsplit(".", 1)[0]
    out = os.path.join(SMALL, cid + ".jpg")
    subprocess.run(["sips", "-Z", "220", "-s", "format", "jpeg", "-s", "formatOptions", "58",
                    os.path.join(RAW, fn), "--out", out], capture_output=True, check=True)
    with open(out, "rb") as f:
        imgs[cid] = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()
with open("chars.json", "w") as f:
    json.dump(imgs, f)
print("FERTIG: %d Bilder, %.0f KB base64" % (len(imgs), sum(len(v) for v in imgs.values()) / 1024))
print("FEHLT:", missing or "nichts")
