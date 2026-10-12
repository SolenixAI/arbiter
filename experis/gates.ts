// AGENTS.md gates: the poka-yoke that every pull request must pass.
//   node experis/gates.ts              # check AGENTS.md, exit 1 on any failure
//   node experis/gates.ts --mermaid D  # also write each diagram to D/NN.mmd for the render check
// Node builtins only, so it runs on Node 24 with no install.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isEntryPoint, readText } from "./io.ts";
import { LINE_END, LINE_START, lstrip, partition, pyInt, splitlines, splitWords, strip, stripRun, WORD_AFTER, WORD_BEFORE, WS } from "./text.ts";

export interface GateReport {
  summary: string;
  fails: string[];
  diagrams: string[];
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PVI2 = ["North star:", "Inspiration:", "Purpose:", "Value:", "Impact:"];
const TRIPLET = ["docus", "experis", "imples"];
const SENTENCE_BREAK = new RegExp(`(?<=[.!?])${WS}+(?=[A-Z"\`])`);
const FORMULA = LINE_START + "- `[^`]+`" + LINE_END;
const MARKER = "`?<[~?!≠⊥]>`?";
const STOP = new RegExp(
  `${WORD_BEFORE}(report it|record the blocker|outside your control|one-way door|keep a finding|stop and ask|wait for (?:the user|approval)|out of scope)${WORD_AFTER}`,
  "giu",
);
const OPEN = new RegExp(`\\(${WS}*${MARKER}${WS}*[,)]|\\(assumed${WORD_AFTER}|\\p{Nd}%?${WS}*${MARKER}`, "gu");
const MUTED = new RegExp(`${WORD_BEFORE}(?:do not|don't|never) flag${WORD_AFTER}|overruled by`, "iu");

// Python's repr of a list of strings, as the Python gate printed it.
function pyListRepr(items: string[]): string {
  return `[${items.map((item) => `'${item}'`).join(", ")}]`;
}

function countMatches(text: string, source: string): number {
  return [...text.matchAll(new RegExp(source, "g"))].length;
}

// The first 70 or 60 characters, counted in code points, as Python slices a string.
function firstChars(text: string, count: number): string {
  return Array.from(text).slice(0, count).join("");
}

// The bodies of a section, by lowercase name, in document order.
function bodies(section: string): Map<string, string> {
  const pieces = section.split(new RegExp(`${LINE_START}### (Docus|Experis|Imples)${WS}*${LINE_END}`));
  const found = new Map<string, string>();
  for (let i = 1; i < pieces.length - 1; i += 2) found.set(pieces[i].toLowerCase(), pieces[i + 1]);
  return found;
}

function trackedFiles(root: string): string[] {
  const listed = spawnSync("git", ["-C", root, "ls-files"], { encoding: "utf8" });
  // Without git the Python original raised, so the container-law check never passed by default.
  if (listed.error !== undefined) throw listed.error;
  return splitWords(listed.stdout ?? "");
}

export function checkAgents(root: string): GateReport {
  const md = readText(join(root, "AGENTS.md"));
  const fails: string[] = [];

  // STE: every text sentence has 20 words or fewer. Formulas are math, not sentences.
  for (const line of splitlines(md)) {
    const s = lstrip(line);
    if (s.startsWith("- ") && !s.startsWith("- `")) {
      for (const sentence of s.slice(2).split(SENTENCE_BREAK)) {
        const words = splitWords(sentence).length;
        if (words > 20) fails.push(`STE: ${words} words: ${firstChars(sentence, 70)}…`);
      }
    }
  }

  const cut = md.lastIndexOf("\n---\n");
  const body = cut < 0 ? "" : md.slice(0, cut);
  const parts = body.split(new RegExp(`${LINE_START}(?=#{1,2} )`)).filter((part) => strip(part) !== "");

  const numbers: number[] = [];
  for (const part of parts) {
    const title = splitlines(part)[0] ?? "";
    const numbered = /^## (\p{Nd}+)\. /u.exec(title);
    const name = numbered !== null ? `§${numbered[1]}` : "root";
    if (numbered !== null) numbers.push(pyInt(numbered[1]));

    // Triplet: text, formula and diagram, in that order.
    const found = bodies(part);
    const keys = [...found.keys()];
    if (keys.length !== TRIPLET.length || keys.some((key, i) => key !== TRIPLET[i])) {
      fails.push(`triplet: ${name} has ${pyListRepr(keys)}, needs docus, experis, imples`);
      continue;
    }
    const docus = [...(found.get("docus") ?? "").matchAll(new RegExp(`${LINE_START}- ([^\\n]*)${LINE_END}`, "g"))].map(
      (match) => match[1],
    );
    const counts: Array<[string, number]> = [
      ["docus", docus.length],
      ["experis", countMatches(found.get("experis") ?? "", FORMULA)],
      ["imples", (found.get("imples") ?? "").split("```mermaid").length - 1],
    ];
    // 9-slot rule: each body holds 1 to 9 top-level items.
    for (const [kind, count] of counts) {
      if (count < 1 || count > 9) fails.push(`9-slot: ${name} ${kind} has ${count} top-level items`);
    }
    // Each Docus opens with PVI²: north star, inspiration, purpose, value, impact.
    const opening = docus.slice(0, 5).map((item) => {
      const first = item.split(" ")[0];
      return item.startsWith("North") ? `${first} ${item.split(" ")[1]}` : first;
    });
    if (opening.length !== PVI2.length || opening.some((word, i) => word !== PVI2[i])) {
      fails.push(`PVI²: ${name} Docus must open with ${PVI2.join(", ")}`);
    }
  }

  // Sections run 1 to N with no gap, and every (§N) pointer resolves.
  if (numbers.some((n, i) => n !== i + 1)) {
    fails.push(`sections: numbered [${numbers.join(", ")}]`);
  }
  const refs = [...new Set([...md.matchAll(/§(\p{Nd}+)/gu)].map((match) => pyInt(match[1])))].sort((a, b) => a - b);
  for (const ref of refs) {
    if (!numbers.includes(ref)) fails.push(`pointer: §${ref} does not exist`);
  }

  // The README quotes one rule. The quote must match the file word for word, so it cannot drift.
  const readmeFile = join(root, "README.md");
  const readme = existsSync(readmeFile) ? readText(readmeFile) : "";
  const quotes = readme.matchAll(
    new RegExp(`${LINE_START}\\*{0,2}(Text \\(Docus\\)|Formula \\(Experis\\))\\*{0,2}:\\*{0,2}${WS}*([^\\n]+)${LINE_END}`, "g"),
  );
  for (const [, label, rawQuote] of quotes) {
    const quote = stripRun(strip(rawQuote), "`");
    if (!md.includes(quote)) fails.push(`README quote drifted from AGENTS.md: ${label}: ${firstChars(quote, 60)}…`);
  }

  // Container law: docus, experis and imples hold files only, and the root lists its terminus.
  const tracked = trackedFiles(root);
  for (const file of tracked) {
    const [head, , rest] = partition(file, "/");
    if (TRIPLET.includes(head) && rest.includes("/")) fails.push(`container law: ${head}/ holds files only, found ${file}`);
  }
  if (tracked.length > 0 && !tracked.includes("TERMINUS.md")) fails.push("container law: the root has no TERMINUS.md");

  // The file stays universal: no private tracker ids.
  for (const match of md.matchAll(new RegExp(`${WORD_BEFORE}[A-Z]{2,5}-[0-9]{2,5}${WORD_AFTER}`, "gu"))) {
    fails.push(`private id: ${match[0]}`);
  }

  // Stop exits: no rule may end by parking the work or handing it back (5:0, §1, §8).
  splitlines(md).forEach((line, i) => {
    for (const match of line.matchAll(STOP)) {
      fails.push(`stop exit, line ${i + 1}: '${match[0]}' parks the work; route it to a recipe (§8)`);
    }
    // The file passes its own 5:0: no assumed number or open marker sits on a value in its own rules.
    for (const match of line.matchAll(OPEN)) fails.push(`open fragment in the file, line ${i + 1}: ${match[0]}`);
  });

  // No muted engine: a reviewer config never tells an engine to stop finding something (§10).
  for (const file of tracked) {
    if ((file.endsWith(".yaml") || file.endsWith(".yml")) && MUTED.test(readText(join(root, file)))) {
      fails.push(`muted engine: ${file} tells a reviewer not to flag a finding`);
    }
  }

  const diagrams = [...md.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((match) => match[1]);
  let sentences = 0;
  for (const line of splitlines(md)) {
    const s = lstrip(line);
    if (s.startsWith("- ") && !s.startsWith("- `")) sentences += s.slice(2).split(SENTENCE_BREAK).length;
  }
  const mermaidBlocks = md.split("```mermaid").length - 1;
  return {
    summary: `${numbers.length} sections + root · ${sentences} sentences · ${mermaidBlocks} diagrams`,
    fails,
    diagrams,
  };
}

export function writeDiagrams(diagrams: string[], dir: string): void {
  mkdirSync(dir, { recursive: true });
  diagrams.forEach((diagram, i) => {
    writeFileSync(join(dir, `${String(i).padStart(2, "0")}.mmd`), diagram);
  });
}

export function main(argv: string[], root: string): number {
  const report = checkAgents(root);
  if (argv.includes("--mermaid")) {
    const target = argv[argv.indexOf("--mermaid") + 1];
    if (target === undefined) throw new Error("--mermaid needs a directory");
    writeDiagrams(report.diagrams, target);
  }
  process.stdout.write(`${report.summary}\n`);
  if (report.fails.length > 0) {
    process.stdout.write(`${report.fails.map((fail) => `FAIL ${fail}`).join("\n")}\n`);
    return 1;
  }
  process.stdout.write("PASS: STE, triplets, 9-slot, PVI², pointers, README quote, container law, no private ids, no stop exits, own 5:0, no muted engine\n");
  return 0;
}

if (isEntryPoint(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2), ROOT);
}
