import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// `#` aliases only resolve in import statements. Inside `new URL(...)` the `#`
// starts a URL fragment, so Vite's worker resolver receives an empty path and
// the client transform fails with "specifiers must be a non-empty string".
// Worker entries must use relative paths instead.
describe("worker URLs", () => {
  it("never uses # aliases inside new URL()", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
    const bad: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry.startsWith(".")) continue;
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
          if (entry !== "__tests__") walk(path);
        } else if (/\.(svelte|ts|js)$/.test(entry)) {
          if (/new\s+URL\(\s*["']#/.test(readFileSync(path, "utf8"))) bad.push(path);
        }
      }
    };
    walk(join(root, "src"));
    expect(bad).toEqual([]);
  });
});
