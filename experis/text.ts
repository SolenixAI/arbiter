// Python str semantics for the gates and measurements. JavaScript's regex whitespace, trim(), split() and
// line breaks differ from Python's on a few characters, so these helpers match Python exactly.

// Python's str.isspace() characters, as the body of a regex character class.
const SPACE = "\\t\\n\\v\\f\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000";

// Python's \s and \S for str patterns.
export const WS = `[${SPACE}]`;
export const NOT_WS = `[^${SPACE}]`;

// Python's ^ and $ with re.MULTILINE: a line starts after a newline or at the start, and ends before a newline or at the end.
export const LINE_START = "(?<![^\\n])";
export const LINE_END = "(?![^\\n])";

// Python's \b for str patterns: the edge of a run of letters, digits or underscores (needs the u flag).
export const WORD_BEFORE = "(?<![\\p{L}\\p{N}_])";
export const WORD_AFTER = "(?![\\p{L}\\p{N}_])";

// Python's splitlines(): breaks on CR LF, CR, LF, VT, FF, FS, GS, RS, NEL, LS and PS.
const LINE_BREAK = new RegExp("\\r\\n|[\\n\\v\\f\\r\\x1c-\\x1e\\x85\\u2028\\u2029]", "g");

export function splitlines(text: string): string[] {
  const lines: string[] = [];
  let start = 0;
  for (const found of text.matchAll(LINE_BREAK)) {
    lines.push(text.slice(start, found.index));
    start = found.index + found[0].length;
  }
  if (start < text.length) lines.push(text.slice(start));
  return lines;
}

// Python's str.split() with no argument: runs of whitespace separate words, and empty words are dropped.
export function splitWords(text: string): string[] {
  return text.split(new RegExp(`${WS}+`)).filter((word) => word !== "");
}

const LEADING_WS = new RegExp(`^${WS}+`);
const TRAILING_WS = new RegExp(`${WS}+$`);

export function lstrip(text: string): string {
  return text.replace(LEADING_WS, "");
}

export function strip(text: string): string {
  return lstrip(text).replace(TRAILING_WS, "");
}

// Python's str.strip(ch) for one character.
export function stripRun(text: string, ch: string): string {
  let start = 0;
  let end = text.length;
  while (start < end && text[start] === ch) start++;
  while (end > start && text[end - 1] === ch) end--;
  return text.slice(start, end);
}

export function stripNewlines(text: string): string {
  return stripRun(text, "\n");
}

// Python's round(x) with no digits: a half goes to the even neighbour.
export function pyRound(x: number): number {
  const floor = Math.floor(x);
  const fraction = x - floor;
  if (fraction > 0.5) return floor + 1;
  if (fraction < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

// Python's str.partition(sep): the text before the first separator, the separator, and the text after it.
export function partition(text: string, sep: string): [string, string, string] {
  const at = text.indexOf(sep);
  return at < 0 ? [text, "", ""] : [text.slice(0, at), sep, text.slice(at + sep.length)];
}

// The value of one Unicode decimal digit. Each run of decimal digits is ten code points, starting at zero.
export function digitValue(digit: string): number {
  const code = digit.codePointAt(0) as number;
  let start = code;
  while (start > 0 && /\p{Nd}/u.test(String.fromCodePoint(start - 1))) start--;
  return (code - start) % 10;
}

// Python's int() of a run of decimal digits, which may use any Unicode decimal digit.
export function pyInt(digits: string): number {
  return Number(Array.from(digits, (digit) => digitValue(digit)).join(""));
}
