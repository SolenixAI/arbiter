import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loads, type Dict, type Json } from "./json.ts";
import { roman, runMeasure, tokenCount, versionLabel } from "./measure.ts";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const NOW = "2026-10-11T18:52-02:30";

// One section with its three bodies, laid out the way AGENTS.md lays them out.
const TRIPLE = [
  "# Demo",
  "",
  "Root line.",
  "",
  "## 1. Goal state",
  "### Docus",
  "- North star: one goal.",
  "- Inspiration: {[x]}.",
  "- Purpose: p.",
  "- Value: v.",
  "- Impact: i.",
  "### Experis",
  "`formula = 1`",
  "`other = 2`",
  "### Imples",
  "```mermaid",
  "flowchart TD",
  "  A --> B",
  "```",
  "",
  "---",
  "The user approved this file on 2026-10-01T10:00+00:00.",
  "",
].join("\n");

// Reference outputs from the Python original this port replaces, on the same file (timestamps shown as <NOW>).
const PRINT_BEFORE_WRITE = [
  "## Measurements",
  "",
  "| tokens | % | PVI | Δ PVI | N.N.N α |",
  "|---|---|---|---|---|",
  "| 104 | 100% | – | – | – |",
  "",
  "| measurement | value |",
  "|---|---|",
  "| STE: sentences of 20 words or fewer | 100% |",
  "| complete triplets: text, formula, diagram | 1/1 |",
  "| 9-slot rule: bodies with 1 to 9 items | 3/6 |",
  "",
  "",
].join("\n");

const WRITE_FIRST = [
  "## Measurements",
  "",
  "| tokens | % | PVI | Δ PVI | N.N.N α |",
  "|---|---|---|---|---|",
  "| 104 | 100% | – | – | <NOW> |",
  "",
  "| measurement | value |",
  "|---|---|",
  "| STE: sentences of 20 words or fewer | 100% |",
  "| complete triplets: text, formula, diagram | 1/1 |",
  "| 9-slot rule: bodies with 1 to 9 items | 3/6 |",
  "",
  "tables written to measurements.json; <ROOT>/AGENTS.md holds only rules",
  "",
].join("\n");

const PRINT_AFTER_FIRST = [
  "## Measurements",
  "",
  "| tokens | % | PVI | Δ PVI | N.N.N α |",
  "|---|---|---|---|---|",
  "| 104 | 100% | – | – | <NOW> |",
  "",
  "| measurement | value |",
  "|---|---|",
  "| STE: sentences of 20 words or fewer | 100% |",
  "| complete triplets: text, formula, diagram | 1/1 |",
  "| 9-slot rule: bodies with 1 to 9 items | 3/6 |",
  "",
  "",
].join("\n");

const WRITE_SECOND = [
  "## Measurements",
  "",
  "| tokens | % | PVI | Δ PVI | N.N.N β |",
  "|---|---|---|---|---|",
  "| 104 | 100% | – | – | <NOW> |",
  "",
  "| measurement | value |",
  "|---|---|",
  "| STE: sentences of 20 words or fewer | 100% |",
  "| complete triplets: text, formula, diagram | 1/1 |",
  "| 9-slot rule: bodies with 1 to 9 items | 3/6 |",
  "",
  "tables written to measurements.json; <ROOT>/AGENTS.md holds only rules",
  "",
].join("\n");

const PRINT_AFTER_SECOND = [
  "## Measurements",
  "",
  "| tokens | % | PVI | Δ PVI | N.N.N β |",
  "|---|---|---|---|---|",
  "| 104 | 100% | – | – | <NOW> |",
  "",
  "| measurement | value |",
  "|---|---|",
  "| STE: sentences of 20 words or fewer | 100% |",
  "| complete triplets: text, formula, diagram | 1/1 |",
  "| 9-slot rule: bodies with 1 to 9 items | 3/6 |",
  "",
  "",
].join("\n");

function fixture(markdown: string): string {
  const root = mkdtempSync(join(tmpdir(), "measure-"));
  mkdirSync(join(root, "experis"));
  mkdirSync(join(root, "imples"));
  writeFileSync(join(root, "AGENTS.md"), markdown);
  return root;
}

// Replaces the run's timestamp and fixture path, so the reference text above applies to any run.
function normalise(text: string, root: string): string {
  return text.replaceAll(NOW, "<NOW>").replaceAll(root, "<ROOT>");
}

function read(root: string, file: string): string {
  return readFileSync(join(root, file), "utf8");
}

function section(versions: Dict, key: string): Dict[] {
  return ((versions.get("sections") as Dict).get(key) as Dict[]) ?? [];
}

test("tokenCount agrees with tiktoken's o200k_base", () => {
  assert.equal(tokenCount("hello world"), 2);
  assert.equal(tokenCount("The quick brown fox jumps over the lazy dog."), 10);
  assert.equal(tokenCount("Δ PVI – α ⊥ §§ ∀"), 11);
  assert.equal(tokenCount("North star: arbitrary success for any creator, in any environment or system."), 15);
});

test("roman numerals and version labels match the Python original", () => {
  assert.equal(roman(0), "N");
  assert.equal(roman(4), "IV");
  assert.equal(roman(1994), "MCMXCIV");
  const version = new Map<string, Json>([
    ["M", 1],
    ["m", 2],
    ["p", 3],
    ["l", 4],
  ]);
  assert.equal(versionLabel(version), "I.II.III ε");
});

test("a changing AGENTS.md is measured, checkpointed and reported the way the Python original does", () => {
  const root = fixture(TRIPLE);

  const printed = runMeasure([], root, NOW);
  assert.equal(printed.code, 0);
  assert.equal(normalise(printed.stdout, root), PRINT_BEFORE_WRITE);
  assert.equal(read(root, "AGENTS.md"), TRIPLE, "print-only never writes");

  const first = runMeasure(["--write"], root, NOW);
  assert.equal(first.code, 0);
  assert.equal(normalise(first.stdout, root), WRITE_FIRST);
  assert.equal(read(root, "AGENTS.md"), TRIPLE, "AGENTS.md keeps only rules, and this file has no tables");

  const afterFirst = runMeasure([], root, NOW);
  assert.equal(normalise(afterFirst.stdout, root), PRINT_AFTER_FIRST);

  const versions = loads(read(root, "experis/versions.json")) as Dict;
  assert.equal(section(versions, "1").length, 1);
  assert.equal(section(versions, "1")[0].get("v"), "N.N.N α");
  assert.equal(section(versions, "1")[0].get("sha"), "ceb3e1314631ac84452a0f7010ed97f72ef94d03fb12d5c14ce35731f0010b9a");

  const renders = loads(read(root, "imples/bodies-render.json")) as Dict;
  const bodies = renders.get("1") as Dict;
  assert.equal((bodies.get("docus") as Dict).get("tokens"), 29);
  assert.equal((bodies.get("docus") as Dict).get("pct"), 39);
  assert.equal((bodies.get("experis") as Dict).get("tokens"), 12);
  assert.equal((bodies.get("imples") as Dict).get("pct"), 19);

  const measurements = loads(read(root, "imples/measurements.json")) as Dict;
  assert.equal(
    (measurements.get("sections") as Dict).get("1"),
    `| tokens | % | PVI | Δ PVI | N.N.N α |\n|---|---|---|---|---|\n| 74 | 71% | – | – | ${NOW} |\n`,
  );

  // A rule changes: the section gets its second checkpoint, the letter moves to β.
  writeFileSync(join(root, "AGENTS.md"), TRIPLE.replace("North star: one goal.", "North star: one aim."));
  const second = runMeasure(["--write"], root, NOW);
  assert.equal(normalise(second.stdout, root), WRITE_SECOND);
  assert.equal(normalise(runMeasure([], root, NOW).stdout, root), PRINT_AFTER_SECOND);

  const versionsAfter = loads(read(root, "experis/versions.json")) as Dict;
  assert.deepEqual(
    section(versionsAfter, "1").map((entry) => entry.get("v")),
    ["N.N.N α", "N.N.N β"],
  );
  assert.equal(section(versionsAfter, "1")[1].get("sha"), "b3ffd14da20ab4a34eba0e258d93f638cc23e79f7124f91a733f72ab97b3312b");
});

test("reads CRLF line endings the way Python's universal newlines do", () => {
  const root = fixture(TRIPLE.replace(/\n/g, "\r\n"));
  assert.equal(normalise(runMeasure([], root, NOW).stdout, root), PRINT_BEFORE_WRITE);
});

test("refuses a heading with no title, as the Python original does, and writes nothing", () => {
  const markdown = TRIPLE.replace("## 1. Goal state", "## ");
  const root = fixture(markdown);
  assert.throws(() => runMeasure(["--write"], root, NOW), /IndexError/);
  assert.equal(read(root, "AGENTS.md"), markdown);
  assert.equal(existsSync(join(root, "experis", "versions.json")), false);
});

test("runs when reached through a symlink, so a symlinked tool cannot pass unchecked", () => {
  const link = join(mkdtempSync(join(tmpdir(), "link-")), "measure-link.ts");
  symlinkSync(join(REPO, "experis", "measure.ts"), link);
  const run = spawnSync(process.execPath, [link], { cwd: REPO, encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /## Measurements/);
});
