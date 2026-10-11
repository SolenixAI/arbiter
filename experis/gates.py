#!/usr/bin/env python3
"""AGENTS.md gates: the poka-yoke that every pull request must pass.

  python3 experis/gates.py              # check AGENTS.md, exit 1 on any failure
  python3 experis/gates.py --mermaid D  # also write each diagram to D/NN.mmd for the render check

Stdlib only, so it runs anywhere with no install.
"""
import re, sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "AGENTS.md"
SPLIT = re.compile(r'(?<=[.!?])\s+(?=[A-Z"`])')
FORMULA = re.compile(r"(?m)^- `[^`]+`$")
PVI2 = ("North star:", "Inspiration:", "Purpose:", "Value:", "Impact:")

md = SRC.read_text()
body, _, tail = md.rpartition("\n---\n")
parts = [p for p in re.split(r"(?m)^(?=#{1,2} )", body) if p.strip()]
fails = []

def bodies(p):
    got = re.split(r"(?m)^### (Docus|Experis|Imples)\s*$", p)
    return {got[i].lower(): got[i + 1] for i in range(1, len(got) - 1, 2)}

# STE: every text sentence has 20 words or fewer. Formulas are math, not sentences.
for line in md.splitlines():
    s = line.lstrip()
    if s.startswith("- ") and not s.startswith("- `"):
        for sent in SPLIT.split(s[2:]):
            if len(sent.split()) > 20:
                fails.append(f"STE: {len(sent.split())} words: {sent[:70]}…")

numbers = []
for p in parts:
    title = p.splitlines()[0]
    m = re.match(r"## (\d+)\. ", title)
    name = f"§{m.group(1)}" if m else "root"
    if m: numbers.append(int(m.group(1)))
    b = bodies(p)
    # Triplet: text, formula and diagram, in that order.
    if list(b) != ["docus", "experis", "imples"]:
        fails.append(f"triplet: {name} has {list(b)}, needs docus, experis, imples")
        continue
    docus = re.findall(r"(?m)^- (.*)$", b["docus"])
    counts = {"docus": len(docus), "experis": len(FORMULA.findall(b["experis"])), "imples": b["imples"].count("```mermaid")}
    # 9-slot rule: each body holds 1 to 9 top-level items.
    for k, n in counts.items():
        if not 1 <= n <= 9:
            fails.append(f"9-slot: {name} {k} has {n} top-level items")
    # Each Docus opens with PVI²: north star, inspiration, purpose, value, impact.
    if [d.split(" ")[0] + (" " + d.split(" ")[1] if d.startswith("North") else "") for d in docus[:5]] != list(PVI2):
        fails.append(f"PVI²: {name} Docus must open with {', '.join(PVI2)}")

# Sections run 1 to N with no gap, and every (§N) pointer resolves.
if numbers != list(range(1, len(numbers) + 1)):
    fails.append(f"sections: numbered {numbers}")
for ref in sorted({int(x) for x in re.findall(r"§(\d+)", md)}):
    if ref not in numbers:
        fails.append(f"pointer: §{ref} does not exist")

# The README quotes one rule. The quote must match the file word for word, so it cannot drift.
readme = (SRC.parent / "README.md").read_text() if (SRC.parent / "README.md").exists() else ""
for label, quote in re.findall(r"(?m)^\*{0,2}(Text \(Docus\)|Formula \(Experis\))\*{0,2}:\*{0,2}\s*(.+)$", readme):
    q = quote.strip().strip("`")
    if q not in md:
        fails.append(f"README quote drifted from AGENTS.md: {label}: {q[:60]}…")

# Container law: docus, experis and imples hold files only, and the root lists its terminus.
import subprocess
root = SRC.parent
tracked = subprocess.run(["git", "-C", str(root), "ls-files"], capture_output=True, text=True).stdout.split()
for f in tracked:
    head, _, rest = f.partition("/")
    if head in ("docus", "experis", "imples") and "/" in rest:
        fails.append(f"container law: {head}/ holds files only, found {f}")
if tracked and "TERMINUS.md" not in tracked:
    fails.append("container law: the root has no TERMINUS.md")

# The file stays universal: no private tracker ids.
for hit in re.findall(r"\b[A-Z]{2,5}-\d{2,5}\b", md):
    fails.append(f"private id: {hit}")

# Stop exits: no rule may end by parking the work or handing it back (5:0, §1, §8).
STOP = re.compile(r"(?i)\b(report it|record the blocker|outside your control|one-way door|keep a finding|stop and ask|wait for (?:the user|approval)|out of scope)\b")
OPEN = re.compile(r"\(\s*`?<[~?!≠⊥]>`?\s*[,)]|\(assumed\b")
for n, line in enumerate(md.splitlines(), 1):
    for m in STOP.finditer(line):
        fails.append(f"stop exit, line {n}: '{m.group(0)}' parks the work; route it to a recipe (§8)")
    # The file passes its own 5:0: no assumed number or open marker sits on a value in its own rules.
    for m in OPEN.finditer(line):
        fails.append(f"open fragment in the file, line {n}: {m.group(0)}")

# No muted engine: a reviewer config never tells an engine to stop finding something (§10).
for f in tracked:
    if f.endswith((".yaml", ".yml")) and re.search(r"(?i)\b(?:do not|don't|never) flag\b|overruled by", (root / f).read_text()):
        fails.append(f"muted engine: {f} tells a reviewer not to flag a finding")

if "--mermaid" in sys.argv:
    out = Path(sys.argv[sys.argv.index("--mermaid") + 1]); out.mkdir(parents=True, exist_ok=True)
    for i, d in enumerate(re.findall(r"```mermaid\n(.*?)```", md, re.S)):
        (out / f"{i:02}.mmd").write_text(d)

sentences = sum(len(SPLIT.split(l.lstrip()[2:])) for l in md.splitlines() if l.lstrip().startswith("- ") and not l.lstrip().startswith("- `"))
print(f"{len(numbers)} sections + root · {sentences} sentences · {md.count('```mermaid')} diagrams")
if fails:
    print("\n".join(f"FAIL {f}" for f in fails)); sys.exit(1)
print("PASS: STE, triplets, 9-slot, PVI², pointers, README quote, container law, no private ids, no stop exits, own 5:0, no muted engine")
