import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { plan, sourceFiles } from "../tools/generate.mjs";

const CLI = fileURLToPath(new URL("../tools/catalog.mjs", import.meta.url));

const INDEX = `@import url("b.css");\n@import url("a.css");\n`;

const stylesheet = (name, selector, description) => `/**
 * @file ${name}
 * @description The ${name} file.
 * @context
 *   stale line
 */

/**
 * @selector ${selector}
 * @description ${description}
 */
${selector} {}
`;

const AGENTS = `# Agents

<!-- BEGIN GENERATED CATALOG (old) -->
stale
<!-- END GENERATED CATALOG -->
`;

// Creates a css-base-like folder in a temp directory and returns its path.
function makeFolder(files) {
  const dir = mkdtempSync(join(tmpdir(), "css-base-test-"));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

const standard = () =>
  makeFolder({
    "index.css": INDEX,
    "a.css": stylesheet("a.css", ".a", "Thing A."),
    "b.css": stylesheet("b.css", ".b", "Thing B."),
    "AGENTS.md": AGENTS,
  });

// Runs the CLI against a folder.
const cli = (mode, dir) => spawnSync(process.execPath, [CLI, mode, dir], { encoding: "utf8" });

test("sourceFiles: imported stylesheets in import order, then unlisted ones, then scripts", () => {
  const dir = makeFolder({
    "index.css": INDEX,
    "a.css": "",
    "b.css": "",
    "z.css": "",
    "y.js": "",
    "x.js": "",
    "notes.txt": "",
  });
  assert.deepEqual(sourceFiles(dir), ["b.css", "a.css", "z.css", "x.js", "y.js"]);
  rmSync(dir, { recursive: true });
});

test("plan: proposes new headers and a new catalog", () => {
  const dir = standard();
  const changes = plan(dir);
  assert.deepEqual(changes.map((c) => c.name), ["b.css", "a.css", "AGENTS.md"]);
  const a = changes.find((c) => c.name === "a.css").content;
  assert.match(a, /@context\n \*   \.a: Thing A\.\n \*\//);
  const agents = changes.find((c) => c.name === "AGENTS.md").content;
  assert.ok(agents.indexOf("`b.css`") < agents.indexOf("`a.css`"), "catalog follows import order");
  rmSync(dir, { recursive: true });
});

test("plan: does not write anything", () => {
  const dir = standard();
  plan(dir);
  assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8"), AGENTS);
  rmSync(dir, { recursive: true });
});

test("plan: preserves CRLF line endings", () => {
  const dir = makeFolder({
    "index.css": `@import url("a.css");\r\n`,
    "a.css": stylesheet("a.css", ".a", "Thing A.").replace(/\n/g, "\r\n"),
    "AGENTS.md": AGENTS.replace(/\n/g, "\r\n"),
  });
  for (const { content } of plan(dir)) {
    assert.ok(!/(?<!\r)\n/.test(content), "every newline is CRLF");
  }
  rmSync(dir, { recursive: true });
});

test("plan: reports a comment error with the file and line", () => {
  const bad = stylesheet("a.css", ".a", "Thing A.").replace("@selector .a", "@selector .a\n * @nope x");
  const dir = makeFolder({ "index.css": `@import url("a.css");`, "a.css": bad, "AGENTS.md": AGENTS });
  assert.throws(() => plan(dir), /a\.css:\d+: unknown tag @nope/);
  rmSync(dir, { recursive: true });
});

test("plan: @file must match the file name", () => {
  const dir = makeFolder({
    "index.css": `@import url("a.css");`,
    "a.css": stylesheet("other.css", ".a", "Thing A."),
    "AGENTS.md": AGENTS,
  });
  assert.throws(() => plan(dir), /a\.css: @file says "other\.css"/);
  rmSync(dir, { recursive: true });
});

test("plan: fails when AGENTS.md has no markers", () => {
  const dir = makeFolder({
    "index.css": `@import url("a.css");`,
    "a.css": stylesheet("a.css", ".a", "Thing A."),
    "AGENTS.md": "# Agents\n",
  });
  assert.throws(() => plan(dir), /no GENERATED CATALOG markers/);
  rmSync(dir, { recursive: true });
});

test("cli: check fails on a stale folder; write fixes it; check then passes", () => {
  const dir = standard();
  const stale = cli("check", dir);
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /out of date: b\.css, a\.css, AGENTS\.md/);

  const wrote = cli("write", dir);
  assert.equal(wrote.status, 0);
  assert.match(wrote.stdout, /updated: b\.css, a\.css, AGENTS\.md/);
  assert.match(readFileSync(join(dir, "b.css"), "utf8"), /\*   \.b: Thing B\./);

  const fresh = cli("check", dir);
  assert.equal(fresh.status, 0);
  assert.match(cli("write", dir).stdout, /already up to date/);
  rmSync(dir, { recursive: true });
});

test("cli: check does not modify files", () => {
  const dir = standard();
  cli("check", dir);
  assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8"), AGENTS);
  rmSync(dir, { recursive: true });
});

test("cli: an invalid comment exits 1 with the message", () => {
  const dir = makeFolder({
    "index.css": `@import url("a.css");`,
    "a.css": "/**\n * @file a.css\n * @description d\n */\n/**\n * Text before a tag.\n */\n",
    "AGENTS.md": AGENTS,
  });
  const result = cli("write", dir);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /text before the first @tag/);
  rmSync(dir, { recursive: true });
});

test("cli: rejects an unknown mode", () => {
  const dir = standard();
  const result = cli("frobnicate", dir);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown mode "frobnicate"/);
  rmSync(dir, { recursive: true });
});

// A css folder already in sync, next to a docs folder with one page that uses
// both tags.
const PAGE = `<html>
<body>
<include-html src="partials/nav.html"></include-html>
<css-catalog class="stack" src="../css/a.css"></css-catalog>
</body>
</html>
`;

const withDocs = (overrides = {}) => {
  const root = makeFolder({
    "css/index.css": `@import url("a.css");\n`,
    "css/a.css": stylesheet("a.css", ".a", "Thing A."),
    "css/AGENTS.md": AGENTS,
    "docs/page.html": PAGE,
    "docs/partials/nav.html": "<nav>Links</nav>\n",
    ...overrides,
  });
  // Bring the css folder in sync so only docs changes are left to see.
  const cssDir = join(root, "css");
  for (const { path, content } of plan(cssDir)) writeFileSync(path, content);
  return { root, cssDir, docsDir: join(root, "docs") };
};

test("docs: fills the include and css-catalog tags", () => {
  const { root, cssDir, docsDir } = withDocs();
  const changes = plan(cssDir, docsDir);
  assert.deepEqual(changes.map((c) => c.name), ["docs/page.html"]);
  const html = changes[0].content;
  assert.match(html, /<include-html src="partials\/nav\.html">\n<nav>Links<\/nav>\n<\/include-html>/);
  assert.match(html, /<css-catalog class="stack" src="\.\.\/css\/a\.css">\n<section id="a">/);
  assert.match(html, /<h2><a href="#a">\.a<\/a><\/h2>\n {2}<p>Thing A\.<\/p>/);
  assert.equal(changes[0].path, join(docsDir, "page.html"));
  rmSync(root, { recursive: true });
});

test("docs: are left alone when no docs folder is given", () => {
  const { root, cssDir } = withDocs();
  assert.deepEqual(plan(cssDir), []);
  rmSync(root, { recursive: true });
});

test("docs: are up to date once written, and follow the comments after a change", () => {
  const { root, cssDir, docsDir } = withDocs();
  for (const { path, content } of plan(cssDir, docsDir)) writeFileSync(path, content);
  assert.deepEqual(plan(cssDir, docsDir), []);

  writeFileSync(join(cssDir, "a.css"), stylesheet("a.css", ".a", "Changed words."));
  const names = plan(cssDir, docsDir).map((c) => c.name);
  assert.deepEqual(names, ["a.css", "AGENTS.md", "docs/page.html"]);
  rmSync(root, { recursive: true });
});

test("docs: preserves CRLF line endings", () => {
  const { root, cssDir, docsDir } = withDocs({ "docs/page.html": PAGE.replace(/\n/g, "\r\n") });
  const [change] = plan(cssDir, docsDir);
  assert.ok(!/(?<!\r)\n/.test(change.content), "every newline is CRLF");
  rmSync(root, { recursive: true });
});

test("docs: a missing partial is an error naming the page and the path", () => {
  const { root, cssDir, docsDir } = withDocs({
    "docs/page.html": `<include-html src="partials/missing.html"></include-html>`,
  });
  assert.throws(() => plan(cssDir, docsDir), /page\.html: cannot read partials\/missing\.html/);
  rmSync(root, { recursive: true });
});

test("docs: a css-catalog for a file with no documented items is an error", () => {
  const { root, cssDir, docsDir } = withDocs({
    "css/plain.css": "/**\n * @file plain.css\n * @description Nothing documented.\n * @context\n */\n",
    "docs/page.html": `<css-catalog src="../css/plain.css"></css-catalog>`,
  });
  assert.throws(() => plan(cssDir, docsDir), /page\.html: \.\.\/css\/plain\.css has no documented items/);
  rmSync(root, { recursive: true });
});

test("docs: an invalid comment in the source stylesheet fails with its location", () => {
  const { root, cssDir, docsDir } = withDocs({
    "other/bad.css": "/**\n * @file bad.css\n * @description d\n */\n/**\n * @selector .x\n */\n",
    "docs/page.html": `<css-catalog src="../other/bad.css"></css-catalog>`,
  });
  assert.throws(() => plan(cssDir, docsDir), /bad\.css:5: missing @description/);
  rmSync(root, { recursive: true });
});

test("cli: checks and writes the docs folder when it is given", () => {
  const { root, cssDir, docsDir } = withDocs();
  const run = (mode) =>
    spawnSync(process.execPath, [CLI, mode, cssDir, docsDir], { encoding: "utf8" });

  const stale = run("check");
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /out of date: docs\/page\.html/);

  assert.equal(run("write").status, 0);
  assert.match(readFileSync(join(docsDir, "page.html"), "utf8"), /<nav>Links<\/nav>/);
  assert.equal(run("check").status, 0);
  rmSync(root, { recursive: true });
});

test("cli: leaves docs alone when only a css folder is given", () => {
  const { root, cssDir } = withDocs();
  assert.equal(cli("check", cssDir).status, 0);
  rmSync(root, { recursive: true });
});
