// Renders the AGENTS.md catalog from parsed stylesheets.
import { LIST_FIELDS as LISTS, identifier } from "./doc-comments.mjs";

const BEGIN =
  "<!-- BEGIN GENERATED CATALOG (generated from the doc comments in each file; do not edit) -->";
const END = "<!-- END GENERATED CATALOG -->";
const REGION = /<!-- BEGIN GENERATED CATALOG[^>]*-->[\s\S]*?<!-- END GENERATED CATALOG -->/;

// Keeps header text from turning into markdown emphasis or HTML tags.
const md = (s) => s.replace(/[*<]/g, "\\$&");

// The non-empty lines of a header block such as @context or @notes.
const blockLines = (block) =>
  block.body
    .split("\n")
    .map((line) => line.trim().replace(/^-\s+/, ""))
    .filter(Boolean);

function renderItem(item) {
  const id = `\`${identifier(item)}\``;
  const out = ["", `#### ${item.title ? `${md(item.title)} - ${id}` : id}`, "", md(item.description)];
  const listed = LISTS.filter(([, tag]) => item[tag]);
  if (listed.length || item.requires) out.push("");
  for (const [label, tag] of listed) {
    out.push(`- **${label}**`);
    for (const e of item[tag]) out.push(`  - \`${e.name}\`${e.text ? ` - ${md(e.text)}` : ""}`);
  }
  if (item.requires) out.push(`- **Requires:** ${md(item.requires)}`);
  return out;
}

// One line: the selector, then the names of what it adds, without descriptions.
function renderListItem(item) {
  const extras = LISTS.filter(([, tag]) => item[tag]).map(
    ([label, tag]) => `${label.toLowerCase()} ${item[tag].map((e) => `\`${e.name}\``).join(", ")}`,
  );
  return `- \`${identifier(item)}\`${extras.length ? ` - ${extras.join("; ")}` : ""}`;
}

// A file's header can choose "@catalog list" to show items as plain selectors.
function renderFile({ name, header, items }) {
  const style = header.catalog ?? "full";
  if (!["full", "list"].includes(style)) {
    throw new Error(`${name}: @catalog must be "full" or "list", not "${style}"`);
  }
  const out = ["", `### \`${name}\` - ${md(header.description)}`];
  if (items.length && style === "list") out.push("", ...items.map(renderListItem));
  else if (items.length) for (const item of items) out.push(...renderItem(item));
  else if (header.context) out.push("", ...blockLines(header.context).map((b) => `- ${md(b)}`));
  if (header.notes) out.push("", ...blockLines(header.notes).map((b) => `- **Note:** ${md(b)}`));
  return out;
}

// files: [{ name, header, items }] as returned by parseStylesheet, plus a name.
export function renderCatalog(files) {
  return [BEGIN, ...files.flatMap(renderFile), "", END].join("\n");
}

// Returns `text` with the region between the catalog markers replaced.
export function replaceCatalog(text, files) {
  if (!REGION.test(text)) throw new Error("AGENTS.md has no GENERATED CATALOG markers");
  return text.replace(REGION, () => renderCatalog(files));
}
