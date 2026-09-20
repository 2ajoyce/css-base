// Parser for the doc comments in css-base stylesheets.
//
// A doc comment is a block comment that opens with two stars. Every field in
// it is a tag; there is no positional text.
//
//   comment      = open , { line } , close
//   line         = [ "*" ] , text            the leading "* " is stripped
//   tag          = "@" , name , [ text ]     starts a line
//   continuation = a line that is not a tag  belongs to the previous tag
//
// What a tag's text means depends on its kind, declared in TAGS below:
//   text    one string, continuation lines joined    @selector .tabs
//   named   first word is the name, the rest is      @variant .success Green
//           an optional description
//   block   keeps line breaks; text on the tag       @example Two tabs
//           line is a title, the lines below are the code
//
// A comment with @file is a file header; any other comment is an item and
// needs @description and either @selector (CSS) or @function (JS).

const HEADER = "header";
const ITEM = "item";

const TAGS = {
  file: { on: [HEADER], kind: "text" },
  catalog: { on: [HEADER], kind: "text" },
  context: { on: [HEADER], kind: "block" },
  notes: { on: [HEADER], kind: "block" },
  description: { on: [HEADER, ITEM], kind: "text" },
  title: { on: [ITEM], kind: "text" },
  selector: { on: [ITEM], kind: "text" },
  function: { on: [ITEM], kind: "text" },
  requires: { on: [ITEM], kind: "text" },
  variant: { on: [ITEM], kind: "named", repeat: true },
  state: { on: [ITEM], kind: "named", repeat: true },
  part: { on: [ITEM], kind: "named", repeat: true },
  var: { on: [ITEM], kind: "named", repeat: true },
  param: { on: [ITEM], kind: "named", repeat: true },
  example: { on: [ITEM], kind: "block", repeat: true },
};

const REQUIRED = {
  [HEADER]: ["file", "description"],
  [ITEM]: ["description"],
};

const fail = (where, message) => {
  throw new Error(`${where}: ${message}`);
};

const joined = (tag) =>
  [tag.head, ...tag.lines].join(" ").replace(/\s+/g, " ").trim();

const VALUE = {
  text: (tag, where) => joined(tag) || fail(where, `@${tag.name} needs a value`),
  named: (tag, where) => {
    const m = joined(tag).match(/^(\S+)\s*(.*)$/);
    return m ? { name: m[1], text: m[2] } : fail(where, `@${tag.name} needs a name`);
  },
  block: (tag) => ({ title: tag.head, body: tag.lines.join("\n") }),
};

// Splits a comment body into { name, head, lines } tags.
function readTags(body, where) {
  const tags = [];
  const lines = body
    .split("\n")
    .map((line, i) => (i === 0 ? line.trim() : line.replace(/^[ \t]*\* ?/, "")));
  for (const line of lines) {
    const start = line.match(/^@(\w+)[ \t]*(.*)$/);
    if (start) tags.push({ name: start[1], head: start[2].trimEnd(), lines: [] });
    else if (tags.length) tags.at(-1).lines.push(line.trimEnd());
    else if (line.trim()) fail(where, `text before the first @tag: "${line.trim()}"`);
  }
  for (const tag of tags) {
    while (tag.lines.at(-1) === "") tag.lines.pop();
    while (tag.lines[0] === "") tag.lines.shift();
  }
  return tags;
}

// One comment body -> { kind, where, ...fields }. Repeatable tags become arrays.
export function parseComment(body, where = "comment") {
  const tags = readTags(body, where);
  const kind = tags.some((tag) => tag.name === "file") ? HEADER : ITEM;
  const out = { kind, where };
  for (const tag of tags) {
    const spec = TAGS[tag.name];
    if (!spec) fail(where, `unknown tag @${tag.name}`);
    if (!spec.on.includes(kind)) {
      fail(where, `@${tag.name} is not allowed in ${kind === ITEM ? "an" : "a"} ${kind} comment`);
    }
    const value = VALUE[spec.kind](tag, where);
    if (spec.repeat) (out[tag.name] ??= []).push(value);
    else if (tag.name in out) fail(where, `@${tag.name} appears twice`);
    else out[tag.name] = value;
  }
  for (const name of REQUIRED[kind]) {
    if (!(name in out)) fail(where, `missing @${name}`);
  }
  if (kind === ITEM && !out.selector && !out.function) {
    fail(where, "missing @selector or @function");
  }
  return out;
}

// What an item documents: its selector (CSS) or its function signature (JS).
export const identifier = (item) => item.selector ?? item.function;

// All doc comments in a stylesheet's text, in order.
export function parseDocComments(text, file = "") {
  return [...text.matchAll(/\/\*\*([\s\S]*?)\*\//g)].map((m) => {
    const line = text.slice(0, m.index).split("\n").length;
    return parseComment(m[1], `${file}:${line}`);
  });
}

// Splits a stylesheet into its header and its items.
export function parseStylesheet(text, file = "") {
  const comments = parseDocComments(text.replace(/\r\n/g, "\n"), file);
  const headers = comments.filter((c) => c.kind === HEADER);
  if (headers.length !== 1) fail(file, `expected one @file header, found ${headers.length}`);
  return { header: headers[0], items: comments.filter((c) => c.kind === ITEM) };
}
