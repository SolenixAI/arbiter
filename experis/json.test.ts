import { test } from "node:test";
import assert from "node:assert/strict";
import { PyFloat, dumps, floatRepr, loads, type Json } from "./json.ts";

test("floatRepr prints a float the way Python's repr does", () => {
  assert.equal(floatRepr(0), "0.0");
  assert.equal(floatRepr(75), "75.0");
  assert.equal(floatRepr(0.1), "0.1");
  assert.equal(floatRepr(1234.5), "1234.5");
  assert.equal(floatRepr(-2.5), "-2.5");
  assert.equal(floatRepr(1e15), "1000000000000000.0");
  assert.equal(floatRepr(1e16), "1e+16");
  assert.equal(floatRepr(0.0001), "0.0001");
  assert.equal(floatRepr(0.00001), "1e-05");
  assert.equal(floatRepr(1.5e-5), "1.5e-05");
});

test("dumps matches json.dumps(indent=1, ensure_ascii=False)", () => {
  const value: Json = new Map<string, Json>([
    ["a", [1, new PyFloat(2)]],
    ["b", "é"],
    ["c", new Map()],
    ["d", []],
    ["e", null],
  ]);
  assert.equal(dumps(value), '{\n "a": [\n  1,\n  2.0\n ],\n "b": "é",\n "c": {},\n "d": [],\n "e": null\n}');
});

test("dumps refuses a bare non-integer number, so every float is marked", () => {
  assert.throws(() => dumps(2.5 as unknown as Json));
});

test("loads keeps key order and tells a float from an int", () => {
  const value = loads('{"2": 1, "1": 2.0, "x": [true, null, "a\\nb"]}');
  assert.ok(value instanceof Map);
  assert.deepEqual([...value.keys()], ["2", "1", "x"]);
  assert.equal(value.get("2"), 1);
  assert.ok(value.get("1") instanceof PyFloat);
  assert.equal((value.get("1") as PyFloat).value, 2);
  assert.deepEqual(value.get("x"), [true, null, "a\nb"]);
});

test("loads rejects trailing data, as json.loads does", () => {
  assert.throws(() => loads("{} x"));
});
