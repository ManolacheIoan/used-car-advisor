# Body for: git filter-repo --file-info-callback "$(cat strip_prices.py)"
# Removes listing-derived (autovit.ro) price data from the files that contained it; everything else is untouched.
import csv, io, json, re

def strip(name, data):
    t = data.decode("utf-8")
    if name == b"data/cars.template.csv":
        rows = list(csv.DictReader(io.StringIO(t)))
        if not rows or "price_min_eur" not in rows[0]:
            return data
        out = io.StringIO()
        w = csv.DictWriter(out, fieldnames=list(rows[0].keys()), lineterminator="\n")
        w.writeheader()
        for r in rows:
            for k in r:
                if k.startswith("price_"):
                    r[k] = ""
            w.writerow(r)
        return out.getvalue().encode("utf-8")
    if name == b"src/data/cars.json":
        if b"autovit" not in data:
            return data
        c = json.loads(t)
        for m in c["models"]:
            m.pop("price_eur", None)
            m["sources"] = [s for s in m["sources"] if "autovit" not in s["url"]]
        return (json.dumps(c, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    if name == b"data/SOURCES.md":
        t = re.sub(r"- \*\*Prețuri second-hand\*\* \(2026-10-16\).*?(?=\n## )",
                   "- **Prețuri second-hand:** goale. Se completează manual.\n", t, flags=re.S)
    elif name == b"README.md":
        t = re.sub(r"4\. Prețurile \(`price_min_eur`, `price_max_eur`\) sunt completate din anunțurile de pe autovit\.ro\..*?sursa lor\.",
                   "4. Prețurile (`price_min_eur`, `price_max_eur`) sunt goale; le completezi manual.", t, flags=re.S)
    elif name == b"docs/ARCHITECTURE.md":
        t = re.sub(r", iar prețurile second-hand din anunțurile autovit\.ro \(percentila 10–90, pe\s+generație\)",
                   ". Prețurile second-hand se completează manual", t)
    elif name == b"ROADMAP.md":
        t = t.replace(" (inclusiv prețurile din autovit.ro)", "")
    return t.encode("utf-8")

if filename in (b"data/cars.template.csv", b"src/data/cars.json", b"data/SOURCES.md",
                b"README.md", b"docs/ARCHITECTURE.md", b"ROADMAP.md"):
    old = value.get_contents_by_identifier(blob_id)
    new = strip(filename, old)
    if new != old:
        blob_id = value.insert_file_with_contents(new)
return (filename, mode, blob_id)
