import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkAgents, writeDiagrams } from "./gates.ts";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// A temporary repo holding the real AGENTS.md, README.md and TERMINUS.md, with one edit applied to AGENTS.md.
function fixture(edit: (md: string) => string = (md) => md): string {
  const root = mkdtempSync(join(tmpdir(), "gates-"));
  for (const file of ["AGENTS.md", "README.md", "TERMINUS.md"]) copyFileSync(join(REPO, file), join(root, file));
  writeFileSync(join(root, "AGENTS.md"), edit(readFileSync(join(root, "AGENTS.md"), "utf8")));
  return root;
}

// Applies an edit to the first match after a marker, so a test can target one section.
function editAfter(md: string, marker: string, from: string, to: string): string {
  const at = md.indexOf(marker);
  if (at < 0) throw new Error(`marker not found: ${marker}`);
  return md.slice(0, at) + md.slice(at).replace(from, to);
}

test("passes on the repository's own AGENTS.md, with the counts the Python original printed", () => {
  const report = checkAgents(REPO);
  assert.equal(report.summary, "13 sections + root · 347 sentences · 14 diagrams");
  assert.deepEqual(report.fails, []);
});

test("fails a sentence of more than 20 words (STE)", () => {
  const words = Array.from({ length: 25 }, (_, i) => `word${i}`).join(" ");
  const report = checkAgents(fixture((md) => `${md.replace("## Measurements", "## Measurements")}\n- ${words}.\n`));
  assert.ok(report.fails.some((fail) => fail.startsWith("STE: 25 words: word0 word1")), report.fails.join("\n"));
});

test("fails a section whose bodies are not docus, experis and imples", () => {
  const report = checkAgents(fixture((md) => editAfter(md, "## 1. Goal state", "### Imples", "### Other")));
  assert.ok(
    report.fails.includes("triplet: §1 has ['docus', 'experis'], needs docus, experis, imples"),
    report.fails.join("\n"),
  );
});

test("fails a Docus that does not open with PVI²", () => {
  const report = checkAgents(fixture((md) => editAfter(md, "## 1. Goal state", "- North star:", "- Purpose:")));
  assert.ok(
    report.fails.includes("PVI²: §1 Docus must open with North star:, Inspiration:, Purpose:, Value:, Impact:"),
    report.fails.join("\n"),
  );
});

test("fails a (§N) pointer that does not exist", () => {
  const report = checkAgents(fixture((md) => md.replace("(§1, §12)", "(§1, §99)")));
  assert.ok(report.fails.includes("pointer: §99 does not exist"), report.fails.join("\n"));
});

test("fails when the README's quoted rule drifts from AGENTS.md", () => {
  const report = checkAgents(fixture((md) => md.replaceAll("Pre-mortem first:", "Pre-mortem early:")));
  assert.ok(
    report.fails.some((fail) => fail.startsWith("README quote drifted from AGENTS.md: Text (Docus): Pre-mortem first")),
    report.fails.join("\n"),
  );
});

test("fails a private tracker id", () => {
  const report = checkAgents(fixture((md) => md.replace("Value: a one-person army", "Value: SOL-1234 a one-person army")));
  assert.ok(report.fails.includes("private id: SOL-1234"), report.fails.join("\n"));
});

test("container law: a folder inside docus fails, because docus holds files only", () => {
  const root = fixture();
  mkdirSync(join(root, "docus", "nested"), { recursive: true });
  writeFileSync(join(root, "docus", "nested", "note.md"), "# note\n");
  spawnSync("git", ["-C", root, "init", "-q"]);
  spawnSync("git", ["-C", root, "add", "-A"]);
  const report = checkAgents(root);
  assert.ok(
    report.fails.includes("container law: docus/ holds files only, found docus/nested/note.md"),
    report.fails.join("\n"),
  );
});

test("writeDiagrams writes one NN.mmd file per mermaid block, as the render check reads them", () => {
  const dir = mkdtempSync(join(tmpdir(), "mmd-"));
  writeDiagrams(checkAgents(REPO).diagrams, dir);
  const names = readdirSync(dir).sort();
  assert.equal(names.length, 14);
  assert.equal(names[0], "00.mmd");
  assert.equal(names[13], "13.mmd");
  assert.match(readFileSync(join(dir, "00.mmd"), "utf8"), /^flowchart/);
});
