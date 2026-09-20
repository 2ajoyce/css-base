/**
 * @file drop-zone.js
 * @description Drag-and-drop and click-to-browse behavior for .drop-zone elements.
 * @context
 *   initDropZone(selector, onFile, options) (Wires up matching .drop-zone elements and calls onFile with the accepted file. States: .drag-over, .invalid. options.accept limits MIME types or extensions)
 * @notes
 *   Needs the .drop-zone styles from components.css.
 */

/**
 * Wires up drag-and-drop and click-to-browse behavior for .drop-zone elements.
 * @param {string} selector - CSS selector for the drop zone container(s)
 * @param {(file: File) => void} onFile - Called with the accepted file
 * @param {object} [options]
 * @param {string[]} [options.accept] - Allowed MIME types/extensions (e.g. ["image/png", ".pdf"])
 */
function initDropZone(selector, onFile, options = {}) {
  const { accept } = options;
  const zones =
    typeof selector === "string"
      ? document.querySelectorAll(selector)
      : [selector];

  zones.forEach((zone) => {
    if (!zone) return;

    const input = document.createElement("input");
    input.type = "file";
    input.hidden = true;
    if (accept) input.accept = accept.join(",");
    zone.appendChild(input);

    const isAccepted = (file) => {
      if (!accept || accept.length === 0) return true;
      return accept.some((rule) => {
        if (rule.startsWith(".")) {
          return file.name.toLowerCase().endsWith(rule.toLowerCase());
        }
        return file.type === rule;
      });
    };

    const handleFile = (file) => {
      if (!file) return;
      if (!isAccepted(file)) {
        zone.classList.remove("drag-over");
        zone.classList.add("invalid");
        return;
      }
      zone.classList.remove("invalid", "drag-over");
      onFile(file);
    };

    zone.addEventListener("click", () => input.click());

    input.addEventListener("change", () => {
      handleFile(input.files[0]);
      input.value = "";
    });

    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drag-over");
    });

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("drag-over");
      const file = event.dataTransfer.files[0];
      handleFile(file);
    });
  });
}
