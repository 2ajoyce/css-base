/**
 * @file theme-switcher.js
 * @description Logic for toggling light/dark/custom themes.
 * @context
 *   setTheme(theme): Sets the data-theme attribute on the html element and syncs the select.
 * @notes
 *   Requires a select element with id="theme-select" whose option values match the [data-theme] names in themes.css.
 *   Persists the user's choice to localStorage.
 *   Optional: copy it into the project only if dynamic theming is needed.
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

/**
 * @function setTheme(theme)
 * @description Sets the data-theme attribute on the html element and syncs the select. Runs on load, using the saved choice or else the system preference, and again whenever the select changes.
 * @param theme A theme name matching a [data-theme] value in themes.css
 * @requires a select element with id theme-select
 */
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("theme-select").value = theme;
}

document.getElementById("theme-select").addEventListener("change", function () {
  const selectedTheme = this.value;
  setTheme(selectedTheme);
  localStorage.setItem("theme", selectedTheme);
});
