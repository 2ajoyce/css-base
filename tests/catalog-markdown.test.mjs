import assert from "node:assert/strict";
import test from "node:test";
import { parseStylesheet } from "../tools/doc-comments.mjs";
import { renderCatalog, replaceCatalog } from "../tools/catalog-markdown.mjs";

// Parses a stylesheet and names it, the way the generator hands files over.
const file = (name, css) => ({ name, ...parseStylesheet(css, name) });

const TAG = file(
  "a.css",
  `
/**
 * @file a.css
 * @description Things.
 */

/**
 * @title Tag
 * @selector .tag
 * @description Small labels.
 * @variant .success Green
 * @variant .danger
 * @var --tag-size Size of the tag
 * @requires toast.js
 * @example
 * <span class="tag">Hi</span>
 */
`,
);

test("renders an item with its title, description and lists", () => {
  assert.equal(
    renderCatalog([TAG]),
    [
      "<!-- BEGIN GENERATED CATALOG (generated from the doc comments in each file; do not edit) -->",
      "",
      "### `a.css` - Things.",
      "",
      "#### Tag - `.tag`",
      "",
      "Small labels.",
      "",
      "- **Variants**",
      "  - `.success` - Green",
      "  - `.danger`",
      "- **Variables**",
      "  - `--tag-size` - Size of the tag",
      "- **Requires:** toast.js",
      "",
      "<!-- END GENERATED CATALOG -->",
    ].join("\n"),
  );
});

test("leaves examples out of the catalog", () => {
  assert.doesNotMatch(renderCatalog([TAG]), /<span|```/);
});

test("headings fall back to the identifier when an item has no title", () => {
  const f = file(
    "a.css",
    `
/**
 * @file a.css
 * @description d
 */
/**
 * @function go(now)
 * @description Starts things.
 * @param now Whether to start now
 */
`,
  );
  const out = renderCatalog([f]);
  assert.match(out, /#### `go\(now\)`\n\nStarts things\./);
  assert.match(out, /- \*\*Parameters\*\*\n {2}- `now` - Whether to start now/);
});

test("@catalog list renders one line per item, without descriptions", () => {
  const f = file(
    "elements.css",
    `
/**
 * @file elements.css
 * @description Tags.
 * @catalog list
 */
/**
 * @selector h1, h2
 * @description Headings that nobody needs described.
 */
/**
 * @selector label
 * @description Labels.
 * @variant .left Left of the input
 * @variant .right
 * @state .active Current
 */
`,
  );
  const out = renderCatalog([f]);
  assert.match(out, /### `elements\.css` - Tags\.\n\n- `h1, h2`\n- `label` - variants `\.left`, `\.right`; states `\.active`\n/);
  assert.doesNotMatch(out, /nobody|Left of the input/);
});

test("rejects an unknown @catalog style, naming the file", () => {
  const f = file(
    "a.css",
    `
/**
 * @file a.css
 * @description d
 * @catalog fancy
 */
`,
  );
  assert.throws(() => renderCatalog([f]), /a\.css: @catalog must be "full" or "list", not "fancy"/);
});

test("a file with no items shows its hand-written @context and @notes", () => {
  const f = file(
    "reset.css",
    `
/**
 * @file reset.css
 * @description Resets.
 * @context
 *   Sets box-sizing.
 *   - Removes margins.
 * @notes
 *   - Be careful.
 */
`,
  );
  assert.match(
    renderCatalog([f]),
    /### `reset\.css` - Resets\.\n\n- Sets box-sizing\.\n- Removes margins\.\n\n- \*\*Note:\*\* Be careful\./,
  );
});

test("escapes asterisks and angle brackets in text", () => {
  const f = file(
    "a.css",
    `
/**
 * @file a.css
 * @description Uses --light-* and <b>.
 */
`,
  );
  assert.match(renderCatalog([f]), /Uses --light-\\\* and \\<b>\./);
});

test("replaceCatalog swaps only the region between the markers", () => {
  const text = [
    "# Title",
    "",
    "<!-- BEGIN GENERATED CATALOG (old wording) -->",
    "stale",
    "<!-- END GENERATED CATALOG -->",
    "",
    "Hand-written after.",
  ].join("\n");
  const out = replaceCatalog(text, [TAG]);
  assert.ok(out.startsWith("# Title\n\n<!-- BEGIN GENERATED CATALOG (generated from"));
  assert.ok(out.endsWith("<!-- END GENERATED CATALOG -->\n\nHand-written after."));
  assert.doesNotMatch(out, /stale/);
  assert.equal(replaceCatalog(out, [TAG]), out);
});

test("replaceCatalog fails when the markers are missing", () => {
  assert.throws(() => replaceCatalog("# Title", [TAG]), /no GENERATED CATALOG markers/);
});
