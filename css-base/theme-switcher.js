/**
 * @file theme-switcher.js
 * @description Applies a saved theme before first paint and wires up a light/dark toggle switch.
 * @context
 *   initThemeToggle(selector): Wires up an input.toggle checkbox that flips between light and dark, syncing its checked state to the current theme and persisting the choice to localStorage.
 * @notes
 *   Sets data-theme on <html>. Remove the attribute to follow the system preference (see themes.css).
 *   Persists the user's choice to localStorage under the key "theme".
 *   Applies the saved theme immediately (top-level, not on DOMContentLoaded) so it runs before first paint when loaded from <head>.
 *   If the input has the .icons variant, sets its --toggle-icon-start and --toggle-icon-end to a sun and moon.
 */

(function () {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch {}
})();

const svgToDataUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const THEME_TOGGLE_ICONS = {
  sun: svgToDataUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>',
  ),
  moon: svgToDataUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  ),
};

/**
 * @function initThemeToggle(selector)
 * @description Wires up an input.toggle checkbox that flips between light and dark, syncing its checked state to the current theme and persisting the choice to localStorage.
 * @param selector CSS selector for the toggle switch. Defaults to "#theme-toggle".
 * @requires an input.toggle checkbox matching selector, from elements.css, such as <input type="checkbox" id="theme-toggle" class="toggle icons">
 * @example
 * <input type="checkbox" id="theme-toggle" class="toggle icons" aria-label="Toggle dark theme" />
 * <script>initThemeToggle();</script>
 */
function initThemeToggle(selector = "#theme-toggle") {
  const input = document.querySelector(selector);
  if (!input) return;

  if (input.classList.contains("icons")) {
    input.style.setProperty("--toggle-icon-start", THEME_TOGGLE_ICONS.sun);
    input.style.setProperty("--toggle-icon-end", THEME_TOGGLE_ICONS.moon);
  }

  const systemPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentTheme = () =>
    document.documentElement.getAttribute("data-theme") || (systemPrefersDark() ? "dark" : "light");

  input.checked = currentTheme() === "dark";

  input.addEventListener("change", () => {
    const next = input.checked ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  });
}

document.addEventListener("DOMContentLoaded", () => initThemeToggle());
