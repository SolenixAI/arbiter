import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readText } from "./io.ts";

test("readText turns CR LF and lone CR into LF, as Python's read_text does", () => {
  const file = join(mkdtempSync(join(tmpdir(), "io-")), "sample.txt");
  writeFileSync(file, "a\r\nb\rc\n");
  assert.equal(readText(file), "a\nb\nc\n");
});
