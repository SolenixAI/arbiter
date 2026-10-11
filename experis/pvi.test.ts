import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clean, runPvi, sectionHashes } from "./pvi.ts";

const DEMO = `# Demo

Root line.

## 1. Goal state
- First sentence. Second sentence.

## Measurements

| tokens | % |
|---|---|
| 9 | 100% |


## 2. Second part
- Another rule.

---
The user approved this file on 2026-10-01T10:00+00:00.
`;

const RATINGS = `{
  "1. Goal state": [
    {"P": 5, "V": 4, "I": 3, "C": 4, "E": 2, "rater": "a", "rated_at": "2026-10-11T10:00+00:00", "sources": {"confidence": 0.8, "n": 2.0}},
    {"P": 4, "V": 4, "I": 4, "C": 3, "E": 3, "rater": "b", "rated_at": "2026-10-11T10:05+00:00", "sources": {}},
    {"P": 3, "V": 3, "I": 3, "C": 3, "E": 3, "rater": "c", "rated_at": "2026-10-11T10:10+00:00", "sources": {"zero": 0}}
  ],
  "2. Second part": [
    {"P": 0, "V": 2, "I": 2, "C": 2, "E": 2, "rater": "a", "rated_at": "2026-10-11T10:00+00:00", "sources": {"x": true, "y": null}},
    {"P": 0, "V": 2, "I": 2, "C": 2, "E": 2, "rater": "b", "rated_at": "2026-10-11T10:05+00:00", "sources": {}},
    {"P": 0, "V": 2, "I": 2, "C": 2, "E": 2, "rater": "c", "rated_at": "2026-10-11T10:10+00:00", "sources": {}}
  ]
}
`;

const LIST_UNRATED = `a230e40008d2  unrated       # Demo
cca458b85160  unrated       1. Goal state
063faf832494  unrated       2. Second part
`;

const LIST_RATED = `a230e40008d2  unrated       # Demo
cca458b85160  current   67  1. Goal state
063faf832494  current    0  2. Second part
file: mean 34 over 2 current sections · lowest 0 (2. Second part)
`;

const LIST_STALE = `a230e40008d2  unrated       # Demo
a0d62ce9d569  stale         1. Goal state
063faf832494  current    0  2. Second part
file: mean 0 over 1 current sections · lowest 0 (2. Second part)
`;

const LEDGER = `{
 "1. Goal state": {
  "score": 67,
  "hash": "cca458b85160e6085a8c5141bcfb13d2fcfb8be9b00e94382d8a2e3750cc8fd7",
  "ratings": [
   {
    "P": 5,
    "V": 4,
    "I": 3,
    "C": 4,
    "E": 2,
    "rater": "a",
    "rated_at": "2026-10-11T10:00+00:00",
    "sources": {
     "confidence": 0.8,
     "n": 2.0
    },
    "score": 68.75087710349915
   },
   {
    "P": 4,
    "V": 4,
    "I": 4,
    "C": 3,
    "E": 3,
    "rater": "b",
    "rated_at": "2026-10-11T10:05+00:00",
    "sources": {},
    "score": 71.30409831864014
   },
   {
    "P": 3,
    "V": 3,
    "I": 3,
    "C": 3,
    "E": 3,
    "rater": "c",
    "rated_at": "2026-10-11T10:10+00:00",
    "sources": {
     "zero": 0
    },
    "score": 60.0
   }
  ]
 },
 "2. Second part": {
  "score": 0,
  "hash": "063faf83249421057ee35dc64c0e6929f9ba5825727ddf8ab403e11c4a2c4cf5",
  "ratings": [
   {
    "P": 0,
    "V": 2,
    "I": 2,
    "C": 2,
    "E": 2,
    "rater": "a",
    "rated_at": "2026-10-11T10:00+00:00",
    "sources": {
     "x": true,
     "y": null
    },
    "score": 0.0
   },
   {
    "P": 0,
    "V": 2,
    "I": 2,
    "C": 2,
    "E": 2,
    "rater": "b",
    "rated_at": "2026-10-11T10:05+00:00",
    "sources": {},
    "score": 0.0
   },
   {
    "P": 0,
    "V": 2,
    "I": 2,
    "C": 2,
    "E": 2,
    "rater": "c",
    "rated_at": "2026-10-11T10:10+00:00",
    "sources": {},
    "score": 0.0
   }
  ]
 }
}
`;

function fixture(markdown: string): string {
  const root = mkdtempSync(join(tmpdir(), "pvi-"));
  mkdirSync(join(root, "experis"));
  writeFileSync(join(root, "AGENTS.md"), markdown);
  return root;
}

test("clean removes the measurement tables and collapses blank lines", () => {
  assert.equal(
    clean(DEMO),
    "# Demo\n\nRoot line.\n\n## 1. Goal state\n- First sentence. Second sentence.\n\n## 2. Second part\n- Another rule.\n\n---\nThe user approved this file on 2026-10-01T10:00+00:00.\n",
  );
});

test("sectionHashes gives each section's title and the SHA-256 of its text", () => {
  assert.deepEqual(sectionHashes(DEMO), [
    ["# Demo", "a230e40008d29a9963b9472839fc4f8c9e9103ebf209690f2ba94d280d72b893"],
    ["1. Goal state", "cca458b85160e6085a8c5141bcfb13d2fcfb8be9b00e94382d8a2e3750cc8fd7"],
    ["2. Second part", "063faf83249421057ee35dc64c0e6929f9ba5825727ddf8ab403e11c4a2c4cf5"],
  ]);
});

test("list shows every section unrated before any ratings", () => {
  assert.equal(runPvi(["list"], fixture(DEMO)).stdout, LIST_UNRATED);
});

test("set stores each section's ratings, and list then shows the file mean", () => {
  const root = fixture(DEMO);
  const result = runPvi(["set"], root, RATINGS);
  assert.equal(result.code, 0);
  assert.equal(result.stdout, `rated 2 sections -> ${join(root, "experis", "pvi.json")}\n`);
  assert.equal(readFileSync(join(root, "experis", "pvi.json"), "utf8"), LEDGER);
  assert.equal(runPvi(["list"], root).stdout, LIST_RATED);
});

test("editing a section makes its ratings stale", () => {
  const root = fixture(DEMO);
  runPvi(["set"], root, RATINGS);
  writeFileSync(join(root, "AGENTS.md"), DEMO.replace("First sentence.", "First line."));
  assert.equal(runPvi(["list"], root).stdout, LIST_STALE);
});

test("set refuses a section that AGENTS.md does not have, and writes nothing", () => {
  const root = fixture(DEMO);
  const result = runPvi(["set"], root, '{"Nope": []}');
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /unknown section: Nope/);
  assert.equal(existsSync(join(root, "experis", "pvi.json")), false);
});

test("no argument prints the usage to stderr and exits 1", () => {
  const result = runPvi([], fixture(DEMO));
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.ok(result.stderr.startsWith("PVI ratings for each AGENTS.md section. Writes only experis/pvi.json; measure.ts --write"));
});
