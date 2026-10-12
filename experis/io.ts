// File and process rules that the Python originals had by default: universal newlines on read, and a
// script that runs when it is reached through a symlink.

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Python's read_text(): CR LF and a lone CR read as LF.
export function readText(file: string): string {
  return readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
}

// True when the module at moduleUrl is the script that node was asked to run. Both paths are resolved first,
// so a symlink to the script runs it, and the script cannot pass without running its checks.
export function isEntryPoint(moduleUrl: string): boolean {
  const script = process.argv[1];
  if (script === undefined) return false;
  try {
    return realpathSync(script) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
