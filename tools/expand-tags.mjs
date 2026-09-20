// Fills the custom tags in a hand-written HTML page.
//
//   <include-html src="partials/nav.html"></include-html>
//   <css-catalog src="../css-base/components.css"></css-catalog>
//
// The tag stays in the page. Only what is inside it is replaced, so running
// this again gives the same result. Attributes other than src (class, style,
// ...) are kept as written. Tags cannot be nested.

const TAG = /<(css-catalog|include-html)\b([^>]*)>([\s\S]*?)<\/\1>/g;
const OPENING = /<(?:css-catalog|include-html)\b/g;

// resolve(tagName, src) returns the text that goes inside the tag.
// `where` names the page in error messages.
export function expandTags(html, resolve, where) {
  const expanded = html.replace(TAG, (_, tag, attributes) => {
    const src = attributes.match(/\bsrc="([^"]*)"/)?.[1];
    if (!src) throw new Error(`${where}: <${tag}> needs a src attribute`);
    return `<${tag}${attributes}>\n${resolve(tag, src)}\n</${tag}>`;
  });
  const opened = (html.match(OPENING) ?? []).length;
  const closed = (html.match(new RegExp(TAG.source, "g")) ?? []).length;
  if (opened !== closed) throw new Error(`${where}: a <css-catalog> or <include-html> tag is not closed`);
  return expanded;
}
