#!/usr/bin/env node
// Fails if any tracked text file contains an em dash (U+2014). Use a plain
// hyphen ( - ) instead: it is easy to type and does not trip linters.
//
// Usage: node tools/check-dashes.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EM_DASH = "—";
const BINARY = /\.(png|jpe?g|gif|webp|ico|zip|woff2?)$/i;

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter((f) => f && !BINARY.test(f));

let found = 0;
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // deleted in the working tree
  }
  text.split("\n").forEach((line, i) => {
    if (line.includes(EM_DASH)) {
      console.error(`${file}:${i + 1}: em dash, use " - " instead`);
      found++;
    }
  });
}

if (found) process.exit(1);
console.log("ok: no em dashes");
