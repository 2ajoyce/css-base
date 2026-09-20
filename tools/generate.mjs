// Works out what has to change on disk to bring the generated parts of a
// css-base folder up to date. Reads files; never writes them.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { replaceCatalog } from "./catalog-markdown.mjs";
import { parseStylesheet } from "./doc-comments.mjs";
import { withContext } from "./header-context.mjs";

// Stylesheets in index.css import order, then any not imported, then scripts.
export function sourceFiles(dir) {
  const index = readFileSync(join(dir, "index.css"), "utf8");
  const imported = [...index.matchAll(/@import\s+url\(["']([^"']+)["']\)/g)].map((m) => m[1]);
  const all = readdirSync(dir);
  const unlisted = all.filter((f) => f.endsWith(".css") && f !== "index.css" && !imported.includes(f));
  return [...imported, ...unlisted, ...all.filter((f) => f.endsWith(".js")).sort()];
}

const lf = (text) => text.replace(/\r\n/g, "\n");
const withEol = (text, original) => (original.includes("\r\n") ? text.replace(/\n/g, "\r\n") : text);

// Returns [{ name, content }] for every file whose content would change.
// Throws if a doc comment is invalid or AGENTS.md has no catalog markers.
export function plan(dir) {
  const files = [];
  const changes = [];
  for (const name of sourceFiles(dir)) {
    const original = readFileSync(join(dir, name), "utf8");
    const text = lf(original);
    const where = relative(process.cwd(), join(dir, name)).replaceAll("\\", "/");
    const { header, items } = parseStylesheet(text, where);
    if (header.file !== name) throw new Error(`${where}: @file says "${header.file}"`);
    files.push({ name, header, items });
    const next = items.length ? withContext(text, items, where) : text;
    if (next !== text) changes.push({ name, content: withEol(next, original) });
  }
  const original = readFileSync(join(dir, "AGENTS.md"), "utf8");
  const next = replaceCatalog(lf(original), files);
  if (next !== lf(original)) changes.push({ name: "AGENTS.md", content: withEol(next, original) });
  return changes;
}
