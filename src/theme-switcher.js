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
}

document.getElementById("theme-select").addEventListener("change", function () {
  const selectedTheme = this.value;
  document.body.setAttribute("data-theme", selectedTheme);
  localStorage.setItem("theme", selectedTheme);
});
