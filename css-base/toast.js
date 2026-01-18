/**
 * Shows a toast notification
 * @param {string} selector - The CSS selector for the toast element
 * @param {number} duration - How long to show the toast in milliseconds
 */
function showToast(selector = ".toast", duration = 5000) {
  const toast = document.querySelector(selector);
  if (!toast) return;

  // Log the text content of the toast to the console
  // Since toasts are ephemeral, this helps with debugging
  console.log("Toast shown:", toast.textContent.trim());

  toast.classList.add("show");

  // Auto-hide after duration
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}
