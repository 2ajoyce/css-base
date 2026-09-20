import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
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
