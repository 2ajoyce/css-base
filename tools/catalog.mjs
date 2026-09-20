#!/usr/bin/env node
// Keeps the generated parts of css-base up to date: the @context block in each
// file header and the catalog in AGENTS.md. Both come from the doc comments.
//
// Usage: node tools/catalog.mjs [write|check] [dir]
//   write  (default) update the files
//   check  change nothing; exit 1 if a file is out of date or a comment is invalid
//   dir    the folder to work on; defaults to css-base
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { plan } from "./generate.mjs";

const defaultDir = join(dirname(fileURLToPath(import.meta.url)), "..", "css-base");
const [mode = "write", dir = defaultDir] = process.argv.slice(2);

if (!["write", "check"].includes(mode)) {
  console.error(`unknown mode "${mode}" (expected write or check)`);
  process.exit(2);
}

try {
  const changes = plan(dir);
  const names = changes.map((c) => c.name).join(", ");
  if (mode === "write") {
    for (const { name, content } of changes) writeFileSync(join(dir, name), content);
    console.log(changes.length ? `updated: ${names}` : "already up to date");
  } else if (changes.length) {
    console.error(`out of date: ${names}\nrun \`just catalog\` and commit the result`);
    process.exit(1);
  } else {
    console.log("ok: generated content is up to date");
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
