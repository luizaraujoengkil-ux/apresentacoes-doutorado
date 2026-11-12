(() => {
  "use strict";

  // Text strings become text nodes. Array entries highlight real controls in the public demonstrator.
  const guide = [
    {
      title: "Localize a ponte",
      instruction: ["Em ", ["Visão geral"], ", selecione ", ["ERI-DEMO-001"], " no mapa ou na lista. Clique em ", ["Abrir cadastro"], "."],
      purpose: "Encontrar a obra pelo mapa ou pelo código e entrar no cadastro certo antes de consultar ou preencher os dados.",
      file: "tutorial-01-acervo.jpg", target: "Abrir cadastro", box: [950, 538, 291, 41],
      alt: "Mapa do acervo com a Ponte Demonstrativa IME selecionada e o botão Abrir cadastro no cartão da obra"
    },
    {
      title: "Consulte o histórico",
      instruction: ["No cadastro, abra ", ["Histórico"], ". Para incluir uma inspeção de teste, use ", ["Registrar evento"], " e associe a viga V01. Consulte ", ["Documentos"], " para localizar a fonte."],
      purpose: "Manter inspeções e intervenções ligadas à data, ao componente e à evidência de origem.",
      file: "tutorial-02-historico.jpg", target: "Registrar evento", box: [1045, 437, 164, 40],
      alt: "Aba Histórico da Ponte Demonstrativa IME, com a linha do tempo e o botão Registrar evento"
    },
    {
      title: "Abra a família F04",
      instruction: ["Em ", ["Famílias ERI"], ", selecione ", ["F04"], " e escolha um registro da V01. Use ", ["Conectar dados de origem"], " para reaproveitar o cadastro. Após editar, clique em ", ["Salvar instância"], "."],
      purpose: "Transformar a observação de campo em dados estruturados, com vínculo à inspeção, à viga e à evidência.",
      file: "tutorial-03-familias.jpg", target: "Família F04", box: [56, 272, 375, 177],
      alt: "As nove famílias de informação com a F04, Observações, anomalias, evidências e ensaios, selecionada"
    },
    {
      title: "Verifique o preenchimento",
      instruction: ["Em ", ["Famílias ERI"], ", clique em ", ["Verificar famílias"], ". Na aba ", ["Validação"], ", selecione ", ["Executar verificação"], " e consulte o resultado da F04."],
      purpose: "Identificar pendências de preenchimento e de estrutura antes da entrega. A análise da condição da ponte é uma etapa técnica.",
      file: "tutorial-04-validacao.jpg", target: "Executar verificação", box: [1019, 497, 191, 40],
      alt: "Aba Validação do cadastro com a seção Qualidade da informação e o botão Executar verificação"
    },
    {
      title: "Encontre a V01 no modelo",
      instruction: ["Em ", ["Modelo e simulação"], ", escolha a ", ["V01"], " em ", ["Componente selecionado"], " e confira o ", ["GlobalId IFC"], ". Mais abaixo, use ", ["Reproduzir"], " para ver a série de leituras simuladas."],
      purpose: "Reconhecer a mesma viga no modelo BIM e associá-la aos registros do cadastro e às leituras demonstrativas.",
      file: "tutorial-05-modelo.jpg", target: "Componente selecionado", box: [913, 515, 272, 40],
      alt: "Tela Modelo e acompanhamento com a viga V01 selecionada e destacada na visualização 3D"
    },
    {
      title: "Exporte e confira o pacote",
      instruction: ["Em ", ["Entregas"], ", vá até ", ["Exportar e conferir no receptor"], ". Confira no receptor se os componentes e as leituras mantiveram seus vínculos."],
      purpose: "Levar o dossiê atualizado junto com o IFC de referência e verificar se os vínculos foram preservados no pacote.",
      file: "tutorial-06-entregas.jpg", target: "Exportar e conferir no receptor", box: [85, 340, 225, 40],
      alt: "Seção de entrega do protótipo com a opção Exportar e conferir no receptor"
    }
  ];

  const slide = document.querySelector("#prototipo");
  const region = slide.querySelector(".tutorial");
  const panel = region.querySelector(".tutorial-panel");
  const tabs = Array.from(region.querySelectorAll("[data-tutorial-step]"));
  const previous = region.querySelector("#tutorial-prev");
  const next = region.querySelector("#tutorial-next");
  const preview = region.querySelector(".tutorial-preview");
  const image = preview.querySelector("img");
  const hotspot = preview.querySelector(".tutorial-hotspot");
  const hint = region.querySelector(".tutorial-hint");
  const targetLabel = region.querySelector("#tutorial-target-text");
  const status = region.querySelector("#tutorial-announcement");
  const dialog = document.querySelector("#tutorial-dialog");
  const dialogHeading = dialog.querySelector("#tutorial-dialog-title");
  const largeImage = dialog.querySelector("#tutorial-large-image");
  const largeHotspot = dialog.querySelector(".tutorial-hotspot");
  const number = i => String(i).padStart(2, "0");
  const asset = step => "assets/" + step.file;
  let current = 0;
  let showHint = true;
  let warmed = false;
  let zoomTrigger;

  function setHotspot(el, box) {
    const [x, y, width, height] = box;
    el.style.setProperty("--spot-x", (x * 100 / 1265) + "%");
    el.style.setProperty("--spot-y", (y * 100 / 711) + "%");
    el.style.setProperty("--spot-w", (width * 100 / 1265) + "%");
    el.style.setProperty("--spot-h", (height * 100 / 711) + "%");
  }

  function setInstruction(parts) {
    region.querySelector("#tutorial-instruction").replaceChildren(...parts.map(part => {
      if (!Array.isArray(part)) return document.createTextNode(part);
      const strong = document.createElement("strong");
      strong.textContent = part[0];
      return strong;
    }));
  }

  function applyHint() {
    hint.setAttribute("aria-pressed", String(showHint));
    hotspot.hidden = !showHint || !image.complete || image.naturalWidth === 0;
    targetLabel.textContent = (showHint ? "Em destaque: " : "Controle indicado: ") + guide[current].target;
    if (!hotspot.hidden) {
      hotspot.classList.remove("glow");
      void hotspot.offsetWidth;
      hotspot.classList.add("glow");
    }
  }

  function showStep(index, animate = true) {
    const step = guide[index];
    if (!step || (animate && index === current)) return;
    const forward = index > current;
    current = index;
    tabs.forEach((tab, i) => tab.setAttribute("aria-pressed", String(i === current)));
    previous.disabled = current === 0;
    next.disabled = current === guide.length - 1;
    region.querySelector("#tutorial-kicker").textContent = "Etapa " + number(current + 1) + " de " + number(guide.length);
    region.querySelector("#tutorial-heading").textContent = step.title;
    setInstruction(step.instruction);
    region.querySelector("#tutorial-purpose").textContent = step.purpose;
    image.alt = step.alt;
    preview.setAttribute("aria-label", "Ampliar imagem: " + step.title);
    image.src = asset(step);
    setHotspot(hotspot, step.box);
    applyHint();
    if (animate) {
      status.textContent = "Etapa " + (current + 1) + " de " + guide.length + ": " + step.title;
      panel.classList.remove("is-entering");
      void panel.offsetWidth;
      panel.style.setProperty("--tutorial-shift", forward ? "7px" : "-7px");
      panel.classList.add("is-entering");
    }
  }

  function go(delta) {
    const wasFocused = document.activeElement;
    showStep(current + delta);
    if (wasFocused === previous && previous.disabled) next.focus();
    if (wasFocused === next && next.disabled) previous.focus();
  }

  function warmImages() {
    if (slide.hidden || warmed) return;
    warmed = true;
    guide.slice(1).forEach(step => {
      const preload = new Image();
      preload.src = asset(step);
    });
  }

  tabs.forEach(tab => tab.addEventListener("click", () => showStep(Number(tab.dataset.tutorialStep))));
  previous.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  region.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const stepTab = event.target.closest("[data-tutorial-step]");
    go(event.key === "ArrowLeft" ? -1 : 1);
    if (stepTab) tabs[current].focus();
  });
  image.addEventListener("load", applyHint);
  hint.addEventListener("click", () => { showHint = !showHint; applyHint(); });
  function openZoom(event) {
    zoomTrigger = event.currentTarget;
    const step = guide[current];
    dialogHeading.textContent = "Etapa " + number(current + 1) + " · " + step.title;
    largeImage.src = asset(step);
    largeImage.alt = step.alt;
    dialog.querySelector("#tutorial-large-target").textContent = "Controle indicado: " + step.target;
    setHotspot(largeHotspot, step.box);
    largeHotspot.hidden = !showHint;
    dialog.showModal();
  }
  preview.addEventListener("click", openZoom);
  region.querySelector(".tutorial-zoom").addEventListener("click", openZoom);
  dialog.addEventListener("close", () => zoomTrigger?.focus());
  new MutationObserver(warmImages).observe(slide, { attributes: true, attributeFilter: ["hidden"] });
  showStep(0, false);
  warmImages();
})();
