/**
 * @file toast.js
 * @description Shows and auto-hides .toast notifications.
 * @context
 *   showToast(selector, duration): Shows a toast, then hides it after a delay.
 */

/**
 * @function showToast(selector, duration)
 * @description Shows a toast, then hides it after a delay. Logs the toast text to the console for debugging.
 * @param selector CSS selector for the toast element. Defaults to ".toast".
 * @param duration Milliseconds to keep the toast visible. Defaults to 5000.
 * @requires .toast styles from components.css
 * @example
 * <div class="toast success">Changes saved.</div>
 * <button onclick="showToast('.toast', 5000)">Save</button>
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
