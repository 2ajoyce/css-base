/**
 * @file theme-switcher.js
 * @description Applies a saved theme before first paint and wires up a toggle button.
 * @context
 *   initThemeToggle(selector): Wires up a button that flips between light and dark on click, syncing its icon/label and persisting the choice to localStorage.
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

const THEME_TOGGLE_ICONS = {
  moon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"></line></svg>',
};

/**
 * @function initThemeToggle(selector)
 * @description Wires up a button that flips between light and dark on click, syncing its icon/label and persisting the choice to localStorage.
 * @param selector CSS selector for the toggle button. Defaults to "#theme-toggle".
 * @requires a plain button element matching selector, such as <button id="theme-toggle">
 * @example
 * <button id="theme-toggle"></button>
 * <script>initThemeToggle();</script>
 */
function initThemeToggle(selector = "#theme-toggle") {
  const button = document.querySelector(selector);
  if (!button) return;

  const systemPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentTheme = () =>
    document.documentElement.getAttribute("data-theme") || (systemPrefersDark() ? "dark" : "light");

  const render = (theme) => {
    // Label and icon show the theme a click switches to, not the current one.
    button.innerHTML =
      theme === "dark" ? `${THEME_TOGGLE_ICONS.sun} Light` : `${THEME_TOGGLE_ICONS.moon} Dark`;
  };

  render(currentTheme());

  button.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    render(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  });
}

document.addEventListener("DOMContentLoaded", () => initThemeToggle());
