import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkToolCall, scratchDir } from "../.claude/hooks/playwright-file-guard.mjs";

const HOOK = fileURLToPath(new URL("../.claude/hooks/playwright-file-guard.mjs", import.meta.url));
const project = path.resolve("guard-test-project");
const url = (...parts) => pathToFileURL(path.join(project, ...parts)).href;

const call = (tool, input) => ({ tool_name: `mcp__playwright__${tool}`, tool_input: input });
const check = (tool, input) => checkToolCall(call(tool, input), project);

test("allows opening a page inside docs", () => {
  assert.equal(check("browser_navigate", { url: url("docs", "components.html") }), null);
  assert.equal(check("browser_navigate", { url: url("docs", "public", "images", "a.png") }), null);
});

test("blocks opening a file outside docs", () => {
  assert.match(check("browser_navigate", { url: url("README.md") }), /outside docs/);
  assert.match(check("browser_navigate", { url: url("css-base", "index.css") }), /outside docs/);
  assert.match(check("browser_navigate", { url: pathToFileURL(path.resolve("/elsewhere/secret.txt")).href }), /outside docs/);
});

test("blocks .. traversal out of docs, plain or encoded", () => {
  assert.match(check("browser_navigate", { url: `${url("docs")}/../README.md` }), /outside docs/);
  assert.ok(check("browser_navigate", { url: `${url("docs")}/..%2FREADME.md` }));
  assert.ok(check("browser_navigate", { url: `${url("docs")}/%2e%2e/README.md` }));
});

test("blocks a file URL that names another machine, without a slow lookup", () => {
  const started = Date.now();
  assert.match(check("browser_navigate", { url: "file://otherhost/share/docs/x.html" }), /another machine \(otherhost\)/);
  assert.ok(check("browser_file_upload", { paths: ["\\\\otherhost\\share\\docs\\x.png"] }));
  assert.ok(check("browser_take_screenshot", { filename: "//otherhost/share/a.png" }));
  assert.ok(Date.now() - started < 500, "decided without touching the network");
});

test("allows file://localhost/ URLs inside docs", () => {
  const local = url("docs", "index.html").replace("file:///", "file://localhost/");
  assert.equal(check("browser_navigate", { url: local }), null);
});

test("allows the project's scratch folder, in any session", () => {
  const scratch = (...parts) => pathToFileURL(path.join(scratchDir(project), ...parts)).href;
  assert.equal(check("browser_navigate", { url: scratch("abc-123", "scratchpad", "preview", "layout.html") }), null);
  assert.equal(check("browser_navigate", { url: scratch("other-session", "scratchpad", "old", "docs", "x.html") }), null);
  assert.equal(check("browser_file_upload", { paths: [path.join(scratchDir(project), "s", "scratchpad", "sample.png")] }), null);
});

test("derives the scratch folder from the project path", () => {
  const dir = scratchDir(path.resolve("/Users/someone/code/my-app"));
  assert.match(dir, /claude[\\/][^\\/]*Users-someone-code-my-app$/);
});

test("the scratch folder of another project, or a look-alike, is not allowed", () => {
  const other = pathToFileURL(path.join(path.dirname(scratchDir(project)), "C--Users-someone-else", "s", "x.html")).href;
  assert.match(check("browser_navigate", { url: other }), /outside docs or the project's scratch folder/);
  const lookAlike = pathToFileURL(path.join(`${scratchDir(project)}-evil`, "x.html")).href;
  assert.match(check("browser_navigate", { url: lookAlike }), /outside docs/);
  assert.match(
    check("browser_navigate", { url: `${pathToFileURL(scratchDir(project)).href}/../other/x.html` }),
    /outside docs/,
  );
});

test("does not treat a sibling folder with a similar name as docs", () => {
  assert.match(check("browser_navigate", { url: url("docs-old", "x.html") }), /outside docs/);
});

test("allows web URLs and about:blank", () => {
  assert.equal(check("browser_navigate", { url: "https://example.com/" }), null);
  assert.equal(check("browser_navigate", { url: "http://localhost:3000/docs" }), null);
  assert.equal(check("browser_navigate", { url: "about:blank" }), null);
});

test("finds a file URL hidden in any other tool's input", () => {
  assert.match(
    check("browser_evaluate", { function: `() => { location.href = "${url("README.md")}"; }` }),
    /outside docs/,
  );
  assert.match(check("browser_tabs", { action: "new", url: url("README.md") }), /outside docs/);
  assert.equal(check("browser_evaluate", { function: `() => fetch("${url("docs", "a.json")}")` }), null);
});

test("refuses browser_run_code_unsafe outright", () => {
  assert.match(check("browser_run_code_unsafe", { code: "async (page) => page.title()" }), /not allowed/);
});

test("output files must stay inside the project", () => {
  assert.equal(check("browser_take_screenshot", { filename: "shots/a.png" }), null);
  assert.equal(check("browser_snapshot", { filename: path.join(project, "out", "s.md") }), null);
  assert.match(check("browser_take_screenshot", { filename: "../elsewhere/a.png" }), /outside the project/);
  assert.match(check("browser_snapshot", { filename: path.resolve("/elsewhere/s.md") }), /outside the project/);
  // The scratch folder is readable, but nothing may be written there through the browser.
  assert.match(
    check("browser_take_screenshot", { filename: path.join(scratchDir(project), "s", "a.png") }),
    /outside the project/,
  );
});

test("uploads must come from docs", () => {
  assert.equal(check("browser_file_upload", { paths: ["docs/public/images/placeholder.png"] }), null);
  assert.match(check("browser_file_upload", { paths: ["docs/a.png", "README.md"] }), /upload path README\.md/);
  assert.match(check("browser_file_upload", { paths: [path.resolve("/elsewhere/x.txt")] }), /outside docs/);
});

test("ignores tools from other servers", () => {
  assert.equal(checkToolCall({ tool_name: "Bash", tool_input: { command: `open ${url("README.md")}` } }, project), null);
});

test("compares paths case-insensitively where the file system is", { skip: process.platform !== "win32" }, () => {
  assert.equal(check("browser_navigate", { url: url("DOCS", "Components.html") }), null);
});

const runHook = (stdin, env = {}) =>
  spawnSync(process.execPath, [HOOK], {
    input: stdin,
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: project, ...env },
  });

test("hook: exits 0 for an allowed call and 2, with the reason, for a blocked one", () => {
  const ok = runHook(JSON.stringify(call("browser_navigate", { url: url("docs", "index.html") })));
  assert.equal(ok.status, 0);

  const blocked = runHook(JSON.stringify(call("browser_navigate", { url: url("README.md") })));
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /Blocked by \.claude\/hooks\/playwright-file-guard\.mjs: .*outside docs/);
});

test("hook: blocks a call it cannot read", () => {
  const result = runHook("not json");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /could not read the tool call/);
});
