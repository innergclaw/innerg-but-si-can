import { LINES, STAGES } from "./lines.js";

const $ = (s) => document.querySelector(s);
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n) => String(n).padStart(2, "0");
const pageUrl = (line) => `${location.origin}${location.pathname}#${line.slug}`;
const shareUrl = (line) =>
  "https://x.com/intent/post?text=" +
  encodeURIComponent(`SI can't ${line.cant}, but it can ${line.can}\n\n${pageUrl(line)}`);

/* ---------- Method strip ---------- */
$("#method-list").innerHTML = Object.values(STAGES)
  .map((s) => `<li><span class="m-n">${s.n}</span><span class="m-name">${s.name}</span><span class="m-note">${s.note}</span></li>`)
  .join("");

/* ---------- Hero ---------- */
const hero = {
  panel: $("#hero-panel"), cant: $("#hero-cant"), can: $("#hero-can"), index: $("#hero-index"),
  stage: $("#hero-stage"), source: $("#hero-source"), share: $("#hero-share"),
};
let index = Math.floor(Math.random() * LINES.length);

function paint(line, i) {
  hero.cant.textContent = line.cant;
  hero.can.textContent = line.can;
  hero.index.textContent = `#${pad(i + 1)} / ${pad(LINES.length)}`;
  hero.stage.textContent = `${STAGES[line.stage].n} ${STAGES[line.stage].name}`;
  hero.source.innerHTML = line.link
    ? `<a class="pill" href="${line.link.href}" rel="noopener">${line.link.label}</a>`
    : `<span class="pill pill-muted">Starter line ~ INNERG INTEL draft</span>`;
  hero.share.href = shareUrl(line);
}

function go(next, { push = true } = {}) {
  const wrapped = (next + LINES.length) % LINES.length;
  index = wrapped;
  const line = LINES[index];
  if (push) history.replaceState(null, "", `#${line.slug}`);
  if (reduceMotion()) return paint(line, index);
  hero.panel.classList.add("is-fading");
  setTimeout(() => { paint(line, index); hero.panel.classList.remove("is-fading"); }, 180);
}

function fromHash() {
  const slug = decodeURIComponent(location.hash.slice(1));
  const i = LINES.findIndex((l) => l.slug === slug);
  return i;
}

$("#hero-prev").addEventListener("click", () => go(index - 1));
$("#hero-next").addEventListener("click", () => go(index + 1));
addEventListener("keydown", (e) => {
  const t = e.target;
  if (t.closest?.("input, textarea, select, [role=tablist], .chips")) return;
  if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
  if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
});
addEventListener("hashchange", () => { const i = fromHash(); if (i >= 0 && i !== index) go(i, { push: false }); });

$("#hero-copy").addEventListener("click", async () => {
  const note = $("#copy-note");
  try { await navigator.clipboard.writeText(pageUrl(LINES[index])); note.textContent = "Link copied"; }
  catch { note.textContent = "Copy failed, use the address bar"; }
  setTimeout(() => (note.textContent = ""), 2400);
});

const start = fromHash();
paint(LINES[start >= 0 ? start : index], start >= 0 ? (index = start) : index);

/* ---------- Wall ---------- */
let stageFilter = "all";
const chips = $("#stage-chips");
chips.innerHTML = [["all", "All"], ...Object.entries(STAGES).map(([k, s]) => [k, s.name])]
  .map(([k, label]) => `<button type="button" class="chip" data-stage="${k}" aria-pressed="${k === "all"}">${label}</button>`)
  .join("");
chips.addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b) return;
  stageFilter = b.dataset.stage;
  chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
  renderWall();
});

function renderWall() {
  const list = $("#line-list");
  const shown = LINES.map((l, i) => ({ l, i })).filter(({ l }) => stageFilter === "all" || l.stage === stageFilter);
  list.innerHTML = shown
    .map(({ l, i }) => `
      <li class="line">
        <a class="line-link" href="#${l.slug}" data-i="${i}">
          <span class="line-no">#${pad(i + 1)}</span>
          <span class="line-text">SI <span class="w-cant">can't</span> ${l.cant}, but it <span class="w-can">can</span> ${l.can}</span>
          <span class="line-stage">${STAGES[l.stage].n} ${STAGES[l.stage].name}</span>
        </a>
      </li>`)
    .join("");
  $("#line-count").textContent = `${shown.length} ${shown.length === 1 ? "line" : "lines"}`;
  if (!CSS.supports("animation-delay: calc(sibling-index() * 0.1s)")) {
    [...list.children].forEach((el, n) => el.style.setProperty("--sibling-index", n + 1));
  }
}
$("#line-list").addEventListener("click", (e) => {
  const a = e.target.closest(".line-link");
  if (!a) return;
  e.preventDefault();
  go(Number(a.dataset.i));
  $(".hero").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth" });
});
renderWall();

/* ---------- Tabs ---------- */
const tabs = [...document.querySelectorAll('[role="tab"]')];
function select(tab, focus = false) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  });
  if (focus) tab.focus();
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => select(t));
  t.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      select(tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length], true);
    }
  });
});

/* ---------- Ticker pause (WCAG 2.2.2) ---------- */
const tick = $("#ticker-track"), tbtn = $("#ticker-toggle");
tbtn.addEventListener("click", () => {
  const paused = tick.classList.toggle("is-paused");
  tbtn.textContent = paused ? "Play ticker" : "Pause ticker";
});
