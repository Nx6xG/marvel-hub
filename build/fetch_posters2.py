#!/usr/bin/env python3
"""V2: Poster laden (mit Retry/Backoff + Cache), per sips verkleinern, posters.json bauen."""
import json, base64, os, subprocess, time, urllib.request, urllib.parse
from fetch_posters import TITLES, API, UA

RAW, SMALL = "raw", "small"
os.makedirs(RAW, exist_ok=True)
os.makedirs(SMALL, exist_ok=True)

def get(url, tries=5):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            return urllib.request.urlopen(req, timeout=30).read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < tries - 1:
                wait = 6 * (i + 1)
                print("  429, warte %ds ..." % wait)
                time.sleep(wait)
                continue
            raise
    return None

def thumb_url(title):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "redirects": 1,
        "prop": "pageimages", "piprop": "thumbnail", "pithumbsize": 320, "pilicense": "any",
        "titles": title,
    })
    data = json.loads(get(API + "?" + q))
    for page in data.get("query", {}).get("pages", {}).values():
        t = page.get("thumbnail", {}).get("source")
        if t:
            return t
    return None

def main():
    missing = []
    for pid, title in TITLES.items():
        raws = [p for p in os.listdir(RAW) if p.startswith(pid + ".")]
        if not raws:
            try:
                url = thumb_url(title)
                if not url:
                    missing.append((pid, title, "kein Bild"))
                    continue
                data = get(url)
                ext = "png" if url.lower().endswith(".png") else "jpg"
                with open(os.path.join(RAW, pid + "." + ext), "wb") as f:
                    f.write(data)
                print("geladen: %s (%d KB)" % (pid, len(data) // 1024))
                time.sleep(1.5)
            except Exception as e:
                missing.append((pid, title, str(e)))
                continue
    # verkleinern: max 260px, jpeg q~55; Seitenverhältnis erkennen (Logos etc.)
    posters, wide = {}, []
    for fn in sorted(os.listdir(RAW)):
        pid, ext = fn.rsplit(".", 1)
        out = os.path.join(SMALL, pid + ".jpg")
        subprocess.run(["sips", "-Z", "260", "-s", "format", "jpeg",
                        "-s", "formatOptions", "55", os.path.join(RAW, fn), "--out", out],
                       capture_output=True, check=True)
        info = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", out],
                              capture_output=True, text=True).stdout
        dims = {}
        for line in info.splitlines():
            for key in ("pixelWidth", "pixelHeight"):
                if key in line:
                    dims[key] = int(line.split(":")[1])
        ratio = dims.get("pixelWidth", 2) / max(1, dims.get("pixelHeight", 3))
        if ratio > 0.85:  # deutlich breiter als 2:3-Poster -> Logo/Standbild
            wide.append(pid)
        with open(out, "rb") as f:
            posters[pid] = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()
    if "l1" in posters:
        posters["l2"] = posters["l1"]
        if "l1" in wide:
            wide.append("l2")
    with open("posters.json", "w") as f:
        json.dump(posters, f)
    with open("wide.json", "w") as f:
        json.dump(wide, f)
    print("WIDE (contain statt cover):", wide)
    total = sum(len(v) for v in posters.values())
    print("FERTIG: %d Poster, %.0f KB base64" % (len(posters), total / 1024))
    for m in missing:
        print("FEHLT:", m)

if __name__ == "__main__":
    main()
