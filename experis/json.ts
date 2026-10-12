// Python's json.dumps(value, indent=1, ensure_ascii=False) and json.loads(text), with the same output bytes.
// Python prints a float as 2.0 or 1e-05 and an int as 2, so a float is a PyFloat and an int is a number.
// A Map keeps its insertion order, as a Python dict does, so an integer-looking key such as "2" is not moved.

export class PyFloat {
  readonly value: number;

  constructor(value: number) {
    this.value = value;
  }
}

export type Dict = Map<string, Json>;
export type Json = null | boolean | number | string | PyFloat | Json[] | Dict;

// Python's float repr: the shortest digits that round-trip, fixed notation for exponents -4 to 15, else scientific.
export function floatRepr(x: number): string {
  if (Number.isNaN(x)) return "NaN";
  if (x === Infinity) return "Infinity";
  if (x === -Infinity) return "-Infinity";
  const sign = x < 0 || Object.is(x, -0) ? "-" : "";
  const magnitude = Math.abs(x);
  if (magnitude === 0) return `${sign}0.0`;
  const [mantissa, exponentText] = magnitude.toExponential().split("e");
  const exponent = Number(exponentText);
  const digits = mantissa.replace(".", "");
  if (exponent >= -4 && exponent < 16) {
    if (exponent < 0) return `${sign}0.${"0".repeat(-exponent - 1)}${digits}`;
    const integerDigits = exponent + 1;
    if (digits.length <= integerDigits) return `${sign}${digits}${"0".repeat(integerDigits - digits.length)}.0`;
    return `${sign}${digits.slice(0, integerDigits)}.${digits.slice(integerDigits)}`;
  }
  const scientific = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
  const exponentDigits = String(Math.abs(exponent)).padStart(2, "0");
  return `${sign}${scientific}e${exponent < 0 ? "-" : "+"}${exponentDigits}`;
}

export function dumps(value: Json): string {
  return dumpAt(value, 0);
}

function dumpAt(value: Json, depth: number): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (value instanceof PyFloat) return floatRepr(value.value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) throw new TypeError(`${value} is a float: wrap it in PyFloat`);
    return String(value);
  }
  const pad = " ".repeat(depth + 1);
  const close = " ".repeat(depth);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => pad + dumpAt(item, depth + 1)).join(",\n")}\n${close}]`;
  }
  if (value.size === 0) return "{}";
  const entries = [...value].map(([key, item]) => `${pad}${JSON.stringify(key)}: ${dumpAt(item, depth + 1)}`);
  return `{\n${entries.join(",\n")}\n${close}}`;
}

export function loads(text: string): Json {
  const parser = new Parser(text);
  const value = parser.value();
  parser.skipSpace();
  if (parser.at !== text.length) parser.fail("Extra data");
  return value;
}

const NUMBER = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?/y;

class Parser {
  readonly text: string;
  at = 0;

  constructor(text: string) {
    this.text = text;
  }

  fail(message: string): never {
    throw new SyntaxError(`${message} at character ${this.at}`);
  }

  skipSpace(): void {
    for (;;) {
      const c = this.text[this.at];
      if (c !== " " && c !== "\t" && c !== "\n" && c !== "\r") return;
      this.at++;
    }
  }

  word(token: string): boolean {
    if (!this.text.startsWith(token, this.at)) return false;
    this.at += token.length;
    return true;
  }

  value(): Json {
    this.skipSpace();
    const c = this.text[this.at];
    if (c === "{") return this.object();
    if (c === "[") return this.array();
    if (c === '"') return this.string();
    if (this.word("true")) return true;
    if (this.word("false")) return false;
    if (this.word("null")) return null;
    if (this.word("NaN")) return new PyFloat(NaN);
    if (this.word("Infinity")) return new PyFloat(Infinity);
    if (this.word("-Infinity")) return new PyFloat(-Infinity);
    return this.number();
  }

  number(): Json {
    NUMBER.lastIndex = this.at;
    const found = NUMBER.exec(this.text);
    if (found === null) this.fail("Expecting value");
    const raw = found[0];
    this.at += raw.length;
    const value = Number(raw);
    return /[.eE]/.test(raw) ? new PyFloat(value) : value;
  }

  string(): string {
    this.at++;
    let out = "";
    for (;;) {
      if (this.at >= this.text.length) this.fail("Unterminated string");
      const c = this.text[this.at];
      if (c === '"') {
        this.at++;
        return out;
      }
      if (c < " ") this.fail("Invalid control character in string");
      if (c !== "\\") {
        out += c;
        this.at++;
        continue;
      }
      const escape = this.text[this.at + 1];
      this.at += 2;
      if (escape === "u") {
        const hex = this.text.slice(this.at, this.at + 4);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) this.fail("Invalid \\u escape");
        out += String.fromCharCode(parseInt(hex, 16));
        this.at += 4;
      } else {
        const plain: Record<string, string> = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
        if (!(escape in plain)) this.fail("Invalid escape");
        out += plain[escape];
      }
    }
  }

  object(): Dict {
    const dict: Dict = new Map();
    this.at++;
    this.skipSpace();
    if (this.text[this.at] === "}") {
      this.at++;
      return dict;
    }
    for (;;) {
      this.skipSpace();
      if (this.text[this.at] !== '"') this.fail("Expecting property name enclosed in double quotes");
      const key = this.string();
      this.skipSpace();
      if (this.text[this.at] !== ":") this.fail("Expecting ':' delimiter");
      this.at++;
      dict.set(key, this.value());
      this.skipSpace();
      const c = this.text[this.at];
      if (c === "}") {
        this.at++;
        return dict;
      }
      if (c !== ",") this.fail("Expecting ',' delimiter");
      this.at++;
    }
  }

  array(): Json[] {
    const list: Json[] = [];
    this.at++;
    this.skipSpace();
    if (this.text[this.at] === "]") {
      this.at++;
      return list;
    }
    for (;;) {
      list.push(this.value());
      this.skipSpace();
      const c = this.text[this.at];
      if (c === "]") {
        this.at++;
        return list;
      }
      if (c !== ",") this.fail("Expecting ',' delimiter");
      this.at++;
    }
  }
}
