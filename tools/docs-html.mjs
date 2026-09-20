// Renders parsed doc comments as HTML for the docs pages.
import { LIST_FIELDS, identifier } from "./doc-comments.mjs";

const escape = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// "Drop Zone" -> "drop-zone". Used for section ids.
export const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function renderItem(item) {
  const title = item.title ?? identifier(item);
  const id = slug(title);
  const out = [
    `<section id="${id}">`,
    `  <h2><a href="#${id}">${escape(title)}</a></h2>`,
    `  <p>${escape(item.description)}</p>`,
    `  <p><strong>Selector:</strong> <code>${escape(identifier(item))}</code></p>`,
  ];
  for (const [label, tag] of LIST_FIELDS.filter(([, tag]) => item[tag])) {
    out.push(`  <h3>${label}</h3>`, "  <ul>");
    for (const e of item[tag]) {
      out.push(`    <li><code>${escape(e.name)}</code>${e.text ? ` - ${escape(e.text)}` : ""}</li>`);
    }
    out.push("  </ul>");
  }
  if (item.requires) out.push(`  <p><strong>Requires:</strong> ${escape(item.requires)}</p>`);
  for (const example of item.example ?? []) {
    out.push(`  <h3>${escape(example.title || "Example")}</h3>`);
    // Shown live only. The markup is in the stylesheet's doc comment.
    out.push(`  <div>`, example.body, `  </div>`);
  }
  out.push("</section>");
  return out.join("\n");
}

// One <section> per documented item, in the order they appear in the file.
export function renderSections(items) {
  return items.map(renderItem).join("\n\n");
}
