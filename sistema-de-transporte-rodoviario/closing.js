(() => {
  "use strict";

  const slide = document.querySelector("#aplicacoes");
  const paper = document.querySelector("#slide-paper");
  const canvas = document.querySelector("#slide-pixels");
  const overlay = slide.querySelector(".closing-overlay");
  const main = overlay.querySelector(".closing-measure-top");
  const headDate = overlay.querySelector(".closing-date-top");
  const footValue = overlay.querySelector(".closing-measure");
  const footDate = overlay.querySelector(".closing-date-bottom");
  const instant = overlay.querySelector(".closing-instant");
  const trace = overlay.querySelector(".closing-trace");
  const guide = overlay.querySelector(".closing-guide");
  const cursor = overlay.querySelector(".closing-cursor");
  const progress = overlay.querySelector(".closing-slider-progress");
  const knob = overlay.querySelector(".closing-slider-knob");
  const pauseMark = overlay.querySelector(".closing-pause-mark");
  const play = slide.querySelector(".closing-play");
  const next = slide.querySelector(".closing-next");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const mm = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const clockBR = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  // Reproduces the original UTC timestamp and value pairs from leituras.csv, at an accelerated rate.
  const records = [["09:00",0.123],["09:05",0.1396],["09:10",0.1503],["09:15",0.1529],["09:20",0.1473],["09:25",0.1354],["09:30",0.12],["09:35",0.1046],["09:40",0.0927],["09:45",0.0871],["09:50",0.0897],["09:55",0.1004],["10:00",0.117],["10:05",0.1354],["10:10",0.1503],["10:15",0.1571],["10:20",0.1533],["10:25",0.1396],["10:30",0.12],["10:35",0.1004],["10:40",0.0867],["10:45",0.0829],["10:50",0.0897],["10:55",0.1046]];
  // Coordinates are in the original capture, so image and plot stay aligned in any viewport.
  const points = records.map(([, value], i) => [94 + 430 * i / (records.length - 1), 295.53 - 797 * value]);
  const interval = 600;
  let current = 0;
  let playing = false;
  let automatic = false;
  let timer;

  function show(i) {
    current = i;
    const [x, y] = points[i];
    trace.setAttribute("points", points.slice(0, i + 1).map(([px, py]) => px.toFixed(2) + "," + py.toFixed(2)).join(" "));
    guide.setAttribute("d", "M" + x + " 159V243");
    cursor.setAttribute("cx", x);
    cursor.setAttribute("cy", y);
    const sliderX = 54 + 493 * i / (records.length - 1);
    progress.setAttribute("d", "M54 416H" + sliderX);
    knob.setAttribute("cx", sliderX);
    const formatted = mm.format(records[i][1]) + " mm";
    const local = clockBR.format(new Date("2026-11-06T" + records[i][0] + ":00Z"));
    const date = "06/11/2026, " + local;
    main.textContent = footValue.textContent = formatted;
    headDate.textContent = date;
    footDate.textContent = "Observado em " + date;
    instant.textContent = "Instante " + (i + 1) + " de " + records.length;
    next.disabled = i === records.length - 1;
  }

  function available() {
    // The scan stops before playback; the paper copy keeps the original still image.
    return !slide.hidden && paper.hidden && canvas.hidden && !document.hidden;
  }

  function updateControl() {
    pauseMark.toggleAttribute("hidden", !playing);
    play.setAttribute("aria-label", playing ? "Pausar leituras simuladas" : "Reproduzir leituras simuladas");
  }

  function pause() {
    clearTimeout(timer);
    playing = false;
    updateControl();
  }

  function start() {
    if (playing || !available()) return;
    if (current === records.length - 1) show(0);
    playing = true;
    updateControl();
    function step() {
      if (!playing || !available()) { pause(); return; }
      show(current + 1);
      if (current < records.length - 1) timer = setTimeout(step, interval);
      else pause();
    }
    timer = setTimeout(step, interval);
  }

  function refresh() {
    if (slide.hidden) {
      automatic = false;
      pause();
      overlay.setAttribute("hidden", "");
      play.hidden = next.hidden = true;
      show(0);
      return;
    }
    if (!available()) {
      if (playing) pause();
      return;
    }
    overlay.removeAttribute("hidden");
    play.hidden = next.hidden = false;
    if (!automatic) {
      automatic = true;
      if (motion.matches) show(records.length - 1);
      else start();
    }
  }

  play.addEventListener("click", () => {
    if (playing) pause();
    else start();
  });
  next.addEventListener("click", () => {
    pause();
    if (current < records.length - 1) show(current + 1);
  });
  const observer = new MutationObserver(refresh);
  for (const element of [slide, paper, canvas]) observer.observe(element, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", refresh);
  motion.addEventListener("change", () => {
    if (motion.matches) {
      pause();
      show(records.length - 1);
    }
    refresh();
  });
  show(0);
  refresh();
})();
