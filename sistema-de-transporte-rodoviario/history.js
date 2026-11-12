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
  const scene = slide.querySelector(".history-scene");
  const play = slide.querySelector(".history-sequence");
  const detailButton = slide.querySelector(".history-zoom-toggle");
  const lens = scene.querySelector(".history-lens");
  const zoom = scene.querySelector(".history-zoom");
  const zoomImage = scene.querySelector(".history-zoom-image");
  const tablet = scene.querySelector(".history-tablet");
  const tabletPhoto = tablet.querySelector(".history-tablet-photo");
  const caption = slide.querySelector(".history-visual-caption");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const defaultCaption = caption.textContent;
  const interval = 6300;

  const records = [
    {
      date: "2008-06-10", label: "10 de junho de 2008", title: "Inspeção antiga",
      detail: "O registro mais antigo do recorte documenta a viga V01 e serve de referência para as inspeções seguintes.",
      source: "Histórico de inspeções"
    },
    {
      date: "2012-09-12", label: "12 de setembro de 2012", title: "Prevenção funcional",
      detail: "A limpeza do tabuleiro e a sinalização temporária ilustram a manutenção preventiva para preservar a funcionalidade da ponte.",
      source: "Registro de intervenções", focus: [.417, .365, 2.7],
      zoomAlt: "Equipe de manutenção, vassoura e cones no tabuleiro"
    },
    {
      date: "2021-06-10", label: "10 de junho de 2021", title: "Deterioração grave da V01",
      detail: "No cenário fictício, a inspeção revela fissuras, perda de cobrimento e armadura exposta em um trecho da viga. Os sinais motivam uma avaliação estrutural.",
      source: "Histórico de inspeções", focus: [.468, .474, 3.2],
      zoomAlt: "Detalhe ilustrativo de fissuras, desplacamento e armadura exposta na viga V01"
    },
    {
      date: "2024-09-12", label: "12 de setembro de 2024", title: "Reforço com fibra de carbono",
      detail: "Após avaliação de insuficiência estrutural no cenário fictício, a V01 recebe reforço com laminados de fibra de carbono (CFRP).",
      source: "Registro de intervenções", focus: [.532, .446, 2.85],
      zoomAlt: "Detalhe ilustrativo dos laminados escuros de fibra de carbono aderidos à viga V01"
    },
    {
      date: "2026-11-06", label: "6 de novembro de 2026", title: "Inspeção e cadastro em campo",
      detail: "A equipe cadastra no ERI-OAE a observação de 2026, com a data e o vínculo à mesma viga V01 que recebeu o reforço.",
      source: "Histórico de inspeções", focus: [.512, .585, 1], tablet: true
    }
  ];

  let active = 0;
  let advance = null;
  let sweep = null;

  function positionLens() {
    const record = records[active];
    const width = scene.clientWidth;
    const height = scene.clientHeight;
    if (!record.focus || !width || !height) return;
    const [x, y, scale] = record.focus;
    const imageRatio = 1.4;
    const imageWidth = Math.max(width, height * imageRatio);
    const imageHeight = imageWidth / imageRatio;
    const focusX = (width - imageWidth) / 2 + x * imageWidth;
    const focusY = (height - imageHeight) * .53 + y * imageHeight;
    scene.style.setProperty("--lens-x", 100 * focusX / width + "%");
    scene.style.setProperty("--lens-y", 100 * focusY / height + "%");
    scene.style.setProperty("--lens-zoom", String(scale));
  }

  function closeZoom() {
    if (sweep !== null) clearTimeout(sweep);
    sweep = null;
    lens.hidden = true;
    zoom.hidden = true;
    caption.textContent = defaultCaption;
    detailButton.textContent = "Ver detalhe";
    detailButton.setAttribute("aria-expanded", "false");
  }

  function showZoom() {
    const record = records[active];
    if (!record.focus || slide.hidden) return;
    positionLens();
    tablet.hidden = !record.tablet;
    zoomImage.hidden = Boolean(record.tablet);
    if (record.tablet) {
      tabletPhoto.loading = "eager";
    } else {
      zoomImage.src = images[active].getAttribute("src");
      zoomImage.alt = record.zoomAlt;
    }
    const open = () => {
      sweep = null;
      lens.hidden = true;
      zoom.hidden = false;
      if (record.tablet) caption.textContent = "Formulário reconstituído · cenário fictício";
      detailButton.textContent = "Ver vista geral";
      detailButton.setAttribute("aria-expanded", "true");
    };
    if (motion.matches) {
      open();
    } else {
      lens.hidden = false;
      sweep = setTimeout(open, 850);
    }
  }

  function show(index) {
    closeZoom();
    active = index;
    const record = records[index];
    scene.dataset.year = record.date.slice(0, 4);
    date.dateTime = record.date;
    date.textContent = record.label;
    title.textContent = record.title;
    detail.textContent = record.detail;
    documentLabel.textContent = record.source;
    detailButton.hidden = !record.focus;
    track.style.setProperty("--history-progress", index * 20 + "%");
    steps.forEach((step, i) => step.setAttribute("aria-pressed", String(i === index)));
    images.forEach((image, i) => {
      image.classList.toggle("is-current", i === index);
      image.setAttribute("aria-hidden", String(i !== index));
    });
    if (record.focus) sweep = setTimeout(showZoom, motion.matches ? 0 : 620);
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

  detailButton.addEventListener("click", () => {
    stop();
    const wasOpen = !zoom.hidden || !lens.hidden;
    closeZoom();
    if (!wasOpen) showZoom();
  });

  steps.forEach((step, index) => {
    step.addEventListener("click", () => {
      stop();
      show(index);
    });
  });

  new ResizeObserver(positionLens).observe(scene);
  new MutationObserver(() => {
    if (slide.hidden) {
      stop();
      closeZoom();
    }
  }).observe(slide, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  track.hidden = false;
  play.hidden = false;
})();
