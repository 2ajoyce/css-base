/**
 * @file theme-switcher.js
 * @description Logic for toggling light/dark/custom themes.
 * @context
 *   setTheme(theme) (Sets data-theme on body and syncs the select. Runs on load from localStorage or prefers-color-scheme, and whenever the select changes)
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
