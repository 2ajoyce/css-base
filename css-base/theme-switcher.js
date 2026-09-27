/**
 * @file theme-switcher.js
 * @description Applies a saved theme before first paint and wires up a light/dark toggle switch.
 * @context
 *   initThemeToggle(selector): Wires up an input.toggle checkbox that flips between light and dark, syncing its checked state to the current theme and persisting the choice to localStorage.
 * @notes
 *   Sets data-theme on <html>. Remove the attribute to follow the system preference (see themes.css).
 *   Persists the user's choice to localStorage under the key "theme".
 *   Applies the saved theme immediately (top-level, not on DOMContentLoaded) so it runs before first paint when loaded from <head>.
 */

(function () {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch {}
})();

/**
 * @function initThemeToggle(selector)
 * @description Wires up an input.toggle checkbox that flips between light and dark, syncing its checked state to the current theme and persisting the choice to localStorage.
 * @param selector CSS selector for the toggle switch. Defaults to "#theme-toggle".
 * @requires an input.toggle checkbox matching selector, from elements.css, such as <input type="checkbox" id="theme-toggle" class="toggle">
 * @example
 * <input type="checkbox" id="theme-toggle" class="toggle" />
 * <script>initThemeToggle();</script>
 */
function initThemeToggle(selector = "#theme-toggle") {
  const input = document.querySelector(selector);
  if (!input) return;

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
