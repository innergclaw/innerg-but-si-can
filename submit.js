const f = document.querySelector("#line-form");
const cant = f.querySelector("#cant"), can = f.querySelector("#can"), stage = f.querySelector("#stage");
const pvCant = document.querySelector("#pv-cant"), pvCan = document.querySelector("#pv-can");
const note = document.querySelector("#form-note");
const clean = (s) => s.trim().replace(/\s+/g, " ").replace(/[\u2014\u2013]/g, "~");
function preview() {
  pvCant.textContent = clean(cant.value) || "...";
  pvCan.textContent = clean(can.value) || "...";
}
f.addEventListener("input", preview);
f.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!cant.value.trim() || !can.value.trim()) {
    note.textContent = "Fill in both halves of the line.";
    (cant.value.trim() ? can : cant).focus();
    return;
  }
  const text = `SI can't ${clean(cant.value)}, but it can ${clean(can.value)}\n\n${stage.value} ~ @InnerGIntel`;
  window.open("https://x.com/intent/post?text=" + encodeURIComponent(text), "_blank", "noopener");
  note.textContent = "Your X draft opened in a new tab. Post it there if you want it considered.";
});
