import { test } from "node:test";
import assert from "node:assert/strict";
import { lstrip, partition, pyRound, splitlines, splitWords, strip, stripNewlines } from "./text.ts";

const LS = String.fromCharCode(0x2028);
const NBSP = String.fromCharCode(0xa0);
const BOM = String.fromCharCode(0xfeff);

test("splitlines breaks where Python's str.splitlines breaks", () => {
  assert.deepEqual(splitlines("a\nb\n"), ["a", "b"]);
  assert.deepEqual(splitlines("a\r\nb"), ["a", "b"]);
  assert.deepEqual(splitlines(`x${LS}y`), ["x", "y"]);
  assert.deepEqual(splitlines("\n"), [""]);
  assert.deepEqual(splitlines(""), []);
});

test("splitWords and strip treat whitespace the way Python does", () => {
  assert.deepEqual(splitWords("  a  b\tc "), ["a", "b", "c"]);
  assert.equal(strip(`${NBSP}a${NBSP}`), "a");
  assert.equal(lstrip(`${NBSP}a`), "a");
  assert.equal(strip(`${BOM}a`), `${BOM}a`);
});

test("stripNewlines removes only newline characters from both ends", () => {
  assert.equal(stripNewlines("\n\na b\n"), "a b");
  assert.equal(stripNewlines("  a  "), "  a  ");
});

test("pyRound rounds half to even, as Python's round() does", () => {
  assert.equal(pyRound(0.5), 0);
  assert.equal(pyRound(1.5), 2);
  assert.equal(pyRound(2.5), 2);
  assert.equal(pyRound(-2.5), -2);
  assert.equal(pyRound(-3.5), -4);
  assert.equal(pyRound(2.6), 3);
});

test("partition splits at the first separator, as str.partition does", () => {
  assert.deepEqual(partition("docus/a/b.md", "/"), ["docus", "/", "a/b.md"]);
  assert.deepEqual(partition("TERMINUS.md", "/"), ["TERMINUS.md", "", ""]);
});
