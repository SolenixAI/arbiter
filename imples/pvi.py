"""PVI ratings for each AGENTS.md section. Writes only imples/pvi.json; measure.py --write puts the scores in AGENTS.md.
Each rating is stored with the SHA-256 of its section's text (measurement tables excluded), so a changed section shows as stale.
  python3 imples/pvi.py list          # section titles + current hashes + rating state + file mean
  python3 imples/pvi.py set < r.json  # r.json: {"<section title>": [rating, rating, rating]}, rating = {"P":0-5,"V":0-5,"I":0-5,"C":0-5 (certainty),"E":0-5,"rater":"...","rated_at":"ISO 8601", "sources":{...}}
One rating = 20 * (P*V*I*C*E)^(1/5), AGENTS.md section 6. A section's score is the mean of 3 independent raters (section 13: one rater's noise is about ±7).
The file score is the mean of the sections, never a sum: a sum rewards adding weak sections.
"""
import hashlib, json, re, sys
from pathlib import Path
SRC = Path(__file__).resolve().parent.parent / "AGENTS.md"
LEDGER = Path(__file__).with_name("pvi.json")

def clean(md):
    """AGENTS.md without its measurement tables and its Measurements section."""
    md = re.sub(r"(?ms)^## Measurements\n.*?(?=^## |^---\n)", "", md)
    md = "\n".join(l for l in md.split("\n") if not l.startswith("|"))
    return re.sub(r"\n{3,}", "\n\n", md)

def sections(md=None):
    md = clean(md if md is not None else SRC.read_text()).rsplit("\n---\n", 1)[0]
    for p in [p for p in re.split(r"(?m)^## ", md) if p.strip()]:
        text = ("## " + p).strip("\n")
        yield p.splitlines()[0].strip(), hashlib.sha256(text.encode()).hexdigest()

def ledger():
    return json.loads(LEDGER.read_text()) if LEDGER.exists() else {}

def score(title, h, led):
    r = led.get(title)
    return None if not r else (r["score"] if r["hash"] == h and "ratings" in r else "stale")

if __name__ == "__main__":
    led = ledger()
    if sys.argv[1:] == ["list"]:
        cur = {}
        for title, h in sections():
            s = score(title, h, led)
            print(f"{h[:12]}  {'unrated' if s is None else 'stale' if s == 'stale' else 'current':8} {'' if s in (None, 'stale') else s:>3}  {title}")
            if isinstance(s, int): cur[title] = s
        if cur:
            low = min(cur, key=cur.get)
            print(f"file: mean {round(sum(cur.values()) / len(cur))} over {len(cur)} current sections · lowest {cur[low]} ({low})")
    elif sys.argv[1:] == ["set"]:
        new, current = json.load(sys.stdin), dict(sections())
        for title, rs in new.items():
            assert title in current, f"unknown section: {title}"
            assert len(rs) == 3, f"need 3 independent ratings: {title}"
            for r in rs:
                assert all(r[k] in range(6) for k in "PVICE"), f"P, V, I, C, E must be 0-5: {title}"
                r["score"] = 20 * (r["P"] * r["V"] * r["I"] * r["C"] * r["E"]) ** 0.2
            led[title] = {"score": round(sum(r["score"] for r in rs) / 3), "hash": current[title], "ratings": rs}
        LEDGER.write_text(json.dumps(led, indent=1, ensure_ascii=False) + "\n")
        print(f"rated {len(new)} sections -> {LEDGER}")
    else:
        sys.exit(__doc__)
