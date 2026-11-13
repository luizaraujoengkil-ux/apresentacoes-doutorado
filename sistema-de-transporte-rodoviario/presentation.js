"use strict";

const slides = Array.from(document.querySelectorAll(".slide"));
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const counter = document.querySelector("#counter");
const markerList = document.querySelector("#markers");
const stage = document.querySelector("#stage");
const paper = document.querySelector("#slide-paper");
const pixelCanvas = document.querySelector("#slide-pixels");
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

function showPaper(slide) {
  const surface = ensurePaperSurface();
  if (!surface) return false;
  const copy = slide.cloneNode(true);
  copy.classList.remove("entering");
  // Reuse already loaded sources for the brief visual copy; it has no interactive behavior.
  copy.querySelectorAll('img[loading="lazy"]').forEach(image => image.removeAttribute("loading"));
  const caption = document.createElement("span");
  caption.className = "paper-caption";
  caption.textContent = "Registro analógico  /  " + numberLabel(current + 1);
  surface.replaceChildren(copy, caption);
  paper.style.clipPath = "";
  paper.hidden = false;
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

const clampPixel = (value, max) => Math.max(0, Math.min(max, value));

function drawScan(progress, direction) {
  const unit = Math.max(10, Math.min(18, Math.round(pixelWidth / 78)));
  const height = paper.offsetHeight;
  const rows = Math.max(1, Math.ceil(height / unit));
  const sign = direction > 0 ? 1 : -1;
  const leading = -unit * 6 + (pixelWidth + unit * 12) * progress;
  const paperEdge = sign > 0 ? "100%" : "0";
  const polygon = [paperEdge + " 0"];
  pixelContext.clearRect(0, 0, pixelWidth, pixelHeight);

  for (let row = 0; row < rows; row++) {
    let seed = Math.imul(row + 1, 0x85ebca77);
    seed = Math.imul(seed ^ (seed >>> 16), 0x7feb352d);
    seed = (seed ^ (seed >>> 15)) >>> 0;
    const offset = ((seed % 9) - 4) * unit;
    const boundary = clampPixel(Math.round((leading + offset) / unit) * unit, pixelWidth);
    const x = sign > 0 ? boundary : pixelWidth - boundary;
    const y = row * unit;
    polygon.push(x + "px " + y + "px", x + "px " + Math.min(height, y + unit) + "px");
    if (boundary === 0 || boundary === pixelWidth || y + unit < pixelOffset || y > pixelOffset + pixelHeight) continue;
    const paintY = y - pixelOffset;
    pixelContext.fillStyle = seed % 7 === 0 ? "#dabc92" : "#77dcd6";
    pixelContext.globalAlpha = .67 + (seed % 3) * .11;
    pixelContext.fillRect(x - (sign > 0 ? unit : 0), paintY, unit, unit);
    if (seed % 4 !== 0) {
      const tail = Math.max(2, Math.round(unit * (.28 + (seed % 4) * .12)));
      pixelContext.fillStyle = "#51acae";
      pixelContext.globalAlpha = .56;
      pixelContext.fillRect(x - sign * (unit * (1 + seed % 3)) - tail / 2, paintY + (unit - tail) / 2, tail, tail);
    }
  }
  pixelContext.globalAlpha = 1;
  polygon.push(paperEdge + " 100%");
  paper.style.clipPath = "polygon(" + polygon.join(",") + ")";
}

function stopPixels() {
  cancelAnimationFrame(pixelFrame);
  pixelFrame = 0;
  pixelCanvas.hidden = true;
  paper.hidden = true;
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

  const started = performance.now();
  const hold = 820;
  const duration = 1480;
  const direction = index > from ? 1 : -1;
  function draw(now) {
    const time = Math.max(0, now - started);
    if (time >= hold + duration || document.querySelector("dialog[open]")) {
      stopPixels();
      return;
    }
    if (time >= hold) {
      pixelCanvas.hidden = false;
      drawScan((time - hold) / duration, direction);
    }
    pixelFrame = requestAnimationFrame(draw);
  }
  pixelFrame = requestAnimationFrame(draw);
}

function moveSlide(delta) {
  showSlide(current + delta);
}

motionPreference.addEventListener("change", () => { if (motionPreference.matches) stopPixels(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) stopPixels(); });
window.addEventListener("resize", () => { if (pixelFrame) stopPixels(); });
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
