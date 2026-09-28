/**
 * @file theme-switcher.js
 * @description Applies a saved theme before first paint and wires up a light/dark toggle switch.
 * @context
 *   initThemeToggle(selector): Wires up every input.toggle checkbox matching selector to flip between light and dark, syncing all of them (and their checked state) to the current theme and persisting the choice to localStorage.
 * @notes
 *   Sets data-theme on <html>. Remove the attribute to follow the system preference (see themes.css).
 *   Persists the user's choice to localStorage under the key "theme".
 *   Applies the saved theme immediately (top-level, not on DOMContentLoaded) so it runs before first paint when loaded from <head>.
 *   If the input has the .icons variant, sets its --toggle-icon-start and --toggle-icon-end to a sun and moon, recolored for contrast whenever the theme changes.
 */

(function () {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch {}
})();

const svgToDataUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const THEME_TOGGLE_PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
};

const themeToggleIcon = (name, stroke) =>
  svgToDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${THEME_TOGGLE_PATHS[name]}</svg>`,
  );

// A dark stroke reads on the light theme's white knob and light gray track;
// a light stroke reads on the dark theme's near-black knob and dark gray track.
const THEME_TOGGLE_ICONS = {
  light: { sun: themeToggleIcon("sun", "#1f2937"), moon: themeToggleIcon("moon", "#1f2937") },
  dark: { sun: themeToggleIcon("sun", "#f8fafc"), moon: themeToggleIcon("moon", "#f8fafc") },
};

/**
 * @function initThemeToggle(selector)
 * @description Wires up every input.toggle checkbox matching selector to flip between light and dark, syncing all of them (and their checked state) to the current theme and persisting the choice to localStorage.
 * @param selector CSS selector for the toggle switch(es). Defaults to ".theme-toggle".
 * @requires one or more input.toggle checkboxes matching selector, from elements.css, such as <input type="checkbox" class="theme-toggle toggle icons">
 * @example
 * <input type="checkbox" class="theme-toggle toggle icons" aria-label="Toggle dark theme" />
 * <script>initThemeToggle();</script>
 */
function initThemeToggle(selector = ".theme-toggle") {
  const inputs = document.querySelectorAll(selector);
  if (!inputs.length) return;

  const systemPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentTheme = () =>
    document.documentElement.getAttribute("data-theme") || (systemPrefersDark() ? "dark" : "light");

  const paintIcons = (input) => {
    if (!input.classList.contains("icons")) return;
    const icons = THEME_TOGGLE_ICONS[currentTheme()];
    input.style.setProperty("--toggle-icon-start", icons.sun);
    input.style.setProperty("--toggle-icon-end", icons.moon);
  };

  const syncAll = () => {
    const isDark = currentTheme() === "dark";
    for (const input of inputs) {
      input.checked = isDark;
      paintIcons(input);
    }
  };

  syncAll();

  for (const input of inputs) {
    input.addEventListener("change", () => {
      const next = input.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch {}
      syncAll();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => initThemeToggle());
