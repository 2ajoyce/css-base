/**
 * @file theme-switcher.js
 * @description Logic for toggling light/dark/custom themes.
 * @context
 *   - Intended to be copied into the user's project if dynamic theming is needed.
 *   - Works in tandem with `themes.css` (which defines [data-theme="..."]).
 *   - Requires an HTML <select> element with id="theme-select".
 * @functionality
 *   - Auto-detects system preference (prefers-color-scheme).
 *   - Persists user choice to localStorage.
 *   - Updates data-theme attribute on body.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Check local storage for saved theme
  let savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
    return;
  }

  // Check browser preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
});

function setTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  document.getElementById("theme-select").value = theme;

  // Separately, set the background color of the root element
  const root = document.documentElement;
  root.style.backgroundColor = getComputedStyle(document.body).getPropertyValue(
    "--background-color",
  );
}

document.getElementById("theme-select").addEventListener("change", function () {
  const selectedTheme = this.value;
  setTheme(selectedTheme);
  localStorage.setItem("theme", selectedTheme);
});
