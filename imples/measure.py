"""AGENTS.md measurements with tiktoken (o200k_base). The tables live in measurements.json, next to the viewer; AGENTS.md holds only rules.
  uv run --with tiktoken python3 imples/measure.py          # print only
  uv run --with tiktoken python3 imples/measure.py --write  # write measurements.json, record a temporal checkpoint for every changed node
  uv run --with tiktoken python3 imples/measure.py --seal   # only on the user's approval: write the tables, stamp the approval time, lock the file
One table shape at 3 levels (document, section, body): | tokens | % of parent | PVI | Δ PVI | <checkpoint letter> |.
Body PVI = the body rated alone against its parent section's goal (semantic, parent-relative). Checkpoints: versions.json, one Greek letter per change of a node's hash.
"""
import re, subprocess, sys, time, json, hashlib
from pathlib import Path
import tiktoken
sys.path.insert(0, str(Path(__file__).parent))
from pvi import SRC, clean, sections, ledger, score
ENC = tiktoken.get_encoding("o200k_base")
SPLIT = re.compile(r'(?<=[.!?])\s+(?=[A-Z"`])')
tok = lambda t: len(ENC.encode(t.strip("\n"))) if t else 0
sha = lambda t: hashlib.sha256(t.encode()).hexdigest()
VF, BF = Path(__file__).with_name("versions.json"), Path(__file__).with_name("bodies.json")
G = "αβγδεζηθικλμνξοπρστυφχψω"
z = time.strftime("%z"); NOW = time.strftime("%Y-%m-%dT%H:%M") + f"{z[:3]}:{z[3:]}"
writing = "--write" in sys.argv or "--seal" in sys.argv

raw = SRC.read_text()
md = clean(raw)
body, tail = md.rsplit("\n---\n", 1)
parts = [p for p in re.split(r"(?m)^(?=## )", body) if p.strip()]
total = tok(md)
led, hashes = ledger(), dict(sections(md))
vers = json.loads(VF.read_text()) if VF.exists() else {}
vers.setdefault("file", []); vers.setdefault("sections", {}); vers.setdefault("bodies", {})
bods = json.loads(BF.read_text()) if BF.exists() else {}
lens = [len(s.split()) for l in md.splitlines() if l.lstrip().startswith("- ") and not l.lstrip().startswith("- `") for s in SPLIT.split(l.lstrip()[2:]) if s.strip()]   # formulas are math, not sentences
ste = round(100 * sum(x <= 20 for x in lens) / len(lens))
numbered = [p for p in parts if re.match(r"## \d+\.", p)]
FORMULA = r"(?m)^(?:- )?`[^`]+`$"   # one formula per line or per top-level list item; indented sub-items belong to it
trip = sum(1 for p in numbered if "```mermaid" in p and re.search(FORMULA, p))
def nine(p):
    """9-slot rule: each body (Docus points, Experis formulas, Imples diagrams) holds 1 to 9 items."""
    b = {x.splitlines()[0].lower(): x for x in re.split(r"(?m)^### ", p)[1:]}
    n = [len(re.findall(r"(?m)^- ", b.get("docus", ""))), len(re.findall(FORMULA, b.get("experis", ""))), b.get("imples", "").count("```mermaid")]
    return sum(1 <= x <= 9 for x in n)
nine_ok, nine_all = sum(nine(p) for p in parts if not p.startswith("## Measurements")), 3 * len([p for p in parts if not p.startswith("## Measurements")])

def roman(n):
    """Roman numeral; N (nulla) is zero."""
    if n == 0: return "N"
    out = ""
    for v, r in ((1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")):
        while n >= v: out += r; n -= v
    return out

def vstr(e):
    """Version: Roman major.minor.patch, then the Greek sub-version letter (one of 24)."""
    return f"{roman(e.get('M', 0))}.{roman(e.get('m', 0))}.{roman(e.get('p', 0))} {G[e.get('l', 0) % 24]}"

def checkpoint(L, h, pvi):
    """δ temporal checkpoint: a hash change moves the letter (iterate); --seal moves the patch and resets the letter."""
    if writing and (not L or L[-1]["sha"] != h):
        prev = L[-1] if L else {}
        e = {"M": prev.get("M", 0), "m": prev.get("m", 0), "p": prev.get("p", 0), "l": prev.get("l", -1) + 1, "at": NOW, "sha": h, "pvi": pvi}
        e["v"] = vstr(e); L.append(e)
    elif writing and L and pvi is not None:
        L[-1]["pvi"] = pvi
    return L

def seal_all(V):
    for L in [V["file"]] + list(V["sections"].values()) + list(V["bodies"].values()):
        if L and not L[-1].get("sealed"):
            e = dict(L[-1], p=L[-1].get("p", 0) + 1, l=0, at=NOW, sealed=True); e["v"] = vstr(e); L.append(e)

def cells(n, parent_tokens, pvi, L):
    cur = L[-1] if L else None
    prev = next((e for e in reversed(L[:-1]) if e.get("pvi") is not None), None) if L else None
    d = "–" if pvi is None or not cur or cur.get("pvi") is None or prev is None else f"{cur['pvi'] - prev['pvi']:+.1f}"
    letter, when = (vstr(cur), cur["at"]) if cur else ("N.N.N α", "–")
    return f"| tokens | % | PVI | Δ PVI | {letter} |\n|---|---|---|---|---|\n| {n} | {round(100 * n / parent_tokens)}% | {pvi if pvi is not None else '–'} | {d} | {when} |\n"

def split_bodies(p):
    """Return head, T, F, D, post. Uses ### docus / ### experis / ### imples when present, else text / formula / mermaid."""
    i = p.find("### Docus")
    head, rest = (p[:i].rstrip("\n") + "\n", p[i:]) if i > 0 and "\n" in p[:i].strip("\n") else (("", p) if p.startswith("### ") else (p.split("\n", 1) if "\n" in p else (p, "")))
    if "### Docus" in rest or "### docus" in rest:
        parts_ = re.split(r"(?mi)^### (docus|experis|imples)\s*$", rest)
        got = {parts_[i].lower(): parts_[i + 1].strip("\n") for i in range(1, len(parts_) - 1, 2)}
        return head, got.get("docus", ""), got.get("experis", ""), got.get("imples", ""), ""
    m = re.search(r"```mermaid.*?```", rest, re.S)
    pre, D, post = (rest[:m.start()], m.group(0), rest[m.end():]) if m else (rest, "", "")
    fl = [l for l in pre.splitlines() if re.match(r"^`[^`]+`$", l)]
    fi = pre.find(fl[0]) if fl else len(pre)
    return head, pre[:fi].strip("\n"), pre[fi:].strip("\n"), D, post.strip("\n")

out, scores, render, tables = [], [], {}, {}
NAMES = {"T": "docus", "F": "experis", "D": "imples"}
for p in parts:
    title = p.splitlines()[0].lstrip("#").strip()
    key = p.splitlines()[0][3:].strip() if p.startswith("## ") else p.splitlines()[0].strip()
    s = score(key, hashes.get(key), led) if key in hashes else None
    num = title.split(".")[0] if title[0].isdigit() else ("0" if not p.startswith("## ") else None)
    n = tok(p)
    if not num:
        out.append(p.rstrip("\n") + "\n"); continue
    head, T, F, D, post = split_bodies(p.rstrip("\n"))
    bb = bods.get(num, {})
    b = {"solo": {k: bb["solo"].get(k) for k in "TFD" if bb.get("hashes", {}).get(k) == sha({"T": T, "F": F, "D": D}[k])}} if bb.get("hashes") else None
    solo = [v for v in (b or {}).get("solo", {}).values() if v is not None]
    pvi = round(sum(solo) / len(solo)) if len(solo) == 3 else None   # fractal: a parent is the mean of its 3 bodies, never shown without them
    if pvi is not None: scores.append(pvi)
    L = checkpoint(vers["sections"].setdefault(num, []), hashes.get(key, sha(p)), pvi)
    structured = "### Docus" in p or "### docus" in p
    blocks = [head + ("\n" if num == "0" and not head.endswith("\n") else "")] if head else []   # the root keeps its blank line after the title
    render[num] = {}
    for k, txt in (("T", T), ("F", F), ("D", D)):
        if not txt: continue
        bp = b["solo"].get(k) if b else None
        BL = checkpoint(vers["bodies"].setdefault(f"{num}.{k}", []), sha(txt), bp)
        cur = BL[-1] if BL else {}
        prev = next((e for e in reversed(BL[:-1]) if e.get("pvi") is not None), None) if BL else None
        render[num][NAMES[k]] = {"tokens": tok(txt), "pct": round(100 * tok(txt) / n), "pvi": bp,
            "delta": None if cur.get("pvi") is None or prev is None else round(cur["pvi"] - prev["pvi"], 1),
            "v": vstr(cur) if cur else "N.N.N α", "at": cur.get("at", "–")}
        blocks += ([f"### {NAMES[k].capitalize()}", txt] if structured else [txt, ""])
    if post: blocks += [post, ""]
    if num != "0": tables[num] = cells(n, total, pvi, L)
    out.append("\n".join(blocks).rstrip("\n") + "\n")
nparts = sum(1 for p in parts if not p.startswith("## Measurements"))
mean = round(sum(scores) / len(scores)) if scores and len(scores) == nparts else None   # fractal: no parent without all its children
FL = vers["file"]
fh = sha("".join(hashes.values()))
checkpoint(FL, fh, mean)
if "--seal" in sys.argv: seal_all(vers)
meas = ("## Measurements\n\n" + cells(total, total, mean, FL) +
        "\n| measurement | value |\n|---|---|\n"
        f"| STE: sentences of 20 words or fewer | {ste}% |\n"
        f"| complete triplets: text, formula, diagram | {trip}/{len(numbered)} |\n"
        f"| 9-slot rule: bodies with 1 to 9 items | {nine_ok}/{nine_all} |\n")
STAMP = re.compile(r"The user approved this file on \S+?\.(?= )")
if "--seal" in sys.argv:
    tail = STAMP.sub(f"The user approved this file on {NOW}.", tail, count=1)
new = "\n".join(out) + "\n---\n" + tail   # rules only; the tables go to measurements.json
print(meas)
if writing:
    assert STAMP.sub("", clean(new)) == STAMP.sub("", md), "writing would change more than the tables and the stamp"
    SRC.write_text(new)
    VF.write_text(json.dumps(vers, indent=1, ensure_ascii=False))
    Path(__file__).with_name("bodies-render.json").write_text(json.dumps(render, indent=1, ensure_ascii=False))
    Path(__file__).with_name("measurements.json").write_text(json.dumps({"at": NOW, "file": meas.split("\n", 2)[2], "sections": tables}, indent=1, ensure_ascii=False))
    print(f"tables written to measurements.json; {SRC} holds only rules")
if "--seal" in sys.argv:
    # The viewer highlights every line that differs from the last seal (view/checkpoints/sealed.md).
    (Path(__file__).parent / "checkpoints" / "sealed.md").write_text(SRC.read_text())
    subprocess.run(["chflags", "uchg", str(SRC)], check=True)
    print("sealed:", STAMP.search(new).group(0), "· locked with chflags uchg")
