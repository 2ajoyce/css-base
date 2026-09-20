import assert from "node:assert/strict";
import test from "node:test";
import { parseDocComments } from "../tools/doc-comments.mjs";
import { renderSections, slug } from "../tools/docs-html.mjs";

const items = (css) => parseDocComments(css);

test("slug turns text into an id", () => {
  assert.equal(slug("Drop Zone"), "drop-zone");
  assert.equal(slug("Card header and footer"), "card-header-and-footer");
  assert.equal(slug("Dialog (Modal)"), "dialog-modal");
  assert.equal(slug('[role="button"]'), "role-button");
  assert.equal(slug(".tag"), "tag");
});

test("renders a section with a linked heading, description and selector", () => {
  const html = renderSections(
    items(`
/**
 * @title Drop Zone
 * @selector .drop-zone
 * @description Bordered upload target.
 */
`),
  );
  assert.equal(
    html,
    [
      '<section id="drop-zone">',
      '  <h2><a href="#drop-zone">Drop Zone</a></h2>',
      "  <p>Bordered upload target.</p>",
      "  <p><strong>Selector:</strong> <code>.drop-zone</code></p>",
      "</section>",
    ].join("\n"),
  );
});

test("uses the identifier for the heading and id when there is no title", () => {
  const html = renderSections(
    items(`
/**
 * @selector .tag
 * @description Labels.
 */
`),
  );
  assert.match(html, /<section id="tag">\n {2}<h2><a href="#tag">\.tag<\/a><\/h2>/);
});

test("renders lists, with an optional description on each entry", () => {
  const html = renderSections(
    items(`
/**
 * @selector .x
 * @description d
 * @variant .success Green
 * @variant .danger
 * @var --x-size How big
 * @requires toast.js
 */
`),
  );
  assert.match(html, /<h3>Variants<\/h3>\n {2}<ul>\n {4}<li><code>\.success<\/code> - Green<\/li>\n {4}<li><code>\.danger<\/code><\/li>\n {2}<\/ul>/);
  assert.match(html, /<h3>Variables<\/h3>[\s\S]*<li><code>--x-size<\/code> - How big<\/li>/);
  assert.match(html, /<p><strong>Requires:<\/strong> toast\.js<\/p>/);
});

test("shows an example live, without listing its source", () => {
  const html = renderSections(
    items(`
/**
 * @selector .x
 * @description d
 * @example
 * <b class="x">Hi & bye</b>
 */
`),
  );
  assert.match(html, /<h3>Example<\/h3>\n {2}<div>\n<b class="x">Hi & bye<\/b>\n {2}<\/div>/);
  assert.doesNotMatch(html, /<pre>|<code class="multiline">|&lt;b class/);
});

test("examples use their own title when they have one", () => {
  const html = renderSections(
    items(`
/**
 * @selector .x
 * @description d
 * @example Compact
 * <i>a</i>
 * @example
 * <i>b</i>
 */
`),
  );
  assert.match(html, /<h3>Compact<\/h3>/);
  assert.match(html, /<h3>Example<\/h3>/);
});

test("escapes text in headings, descriptions and list entries", () => {
  const html = renderSections(
    items(`
/**
 * @title A <b> title
 * @selector a > b
 * @description Uses <script> & more.
 * @variant .x <tag>
 */
`),
  );
  assert.match(html, /A &lt;b&gt; title/);
  assert.match(html, /<p>Uses &lt;script&gt; &amp; more\.<\/p>/);
  assert.match(html, /<code>a &gt; b<\/code>/);
  assert.match(html, /<li><code>\.x<\/code> - &lt;tag&gt;<\/li>/);
});

test("separates sections with a blank line and keeps their order", () => {
  const html = renderSections(
    items(`
/**
 * @selector .one
 * @description first
 */
/**
 * @selector .two
 * @description second
 */
`),
  );
  assert.equal(html.split("</section>\n\n<section").length, 2);
  assert.ok(html.indexOf('id="one"') < html.indexOf('id="two"'));
});
