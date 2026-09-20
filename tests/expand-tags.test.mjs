import assert from "node:assert/strict";
import test from "node:test";
import { expandTags } from "../tools/expand-tags.mjs";

// Returns the text a tag is filled with, and records what was asked for.
const resolver = (answers) => {
  const asked = [];
  const resolve = (tag, src) => {
    asked.push([tag, src]);
    return answers[src];
  };
  return { resolve, asked };
};

test("fills a tag with what the resolver returns", () => {
  const { resolve, asked } = resolver({ "a.html": "<b>hi</b>" });
  const out = expandTags(`<p><include-html src="a.html"></include-html></p>`, resolve, "page.html");
  assert.equal(out, `<p><include-html src="a.html">\n<b>hi</b>\n</include-html></p>`);
  assert.deepEqual(asked, [["include-html", "a.html"]]);
});

test("handles both tag names and several tags in one page", () => {
  const { resolve, asked } = resolver({ "nav.html": "NAV", "x.css": "SECTIONS" });
  const out = expandTags(
    `<include-html src="nav.html"></include-html>\n<css-catalog src="x.css"></css-catalog>`,
    resolve,
    "page.html",
  );
  assert.equal(out, `<include-html src="nav.html">\nNAV\n</include-html>\n<css-catalog src="x.css">\nSECTIONS\n</css-catalog>`);
  assert.deepEqual(asked, [
    ["include-html", "nav.html"],
    ["css-catalog", "x.css"],
  ]);
});

test("keeps the other attributes exactly as written", () => {
  const { resolve } = resolver({ "x.css": "S" });
  const out = expandTags(
    `<css-catalog\n  class="stack"\n  style="--stack-space: 2rem"\n  src="x.css"\n></css-catalog>`,
    resolve,
    "page.html",
  );
  assert.match(out, /^<css-catalog\n {2}class="stack"\n {2}style="--stack-space: 2rem"\n {2}src="x\.css"\n>\nS\n<\/css-catalog>$/);
});

test("replaces whatever was inside the tag before", () => {
  const { resolve } = resolver({ "a.html": "new" });
  const out = expandTags(`<include-html src="a.html">\nold\nstuff\n</include-html>`, resolve, "page.html");
  assert.equal(out, `<include-html src="a.html">\nnew\n</include-html>`);
});

test("is idempotent", () => {
  const { resolve } = resolver({ "a.html": "<b>hi</b>" });
  const once = expandTags(`<include-html src="a.html"></include-html>`, resolve, "page.html");
  assert.equal(expandTags(once, resolve, "page.html"), once);
});

test("leaves a page without tags untouched", () => {
  const { resolve, asked } = resolver({});
  const html = "<html><body><p>Nothing to fill</p></body></html>";
  assert.equal(expandTags(html, resolve, "page.html"), html);
  assert.deepEqual(asked, []);
});

test("requires a src attribute, naming the page", () => {
  const { resolve } = resolver({});
  assert.throws(
    () => expandTags(`<include-html></include-html>`, resolve, "docs/page.html"),
    /docs\/page\.html: <include-html> needs a src attribute/,
  );
});

test("rejects a tag that is never closed", () => {
  const { resolve } = resolver({ "a.html": "x" });
  assert.throws(
    () => expandTags(`<include-html src="a.html">\n<p>oops</p>`, resolve, "docs/page.html"),
    /docs\/page\.html: a <css-catalog> or <include-html> tag is not closed/,
  );
});
