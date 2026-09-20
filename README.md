# CSS Base

A lightweight, agent-friendly CSS starter kit.

**[Demo](https://2ajoyce.github.io/css-base/)**

This repository provides a clean, portable set of accessible CSS primitives designed to be the **starting point** for new web projects. It is structured flat for easy copying by AI agents and developers alike.

## AI Agent Instructions

If you are an AI agent initializing a project:

1.  **Copy** the `css-base/` directory to the project root (or `src/styles/` equivalent).
2.  **Read** `css-base/AGENTS.md` for architectural context.
3.  **Link** `css-base/index.css` in the Main HTML file.
4.  **Modify** the files in place. This is a seed, not a package.

## Structure

```text
css-base/
 AGENTS.md       # Context guide for you
 index.css       # Entry point (@imports others)
 reset.css       # Browser normalization
 themes.css      # Design tokens (colors, fonts)
 layout.css      # Grid, flex, stack utilities
 utility.css     # Atomic helpers
 elements.css    # Typography & form defaults
 components.css  # Composite UI (toast, modal)
```

## Usage

### Installation

Simply copy the `css-base` folder into your project.

### Integration

Add the stylesheet to your HTML:

```html
<link rel="stylesheet" href="css-base/index.css" />
```

### Documentation

- **Visual Examples**: Open `docs/index.html` locally to see the components in action.
- **API Reference**: Every CSS file has a header comment block explaining its classes and variables.

## Contributing

This project uses `just` for release management.

- `just build`: Creates a zip of `css-base` for distribution.
- `just catalog`: Regenerates the parts of `css-base` that are built from the doc comments: the `@context` block in each file header and the catalog in `css-base/AGENTS.md`. Run it after adding or changing a component.
- `just check`: Fails if anything generated is out of date or a doc comment is invalid. The `Check Catalog` action runs it on pull requests.
- `just test`: Runs the tests for the scripts in `tools/`. The `Test` action runs it on pull requests.

### Documenting components

Every component, element style and script function gets a doc comment above its first rule. Every field is a tag, and text outside a tag is an error:

```css
/**
 * @title Tag
 * @selector .tag
 * @description Small labels for status, categories, or counts.
 * @variant .success Green
 * @variant .outline Transparent with a primary-color border
 * @example
 * <span class="tag success">Success</span>
 */
```

| Tag | Use |
| --- | --- |
| `@selector` / `@function` | What the comment documents (a selector in CSS, a signature in JS). One is required. |
| `@description` | What it is for. Required. |
| `@title` | Display name. |
| `@catalog` | In a file header only. `list` shows the file's items in the `AGENTS.md` catalog as plain selectors, with no descriptions. Used by `elements.css`. |
| `@variant`, `@state`, `@part`, `@var`, `@param` | A name, then an optional description. One per line, repeatable. |
| `@requires` | Another file or element it depends on. |
| `@example` | Markup. Repeatable; text on the tag line is a title. |

The grammar is defined in `tools/doc-comments.mjs`. Files with no doc comments, such as `reset.css` and `themes.css`, keep a hand-written `@context`.
