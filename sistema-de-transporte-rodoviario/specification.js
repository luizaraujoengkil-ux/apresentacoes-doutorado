(() => {
  "use strict";
  const slide = document.querySelector("#especificacao");
  const stage = slide.querySelector(".spec-stage");
  const steps = Array.from(slide.querySelectorAll("[data-spec-step]"));
  const panels = Array.from(stage.querySelectorAll("[data-spec-panel]"));
  const catalog = document.querySelector("#spec-catalog");
  const catalogTitle = catalog.querySelector("#spec-catalog-title");
  const familyFilter = catalog.querySelector("#spec-filter-family");
  const search = catalog.querySelector("#spec-filter-query");
  const count = catalog.querySelector("#spec-count");
  const results = catalog.querySelector("#spec-results");
  const modes = Array.from(catalog.querySelectorAll("[data-catalog-mode]"));
  const requiredLabels = {
    obrigatorio: "Obrigatório", condicional: "Condicional",
    condicional_na_reabilitacao: "Condicional na reabilitação",
    condicional_quando_aplicavel: "Condicional, quando aplicável",
    condicional_quando_BIM: "Condicional, quando há uso de BIM",
    obrigatorio_apos_primeira_versao: "Obrigatório após a primeira versão",
    obrigatorio_no_contexto_DNIT: "Obrigatório no contexto DNIT",
    obrigatorio_no_encerramento: "Obrigatório no encerramento",
    obrigatorio_para_autorizacao: "Obrigatório para autorização",
    obrigatorio_quando_aplicavel: "Obrigatório quando aplicável",
    obrigatorio_quando_fotografia: "Obrigatório quando há fotografia",
    obrigatorio_quando_validada: "Obrigatório quando validada",
    recomendado_manual_DNIT: "Recomendado pelo manual DNIT",
    proposto_ERI_OAE: "Proposto pela ERI-OAE"
  };
  const feature = "ERI-IPR709-004";
  const presentation = slide.querySelector(".spec-presentation");
  const caption = presentation.querySelector(".spec-scene-caption");
  const play = slide.querySelector(".spec-play");
  const playIcon = play.querySelector(".spec-play-icon");
  const playLabel = play.querySelector(".spec-play-label");
  const stepText = slide.querySelector(".spec-journey-step");
  const journeyNav = Array.from(slide.querySelectorAll("[data-spec-move]"));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const stepDuration = 8000;
  const narration = {
    families: "A observação de campo entra na família F04, com vínculo à inspeção de origem.",
    requirements: "A fonte orienta o requisito: caracterizar o dano e registrar sua condição.",
    fields: "O requisito se desdobra em campos separados, com valores e regras de preenchimento.",
    exchange: "O dossiê e o modelo identificam a mesma viga. A chave é o GlobalId:"
  };
  let currentStep = 0;
  let elapsed = 0;
  let previousTick;
  let animationFrame;
  let playing = false;
  let tourStarted = false;
  let completed = false;

  let mode = "requirements";
  let linkedRequirement = null;
  let trigger;
  let data;
  let families;
  let requirements;

  function node(tag, value, className) {
    const el = document.createElement(tag);
    if (value !== undefined) el.textContent = value;
    if (className) el.className = className;
    return el;
  }

  function progress() {
    if (!reducedMotion.matches) {
      steps[currentStep].style.setProperty("--spec-progress", Math.min(1, elapsed / stepDuration));
    }
  }

  function updateGuide() {
    playIcon.textContent = playing ? "Ⅱ" : completed ? "↻" : "▶";
    playLabel.textContent = playing ? "Pausar percurso" : completed ? "Repetir percurso" : tourStarted ? "Retomar percurso" : "Acompanhar V01";
    stepText.textContent = (currentStep + 1) + " de " + steps.length;
    journeyNav[0].disabled = currentStep === 0;
    journeyNav[1].disabled = currentStep === steps.length - 1;
    steps.forEach((button, i) => {
      button.classList.toggle("spec-passed", i < currentStep || (i === currentStep && completed));
      if (i !== currentStep || reducedMotion.matches) button.style.removeProperty("--spec-progress");
    });
    progress();
  }

  function setStep(step, focus = false) {
    const index = steps.findIndex(button => button.dataset.specStep === step);
    if (index < 0) return;
    currentStep = index;
    steps.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    panels.forEach(panel => { panel.hidden = panel.dataset.specPanel !== step; });
    presentation.dataset.specCurrent = step;
    caption.textContent = narration[step];
    if (step === "exchange") caption.append(node("code", "0ie0zF$y5VRQbchodvwdxV"));
    updateGuide();
    if (focus) steps[index].focus();
  }

  function pauseGuide() {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(animationFrame);
    previousTick = undefined;
    updateGuide();
  }

  function manualStep(step, focus = false) {
    pauseGuide();
    elapsed = 0;
    tourStarted = false;
    completed = false;
    setStep(step, focus);
  }

  function tick(time) {
    if (!playing) return;
    if (previousTick !== undefined) elapsed += time - previousTick;
    previousTick = time;
    if (elapsed >= stepDuration) {
      if (currentStep === steps.length - 1) {
        completed = true;
        pauseGuide();
        return;
      }
      elapsed = 0;
      setStep(steps[currentStep + 1].dataset.specStep);
    }
    progress();
    animationFrame = requestAnimationFrame(tick);
  }

  play.addEventListener("click", () => {
    if (playing) {
      pauseGuide();
      return;
    }
    if (completed || !tourStarted) {
      completed = false;
      elapsed = 0;
      setStep(steps[0].dataset.specStep);
    }
    tourStarted = true;
    playing = true;
    updateGuide();
    animationFrame = requestAnimationFrame(tick);
  });
  steps.forEach(button => button.addEventListener("click", () => manualStep(button.dataset.specStep)));
  journeyNav.forEach(button => button.addEventListener("click", () => {
    const target = steps[currentStep + Number(button.dataset.specMove)];
    if (target) {
      manualStep(target.dataset.specStep);
      if (button.disabled) (journeyNav.find(control => !control.disabled) || play).focus();
    }
  }));
  slide.querySelectorAll("[data-spec-go]").forEach(button =>
    button.addEventListener("click", () => manualStep(button.dataset.specGo, true))
  );
  slide.querySelectorAll("[data-open-catalog]").forEach(button =>
    button.addEventListener("click", () => openCatalog(button.dataset.openCatalog, "", button, button.dataset.catalogId))
  );
  new MutationObserver(() => { if (slide.hidden) pauseGuide(); }).observe(slide, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGuide(); });
  reducedMotion.addEventListener("change", updateGuide);

  function normalize(s) {
    return (s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  }

  function line(container, label, text) {
    if (!text) return;
    const p = node("p");
    p.append(node("strong", label + ": "), document.createTextNode(text));
    container.append(p);
  }

  function renderCatalog() {
    const isField = mode === "fields";
    const query = normalize(search.value.trim());
    const filter = familyFilter.value;
    const family = families.get(filter);
    const source = isField ? data.fields : data.requirements;
    const selected = source.filter(item =>
      (!filter || item.family === filter) &&
      (!isField || !linkedRequirement || item.requirements.includes(linkedRequirement)) &&
      (!query || normalize([item.id, item.title, item.name, item.source].filter(Boolean).join(" ")).includes(query))
    );
    const unit = isField ? (selected.length === 1 ? "campo" : "campos") : (selected.length === 1 ? "requisito" : "requisitos");
    count.textContent = selected.length + " " + unit + (linkedRequirement ? " · requisito de origem: " + linkedRequirement : "");
    catalogTitle.textContent = family ? family.id + " · " + family.title : "Explorar a ERI-OAE";
    modes.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.catalogMode === mode)));

    const list = document.createDocumentFragment();
    if (linkedRequirement) {
      const clear = node("button", "Limpar vínculo · ver todos os campos", "spec-action secondary");
      clear.type = "button";
      clear.addEventListener("click", () => {
        linkedRequirement = null;
        renderCatalog();
        modes.find(button => button.dataset.catalogMode === mode)?.focus();
      });
      list.append(clear);
    }
    if (!selected.length) list.append(node("p", "Nenhum registro encontrado. Tente outro termo ou outra família.", "spec-note"));

    selected.forEach(item => {
      const detail = node("details");
      const title = node("summary");
      title.append(node("span", item.id, "spec-kicker"), document.createTextNode(item.title));
      const body = node("div", undefined, "spec-result-body");
      line(body, "Família", item.family + " · " + families.get(item.family).title);
      if (isField) {
        line(body, "Tipo de dado", item.type);
        line(body, "Preenchimento", requiredLabels[item.required] || item.required);
        line(body, "Unidade ou domínio", item.domain);
        line(body, "Regra de aceite", item.acceptance);
        line(body, "Requisitos de origem", item.requirements.join(", "));
      } else {
        line(body, "Base de referência", item.source);
        line(body, "Evidências na matriz", item.evidence.join(", "));
        const links = data.fields.filter(field => field.requirements.includes(item.id));
        const cross = links.filter(field => field.family !== item.family).length;
        if (cross) line(body, "Vínculo transversal", cross + (cross === 1 ? " campo está" : " campos estão") + " em outra família.");
        const explore = node("button", "Ver " + links.length + (links.length === 1 ? " campo vinculado" : " campos vinculados") + " →", "spec-action secondary");
        explore.type = "button";
        explore.addEventListener("click", () => {
          mode = "fields";
          linkedRequirement = item.id;
          familyFilter.value = "";
          search.value = "";
          renderCatalog();
          modes.find(button => button.dataset.catalogMode === mode)?.focus();
        });
        body.append(explore);
      }
      detail.append(title, body);
      list.append(detail);
    });
    results.replaceChildren(list);
    results.scrollTop = 0;
  }

  function openCatalog(type, family, source, id = "") {
    if (!data) return;
    pauseGuide();
    mode = type;
    linkedRequirement = null;
    familyFilter.value = family;
    search.value = id;
    trigger = source;
    renderCatalog();
    catalog.showModal();
    const detail = id && results.querySelector("details");
    if (detail) {
      detail.open = true;
      detail.querySelector("summary").focus();
    } else {
      modes.find(button => button.dataset.catalogMode === type)?.focus();
    }
  }

  modes.forEach(button => button.addEventListener("click", () => {
    mode = button.dataset.catalogMode;
    linkedRequirement = null;
    search.value = "";
    renderCatalog();
  }));
  familyFilter.addEventListener("change", renderCatalog);
  search.addEventListener("input", renderCatalog);
  catalog.addEventListener("close", () => trigger?.focus());

  const dataUrl = new URL("assets/especificacao-eri-oae.json", document.currentScript.src);
  fetch(dataUrl).then(response => {
    if (!response.ok) throw new Error("Catálogo indisponível");
    return response.json();
  }).then(payload => {
    data = payload;
    families = new Map(data.families.map(family => [family.id, family]));
    requirements = new Map(data.requirements.map(req => [req.id, req]));
    const featured = requirements.get(feature);
    slide.querySelector("#spec-requirement-kicker").textContent = featured.family + " · " + featured.id + " · " + featured.source;
    slide.querySelector("#spec-requirement-title").textContent = featured.title;
    slide.querySelector("#spec-requirement-context").textContent = "Na viga V01, o requisito se traduz em um registro associado à inspeção, ao elemento, à região observada e à descrição da anomalia.";

    const exampleValues = [
      ["ERI-F04-002", "Inspeção de 06/11/2026"],
      ["ERI-F04-003", "Viga longitudinal V01"],
      ["ERI-F04-004", "Face inferior, no meio do vão"],
      ["ERI-F04-018", "Fissura transversal"]
    ];
    const fieldsById = new Map(data.fields.map(field => [field.id, field]));
    exampleValues.forEach(([id, value], i) => {
      const field = fieldsById.get(id);
      const entry = node("div");
      entry.style.setProperty("--i", i);
      const term = node("dt", field.title);
      term.prepend(node("span", id, "spec-kicker spec-field-code"));
      const definition = node("dd", value);
      const rule = node("button", "Ver regra ↗", "spec-field-rule");
      rule.type = "button";
      rule.setAttribute("aria-label", "Ver regra: " + field.title);
      rule.addEventListener("click", () => openCatalog("fields", field.family, rule, id));
      definition.append(rule);
      entry.append(term, definition);
      slide.querySelector("#spec-examples").append(entry);
    });

    const all = node("option", "Todas as famílias");
    all.value = "";
    familyFilter.append(all);
    data.families.forEach((family, i) => {
      const option = node("option", family.id + " · " + family.title);
      option.value = family.id;
      familyFilter.append(option);
      const reqs = data.requirements.filter(req => req.family === family.id).length;
      const fields = data.fields.filter(field => field.family === family.id).length;
      const card = node("button", undefined, "spec-family");
      card.type = "button";
      card.style.setProperty("--i", i);
      if (family.id === "F04") card.classList.add("is-example");
      const description = node("span");
      description.append(node("strong", family.title), node("small", reqs + " requisitos · " + fields + " campos"));
      const arrow = node("span", "↗", "spec-arrow");
      arrow.setAttribute("aria-hidden", "true");
      card.append(node("span", family.id, "spec-family-code"), description, arrow);
      card.addEventListener("click", () => openCatalog("requirements", family.id, card));
      slide.querySelector("#spec-families").append(card);
    });
  }).catch(() => {
    slide.querySelector(".spec-error").hidden = false;
    slide.querySelectorAll("[data-open-catalog]").forEach(button => { button.disabled = true; });
  }).finally(() => stage.removeAttribute("aria-busy"));
})();
