import assert from "node:assert/strict";
import test from "node:test";
import { parseDocComments } from "../tools/doc-comments.mjs";
import { withContext } from "../tools/header-context.mjs";

// Parses the item comments in `css`.
const items = (css) => parseDocComments(css);

const ONE_AND_TWO = items(`
/**
 * @selector .one
 * @description First thing. It has a second sentence.
 */
/**
 * @selector .two, .three
 * @description Second thing
 *   over two lines.
 */
`);

test("replaces the @context lines with selector: first sentence", () => {
  const header = `/**
 * @file a.css
 * @description Things.
 * @context
 *   old line
 *   another old line
 */
.one {}`;
  assert.equal(
    withContext(header, ONE_AND_TWO, "a.css"),
    `/**
 * @file a.css
 * @description Things.
 * @context
 *   .one: First thing.
 *   .two, .three: Second thing over two lines.
 */
.one {}`,
  );
});

test("keeps the tags that follow @context", () => {
  const header = `/**
 * @file a.css
 * @context
 *   old
 * @notes
 *   Keep me.
 */`;
  assert.equal(
    withContext(header, ONE_AND_TWO, "a.css"),
    `/**
 * @file a.css
 * @context
 *   .one: First thing.
 *   .two, .three: Second thing over two lines.
 * @notes
 *   Keep me.
 */`,
  );
});

test("fills an empty @context block", () => {
  const header = `/**
 * @file a.css
 * @context
 */`;
  assert.match(withContext(header, ONE_AND_TWO, "a.css"), /@context\n \*   \.one: First thing\.\n/);
});

test("uses the function signature for script items", () => {
  const fn = items(`
/**
 * @function go(now)
 * @description Starts things.
 */
`);
  const header = "/**\n * @file a.js\n * @context\n */";
  assert.match(withContext(header, fn, "a.js"), /go\(now\): Starts things\./);
});

test("is idempotent", () => {
  const header = "/**\n * @file a.css\n * @context\n *   old\n */";
  const once = withContext(header, ONE_AND_TWO, "a.css");
  assert.equal(withContext(once, ONE_AND_TWO, "a.css"), once);
});

test("fails, naming the file, when there is no @context tag", () => {
  assert.throws(
    () => withContext("/**\n * @file a.css\n */", ONE_AND_TWO, "css-base/a.css"),
    /css-base\/a\.css: the header needs an @context tag/,
  );
});
