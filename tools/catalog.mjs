#!/usr/bin/env node
// Keeps the generated parts of the repo up to date, all from the doc comments:
// the @context block in each css-base file header, the catalog in AGENTS.md,
// and the <include-html> and <css-catalog> tags in the docs pages.
//
// Usage: node tools/catalog.mjs [write|check] [cssDir] [docsDir]
//   write    (default) update the files
//   check    change nothing; exit 1 if a file is out of date or a comment is invalid
//   cssDir   defaults to css-base
//   docsDir  defaults to docs, but only when cssDir is also left at its default
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { plan } from "./generate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [mode = "write", cssArg, docsArg] = process.argv.slice(2);
const cssDir = cssArg ?? join(root, "css-base");
const docsDir = docsArg ?? (cssArg ? undefined : join(root, "docs"));

if (!["write", "check"].includes(mode)) {
  console.error(`unknown mode "${mode}" (expected write or check)`);
  process.exit(2);
}

try {
  const changes = plan(cssDir, docsDir);
  const names = changes.map((c) => c.name).join(", ");
  if (mode === "write") {
    for (const { path, content } of changes) writeFileSync(path, content);
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
