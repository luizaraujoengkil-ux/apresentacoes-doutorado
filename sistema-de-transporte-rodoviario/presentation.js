"use strict";

const slides = Array.from(document.querySelectorAll(".slide"));
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const counter = document.querySelector("#counter");
const markerList = document.querySelector("#markers");
const stage = document.querySelector("#stage");
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
let pendingSlide = null;
let pixelFrame = 0;
let pixelWidth = 0;
let pixelHeight = 0;

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

function sizePixels() {
  const bounds = stage.getBoundingClientRect();
  const offset = Math.max(1, Math.floor(-bounds.top));
  pixelWidth = Math.max(0, Math.floor(bounds.width) - 2);
  pixelHeight = Math.max(0, Math.floor(Math.min(bounds.height - offset - 1, innerHeight - bounds.top - offset)));
  if (!pixelWidth || !pixelHeight) return false;
  const scale = Math.min(devicePixelRatio || 1, 1.5);
  pixelCanvas.style.width = pixelWidth + "px";
  pixelCanvas.style.height = pixelHeight + "px";
  pixelCanvas.style.top = offset + "px";
  pixelCanvas.width = Math.round(pixelWidth * scale);
  pixelCanvas.height = Math.round(pixelHeight * scale);
  pixelContext.setTransform(scale, 0, 0, scale, 0, 0);
  return true;
}

function drawPixels(phase, reveal, direction) {
  pixelContext.clearRect(0, 0, pixelWidth, pixelHeight);
  const tile = Math.max(12, Math.min(21, Math.round(pixelWidth / 82)));
  const columns = Math.ceil(pixelWidth / tile);
  const rows = Math.ceil(pixelHeight / tile);
  const accents = ["#76dfd7", "#45b9bb", "#248b99", "#edbc83"];
  const base = ["#102633", "#112934", "#132b38", "#152e3b"];
  const clamp = value => Math.min(1, Math.max(0, value));
  const sweep = phase * 1.47;
  for (let column = 0; column < columns; column++) {
    const along = (direction > 0 ? column : columns - 1 - column) / columns;
    for (let row = 0; row < rows; row++) {
      let seed = Math.imul(column + 1, 0x9e3779b1) ^ Math.imul(row + 1, 0x85ebca77);
      seed = Math.imul(seed ^ (seed >>> 16), 0x7feb352d);
      seed = (seed ^ (seed >>> 15)) >>> 0;
      const jitter = ((seed % 29) - 14) / 168;
      const offset = .09 + along * .95 + (row / rows - .5) * .10 + jitter;
      const local = clamp((sweep - offset) / .31);
      const amount = reveal ? 1 - local : local;
      if (amount <= 0) continue;
      const eased = amount * amount * (3 - 2 * amount);
      const edge = amount < .97 && seed % 4 !== 0;
      const side = (tile + .55) * eased;
      const drift = edge ? (1 - eased) * (seed % 5 - 2) : 0;
      pixelContext.fillStyle = edge ? accents[seed % 17 === 0 ? 3 : seed % 3] : base[seed % base.length];
      pixelContext.fillRect(column * tile + (tile - side) * .5 + drift,
        row * tile + (tile - side) * .5, side, side);
    }
  }
}

function stopPixels(commitPending = false) {
  cancelAnimationFrame(pixelFrame);
  pixelFrame = 0;
  const pending = pendingSlide;
  pendingSlide = null;
  if (pixelCanvas) pixelCanvas.hidden = true;
  if (commitPending && pending) renderSlide(pending.index, true, false);
}

function showSlide(index) {
  if (index < 0 || index >= slides.length) return;
  if (pendingSlide) {
    if (index === current) stopPixels();
    else pendingSlide.index = index;
    return;
  }
  if (index === current) return;
  if (!pixelContext || motionPreference.matches || document.hidden || !sizePixels()) {
    stopPixels();
    renderSlide(index, true, !motionPreference.matches);
    return;
  }

  stopPixels();
  pendingSlide = { index };
  pixelCanvas.hidden = false;
  const direction = index > current ? 1 : -1;
  const started = performance.now();
  const coverTime = 230;
  const revealTime = 345;
  function draw(now) {
    const elapsed = now - started;
    if (elapsed < coverTime) {
      drawPixels(Math.max(0, elapsed / coverTime), false, direction);
    } else {
      if (pendingSlide) {
        if (document.querySelector("dialog[open]")) {
          stopPixels();
          return;
        }
        const target = pendingSlide.index;
        pendingSlide = null;
        renderSlide(target, true, false);
        if (!sizePixels()) {
          stopPixels();
          return;
        }
      }
      const reveal = (elapsed - coverTime) / revealTime;
      if (reveal >= 1) {
        stopPixels();
        return;
      }
      drawPixels(reveal, true, direction);
    }
    pixelFrame = requestAnimationFrame(draw);
  }
  pixelFrame = requestAnimationFrame(draw);
}

function moveSlide(delta) {
  showSlide((pendingSlide?.index ?? current) + delta);
}

motionPreference.addEventListener("change", () => { if (motionPreference.matches) stopPixels(true); });
document.addEventListener("visibilitychange", () => { if (document.hidden) stopPixels(true); });
window.addEventListener("resize", () => { if (pixelFrame) stopPixels(true); });

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
