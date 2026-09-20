// Works out what has to change on disk to bring the generated parts of
// css-base, and optionally its docs pages, up to date. Reads files; never
// writes them.
import { readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { replaceCatalog } from "./catalog-markdown.mjs";
import { renderSections } from "./docs-html.mjs";
import { parseStylesheet } from "./doc-comments.mjs";
import { expandTags } from "./expand-tags.mjs";
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
const label = (path) => relative(process.cwd(), path).replaceAll("\\", "/");

function read(path, where, src) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`${where}: cannot read ${src}`);
  }
}

// Fills the <include-html> and <css-catalog> tags in each top-level .html page.
function planDocs(docsDir) {
  const changes = [];
  for (const file of readdirSync(docsDir).filter((f) => f.endsWith(".html")).sort()) {
    const path = join(docsDir, file);
    const where = label(path);
    const original = readFileSync(path, "utf8");
    const text = lf(original);
    const resolve = (tag, src) => {
      const source = read(join(docsDir, src), where, src);
      if (tag === "include-html") return lf(source).trim();
      const { items } = parseStylesheet(source, label(join(docsDir, src)));
      if (!items.length) throw new Error(`${where}: ${src} has no documented items`);
      return renderSections(items);
    };
    const next = expandTags(text, resolve, where);
    if (next !== text) {
      changes.push({ name: `${basename(docsDir)}/${file}`, path, content: withEol(next, original) });
    }
  }
  return changes;
}

// Returns [{ name, path, content }] for every file whose content would change.
// Throws if a doc comment is invalid, AGENTS.md has no catalog markers, or a
// docs tag cannot be filled. Pass docsDir to include the docs pages.
export function plan(dir, docsDir) {
  const files = [];
  const changes = [];
  for (const name of sourceFiles(dir)) {
    const path = join(dir, name);
    const original = readFileSync(path, "utf8");
    const text = lf(original);
    const where = label(path);
    const { header, items } = parseStylesheet(text, where);
    if (header.file !== name) throw new Error(`${where}: @file says "${header.file}"`);
    files.push({ name, header, items });
    const next = items.length ? withContext(text, items, where) : text;
    if (next !== text) changes.push({ name, path, content: withEol(next, original) });
  }
  const agentsPath = join(dir, "AGENTS.md");
  const original = readFileSync(agentsPath, "utf8");
  const next = replaceCatalog(lf(original), files);
  if (next !== lf(original)) {
    changes.push({ name: "AGENTS.md", path: agentsPath, content: withEol(next, original) });
  }
  if (docsDir) changes.push(...planDocs(docsDir));
  return changes;
}
