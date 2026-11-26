// Style A Instagram story (1080 x 1920) for the featured Can't / Can line.
// Drawn with the standard Canvas 2D API (not the experimental canvas-html capture).

const W = 1080;
const H = 1920;
const CREAM = "#F3EBDD";
const INK = "#1E1414";
const BRICK = "#9E2B25";
const MUTED = "#5E4E47";
const SITE = "innergclaw.github.io/innerg-but-si-can";
const FOOTER = "No. 001  •  INNERG INTEL  •  2026";
const PAD = 88;

const FONT_DISPLAY = '"Fraunces", Georgia, serif';
const FONT_MONO = '"Courier Prime", ui-monospace, monospace';
const FONT_BODY = '"Cormorant Garamond", Georgia, serif';

export const STORY_SIZE = { width: W, height: H };

function filenameFor(line) {
  return `but-si-can-${line.slug}.png`;
}

async function readyFonts() {
  const faces = [
    `900 120px ${FONT_DISPLAY}`,
    `italic 900 120px ${FONT_DISPLAY}`,
    `700 28px ${FONT_MONO}`,
    `600 italic 28px ${FONT_BODY}`,
  ];
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    if (document.fonts?.load) await Promise.all(faces.map((f) => document.fonts.load(f)));
  } catch {
    /* Draw with fallbacks if a face is slow or missing. */
  }
}

function loadSeal() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The seal image did not load."));
    img.src = new URL("assets/seal.jpg", import.meta.url).href;
  });
}

function setDisplayFont(ctx, { italic = false, size, weight = "900" } = {}) {
  ctx.font = `${italic ? "italic " : ""}${weight} ${size}px ${FONT_DISPLAY}`;
  if ("fontVariationSettings" in ctx) {
    ctx.fontVariationSettings = italic
      ? `"opsz" 144, "wght" ${weight}, "SOFT" 100`
      : `"opsz" 144, "wght" ${weight}, "SOFT" 100`;
  }
  ctx.textBaseline = "alphabetic";
}

function setMonoFont(ctx, size, weight = "700") {
  ctx.font = `${weight} ${size}px ${FONT_MONO}`;
  if ("fontVariationSettings" in ctx) ctx.fontVariationSettings = "normal";
  ctx.textBaseline = "alphabetic";
}

function tokenize(runs) {
  const tokens = [];
  for (const run of runs) {
    const words = String(run.text).trim().split(/\s+/).filter(Boolean);
    for (const word of words) {
      tokens.push({ ...run, text: word });
    }
  }
  return tokens;
}

function wrapTokens(ctx, tokens, maxWidth, size) {
  const lines = [];
  let line = [];
  let width = 0;
  const gap = () => {
    setDisplayFont(ctx, { size, weight: "900" });
    return ctx.measureText(" ").width;
  };

  for (const token of tokens) {
    setDisplayFont(ctx, { italic: token.italic, size, weight: token.weight || "900" });
    const tw = ctx.measureText(token.text).width;
    const extra = line.length ? gap() : 0;
    if (line.length && width + extra + tw > maxWidth) {
      lines.push({ tokens: line, width });
      line = [];
      width = 0;
    }
    const xGap = line.length ? gap() : 0;
    line.push({ ...token, xGap, tw });
    width += xGap + tw;
  }
  if (line.length) lines.push({ tokens: line, width });
  return lines;
}

function drawToken(ctx, token, x, baseline, size) {
  setDisplayFont(ctx, { italic: token.italic, size, weight: token.weight || "900" });
  if (token.shadow) {
    ctx.fillStyle = "rgba(30, 20, 20, 0.35)";
    ctx.fillText(token.text, x - Math.round(size * 0.03), baseline + Math.round(size * 0.02));
  }
  ctx.fillStyle = token.fill;
  ctx.fillText(token.text, x, baseline);
  if (token.strike) {
    const m = ctx.measureText(token.text);
    const mid = baseline - (m.actualBoundingBoxAscent || size * 0.7) * 0.38;
    ctx.strokeStyle = BRICK;
    ctx.lineWidth = Math.max(4, size * 0.065);
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(x, mid);
    ctx.lineTo(x + token.tw, mid);
    ctx.stroke();
  }
  if (token.underline) {
    const uy = baseline + Math.max(6, size * 0.08);
    ctx.strokeStyle = BRICK;
    ctx.lineWidth = Math.max(5, size * 0.085);
    ctx.beginPath();
    ctx.moveTo(x, uy);
    ctx.lineTo(x + token.tw, uy);
    ctx.stroke();
  }
}

function drawLines(ctx, lines, x0, y0, size, lineHeight) {
  let y = y0;
  for (const line of lines) {
    let x = x0;
    for (const token of line.tokens) {
      x += token.xGap;
      drawToken(ctx, token, x, y, size);
      x += token.tw;
    }
    y += lineHeight;
  }
  return y;
}

function blockHeight(lineCount, size) {
  return lineCount * size * 1.02;
}

function drawDots(ctx) {
  const tile = document.createElement("canvas");
  tile.width = 8;
  tile.height = 8;
  const t = tile.getContext("2d");
  t.fillStyle = "rgba(30, 20, 20, 0.07)";
  t.fillRect(0, 0, 2, 2);
  ctx.fillStyle = ctx.createPattern(tile, "repeat");
  ctx.fillRect(0, 0, W, H);
}

function fitSize(ctx, cantRuns, canRuns, maxWidth, minY, maxY) {
  for (let size = 100; size >= 52; size -= 2) {
    const cantLines = wrapTokens(ctx, tokenize(cantRuns(size)), maxWidth, size);
    const canLines = wrapTokens(ctx, tokenize(canRuns(size)), maxWidth, size);
    const gap = size * 0.32;
    const used = blockHeight(cantLines.length, size) + gap + blockHeight(canLines.length, size);
    if (minY + used <= maxY) {
      return { size, cantLines, canLines, gap };
    }
  }
  const size = 52;
  return {
    size,
    cantLines: wrapTokens(ctx, tokenize(cantRuns(size)), maxWidth, size),
    canLines: wrapTokens(ctx, tokenize(canRuns(size)), maxWidth, size),
    gap: size * 0.32,
  };
}

export async function renderStory(line, meta) {
  await readyFonts();
  const seal = await loadSeal();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);
  drawDots(ctx);

  const maxWidth = W - PAD * 2;
  let y = 220;

  const sealSize = 132;
  ctx.save();
  ctx.beginPath();
  ctx.arc(PAD + sealSize / 2, y + sealSize / 2, sealSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(seal, PAD, y, sealSize, sealSize);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(PAD + sealSize / 2, y + sealSize / 2, sealSize / 2 - 1, 0, Math.PI * 2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.stroke();

  const markX = PAD + sealSize + 24;
  const markY = y + sealSize / 2 + 18;
  setDisplayFont(ctx, { size: 52, weight: "900" });
  ctx.fillStyle = INK;
  const butW = ctx.measureText("But SI ").width;
  ctx.fillText("But SI ", markX, markY);
  setDisplayFont(ctx, { italic: true, size: 52, weight: "900" });
  ctx.fillStyle = BRICK;
  const canMark = "can";
  ctx.fillText(canMark, markX + butW, markY);
  const canW = ctx.measureText(canMark).width;
  ctx.strokeStyle = BRICK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(markX + butW, markY + 10);
  ctx.lineTo(markX + butW + canW, markY + 10);
  ctx.stroke();

  y += sealSize + 56;

  const idx = meta?.index ?? 0;
  const total = meta?.total ?? 0;
  const stage = meta?.stage ?? "";
  const kicker = `#${String(idx).padStart(2, "0")}  /  ${String(total).padStart(2, "0")}   ~   ${stage}`.toUpperCase();
  setMonoFont(ctx, 22);
  ctx.fillStyle = MUTED;
  ctx.letterSpacing = "4px";
  ctx.fillText(kicker, PAD, y);
  ctx.letterSpacing = "0px";
  y += 54;

  const cantRuns = () => [
    { text: "SI", fill: INK },
    { text: "can't", fill: BRICK, italic: true, strike: true, shadow: true },
    { text: line.cant, fill: INK },
  ];
  const canRuns = () => [
    { text: "but it", fill: INK },
    { text: "can", fill: INK, italic: true, underline: true },
    { text: line.can, fill: INK },
  ];

  const footerTop = H - 440;
  const fit = fitSize(ctx, cantRuns, canRuns, maxWidth, y, footerTop - 40);
  const afterCant = drawLines(ctx, fit.cantLines, PAD, y + fit.size, fit.size, fit.size * 1.02);
  drawLines(ctx, fit.canLines, PAD, afterCant + fit.gap + fit.size * 0.15, fit.size, fit.size * 1.02);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD, H - 400);
  ctx.lineTo(W - PAD, H - 400);
  ctx.stroke();

  setMonoFont(ctx, 20);
  ctx.fillStyle = INK;
  ctx.letterSpacing = "6px";
  ctx.textAlign = "center";
  ctx.fillText(FOOTER, W / 2, H - 344);
  ctx.fillStyle = MUTED;
  ctx.letterSpacing = "3px";
  ctx.fillText(SITE, W / 2, H - 300);
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not make the story image."))), "image/png");
  });
  return { blob, canvas, filename: filenameFor(line) };
}

export function canShareFiles() {
  try {
    const probe = new File([new Uint8Array([137, 80, 78, 71])], "probe.png", { type: "image/png" });
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function saveStory(line, meta) {
  const { blob, filename } = await renderStory(line, meta);
  triggerDownload(blob, filename);
  return filename;
}

export async function shareStory(line, meta) {
  const { blob, filename } = await renderStory(line, meta);
  const file = new File([blob], filename, { type: "image/png" });
  if (!navigator.canShare?.({ files: [file] })) {
    triggerDownload(blob, filename);
    return "saved";
  }
  await navigator.share({
    files: [file],
    title: "But SI Can",
    text: `SI can't ${line.cant}, but it can ${line.can}`,
  });
  return "shared";
}
