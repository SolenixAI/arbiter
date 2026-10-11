// AGENTS.md measurements with tiktoken (o200k_base). The tables live in measurements.json, next to the viewer; AGENTS.md holds only rules.
//   node experis/measure.ts          # print only
//   node experis/measure.ts --write  # write measurements.json, record a temporal checkpoint for every changed node
//   node experis/measure.ts --seal   # only on the user's approval: write the tables, stamp the approval time, lock the file
// One table shape at 3 levels (document, section, body): | tokens | % of parent | PVI | Δ PVI | <checkpoint letter> |.
// Body PVI = the body rated alone against its parent section's goal (semantic, parent-relative). Checkpoints: versions.json, one Greek letter per change of a node's hash.

import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getEncoding } from "js-tiktoken";
import { dumps, loads, type Dict, type Json } from "./json.ts";
import { isEntryPoint, readText } from "./io.ts";
import { clean, sectionHashes, sha256 } from "./pvi.ts";
import { LINE_START, lstrip, NOT_WS, pyRound, splitlines, splitWords, strip, stripNewlines, WS } from "./text.ts";

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface Context {
  writing: boolean;
  now: string;
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GREEK = "αβγδεζηθικλμνξοπρστυφχψω";
const ROMAN: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];
const NAMES: Record<string, string> = { T: "docus", F: "experis", D: "imples" };
const NO_LETTER = "N.N.N α";
const SENTENCE_BREAK = new RegExp(`(?<=[.!?])${WS}+(?=[A-Z"\`])`);
const FORMULA_LINE = LINE_START + "(?:- )?`[^`]+`" + "(?![^\\n])";
const STAMP = new RegExp(`The user approved this file on ${NOT_WS}+?\\.(?= )`);
const STAMP_ALL = new RegExp(STAMP.source, "g");

let encoder: ReturnType<typeof getEncoding> | undefined;

export function tokenCount(text: string | undefined): number {
  if (!text) return 0;
  encoder ??= getEncoding("o200k_base");
  return encoder.encode(stripNewlines(text)).length;
}

export function roman(n: number): string {
  if (n === 0) return "N";
  let out = "";
  let rest = n;
  for (const [value, symbol] of ROMAN) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out;
}

function numberOr(entry: Dict, key: string, fallback: number): number {
  const value = entry.get(key);
  return typeof value === "number" ? value : fallback;
}

// Roman major.minor.patch, then the Greek sub-version letter (one of 24).
export function versionLabel(entry: Dict): string {
  const letter = ((numberOr(entry, "l", 0) % 24) + 24) % 24;
  return `${roman(numberOr(entry, "M", 0))}.${roman(numberOr(entry, "m", 0))}.${roman(numberOr(entry, "p", 0))} ${GREEK[letter]}`;
}

function asList(value: Json | undefined): Dict[] {
  return (value as Dict[] | undefined) ?? [];
}

function asDict(value: Json | undefined): Dict {
  return (value as Dict | undefined) ?? new Map<string, Json>();
}

// A temporal checkpoint: a hash change adds an entry (the letter moves on); --seal moves the patch and resets the letter.
function checkpoint(ctx: Context, list: Dict[], hash: string, pvi: number | null): Dict[] {
  const last = list[list.length - 1];
  if (ctx.writing && (last === undefined || last.get("sha") !== hash)) {
    const prev = last ?? new Map<string, Json>();
    const entry: Dict = new Map<string, Json>([
      ["M", numberOr(prev, "M", 0)],
      ["m", numberOr(prev, "m", 0)],
      ["p", numberOr(prev, "p", 0)],
      ["l", numberOr(prev, "l", -1) + 1],
      ["at", ctx.now],
      ["sha", hash],
      ["pvi", pvi],
    ]);
    entry.set("v", versionLabel(entry));
    list.push(entry);
  } else if (ctx.writing && last !== undefined && pvi !== null) {
    last.set("pvi", pvi);
  }
  return list;
}

function sealAll(versions: Dict, ctx: Context): void {
  const lists: Dict[][] = [asList(versions.get("file"))];
  for (const value of asDict(versions.get("sections")).values()) lists.push(value as Dict[]);
  for (const value of asDict(versions.get("bodies")).values()) lists.push(value as Dict[]);
  for (const list of lists) {
    const last = list[list.length - 1];
    if (last !== undefined && !last.get("sealed")) {
      const entry: Dict = new Map(last);
      entry.set("p", numberOr(last, "p", 0) + 1);
      entry.set("l", 0);
      entry.set("at", ctx.now);
      entry.set("sealed", true);
      entry.set("v", versionLabel(entry));
      list.push(entry);
    }
  }
}

// A signed difference with one decimal, as Python's format(x, "+.1f").
function signed(x: number): string {
  return `${x < 0 ? "-" : "+"}${Math.abs(x).toFixed(1)}`;
}

function cells(n: number, parentTokens: number, pvi: number | null, list: Dict[]): string {
  const cur = list[list.length - 1];
  const hasPvi = (entry: Dict): boolean => entry.get("pvi") !== null && entry.get("pvi") !== undefined;
  const prev = list.length > 0 ? list.slice(0, -1).reverse().find(hasPvi) : undefined;
  let delta = "–";
  if (pvi !== null && cur !== undefined && hasPvi(cur) && prev !== undefined) {
    delta = signed((cur.get("pvi") as number) - (prev.get("pvi") as number));
  }
  const letter = cur !== undefined ? versionLabel(cur) : NO_LETTER;
  const when = cur !== undefined ? String(cur.get("at")) : "–";
  const percent = pyRound((100 * n) / parentTokens);
  return `| tokens | % | PVI | Δ PVI | ${letter} |\n|---|---|---|---|---|\n| ${n} | ${percent}% | ${pvi ?? "–"} | ${delta} | ${when} |\n`;
}

function rstripNewlines(text: string): string {
  let end = text.length;
  while (end > 0 && text[end - 1] === "\n") end--;
  return text.slice(0, end);
}

function capitalise(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

interface Bodies {
  head: string;
  T: string;
  F: string;
  D: string;
  post: string;
}

// The three bodies of a section: under ### headings when present, else text, then formulas, then the diagram.
function splitBodies(p: string): Bodies {
  const i = p.indexOf("### Docus");
  let head: string;
  let rest: string;
  if (i > 0 && stripNewlines(p.slice(0, i)).includes("\n")) {
    head = `${rstripNewlines(p.slice(0, i))}\n`;
    rest = p.slice(i);
  } else if (p.startsWith("### ")) {
    head = "";
    rest = p;
  } else if (p.includes("\n")) {
    const at = p.indexOf("\n");
    head = p.slice(0, at);
    rest = p.slice(at + 1);
  } else {
    head = p;
    rest = "";
  }
  if (rest.includes("### Docus") || rest.includes("### docus")) {
    const pieces = rest.split(new RegExp(`${LINE_START}### (docus|experis|imples)${WS}*(?![^\\n])`, "i"));
    const got = new Map<string, string>();
    for (let k = 1; k < pieces.length - 1; k += 2) {
      got.set(pieces[k].toLowerCase(), stripNewlines(pieces[k + 1]));
    }
    return { head, T: got.get("docus") ?? "", F: got.get("experis") ?? "", D: got.get("imples") ?? "", post: "" };
  }
  const mermaid = /```mermaid[\s\S]*?```/.exec(rest);
  const pre = mermaid !== null ? rest.slice(0, mermaid.index) : rest;
  const D = mermaid !== null ? mermaid[0] : "";
  const post = mermaid !== null ? rest.slice(mermaid.index + mermaid[0].length) : "";
  const formulaLine = splitlines(pre).find((line) => /^`[^`]+`$/.test(line));
  const cut = formulaLine !== undefined ? pre.indexOf(formulaLine) : pre.length;
  return { head, T: stripNewlines(pre.slice(0, cut)), F: stripNewlines(pre.slice(cut)), D, post: stripNewlines(post) };
}

function countMatches(text: string, source: string): number {
  return [...text.matchAll(new RegExp(source, "g"))].length;
}

// The number of bodies (of the three) that hold 1 to 9 items.
function nine(p: string): number {
  const bodies = new Map<string, string>();
  for (const piece of p.split(new RegExp(`${LINE_START}### `)).slice(1)) {
    bodies.set(splitlines(piece)[0].toLowerCase(), piece);
  }
  const counts = [
    countMatches(bodies.get("docus") ?? "", `${LINE_START}- `),
    countMatches(bodies.get("experis") ?? "", FORMULA_LINE),
    (bodies.get("imples") ?? "").split("```mermaid").length - 1,
  ];
  return counts.filter((count) => count >= 1 && count <= 9).length;
}

function localNow(): string {
  const date = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const minutes = Math.abs(offset);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}` +
    `${offset < 0 ? "-" : "+"}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
  );
}

export function runMeasure(argv: string[], root: string, now: string): RunResult {
  const ctx: Context = { writing: argv.includes("--write") || argv.includes("--seal"), now };
  const sealing = argv.includes("--seal");
  const agentsFile = join(root, "AGENTS.md");
  const versionsFile = join(root, "experis", "versions.json");
  const bodiesFile = join(root, "experis", "bodies.json");
  const viewDir = join(root, "imples");

  const md = clean(readText(agentsFile));
  const cut = md.lastIndexOf("\n---\n");
  if (cut < 0) throw new Error("not enough values to unpack (expected 2, got 1)");
  const body = md.slice(0, cut);
  const tail = md.slice(cut + "\n---\n".length);
  const parts = body
    .split(new RegExp(`${LINE_START}(?=## )`))
    .filter((part) => strip(part) !== "");

  const total = tokenCount(md);
  const hashes = new Map(sectionHashes(md));
  const versions: Dict = existsSync(versionsFile)
    ? (loads(readText(versionsFile)) as Dict)
    : new Map<string, Json>();
  if (!versions.has("file")) versions.set("file", []);
  if (!versions.has("sections")) versions.set("sections", new Map<string, Json>());
  if (!versions.has("bodies")) versions.set("bodies", new Map<string, Json>());
  const bods: Dict = existsSync(bodiesFile) ? (loads(readText(bodiesFile)) as Dict) : new Map<string, Json>();

  const lens: number[] = [];
  for (const line of splitlines(md)) {
    const s = lstrip(line);
    if (s.startsWith("- ") && !s.startsWith("- `")) {
      for (const sentence of s.slice(2).split(SENTENCE_BREAK)) {
        if (strip(sentence) !== "") lens.push(splitWords(sentence).length);
      }
    }
  }
  const ste = pyRound((100 * lens.filter((words) => words <= 20).length) / lens.length);

  const numbered = parts.filter((part) => /^## \p{Nd}+\./u.test(part));
  const trip = numbered.filter((part) => part.includes("```mermaid") && new RegExp(FORMULA_LINE).test(part)).length;
  const bodyParts = parts.filter((part) => !part.startsWith("## Measurements"));
  const nineOk = bodyParts.reduce((sum, part) => sum + nine(part), 0);
  const nineAll = 3 * bodyParts.length;

  const out: string[] = [];
  const scores: number[] = [];
  const render = new Map<string, Json>();
  const tables = new Map<string, Json>();
  for (const p of parts) {
    const first = splitlines(p)[0] ?? "";
    const title = strip(first.replace(/^#+/, ""));
    // The Python original indexes title[0] here, so an empty title raises before anything is written.
    if (title === "") throw new Error("IndexError: string index out of range");
    const key = p.startsWith("## ") ? strip(first.slice(3)) : strip(first);
    const num = /^\p{Nd}/u.test(title) ? title.split(".")[0] : p.startsWith("## ") ? null : "0";
    const n = tokenCount(p);
    if (num === null) {
      out.push(`${rstripNewlines(p)}\n`);
      continue;
    }
    const { head, T, F, D, post } = splitBodies(rstripNewlines(p));

    const bb = asDict(bods.get(num));
    const bbHashes = bb.get("hashes") as Dict | undefined;
    let solo: Map<string, number | null> | null = null;
    if (bbHashes !== undefined && bbHashes.size > 0) {
      const bbSolo = asDict(bb.get("solo"));
      const texts: Record<string, string> = { T, F, D };
      solo = new Map();
      for (const k of ["T", "F", "D"]) {
        if (bbHashes.get(k) === sha256(texts[k])) solo.set(k, (bbSolo.get(k) as number | null | undefined) ?? null);
      }
    }
    const soloValues = solo !== null ? [...solo.values()].filter((value): value is number => value !== null) : [];
    const pvi = soloValues.length === 3 ? pyRound(soloValues.reduce((sum, value) => sum + value, 0) / 3) : null;
    if (pvi !== null) scores.push(pvi);

    const sectionMap = asDict(versions.get("sections"));
    if (!sectionMap.has(num)) sectionMap.set(num, []);
    const L = checkpoint(ctx, sectionMap.get(num) as Dict[], hashes.get(key) ?? sha256(p), pvi);

    const structured = p.includes("### Docus") || p.includes("### docus");
    const blocks: string[] = head !== "" ? [head + (num === "0" && !head.endsWith("\n") ? "\n" : "")] : [];
    const renderOfSection = new Map<string, Json>();
    render.set(num, renderOfSection);
    const bodyMap = asDict(versions.get("bodies"));
    for (const [k, txt] of [
      ["T", T],
      ["F", F],
      ["D", D],
    ] as const) {
      if (txt === "") continue;
      const bp = solo?.get(k) ?? null;
      const bodyKey = `${num}.${k}`;
      if (!bodyMap.has(bodyKey)) bodyMap.set(bodyKey, []);
      const BL = checkpoint(ctx, bodyMap.get(bodyKey) as Dict[], sha256(txt), bp);
      const cur = BL[BL.length - 1];
      const prev = BL.slice(0, -1).reverse().find((entry) => entry.get("pvi") !== null && entry.get("pvi") !== undefined);
      const curPvi = cur?.get("pvi");
      const delta =
        curPvi === null || curPvi === undefined || prev === undefined ? null : (curPvi as number) - (prev.get("pvi") as number);
      renderOfSection.set(
        NAMES[k],
        new Map<string, Json>([
          ["tokens", tokenCount(txt)],
          ["pct", pyRound((100 * tokenCount(txt)) / n)],
          ["pvi", bp],
          ["delta", delta],
          ["v", cur !== undefined ? versionLabel(cur) : NO_LETTER],
          ["at", cur !== undefined ? (cur.get("at") as string) : "–"],
        ]),
      );
      blocks.push(...(structured ? [`### ${capitalise(NAMES[k])}`, txt] : [txt, ""]));
    }
    if (post !== "") blocks.push(post, "");
    if (num !== "0") tables.set(num, cells(n, total, pvi, L));
    out.push(`${rstripNewlines(blocks.join("\n"))}\n`);
  }

  const parentPvi = scores.length > 0 && scores.length === bodyParts.length ? pyRound(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null;
  const FL = asList(versions.get("file"));
  checkpoint(ctx, FL, sha256([...hashes.values()].join("")), parentPvi);
  if (sealing) sealAll(versions, ctx);

  const meas =
    `## Measurements\n\n${cells(total, total, parentPvi, FL)}\n| measurement | value |\n|---|---|\n` +
    `| STE: sentences of 20 words or fewer | ${ste}% |\n` +
    `| complete triplets: text, formula, diagram | ${trip}/${numbered.length} |\n` +
    `| 9-slot rule: bodies with 1 to 9 items | ${nineOk}/${nineAll} |\n`;

  let tailText = tail;
  if (sealing) tailText = tailText.replace(STAMP, `The user approved this file on ${ctx.now}.`);
  const newText = `${out.join("\n")}\n---\n${tailText}`;
  let stdout = `${meas}\n`;

  if (ctx.writing) {
    const stampless = (text: string): string => text.replace(STAMP_ALL, "");
    // The Python original prints the tables before this guard, so a refused write still shows them.
    if (stampless(clean(newText)) !== stampless(md)) {
      return { code: 1, stdout, stderr: "AssertionError: writing would change more than the tables and the stamp\n" };
    }
    writeFileSync(agentsFile, newText);
    writeFileSync(versionsFile, dumps(versions));
    writeFileSync(join(viewDir, "bodies-render.json"), dumps(render));
    const firstBreak = meas.indexOf("\n");
    const secondBreak = meas.indexOf("\n", firstBreak + 1);
    writeFileSync(
      join(viewDir, "measurements.json"),
      dumps(
        new Map<string, Json>([
          ["at", ctx.now],
          ["file", meas.slice(secondBreak + 1)],
          ["sections", tables],
        ]),
      ),
    );
    stdout += `tables written to measurements.json; ${agentsFile} holds only rules\n`;
  }
  if (sealing) {
    writeFileSync(join(viewDir, "checkpoints", "sealed.md"), readText(agentsFile));
    execFileSync("chflags", ["uchg", agentsFile]);
    // The Python original locks the file before it reads the stamp. With no stamp line it fails at that read, after the lock.
    const stamp = newText.match(STAMP);
    if (stamp === null) {
      return { code: 1, stdout, stderr: "AttributeError: 'NoneType' object has no attribute 'group'\n" };
    }
    stdout += `sealed: ${stamp[0]} · locked with chflags uchg\n`;
  }
  return { code: 0, stdout, stderr: "" };
}

if (isEntryPoint(import.meta.url)) {
  try {
    const result = runMeasure(process.argv.slice(2), ROOT, localNow());
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exitCode = result.code;
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}
