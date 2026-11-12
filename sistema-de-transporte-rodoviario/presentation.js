"use strict";

const demo = [
  { heading: "Inspeção de 2008", detail: "Localize a ponte e consulte o documento fictício de origem em Documentos.", file: "acervo.png", alt: "Acervo georreferenciado com a ponte fictícia selecionada", caption: "Captura do demonstrador público" },
  { heading: "Observação na família F04", detail: "Associe a observação à inspeção e à viga V01. Registre a região, a descrição e a referência à evidência.", file: "familias.jpg", alt: "Tela Famílias ERI, com a família F04 de observações e evidências", caption: "Famílias ERI · captura do piloto local" },
  { heading: "A mesma viga no modelo", detail: "Selecione a V01 e confira seu identificador IFC, o GlobalId.", file: "modelo.jpg", alt: "Modelo da ponte fictícia com a viga V01 destacada em verde e seus identificadores na ficha lateral", caption: "Modelo e simulação · captura do piloto local" },
  { heading: "Leituras simuladas", detail: "Reproduza a série de deslocamento do sensor virtual vinculado à V01.", file: "serie.jpg", alt: "Série temporal de deslocamento simulado da viga V01", caption: "Série de deslocamento · captura do piloto local" },
  { heading: "Exportação e recepção", detail: "Em Entregas, use Exportar e conferir no receptor. Confira se o identificador da V01 foi preservado.", file: "receptor.jpg", alt: "Tabela do receptor local com os identificadores dos sete componentes", caption: "Receptor do pacote · captura do piloto local" }
];

const slides = Array.from(document.querySelectorAll(".slide"));
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const counter = document.querySelector("#counter");
const markerList = document.querySelector("#markers");
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

function showSlide(index, updateAddress = true) {
  if (index < 0 || index >= slides.length || index === current) return;
  slides.forEach((slide, i) => {
    slide.hidden = i !== index;
    slide.classList.toggle("entering", i === index);
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

function slideFromAddress() {
  const found = slides.findIndex((slide) => "#" + slide.id === location.hash);
  showSlide(Math.max(0, found), false);
}

slideFromAddress();
window.addEventListener("hashchange", slideFromAddress);
previous.addEventListener("click", () => showSlide(current - 1));
next.addEventListener("click", () => showSlide(current + 1));

const familiesDialog = document.querySelector("#families-dialog");

document.querySelector("#show-families").addEventListener("click", () => familiesDialog.showModal());
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
  if (document.querySelector("dialog[open]") || event.target instanceof HTMLSelectElement || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  const key = event.key.toLowerCase();
  if (["arrowleft", "pageup", "arrowright", "pagedown", "home", "end", "f"].includes(key)) event.preventDefault();
  if (key === "arrowleft" || key === "pageup") showSlide(current - 1);
  if (key === "arrowright" || key === "pagedown") showSlide(current + 1);
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

const demoButtons = Array.from(document.querySelectorAll("[data-step]"));
const demoImage = document.querySelector("#demo-image");
demoButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    const step = demo[index];
    demoButtons.forEach((other, i) => other.setAttribute("aria-pressed", String(i === index)));
    document.querySelector("#demo-heading").textContent = step.heading;
    document.querySelector("#demo-detail").textContent = step.detail;
    const imagePath = "assets/" + step.file;
    demoImage.src = imagePath;
    demoImage.dataset.view = step.file.split(".")[0];
    document.querySelector("#demo-image-link").href = imagePath;
    document.querySelector("#demo-zoom").href = imagePath;
    demoImage.alt = step.alt;
    document.querySelector("#demo-caption").textContent = step.caption;
  });
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
