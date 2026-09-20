import assert from "node:assert/strict";
import test from "node:test";
import { identifier, parseDocComments, parseStylesheet } from "../tools/doc-comments.mjs";

// Parses the first doc comment in `css`. Fixtures are written the way the
// comments look in the stylesheets.
const parse = (css) => parseDocComments(css)[0];

// Joins lines into the multi-line string a block tag is expected to produce.
const lines = (...rows) => rows.join("\n");

test("reads text tags", () => {
  const c = parse(`
    /**
     * @selector .tag
     * @description Small labels.
     */
  `);
  assert.equal(c.kind, "item");
  assert.equal(c.selector, ".tag");
  assert.equal(c.description, "Small labels.");
});

test("joins continuation lines into one string", () => {
  const c = parse(`
    /**
     * @selector .x
     * @description One
     *   and two
     * and three.
     */
  `);
  assert.equal(c.description, "One and two and three.");
});

test("splits named tags into name and text; text is optional", () => {
  const c = parse(`
    /**
     * @selector .x
     * @description d
     * @variant .success Green styling
     * @variant .danger
     */
  `);
  assert.deepEqual(c.variant, [
    { name: ".success", text: "Green styling" },
    { name: ".danger", text: "" },
  ]);
});

test("keeps line breaks and indentation in examples; the tag line is the title", () => {
  const c = parse(`
    /**
     * @selector .x
     * @description d
     * @example Two items
     * <ul>
     *   <li>a</li>
     *   <li>b</li>
     * </ul>
     * @example
     * <b>x</b>
     */
  `);
  assert.deepEqual(c.example, [
    {
      title: "Two items",
      body: lines("<ul>", "  <li>a</li>", "  <li>b</li>", "</ul>"),
    },
    { title: "", body: "<b>x</b>" },
  ]);
});

test("a comment with @file is a header", () => {
  const c = parse(`
    /**
     * @file a.css
     * @description Things.
     * @context
     *   .a (First)
     *   .b (Second)
     */
  `);
  assert.equal(c.kind, "header");
  assert.equal(c.file, "a.css");
  assert.equal(c.context.body, lines("  .a (First)", "  .b (Second)"));
});

test("a header can choose how its file appears in the catalog", () => {
  const c = parse(`
    /**
     * @file a.css
     * @description Things.
     * @catalog list
     */
  `);
  assert.equal(c.catalog, "list");
  assert.throws(
    () =>
      parse(`
        /**
         * @selector .x
         * @description d
         * @catalog list
         */
      `),
    /@catalog is not allowed in an item comment/,
  );
});

test("rejects unknown tags", () => {
  assert.throws(
    () =>
      parse(`
        /**
         * @selector .x
         * @nope y
         */
      `),
    /unknown tag @nope/,
  );
});

test("an item can document a function instead of a selector", () => {
  const c = parse(`
    /**
     * @function showToast(selector, duration)
     * @description Shows a toast.
     * @param selector Which toast to show
     * @param duration How long to show it, in milliseconds
     */
  `);
  assert.equal(c.function, "showToast(selector, duration)");
  assert.equal(identifier(c), "showToast(selector, duration)");
  assert.deepEqual(c.param, [
    { name: "selector", text: "Which toast to show" },
    { name: "duration", text: "How long to show it, in milliseconds" },
  ]);
});

test("rejects text before the first tag", () => {
  assert.throws(
    () =>
      parse(`
        /**
         * A description with no tag.
         * @selector .x
         */
      `),
    /text before the first @tag/,
  );
});

test("rejects a repeated single-use tag", () => {
  assert.throws(
    () =>
      parse(`
        /**
         * @selector .x
         * @selector .y
         * @description d
         */
      `),
    /@selector appears twice/,
  );
});

test("requires the mandatory tags", () => {
  assert.throws(
    () =>
      parse(`
        /**
         * @description d
         */
      `),
    /missing @selector or @function/,
  );
  assert.throws(
    () =>
      parse(`
        /**
         * @selector .x
         */
      `),
    /missing @description/,
  );
  assert.throws(
    () =>
      parse(`
        /**
         * @file a.css
         */
      `),
    /missing @description/,
  );
});

test("keeps header-only and item-only tags apart", () => {
  assert.throws(
    () =>
      parse(`
        /**
         * @file a.css
         * @description d
         * @variant .x
         */
      `),
    /@variant is not allowed in a header comment/,
  );
  assert.throws(
    () =>
      parse(`
        /**
         * @selector .x
         * @description d
         * @context a
         */
      `),
    /@context is not allowed in an item comment/,
  );
});

test("reports the line of a bad comment in a stylesheet", () => {
  const css = `/**
 * @file a.css
 * @description d
 */

/**
 * @selector .x
 */
`;
  assert.throws(() => parseStylesheet(css, "a.css"), /a\.css:6: missing @description/);
});

test("splits a stylesheet into header and items, ignoring plain comments", () => {
  const css = `
/**
 * @file a.css
 * @description d
 */

/* A plain comment. */

/**
 * @selector .one
 * @description first
 */
.one {}

/**
 * @selector .two
 * @description second
 */
.two {}
`;
  const { header, items } = parseStylesheet(css, "a.css");
  assert.equal(header.file, "a.css");
  assert.deepEqual(
    items.map((i) => i.selector),
    [".one", ".two"],
  );
});
