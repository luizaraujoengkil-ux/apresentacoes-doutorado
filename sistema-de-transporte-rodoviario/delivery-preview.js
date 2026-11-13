(() => {
  "use strict";

  const download = document.querySelector("#delivery-download");
  const replay = document.querySelector("#delivery-replay");
  const hint = document.querySelector("#delivery-hint");
  const dialog = document.querySelector("#delivery-preview");
  if (!download || !dialog || typeof dialog.showModal !== "function") return;

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const seenKey = "eri-oae-delivery-preview-v1";
  const chapters = Array.from(dialog.querySelectorAll("[data-delivery-scene]"));
  const back = dialog.querySelector("[data-delivery-back]");
  const forward = dialog.querySelector("[data-delivery-next]");
  const play = dialog.querySelector("[data-delivery-play]");
  const frame = dialog.querySelector(".delivery-scene");
  const art = dialog.querySelector(".delivery-art");
  const status = dialog.querySelector("#delivery-announcement");
  const withSelector = selector => dialog.querySelector(selector);
  const number = value => String(value).padStart(2, "0");

  // The chart is generated from the 24 rows of leituras.csv in the downloadable ZIP.
  const readings = [
    .123, .1396, .1503, .1529, .1473, .1354, .12, .1046, .0927, .0871, .0897, .1004,
    .117, .1354, .1503, .1571, .1533, .1396, .12, .1004, .0867, .0829, .0897, .1046
  ];
  const points = readings.map((value, i) => [39 + i * 11.35, 133 - (value - .08) * 1100]);
  const trace = points.map(([x, y]) => x.toFixed(2) + "," + y.toFixed(2)).join(" ");
  const chart = '<div class="delivery-demo-chart"><span>V01 · DESLOCAMENTO SIMULADO</span>' +
    '<svg viewBox="0 0 322 166" focusable="false"><path class="delivery-chart-grid" d="M38 45H305M38 88H305M38 133H305"/>' +
    '<text x="14" y="48">0,16</text><text x="14" y="91">0,12</text><text x="14" y="136">0,08</text>' +
    '<polyline class="delivery-trace" pathLength="1" points="' + trace + '"/>' +
    '<circle cx="' + points.at(-1)[0] + '" cy="' + points.at(-1)[1] + '" r="4" fill="#a4fff1"/>' +
    '<text x="38" y="153">09h00</text><text x="261" y="153">10h55 UTC</text></svg><strong>24 leituras · unidade: mm</strong></div>';

  const scene = [
    {
      category: "01 · Abrir o ZIP", title: "O que vem no pacote",
      description: "O ZIP reúne o dossiê, o modelo, as leituras, os documentos de origem e os arquivos de conferência da Ponte Demonstrativa IME. Vamos acompanhar a viga V01.",
      files: ["ERI-DEMO-001-intercambio.zip"], duration: 5500,
      graphic: '<div class="delivery-zip"><div class="delivery-zip-top"><span>↓</span><strong>ZIP</strong><small>ERI-DEMO-001</small></div><div class="delivery-zip-files"><span>JSON</span><span>IFC</span><span>CSV</span><span>IDS</span></div><p>16 arquivos no pacote</p></div>'
    },
    {
      category: "02 · Consultar o acervo", title: "O registro estruturado da ponte",
      description: "O dossiê JSON reúne o cadastro da obra, as inspeções, as intervenções e os registros das famílias ERI. Ele preserva o vínculo da observação com a viga e sua fonte.",
      files: ["dossie.json"], duration: 7000,
      graphic: '<div class="delivery-code-visual"><span>DOSSIE.JSON</span><div><b>01</b><i></i><strong>Cadastro da ponte</strong></div><div><b>02</b><i></i><strong>Inspeção e intervenção</strong></div><div><b>03</b><i></i><strong>Viga V01 + evidência</strong></div></div>'
    },
    {
      category: "03 · Abrir o modelo", title: "A mesma viga no BIM",
      description: "Abra o IFC 4.3 em um visualizador BIM compatível. O mapeamento liga a V01 no dossiê ao GlobalId da mesma viga no modelo. O GLB serve à visualização 3D.",
      files: ["modelo.ifc", "mapeamento.json", "modelo.glb"], duration: 7600,
      graphic: '<div class="delivery-model-visual"><img src="assets/modelo.jpg" alt=""><span class="delivery-beam-label">V01 · GlobalId no IFC</span></div>'
    },
    {
      category: "04 · Ler a série", title: "As medições acompanham a viga",
      description: "O CSV traz 24 leituras simuladas de deslocamento, com instante, valor, unidade e identificação do componente. O arquivo de sensores descreve o sensor virtual da V01.",
      files: ["leituras.csv", "sensores.json"], duration: 7300, graphic: chart
    },
    {
      category: "05 · Voltar à fonte", title: "Os documentos continuam acessíveis",
      description: "A pasta reúne textos sobre geometria, inspeções e intervenções, além de ilustrações de antes, durante e depois. Assim, os registros podem ser conferidos com as fontes do ensaio.",
      files: ["documentos/"], duration: 6500,
      graphic: '<div class="delivery-doc-visual"><span>DOCUMENTOS /</span><div><i></i><strong>Geometria</strong><small>TXT</small></div><div><i></i><strong>Inspeções e intervenções</strong><small>TXT</small></div><div><i></i><strong>Antes · durante · depois</strong><small>SVG</small></div></div>'
    },
    {
      category: "06 · Conferir a entrega", title: "O que pode ser verificado",
      description: "O IDS define verificações de identificação no IFC, e os relatórios registram os resultados do ensaio. O manifesto lista os arquivos e usa um código SHA-256 para detectar alterações no conteúdo.",
      files: ["requisitos.ids", "verificacao-ids.json", "verificacao-ifc.json", "manifesto.json"], duration: 8500,
      graphic: '<div class="delivery-doc-visual"><span>CONFERÊNCIA DO PACOTE</span><div><i></i><strong>Regras de identificação</strong><small>IDS</small></div><div><i></i><strong>Resultados do ensaio</strong><small>JSON</small></div><div><i></i><strong>Integridade dos arquivos</strong><small>SHA-256</small></div></div>'
    }
  ];

  let seen = false;
  try { seen = sessionStorage.getItem(seenKey) === "1"; } catch {}
  let trigger;
  let current = 0;
  let running = false;
  let completed = false;
  let elapsed = 0;
  let lastTime;
  let raf;
  let downloadedFromDialog = false;

  function reflectSeen() {
    replay.hidden = !seen;
    hint.hidden = seen;
    if (seen) download.textContent = "Baixar ZIP do ensaio ↓";
  }

  function paintProgress() {
    if (motion.matches) return;
    chapters[current].style.setProperty("--film-progress", String(Math.min(1, elapsed / scene[current].duration)));
  }

  function reflectControls() {
    play.textContent = running ? "Pausar" : completed ? "Repetir" : "Reproduzir";
    back.disabled = current === 0;
    forward.disabled = current === scene.length - 1;
    chapters.forEach((chapter, i) => {
      chapter.setAttribute("aria-pressed", String(i === current));
      chapter.classList.toggle("is-watched", i < current || (completed && i === current));
      if (i !== current || motion.matches) chapter.style.removeProperty("--film-progress");
    });
    paintProgress();
  }

  function show(index, announce = false) {
    current = index;
    const entry = scene[index];
    withSelector("#delivery-scene-index").textContent = number(index + 1) + " / " + number(scene.length);
    withSelector("#delivery-scene-category").textContent = entry.category;
    withSelector("#delivery-scene-title").textContent = entry.title;
    withSelector("#delivery-scene-description").textContent = entry.description;
    withSelector("#delivery-file-tags").replaceChildren(...entry.files.map(name => {
      const code = document.createElement("code");
      code.textContent = name;
      return code;
    }));
    // Illustrations above are authored markup with no inputs from the page or the ZIP.
    art.innerHTML = entry.graphic;
    if (!motion.matches) {
      frame.classList.remove("is-revealing");
      void frame.offsetWidth;
      frame.classList.add("is-revealing");
    }
    if (announce) status.textContent = "Capítulo " + (index + 1) + " de " + scene.length + ": " + entry.title;
    reflectControls();
  }

  function tick(time) {
    if (!running) return;
    if (lastTime !== undefined) elapsed += time - lastTime;
    lastTime = time;
    if (elapsed >= scene[current].duration) {
      if (current === scene.length - 1) {
        completed = true;
        pause();
        return;
      }
      elapsed = 0;
      show(current + 1, true);
    }
    paintProgress();
    raf = requestAnimationFrame(tick);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
    lastTime = undefined;
    reflectControls();
  }

  function start() {
    if (running) return;
    if (completed) {
      completed = false;
      elapsed = 0;
      show(0, true);
    }
    running = true;
    reflectControls();
    raf = requestAnimationFrame(tick);
  }

  function manual(index) {
    if (!scene[index]) return;
    pause();
    completed = false;
    elapsed = 0;
    show(index, true);
  }

  function nudge(delta) {
    const prevFocus = document.activeElement;
    manual(current + delta);
    if (prevFocus === back && back.disabled) forward.focus();
    if (prevFocus === forward && forward.disabled) back.focus();
  }

  function open(source) {
    trigger = source;
    seen = true;
    try { sessionStorage.setItem(seenKey, "1"); } catch {}
    reflectSeen();
    completed = false;
    downloadedFromDialog = false;
    elapsed = 0;
    status.textContent = "";
    show(0);
    dialog.showModal();
    if (!motion.matches) start();
  }

  download.addEventListener("click", event => {
    if (seen || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(download);
  });
  replay.addEventListener("click", () => open(replay));
  play.addEventListener("click", () => running ? pause() : start());
  back.addEventListener("click", () => nudge(-1));
  forward.addEventListener("click", () => nudge(1));
  chapters.forEach((button, i) => button.addEventListener("click", () => manual(i)));
  dialog.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const chapterFocused = event.target.closest("[data-delivery-scene]");
      nudge(event.key === "ArrowLeft" ? -1 : 1);
      if (chapterFocused) chapters[current].focus();
    }
  });
  dialog.querySelector("a[download]").addEventListener("click", () => {
    downloadedFromDialog = true;
    dialog.close();
  });
  dialog.addEventListener("close", () => {
    pause();
    (downloadedFromDialog ? download : trigger)?.focus();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && dialog.open) pause();
  });
  motion.addEventListener("change", () => { if (motion.matches) pause(); else reflectControls(); });
  reflectSeen();
})();
