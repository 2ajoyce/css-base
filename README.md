# CSS Base

A lightweight CSS reset.

Coding agents are great at CSS in isolation and bad at consistency. I'm hoping to address that by using this base css file as a starting spot in new projects.

## Getting Started

### Demo

You can view the latest release at [https://2ajoyce.github.io/css-base/](https://2ajoyce.github.io/css-base/).

### Download

Download the latest release from the [Releases](https://github.com/2ajoyce/css-base/releases) page. Extract the contents of the zip file into your project.

### Usage

1. Copy the `public/css/` directory and `index.css` into your project.
2. Link to `index.css` in your HTML:

```html
<link rel="stylesheet" href="path/to/index.css" />
```

If you want to use the theme switcher, also include `theme-switcher.js`:

```html
<script src="path/to/theme-switcher.js"></script>
```

## Development

This project uses [just](https://github.com/casey/just) as a command runner.

### Build

To create a zip archive of the `src` directory:

```sh
just build
```

This will generate a file named `styleguide_YYYY-MM-DD_N.zip` in the root directory.

### CI Build

For CI environments (Linux/Bash):

```sh
just build-ci
```

## License

MIT
