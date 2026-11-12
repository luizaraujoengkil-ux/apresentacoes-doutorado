"use strict";

const notes = [
  ["0min25s", "Apresente o título e os autores. Na projeção, acompanhe a imagem da ponte se transformar na representação BIM e observe como a viga V01 leva aos dados vinculados. O artigo especifica como preservar esse vínculo entre o modelo IFC e o dossiê de inspeções e intervenções."],
  ["0min55s", "Comece pela viga V01. A inspeção de 2008, o reforço de 2024 e a inspeção de 2026 se referem ao mesmo componente. O problema é reconhecer esse vínculo quando os documentos são produzidos em épocas e formatos diferentes. O cenário é inteiramente fictício."],
  ["0min50s", "Resuma a base em uma frase por bloco. A literatura ajudou a situar o problema de integrar registros e modelos. As fontes brasileiras orientaram quais informações registrar. As referências de gestão e troca ajudaram a definir como organizar a entrega."],
  ["1min20s", "Explique o percurso da fonte ao campo. A leitura registrou origem, escopo e aplicabilidade. Na periodicidade de inspeção, o artigo preservou os regimes associados à ABNT NBR 9452 e ao procedimento DNIT, com origem e justificativa. Mostre o resultado em campos de fonte, jurisdição, responsável e data-limite. Os 50 requisitos incluem 41 com suporte direto, 7 inferências e 2 proposições."],
  ["1min05s", "Leia os números na ordem da explicação. As nove famílias organizam a informação. Os 50 requisitos dizem o que deve ser registrado. Os 301 campos permitem preencher e verificar os requisitos. Use o exemplo da observação da V01. Cada observação nova reutiliza a estrutura de campos. Abra a tabela apenas se precisar mostrar as outras famílias."],
  ["0min50s", "Mostre que a implementação preserva o vínculo entre documento, evento, família e componente. No acervo legado, a equipe extrai os dados relevantes e associa o documento de origem. As famílias recebem registros contextualizados e a entrega preserva os vínculos."],
  ["3min30s", "Abra a Ponte Demonstrativa IME. Em Documentos, mostre o histórico fictício de inspeções. Em Famílias ERI, abra F04 e a observação da V01. Se for demonstrar a gravação, complemente a descrição com um texto fictício. Em Modelo e simulação, selecione V01, aponte o GlobalId e reproduza algumas leituras. Em Entregas, use Exportar e conferir no receptor. As cinco etapas deste slide servem de apoio visual."],
  ["1min20s", "Abra o pacote. O IFC 4.3 acompanha o dossiê como modelo de referência na versão pública. O JSON leva os dados editados e o CSV leva tabelas e leituras simuladas. O mesmo componente pode ser reconhecido pelo GlobalId. Leitores IFC, sistemas de gestão e plataformas de gêmeos digitais consomem partes diferentes do pacote. A integração com um destino externo requer mapeamento e teste específico."],
  ["0min45s", "Mostre a recepção do pacote original e a detecção de uma alteração na cópia. Na versão pública foram 56 controles de integridade e vínculos, com sete componentes e 24 leituras. As capturas de apoio são do piloto local. O ensaio verificou o intercâmbio em cenário fictício."],
  ["1min00s", "Volte à mesma viga. Um histórico rastreável ajuda a planejar a manutenção preventiva e a investigar causas recorrentes numa abordagem proativa. As leituras simuladas demonstram o vínculo com o modelo. Manutenção preditiva e gêmeos digitais operacionais exigem instrumentação real, séries confiáveis, modelos de análise e validação em campo."]
];

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

const notesDialog = document.querySelector("#notes-dialog");
const familiesDialog = document.querySelector("#families-dialog");

function openNotes() {
  const [duration, script] = notes[current];
  document.querySelector("#notes-meta").textContent = "Slide " + (current + 1) + " · " + duration;
  document.querySelector("#notes-text").textContent = script;
  notesDialog.showModal();
}

document.querySelector("#notes").addEventListener("click", openNotes);
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
  if (notesDialog.open || familiesDialog.open || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  const key = event.key.toLowerCase();
  if (["arrowleft", "pageup", "arrowright", "pagedown", "home", "end", "f", "n"].includes(key)) event.preventDefault();
  if (key === "arrowleft" || key === "pageup") showSlide(current - 1);
  if (key === "arrowright" || key === "pagedown") showSlide(current + 1);
  if (key === "home") showSlide(0);
  if (key === "end") showSlide(slides.length - 1);
  if (key === "f" && !fullscreenButton.disabled) toggleFullscreen();
  if (key === "n") openNotes();
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
