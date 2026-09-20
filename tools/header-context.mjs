// Rewrites the generated @context block in a file header.
import { identifier } from "./doc-comments.mjs";

const firstSentence = (text) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;

// Replaces the lines under the header's @context tag with one
// "identifier: description" line per item. Every other header line is kept.
// `where` names the file in error messages.
export function withContext(text, items, where) {
  const lines = text.split("\n");
  const open = lines.findIndex((line) => /^\s*\*\s*@context\b/.test(line));
  if (open < 0) throw new Error(`${where}: the header needs an @context tag`);
  let close = open + 1;
  while (close < lines.length && !/^\s*\*\s*(@\w+|\/)/.test(lines[close])) close++;
  const entries = items.map((i) => ` *   ${identifier(i)}: ${firstSentence(i.description)}`);
  lines.splice(open + 1, close - open - 1, ...entries);
  return lines.join("\n");
}
