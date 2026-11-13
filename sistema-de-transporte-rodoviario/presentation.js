"use strict";

const slides = Array.from(document.querySelectorAll(".slide"));
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const counter = document.querySelector("#counter");
const markerList = document.querySelector("#markers");
const stage = document.querySelector("#stage");
const paper = document.querySelector("#slide-paper");
const pixelCanvas = document.querySelector("#slide-pixels");
const scanStatus = document.querySelector("#slide-scan-status");
const scanStart = document.querySelector("#slide-scan-start");
const pixelContext = pixelCanvas?.getContext("2d");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const markers = slides.map((slide, index) => {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.title = "Slide " + (index + 1) + " · " + slide.dataset.title;
  marker.setAttribute("aria-label", marker.title);
  marker.addEventListener("click", () => showSlide(index));
  markerList.append(marker);
  return marker;
});

const numberLabel = (value) => String(value).padStart(2, "0");
let current = -1;
let paperSurface;
let pixelFrame = 0;
let pixelWidth = 0;
let pixelHeight = 0;
let pixelOffset = 0;
let paperHeight = 0;
let paperFragments = [];
let heldSlide = null;

const sourceSlips = {
  historico: ["INSPEÇÃO / 2008", "REFORÇO / 2024", "V01 / FICHA DE CAMPO"],
  base: ["FONTE: ABNT", "ESTUDOS / EB1 · EB2", "DNIT / DOCUMENTOS"],
  metodo: ["VISTORIA / DATA DE REFERÊNCIA", "REGIME / PERIODICIDADE", "PRAZO / CONFERÊNCIA"],
  especificacao: ["F04 / OBSERVAÇÃO", "V01 / REGIÃO OBSERVADA", "EVIDÊNCIA / DOCUMENTO"],
  prototipo: ["ERI-DEMO-001 / CADASTRO", "V01 / HISTÓRICO", "F04 / ORIGEM"],
  entrega: ["MODELO / IFC", "DOCUMENTOS / ORIGEM", "DOSSIÊ / JSON"],
  verificacao: ["CONTROLE / PACOTE", "IDENTIFICAÇÃO / V01", "RESULTADO / ENSAIO"],
  aplicacoes: ["V01 / REGISTROS", "MANUTENÇÃO / HISTÓRICO", "SÉRIE / LEITURAS"]
};

function renderSlide(index, updateAddress = true, useFade = true) {
  if (index < 0 || index >= slides.length || index === current) return;
  const departing = slides[current];
  if (departing?.contains(document.activeElement)) stage.focus({ preventScroll: true });
  slides.forEach((slide, i) => {
    slide.hidden = i !== index;
    slide.classList.toggle("entering", i === index && useFade);
    if (i === index) markers[i].setAttribute("aria-current", "step");
    else markers[i].removeAttribute("aria-current");
  });
  current = index;
  previous.disabled = index === 0;
  next.disabled = index === slides.length - 1;
  counter.textContent = numberLabel(index + 1) + " / " + numberLabel(slides.length);
  if (updateAddress) history.replaceState(null, "", "#" + slides[index].id);
  window.scrollTo(0, 0);
}

function ensurePaperSurface() {
  if (paperSurface) return paperSurface;
  const applicable = Array.from(document.styleSheets).flatMap(sheet => {
    try { return Array.from(sheet.cssRules, rule => rule.cssText); }
    catch { return []; }
  });
  if (!applicable.length) return null;
  const style = document.createElement("style");
  style.textContent = applicable.join("\n") + `
    :host { display: block; }
    .paper-surface { width: 100%; height: 100%; }
    .paper-surface > .slide {
      width: 100%; height: 100%; margin: 0; animation: none;
      filter: invert(1) grayscale(1) brightness(1.09) contrast(1.08);
      border-radius: 0;
    }
    .paper-surface > .slide :is(img, video, canvas) { filter: invert(1); }
    .paper-surface > .slide *, .paper-surface > .slide *::before, .paper-surface > .slide *::after {
      animation: none !important; transition: none !important;
    }
    .paper-fragment { transform-origin: center; }
    .paper-title-piece { display: inline-block; max-width: 100%; }
    .paper-image-slice {
      position: absolute; display: block; margin: 0; border-radius: 0;
      pointer-events: none;
    }
    .paper-slip {
      position: absolute; z-index: 3; width: max-content; max-width: 55%;
      padding: .32rem .48rem .36rem; border: 1px solid #888;
      border-left-width: 3px; background: #222; color: #eee;
      font: 750 clamp(.53rem,.96vw,.75rem)/1.24 "Consolas", monospace; letter-spacing: .05em;
      box-shadow: 2px 2px #0f0f0f55;
    }
    .paper-slip--a { top: 20%; right: 8%; }
    .paper-slip--b { top: 54%; left: 11%; }
    .paper-slip--c { top: 70%; right: 16%; }
    .paper-slip::after {
      content: ""; display: block; height: 3px; width: 62%; margin-top: .33rem;
      background: repeating-linear-gradient(90deg,#999 0 4px,transparent 4px 7px);
    }
    .paper-surface .paper-caption {
      position: absolute; inset: auto auto 9px clamp(18px, 3vw, 42px);
      color: #353535; font: 700 clamp(.57rem, .9vw, .7rem)/1.25 "Segoe UI", sans-serif;
      text-transform: uppercase; letter-spacing: .12em;
    }
  `;
  // An isolated copy keeps the same layout and IDs without duplicating the active controls.
  const root = paper.attachShadow({ mode: "open" });
  paperSurface = document.createElement("div");
  paperSurface.className = "paper-surface";
  root.append(style, paperSurface);
  return paperSurface;
}

function makeFragment(element, offset, kind, area) {
  element.classList.add("paper-fragment");
  const rect = element.getBoundingClientRect();
  const center = (rect.x + rect.width / 2 - area.x) / area.width;
  const [dx, dy, angle] = offset;
  const scale = Math.min(1, area.width / 960);
  const entry = { element, center, dx: dx * scale, dy: dy * scale, angle, kind };
  paperFragments.push(entry);
  placeFragment(entry, 1);
}

function placeFragment(fragment, amount) {
  const { element, dx, dy, angle, kind } = fragment;
  element.style.transform = "translate(" + (dx * amount).toFixed(1) + "px," +
    (dy * amount).toFixed(1) + "px) rotate(" + (angle * amount).toFixed(2) + "deg)";
  if (kind === "slip") element.style.opacity = String(.95 * amount);
}

function disorder(copy) {
  const area = copy.getBoundingClientRect();
  if (!area.width) return;
  const title = copy.querySelector("h2");
  if (title && !title.children.length) {
    // Preserve the wording; disorder comes from moving the line fragments.
    const words = title.textContent.trim().split(/\s+/);
    const cut = Math.ceil(words.length / 2);
    const segments = [words.slice(0, cut), words.slice(cut)].filter(segment => segment.length);
    title.replaceChildren();
    segments.forEach((segment, i) => {
      if (i) title.append(" ");
      const part = document.createElement("span");
      part.className = "paper-title-piece";
      part.textContent = segment.join(" ");
      title.append(part);
    });
    Array.from(title.children).forEach((part, i) =>
      makeFragment(part, i === 0 ? [12, -11, -2.4] : [-35, 9, 3.1], "text", area));
  }

  const images = Array.from(copy.querySelectorAll("img"));
  const image = images.find(element => {
    const r = element.getBoundingClientRect();
    return r.width > area.width * .18 && r.height > 72 && getComputedStyle(element).opacity !== "0";
  });
  if (image && image.complete && image.naturalWidth) {
    const r = image.getBoundingClientRect();
    const layout = getComputedStyle(image);
    const slices = [
      [0, 64, [-13, -9, -1.6]],
      [37, 33, [33, 3, 2.6]],
      [68, 0, [-22, 12, -2.4]]
    ];
    slices.forEach(([top, bottom, offset]) => {
      const slice = document.createElement("img");
      slice.src = image.currentSrc || image.src;
      slice.alt = "";
      slice.className = "paper-image-slice";
      Object.assign(slice.style, {
        left: (r.x - area.x - copy.clientLeft) + "px",
        top: (r.y - area.y - copy.clientTop) + "px",
        width: r.width + "px",
        height: r.height + "px",
        objectFit: layout.objectFit,
        objectPosition: layout.objectPosition,
        clipPath: "inset(" + top + "% 0 " + bottom + "% 0)"
      });
      copy.append(slice);
      makeFragment(slice, offset, "image", area);
    });
    image.style.visibility = "hidden";
  } else {
    const content = copy.querySelector(":scope > .method-stage, :scope > .spec-presentation, :scope > .delivery");
    if (content) makeFragment(content, [17, 9, -1.6], "text", area);
  }

  const presets = [
    ["a", [-20, -5, -8]],
    ["b", [14, 2, 5]],
    ["c", [-2, 0, -6]]
  ];
  (sourceSlips[copy.id] || []).forEach((value, i) => {
    const slip = document.createElement("span");
    slip.className = "paper-slip paper-slip--" + presets[i][0];
    slip.textContent = value;
    copy.append(slip);
    makeFragment(slip, presets[i][1], "slip", area);
  });
}

function showPaper(slide) {
  const surface = ensurePaperSurface();
  if (!surface) return false;
  const copy = slide.cloneNode(true);
  copy.classList.remove("entering");
  copy.inert = false;
  copy.querySelectorAll('img[loading="lazy"]').forEach(image => image.removeAttribute("loading"));
  const caption = document.createElement("span");
  caption.className = "paper-caption";
  caption.textContent = "Registro analógico  /  " + numberLabel(current + 1);
  surface.replaceChildren(copy, caption);
  paper.style.clipPath = "";
  paper.hidden = false;
  paperHeight = paper.offsetHeight;
  disorder(copy);
  return true;
}

function sizePixels() {
  const bounds = stage.getBoundingClientRect();
  pixelOffset = Math.max(0, Math.floor(-bounds.top));
  pixelWidth = Math.max(0, Math.floor(bounds.width));
  pixelHeight = Math.max(0, Math.floor(Math.min(bounds.height - pixelOffset, innerHeight - bounds.top - pixelOffset)));
  if (!pixelWidth || !pixelHeight) return false;
  const scale = Math.min(devicePixelRatio || 1, 1.5);
  pixelCanvas.style.width = pixelWidth + "px";
  pixelCanvas.style.height = pixelHeight + "px";
  pixelCanvas.style.top = pixelOffset + "px";
  pixelCanvas.width = Math.round(pixelWidth * scale);
  pixelCanvas.height = Math.round(pixelHeight * scale);
  pixelContext.setTransform(scale, 0, 0, scale, 0, 0);
  return true;
}

const clampPixel = (value, max = 1) => Math.max(0, Math.min(max, value));
const smoothPixel = value => { const t = clampPixel(value); return t * t * (3 - 2 * t); };

function drawScan(progress) {
  // Use the cover's 15px sampling, 1.34 sweep, .265-wide pixel trail and shrinking particles.
  const columns = Math.max(1, Math.ceil(pixelWidth / 15));
  const rows = Math.max(1, Math.ceil(paperHeight / 15));
  const tileW = pixelWidth / columns;
  const tileH = paperHeight / rows;
  const sweep = 1.34 * progress;
  const polygon = ["100% 0"];
  pixelContext.clearRect(0, 0, pixelWidth, pixelHeight);

  for (let row = 0; row < rows; row++) {
    const y = row * tileH;
    const slope = (row / rows - .5) * .07;
    const boundary = clampPixel(Math.floor((sweep - slope + ((row * 37 % 23) - 11) / 410 - .052) * columns), columns);
    const edge = (boundary * tileW).toFixed(2);
    polygon.push(edge + "px " + y.toFixed(2) + "px", edge + "px " + (y + tileH).toFixed(2) + "px");
    if (y + tileH < pixelOffset || y > pixelOffset + pixelHeight) continue;

    const first = Math.max(0, Math.floor((sweep - slope - .31) * columns));
    const last = Math.min(columns, Math.ceil((sweep - slope + .035) * columns));
    for (let column = first; column < last; column++) {
      const u = (column + .5) / columns;
      const jitter = ((column * 19 + row * 37) % 23 - 11) / 410;
      const local = clampPixel((sweep - u - slope - jitter) / .265);
      if (local <= 0 || local >= 1) continue;
      const eased = smoothPixel(local);
      const shrink = 1 - .91 * eased;
      const seed = (column * 17 + row * 13) % 23;
      const green = Math.round(162 + 82 * eased);
      const blue = Math.round(162 + 64 * eased);
      const opacity = Math.min(1, local * 5) * (1 - smoothPixel((local - .56) / .44));
      const cx = (column + .5) * tileW + local * tileW * (.25 + seed % 3 * .15);
      const cy = y + tileH * .5 - pixelOffset + local * tileH * ((seed % 5) - 2) * .32;
      pixelContext.fillStyle = "rgb(72 " + green + " " + blue + ")";
      pixelContext.globalAlpha = opacity * (.64 + (seed % 4) * .085);
      pixelContext.fillRect(cx - tileW * shrink / 2, cy - tileH * shrink / 2, tileW * shrink, tileH * shrink);
    }
  }
  pixelContext.globalAlpha = 1;
  polygon.push("100% 100%");
  paper.style.clipPath = "polygon(" + polygon.join(",") + ")";

  paperFragments.forEach(fragment => {
    const passing = smoothPixel((sweep - fragment.center + .16) / .25);
    placeFragment(fragment, 1 - passing);
  });
}

function drawFinalScan(progress) {
  pixelContext.clearRect(0, 0, pixelWidth, pixelHeight);
  const center = -38 + (pixelWidth + 76) * smoothPixel(progress);
  const beam = pixelContext.createLinearGradient(center - 48, 0, center + 7, 0);
  beam.addColorStop(0, "rgba(83, 219, 210, 0)");
  beam.addColorStop(.83, "rgba(83, 219, 210, .13)");
  beam.addColorStop(.94, "rgba(151, 255, 239, .62)");
  beam.addColorStop(1, "rgba(83, 219, 210, 0)");
  pixelContext.fillStyle = beam;
  pixelContext.fillRect(center - 48, 0, 55, pixelHeight);
}

function releaseHold() {
  if (!heldSlide) return;
  heldSlide.inert = false;
  heldSlide = null;
  if (document.activeElement === scanStart) stage.focus({ preventScroll: true });
  scanStart.hidden = true;
  next.setAttribute("aria-label", "Próximo slide");
  next.title = "Próximo slide (→)";
}

function stopPixels() {
  releaseHold();
  cancelAnimationFrame(pixelFrame);
  pixelFrame = 0;
  pixelCanvas.hidden = true;
  paper.hidden = true;
  scanStatus.hidden = true;
  paperFragments = [];
  paperSurface?.replaceChildren();
  paper.style.clipPath = "";
}

function showSlide(index) {
  if (index < 0 || index >= slides.length || index === current) return;
  const from = current;
  stopPixels();
  const canScan = from >= 0 && index > 0 && pixelContext && paper.attachShadow &&
    CSS.supports("clip-path", "polygon(0 0, 100% 0, 100% 100%)") &&
    !motionPreference.matches && !document.hidden;
  renderSlide(index, true, !canScan && !motionPreference.matches);
  if (!canScan || !sizePixels() || !showPaper(slides[index])) return;

  if (from === 0 && index === 1) {
    heldSlide = slides[index];
    heldSlide.inert = true;
    scanStart.hidden = false;
    next.setAttribute("aria-label", "Iniciar varredura do slide");
    next.title = "Iniciar varredura (→)";
    return;
  }

  playScan(1400);
}

function startHeldScan() {
  if (!heldSlide) return;
  releaseHold();
  if (!sizePixels()) {
    stopPixels();
    return;
  }
  playScan(0);
}

function playScan(hold) {
  const started = performance.now();
  const digitize = 3300; // Same duration as the photo-to-model pass on the cover.
  const finalScan = 1020;
  function draw(now) {
    const time = Math.max(0, now - started);
    if (time >= hold + digitize + finalScan + 440 || document.querySelector("dialog[open]")) {
      stopPixels();
      return;
    }

    if (time >= hold + digitize) {
      if (!paper.hidden) {
        paper.hidden = true;
        paperSurface.replaceChildren();
        paperFragments = [];
        scanStatus.textContent = "Varredura final";
        scanStatus.hidden = false;
      }
      const scanTime = time - hold - digitize;
      if (scanTime < finalScan) drawFinalScan(scanTime / finalScan);
      else if (!pixelCanvas.hidden) {
        pixelCanvas.hidden = true;
        scanStatus.textContent = "Informação estruturada";
      }
    } else if (time >= hold) {
      pixelCanvas.hidden = false;
      drawScan((time - hold) / digitize);
    }
    pixelFrame = requestAnimationFrame(draw);
  }
  pixelFrame = requestAnimationFrame(draw);
}

function moveSlide(delta) {
  if (heldSlide && delta > 0) startHeldScan();
  else showSlide(current + delta);
}

scanStart.addEventListener("click", startHeldScan);

motionPreference.addEventListener("change", () => { if (motionPreference.matches) stopPixels(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && pixelFrame) stopPixels(); });
window.addEventListener("resize", () => {
  if (heldSlide) {
    paperFragments = [];
    showPaper(heldSlide);
  } else if (pixelFrame) stopPixels();
});
stage.addEventListener("pointerdown", () => { if (pixelFrame) stopPixels(); }, { capture: true });
stage.addEventListener("focusin", event => { if (pixelFrame && event.target !== stage) stopPixels(); });

function slideFromAddress() {
  const hash = location.hash === "#demonstracao" ? "#prototipo" : location.hash;
  const found = slides.findIndex((slide) => "#" + slide.id === hash);
  stopPixels();
  renderSlide(Math.max(0, found), false);
}

slideFromAddress();
window.addEventListener("hashchange", slideFromAddress);
previous.addEventListener("click", () => moveSlide(-1));
next.addEventListener("click", () => moveSlide(1));

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
});

const fullscreenButton = document.querySelector("#fullscreen");
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    fullscreenButton.title = "Tela cheia indisponível nesta janela";
  }
}

fullscreenButton.disabled = !document.fullscreenEnabled;
fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", () => {
  fullscreenButton.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
});

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || document.querySelector("dialog[open]") || event.target instanceof HTMLSelectElement || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  const key = event.key.toLowerCase();
  if (["arrowleft", "pageup", "arrowright", "pagedown", "home", "end", "f"].includes(key)) event.preventDefault();
  if (key === "arrowleft" || key === "pageup") moveSlide(-1);
  if (key === "arrowright" || key === "pagedown") moveSlide(1);
  if (key === "home") showSlide(0);
  if (key === "end") showSlide(slides.length - 1);
  if (key === "f" && !fullscreenButton.disabled) toggleFullscreen();
});

const clock = document.querySelector("#clock");
const start = document.querySelector("#start");
const pause = document.querySelector("#pause");
const reset = document.querySelector("#reset");
let elapsed = 0;
let startedAt = null;
let interval = null;

function updateClock() {
  const liveElapsed = startedAt === null ? 0 : performance.now() - startedAt;
  const seconds = Math.floor((elapsed + liveElapsed) / 1000);
  clock.textContent = numberLabel(Math.floor(seconds / 60)) + ":" + numberLabel(seconds % 60);
}

function stopClock() {
  if (startedAt !== null) elapsed += performance.now() - startedAt;
  startedAt = null;
  clearInterval(interval);
  interval = null;
  start.disabled = false;
  pause.disabled = true;
  updateClock();
}

start.addEventListener("click", () => {
  startedAt = performance.now();
  interval = setInterval(updateClock, 150);
  start.disabled = true;
  pause.disabled = false;
  reset.disabled = false;
  updateClock();
});
pause.addEventListener("click", stopClock);
reset.addEventListener("click", () => {
  stopClock();
  elapsed = 0;
  reset.disabled = true;
  updateClock();
});

const switchReceiver = document.querySelector("#switch-receiver");
const receiverImage = document.querySelector("#receiver-image");
switchReceiver.addEventListener("click", () => {
  const showNegative = switchReceiver.getAttribute("aria-pressed") === "false";
  switchReceiver.setAttribute("aria-pressed", String(showNegative));
  switchReceiver.textContent = showNegative ? "Voltar ao pacote original" : "Ver captura do ensaio de alteração ↗";
  receiverImage.src = showNegative ? "assets/receptor-negativo.jpg" : "assets/receptor.jpg";
  receiverImage.alt = showNegative ? "Receptor local informando falha de integridade na cópia alterada" : "Receptor local exibindo os identificadores preservados dos sete componentes";
  document.querySelector("#receiver-caption").textContent = showNegative ? "Ensaio de alteração · captura do piloto local" : "Captura de apoio · receptor do piloto local";
});
