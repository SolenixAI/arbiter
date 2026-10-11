// PVI ratings for each AGENTS.md section. Writes only experis/pvi.json; measure.ts --write puts the scores in AGENTS.md.
// Each rating is stored with the SHA-256 of its section's text (measurement tables excluded), so a changed section shows as stale.
//   node experis/pvi.ts list          # section titles + current hashes + rating state + file mean
//   node experis/pvi.ts set < r.json  # r.json: {"<section title>": [rating, rating, rating]}, rating = {"P":0-5,"V":0-5,"I":0-5,"C":0-5 (certainty),"E":0-5,"rater":"...","rated_at":"ISO 8601", "sources":{...}}
// One rating = 20 * (P*V*I*C*E)^(1/5), AGENTS.md section 6. A section's score is the mean of 3 independent raters (section 13: one rater's noise is about ±7).
// The file score is the mean of the sections, never a sum: a sum rewards adding weak sections.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PyFloat, dumps, loads, type Dict, type Json } from "./json.ts";
import { LINE_START, pyRound, splitlines, strip, stripNewlines } from "./text.ts";

export const USAGE = `PVI ratings for each AGENTS.md section. Writes only experis/pvi.json; measure.ts --write puts the scores in AGENTS.md.
Each rating is stored with the SHA-256 of its section's text (measurement tables excluded), so a changed section shows as stale.
  node experis/pvi.ts list          # section titles + current hashes + rating state + file mean
  node experis/pvi.ts set < r.json  # r.json: {"<section title>": [rating, rating, rating]}, rating = {"P":0-5,"V":0-5,"I":0-5,"C":0-5 (certainty),"E":0-5,"rater":"...","rated_at":"ISO 8601", "sources":{...}}
One rating = 20 * (P*V*I*C*E)^(1/5), AGENTS.md section 6. A section's score is the mean of 3 independent raters (section 13: one rater's noise is about ±7).
The file score is the mean of the sections, never a sum: a sum rewards adding weak sections.
`;

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// AGENTS.md without its measurement tables and its Measurements section.
export function clean(markdown: string): string {
  const measurements = new RegExp(`${LINE_START}## Measurements\\n[\\s\\S]*?(?=${LINE_START}## |${LINE_START}---\\n)`, "g");
  const md = markdown.replace(measurements, "");
  return md
    .split("\n")
    .filter((line) => !line.startsWith("|"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

// Each section's title and the SHA-256 of its text, in document order. The tail after the last rule is not a section.
export function sectionHashes(markdown: string): Array<[string, string]> {
  const cleaned = clean(markdown);
  const lastRule = cleaned.lastIndexOf("\n---\n");
  const body = lastRule < 0 ? cleaned : cleaned.slice(0, lastRule);
  return body
    .split(new RegExp(`${LINE_START}## `))
    .filter((piece) => strip(piece) !== "")
    .map((piece) => {
      const title = strip(splitlines(piece)[0] ?? "");
      return [title, sha256(stripNewlines(`## ${piece}`))];
    });
}

function ledgerPath(root: string): string {
  return join(root, "experis", "pvi.json");
}

function readAgents(root: string): string {
  return readFileSync(join(root, "AGENTS.md"), "utf8");
}

export function readLedger(root: string): Dict {
  const file = ledgerPath(root);
  return existsSync(file) ? (loads(readFileSync(file, "utf8")) as Dict) : new Map();
}

// The stored score when the hash still matches, "stale" when the section changed, null when never rated.
export function scoreOf(title: string, hash: string, ledger: Dict): number | "stale" | null {
  const rating = ledger.get(title) as Dict | undefined;
  if (rating === undefined || rating.size === 0) return null;
  return rating.get("hash") === hash && rating.has("ratings") ? (rating.get("score") as number) : "stale";
}

export function listSections(root: string): string {
  const ledger = readLedger(root);
  const current = new Map<string, number>();
  let out = "";
  for (const [title, hash] of sectionHashes(readAgents(root))) {
    const state = scoreOf(title, hash, ledger);
    const label = state === null ? "unrated" : state === "stale" ? "stale" : "current";
    const value = state === null || state === "stale" ? "" : String(state);
    out += `${hash.slice(0, 12)}  ${label.padEnd(8)} ${value.padStart(3)}  ${title}\n`;
    if (typeof state === "number") current.set(title, state);
  }
  if (current.size > 0) {
    const scores = [...current.values()];
    const mean = pyRound(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    let lowTitle = "";
    let lowScore = Infinity;
    for (const [title, score] of current) {
      if (score < lowScore) {
        lowTitle = title;
        lowScore = score;
      }
    }
    out += `file: mean ${mean} over ${current.size} current sections · lowest ${lowScore} (${lowTitle})\n`;
  }
  return out;
}

// A rating value that Python's `value in range(6)` accepts: an int, a float equal to an int, or a bool.
function ratingValue(value: Json | undefined): number | null {
  if (typeof value === "boolean") return value ? 1 : 0;
  const n = value instanceof PyFloat ? value.value : typeof value === "number" ? value : null;
  return n !== null && Number.isInteger(n) && n >= 0 && n <= 5 ? n : null;
}

export function setRatings(root: string, input: string): string {
  const incoming = loads(input);
  if (!(incoming instanceof Map)) throw new Error("ratings must be a JSON object");
  const ledger = readLedger(root);
  const current = new Map(sectionHashes(readAgents(root)));
  for (const [title, ratings] of incoming) {
    if (!current.has(title)) throw new Error(`unknown section: ${title}`);
    if (!Array.isArray(ratings) || ratings.length !== 3) throw new Error(`need 3 independent ratings: ${title}`);
    const scores: number[] = [];
    for (const rating of ratings) {
      if (!(rating instanceof Map)) throw new Error(`a rating must be a JSON object: ${title}`);
      const [P, V, I, C, E] = ["P", "V", "I", "C", "E"].map((key) => ratingValue(rating.get(key)));
      if ([P, V, I, C, E].some((value) => value === null)) throw new Error(`P, V, I, C, E must be 0-5: ${title}`);
      const score = 20 * Math.pow((P as number) * (V as number) * (I as number) * (C as number) * (E as number), 0.2);
      rating.set("score", new PyFloat(score));
      scores.push(score);
    }
    ledger.set(
      title,
      new Map<string, Json>([
        ["score", pyRound(scores.reduce((sum, score) => sum + score, 0) / 3)],
        ["hash", current.get(title) as string],
        ["ratings", ratings],
      ]),
    );
  }
  const file = ledgerPath(root);
  writeFileSync(file, `${dumps(ledger)}\n`);
  return `rated ${incoming.size} sections -> ${file}\n`;
}

export function runPvi(argv: string[], root: string, stdin = ""): RunResult {
  try {
    if (argv.length === 1 && argv[0] === "list") return { code: 0, stdout: listSections(root), stderr: "" };
    if (argv.length === 1 && argv[0] === "set") return { code: 0, stdout: setRatings(root, stdin), stderr: "" };
    return { code: 1, stdout: "", stderr: `${USAGE}\n` };
  } catch (error) {
    return { code: 1, stdout: "", stderr: `${(error as Error).message}\n` };
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const stdin = argv.length === 1 && argv[0] === "set" ? readFileSync(0, "utf8") : "";
  const result = runPvi(argv, ROOT, stdin);
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.code;
}
