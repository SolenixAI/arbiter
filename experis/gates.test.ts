import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
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

test("passes on the repository's own AGENTS.md, and the summary counts the diagrams in the file", () => {
  const report = checkAgents(REPO);
  assert.deepEqual(report.fails, []);
  assert.match(report.summary, /^\d+ sections \+ root · \d+ sentences · \d+ diagrams$/);
  assert.ok(report.summary.endsWith(` · ${report.diagrams.length} diagrams`), report.summary);
  const md = readFileSync(join(REPO, "AGENTS.md"), "utf8");
  assert.equal(report.diagrams.length, md.split("```mermaid").length - 1);
});

test("fails a sentence of more than 20 words (STE)", () => {
  const words = Array.from({ length: 25 }, (_, i) => `word${i}`).join(" ");
  const report = checkAgents(fixture((md) => `${md}\n- ${words}.\n`));
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
  const report = checkAgents(fixture((md) => md.replace("(§9)", "(§99)")));
  assert.ok(report.fails.includes("pointer: §99 does not exist"), report.fails.join("\n"));
});

test("fails when the README's quoted rule drifts from AGENTS.md", () => {
  const report = checkAgents(fixture((md) => md.replaceAll("Pre-mortem before the work:", "Pre-mortem early:")));
  assert.ok(
    report.fails.some((fail) => fail.startsWith("README quote drifted from AGENTS.md: Text (Docus): Pre-mortem before the work")),
    report.fails.join("\n"),
  );
});

test("fails a private tracker id", () => {
  const report = checkAgents(fixture((md) => md.replace("Value: whatever any creator intends", "Value: SOL-1234 whatever any creator intends")));
  assert.ok(report.fails.includes("private id: SOL-1234"), report.fails.join("\n"));
});

test("fails a stop exit, and names its line", () => {
  const report = checkAgents(fixture((md) => `${md}\n- Report it as a blocker.\n`));
  const line = readFileSync(join(fixture(), "AGENTS.md"), "utf8").split("\n").length + 1;
  assert.ok(
    report.fails.includes(`stop exit, line ${line}: 'Report it' parks the work; route it to a recipe (§8)`),
    report.fails.join("\n"),
  );
});

test("fails an assumed number or an open marker on a value in the file's own rules", () => {
  const report = checkAgents(fixture((md) => `${md}\n- Each body is right 77% \`<~>\` of the time (assumed).\n`));
  const opens = report.fails.filter((fail) => fail.startsWith("open fragment in the file, line "));
  assert.deepEqual(
    opens.map((fail) => fail.slice(fail.indexOf(": ") + 2)),
    ["7% `<~>`", "(assumed"],
    report.fails.join("\n"),
  );
});

test("fails a tracked reviewer config that tells an engine not to flag a finding", () => {
  const root = fixture();
  writeFileSync(join(root, ".coderabbit.yaml"), "reviews:\n  instructions: Do not flag long sentences.\n");
  spawnSync("git", ["-C", root, "init", "-q"]);
  spawnSync("git", ["-C", root, "add", "-A"]);
  const report = checkAgents(root);
  assert.ok(report.fails.includes("muted engine: .coderabbit.yaml tells a reviewer not to flag a finding"), report.fails.join("\n"));
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

test("reads CRLF line endings the way Python's universal newlines do", () => {
  const report = checkAgents(fixture((md) => md.replace(/\n/g, "\r\n")));
  assert.deepEqual(report.fails, []);
  assert.match(report.summary, /^\d+ sections \+ root/);
});

test("refuses to run the container-law check without git, rather than passing it", () => {
  const root = fixture();
  const path = process.env.PATH;
  process.env.PATH = "";
  try {
    assert.throws(() => checkAgents(root));
  } finally {
    process.env.PATH = path;
  }
});

test("reads a numbered heading written with fullwidth digits, as Python's \\d does", () => {
  const fullwidthOne = String.fromCharCode(0xff11);
  const report = checkAgents(fixture((md) => md.replace("## 1. Goal state", `## ${fullwidthOne}. Goal state`)));
  assert.deepEqual(report.fails, []);
  assert.match(report.summary, /^\d+ sections \+ root/);
});

test("runs when reached through a symlink, so a symlinked gate cannot pass unchecked", () => {
  const link = join(mkdtempSync(join(tmpdir(), "link-")), "gates-link.ts");
  symlinkSync(join(REPO, "experis", "gates.ts"), link);
  const run = spawnSync(process.execPath, [link], { cwd: REPO, encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^\d+ sections \+ root/);
});

test("writeDiagrams writes one NN.mmd file per mermaid block, as the render check reads them", () => {
  const dir = mkdtempSync(join(tmpdir(), "mmd-"));
  const report = checkAgents(REPO);
  writeDiagrams(report.diagrams, dir);
  const names = readdirSync(dir).sort();
  assert.equal(names.length, report.diagrams.length);
  assert.equal(names[0], "00.mmd");
  assert.equal(names[names.length - 1], `${String(names.length - 1).padStart(2, "0")}.mmd`);
  assert.match(readFileSync(join(dir, "00.mmd"), "utf8"), /^flowchart/);
});
