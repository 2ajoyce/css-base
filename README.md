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
 catalog.mjs     # Keeps AGENTS.md in sync with the file headers (Node, no dependencies)
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
- `just catalog`: Regenerates the component catalog in `css-base/AGENTS.md` from the header comment (`@context`) at the top of each file. Run it after adding or changing a class or function.
- `just check`: Verifies that each header matches its file and that `AGENTS.md` is up to date. CI runs the same checks on pull requests. The script lives in `css-base/` so copied projects can run `node catalog.mjs check` too.
