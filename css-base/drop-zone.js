/**
 * @file drop-zone.js
 * @description Drag-and-drop and click-to-browse behavior for .drop-zone elements.
 * @context
 *   initDropZone(selector, onFile, options): Wires up drag-and-drop and click-to-browse on the matching .drop-zone elements.
 */

/**
 * @function initDropZone(selector, onFile, options)
 * @description Wires up drag-and-drop and click-to-browse on the matching .drop-zone elements. Sets .drag-over while a file is dragged over a zone and .invalid when the file type is not accepted.
 * @param selector CSS selector for the drop zone container or containers
 * @param onFile Called with the accepted File
 * @param options Optional. options.accept lists allowed MIME types or extensions, such as ["image/png", ".pdf"].
 * @requires .drop-zone styles from components.css
 * @example
 * <div class="drop-zone" id="upload"><p>Drop a file here, or click to browse</p></div>
 * <script>
 *   initDropZone("#upload", (file) => console.log(file.name), { accept: [".png"] });
 * </script>
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
