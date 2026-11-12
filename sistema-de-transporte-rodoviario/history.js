(() => {
  "use strict";

  const slide = document.querySelector("#historico");
  const track = slide.querySelector(".history-track");
  const steps = Array.from(track.querySelectorAll("[data-history-step]"));
  const images = Array.from(slide.querySelectorAll("[data-history-image]"));
  const date = slide.querySelector(".history-date");
  const title = slide.querySelector(".history-record h3");
  const detail = slide.querySelector(".history-detail");
  const documentLabel = slide.querySelector(".history-record dd");
  const pin = slide.querySelector(".history-pin");
  const scene = slide.querySelector(".history-scene");
  const play = slide.querySelector(".history-play");

  const records = [
    {
      date: "2008-06-10", label: "10 de junho de 2008", title: "Inspeção antiga",
      detail: "O registro mais antigo do recorte documenta a viga V01 e serve de referência para as inspeções seguintes.",
      source: "Histórico de inspeções"
    },
    {
      date: "2012-09-12", label: "12 de setembro de 2012", title: "Manutenção preventiva",
      detail: "O serviço preventivo entra no histórico da ponte. O registro conserva a data e a ligação com a viga V01.",
      source: "Registro de intervenções"
    },
    {
      date: "2021-06-10", label: "10 de junho de 2021", title: "Inspeção intermediária",
      detail: "A vista ilustra manchas, fissuras e pequenos desplacamentos no concreto da V01. A inspeção acrescenta um novo registro à trajetória da viga.",
      source: "Histórico de inspeções", pin: "Sinais no concreto"
    },
    {
      date: "2024-09-12", label: "12 de setembro de 2024", title: "Reforço da viga V01",
      detail: "O reforço fica registrado como intervenção. A imagem mostra a aparência ilustrativa do trecho após o serviço.",
      source: "Registro de intervenções", pin: "Trecho reforçado"
    },
    {
      date: "2026-11-06", label: "6 de novembro de 2026", title: "Inspeção recente",
      detail: "A nova observação da V01 volta ao mesmo histórico e pode ser consultada junto da intervenção de 2024.",
      source: "Histórico de inspeções", pin: "Observação da V01"
    }
  ];

  let active = 0;
  let advance = null;
  const interval = 4300;

  function show(index) {
    active = index;
    const record = records[index];
    scene.dataset.year = record.date.slice(0, 4);
    date.dateTime = record.date;
    date.textContent = record.label;
    title.textContent = record.title;
    detail.textContent = record.detail;
    documentLabel.textContent = record.source;
    pin.hidden = !record.pin;
    pin.querySelector("span").textContent = record.pin || "";
    track.style.setProperty("--history-progress", index * 20 + "%");
    steps.forEach((step, i) => step.setAttribute("aria-pressed", String(i === index)));
    images.forEach((image, i) => {
      image.classList.toggle("is-current", i === index);
      image.setAttribute("aria-hidden", String(i !== index));
    });
  }

  function stop() {
    if (advance !== null) clearInterval(advance);
    advance = null;
    play.textContent = "Reproduzir evolução";
  }

  play.addEventListener("click", () => {
    if (advance !== null) {
      stop();
      return;
    }
    if (active === records.length - 1) show(0);
    play.textContent = "Pausar evolução";
    advance = setInterval(() => {
      show(active + 1);
      if (active === records.length - 1) stop();
    }, interval);
  });

  steps.forEach((step, index) => {
    step.addEventListener("click", () => {
      stop();
      show(index);
    });
  });

  new MutationObserver(() => {
    if (slide.hidden) stop();
  }).observe(slide, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  track.hidden = false;
  play.hidden = false;
})();
