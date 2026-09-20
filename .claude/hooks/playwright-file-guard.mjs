#!/usr/bin/env node
// PreToolUse hook for the Playwright MCP server.
//
// The server is started with --allow-unrestricted-file-access so the browser
// can open the docs pages over file://. That flag lifts every file restriction,
// so this hook puts a fence back. For every mcp__playwright__* call:
//   - a file: URL anywhere in the tool input must point inside READ_DIRS or the
//     project's scratch folder (see scratchDir)
//   - upload `paths` must point inside those same folders
//   - an output `filename` must stay inside the project
//   - browser_run_code_unsafe is refused; it can build any URL or path at runtime
//
// This guards against mistakes. It is not a sandbox against a hostile page.
//
// To enable the flag (do this once the hook is active, see /hooks):
//   claude mcp remove playwright
//   claude mcp add playwright -- npx @playwright/mcp@latest --allow-unrestricted-file-access
import { realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Folders the browser may open and upload from, relative to the project.
export const READ_DIRS = ["docs"];

// Claude Code keeps each project's scratch files (previews, screenshots made
// while working) under <temp>/claude/<project path with separators as dashes>.
// The folder is per session, so allow the project's whole scratch area.
export const scratchDir = (projectDir) =>
  path.join(os.tmpdir(), "claude", path.resolve(projectDir).replace(/[:\\/]/g, "-"));

const ALLOWED = "docs or the project's scratch folder";

const FILE_URL = /file:[^\s"'`<>)]*/gi;

const real = (p) => {
  try {
    return realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
};

const inside = (child, parent) => {
  // A network path (\\host\share) is never inside the project, and looking it
  // up on disk can stall, so decide before touching the file system.
  if (/^[\\/]{2}/.test(child)) return false;
  const rel = path.relative(real(parent), real(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};

const strings = (value) =>
  typeof value === "string"
    ? [value]
    : value && typeof value === "object"
      ? Object.values(value).flatMap(strings)
      : [];

// Returns null when the call is allowed, or the reason it is blocked.
export function checkToolCall({ tool_name = "", tool_input = {} }, projectDir) {
  if (!tool_name.startsWith("mcp__playwright__")) return null;
  const readDirs = [...READ_DIRS.map((d) => path.resolve(projectDir, d)), scratchDir(projectDir)];
  const readable = (p) => readDirs.some((dir) => inside(p, dir));

  if (tool_name === "mcp__playwright__browser_run_code_unsafe") {
    return "browser_run_code_unsafe can build any URL or path at runtime, so it is not allowed";
  }

  for (const text of strings(tool_input)) {
    for (const url of text.match(FILE_URL) ?? []) {
      let target;
      try {
        const host = new URL(url).hostname;
        if (host && host !== "localhost") return `${url} names another machine (${host})`;
        target = fileURLToPath(url);
      } catch {
        return `cannot read the file URL ${url}`;
      }
      if (!readable(target)) return `${url} is outside ${ALLOWED}`;
    }
  }

  for (const p of tool_input.paths ?? []) {
    if (typeof p === "string" && !readable(path.resolve(projectDir, p))) {
      return `upload path ${p} is outside ${ALLOWED}`;
    }
  }

  if (typeof tool_input.filename === "string") {
    if (!inside(path.resolve(projectDir, tool_input.filename), projectDir)) {
      return `output file ${tool_input.filename} is outside the project`;
    }
  }
  return null;
}

async function main() {
  let input;
  try {
    let raw = "";
    for await (const chunk of process.stdin) raw += chunk;
    input = JSON.parse(raw);
  } catch {
    console.error("playwright-file-guard: could not read the tool call, so it is blocked");
    process.exit(2);
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
  const reason = checkToolCall(input, projectDir);
  if (reason) {
    console.error(`Blocked by .claude/hooks/playwright-file-guard.mjs: ${reason}`);
    process.exit(2);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
