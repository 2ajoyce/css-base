import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const SCRIPT = readFileSync(new URL("../css-base/theme-switcher.js", import.meta.url), "utf8");

class FakeStyle {
  #props = new Map();

  setProperty(name, value) {
    this.#props.set(name, value);
  }

  getPropertyValue(name) {
    return this.#props.get(name) || "";
  }
}

class FakeInput {
  constructor(classNames) {
    this.checked = false;
    this.style = new FakeStyle();
    this.#classes = new Set(classNames.split(/\s+/).filter(Boolean));
  }

  #attributes = new Map();
  #classes;
  #listeners = new Map();

  classList = {
    contains: (name) => this.#classes.has(name),
  };

  addEventListener(type, listener) {
    const listeners = this.#listeners.get(type) || [];
    listeners.push(listener);
    this.#listeners.set(type, listeners);
  }

  dispatch(type) {
    for (const listener of this.#listeners.get(type) || []) listener();
  }

  listenerCount(type) {
    return (this.#listeners.get(type) || []).length;
  }

  hasAttribute(name) {
    return this.#attributes.has(name);
  }

  setAttribute(name, value) {
    this.#attributes.set(name, String(value));
  }
}

class FakeDocumentElement {
  #attributes = new Map();

  getAttribute(name) {
    return this.#attributes.get(name) || null;
  }

  setAttribute(name, value) {
    this.#attributes.set(name, String(value));
  }
}

class FakeDocument {
  constructor() {
    this.documentElement = new FakeDocumentElement();
  }

  #inputs = [];

  addEventListener() {}

  addInput(input) {
    this.#inputs.push(input);
  }

  querySelectorAll(selector) {
    return selector === ".theme-toggle" ? this.#inputs.filter((input) => input.classList.contains("theme-toggle")) : [];
  }
}

function loadThemeSwitcher(savedTheme) {
  const document = new FakeDocument();
  const storage = new Map(savedTheme ? [["theme", savedTheme]] : []);
  const context = {
    document,
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value)),
    },
    window: {
      matchMedia: () => ({ matches: false }),
    },
  };
  vm.createContext(context);
  vm.runInContext(SCRIPT, context);
  return { document, initThemeToggle: context.initThemeToggle };
}

test("initThemeToggle can be rerun to wire toggles mounted later", () => {
  const { document, initThemeToggle } = loadThemeSwitcher("dark");
  const initialToggle = new FakeInput("theme-toggle toggle icons");
  document.addInput(initialToggle);

  initThemeToggle();
  assert.equal(initialToggle.checked, true);
  assert.match(initialToggle.style.getPropertyValue("--toggle-icon-start"), /^url\("data:image\/svg\+xml,/);
  assert.equal(initialToggle.listenerCount("change"), 1);

  const delayedToggle = new FakeInput("theme-toggle toggle icons");
  document.addInput(delayedToggle);

  assert.equal(delayedToggle.checked, false);
  assert.equal(delayedToggle.style.getPropertyValue("--toggle-icon-start"), "");

  initThemeToggle();
  assert.equal(initialToggle.listenerCount("change"), 1);
  assert.equal(delayedToggle.listenerCount("change"), 1);
  assert.equal(delayedToggle.checked, true);
  assert.match(delayedToggle.style.getPropertyValue("--toggle-icon-end"), /^url\("data:image\/svg\+xml,/);

  initialToggle.checked = false;
  initialToggle.dispatch("change");

  assert.equal(document.documentElement.getAttribute("data-theme"), "light");
  assert.equal(initialToggle.checked, false);
  assert.equal(delayedToggle.checked, false);
});
