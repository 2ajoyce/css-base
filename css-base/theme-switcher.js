/**
 * @file theme-switcher.js
 * @description Logic for toggling light/dark/custom themes.
 * @context
 *   setTheme(theme): Sets the data-theme attribute on the html element and syncs the select if it exists.
 * @notes
 *   Load it with a plain script tag in the head, so a saved theme is applied before first paint and the page does not flash the wrong theme.
 *   With no saved choice it leaves data-theme unset, so themes.css follows the system preference on its own.
 *   Apps that bundle their own JS can skip this file and use the head snippet documented in themes.css.
 *   Requires a select element with id="theme-select" whose option values match the [data-theme] names in themes.css.
 *   Persists the user's choice to localStorage.
 *   Optional: copy it into the project only if dynamic theming is needed.
 */

// Apply a saved theme right away. In the head this runs before the body is parsed.
const savedTheme = readSavedTheme();
if (savedTheme) setTheme(savedTheme);

document.addEventListener("DOMContentLoaded", function () {
  const select = document.getElementById("theme-select");
  if (!select) return;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  select.value = document.documentElement.getAttribute("data-theme") ?? (prefersDark ? "dark" : "light");
  select.addEventListener("change", function () {
    setTheme(this.value);
    try {
      localStorage.setItem("theme", this.value);
    } catch {}
  });
});

// localStorage can throw when storage is blocked
function readSavedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

/**
 * @function setTheme(theme)
 * @description Sets the data-theme attribute on the html element and syncs the select if it exists. Runs as soon as the script loads when a theme is saved, and again whenever the select changes.
 * @param theme A theme name matching a [data-theme] value in themes.css
 */
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const select = document.getElementById("theme-select");
  if (select) select.value = theme;
}
