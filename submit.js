const f = document.querySelector("#line-form");
const cant = f.querySelector("#cant"), can = f.querySelector("#can"), stage = f.querySelector("#stage");
const pvCant = document.querySelector("#pv-cant"), pvCan = document.querySelector("#pv-can");
const note = document.querySelector("#form-note");
const clean = (s) => s.trim().replace(/\s+/g, " ").replace(/[\u2014\u2013]/g, "~");
function preview() {
  pvCant.textContent = clean(cant.value) || "...";
  pvCan.textContent = clean(can.value) || "...";
}
function lineText() {
  return `SI can't ${clean(cant.value)}, but it can ${clean(can.value)}\n\n${stage.value} ~ But SI Can`;
}
f.addEventListener("input", preview);
f.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!cant.value.trim() || !can.value.trim()) {
    note.textContent = "Fill in both halves of the line.";
    (cant.value.trim() ? can : cant).focus();
    return;
  }
  try {
    await navigator.clipboard.writeText(lineText());
    note.textContent = "Line copied. Paste it into a message to INNERG INTEL. This page does not send it.";
  } catch {
    note.textContent = "Copy failed. Select the preview and copy it yourself.";
  }
});
