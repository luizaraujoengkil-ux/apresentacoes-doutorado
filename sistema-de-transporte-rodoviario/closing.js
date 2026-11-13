(() => {
  "use strict";

  const slide = document.querySelector("#aplicacoes");
  const paper = document.querySelector("#slide-paper");
  const canvas = document.querySelector("#slide-pixels");
  const trace = document.querySelector("#closing-trace");
  const area = document.querySelector("#closing-chart-area");
  const cursor = document.querySelector("#closing-cursor");
  const value = document.querySelector("#closing-value");
  const timestamp = document.querySelector("#closing-time");
  const toggle = document.querySelector("#closing-playback");
  const icon = toggle.querySelector("[data-icon]");
  const label = toggle.querySelector("[data-label]");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const n2 = n => String(n).padStart(2, "0");
  const mm = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  // Reproduces the original UTC timestamp and value pairs from leituras.csv, at an accelerated rate.
  const records = [["09:00",0.123],["09:05",0.1396],["09:10",0.1503],["09:15",0.1529],["09:20",0.1473],["09:25",0.1354],["09:30",0.12],["09:35",0.1046],["09:40",0.0927],["09:45",0.0871],["09:50",0.0897],["09:55",0.1004],["10:00",0.117],["10:05",0.1354],["10:10",0.1503],["10:15",0.1571],["10:20",0.1533],["10:25",0.1396],["10:30",0.12],["10:35",0.1004],["10:40",0.0867],["10:45",0.0829],["10:50",0.0897],["10:55",0.1046]];
  const chartBaseline = 152;
  const points = records.map(([, measurement], i) => [
    53 + 401 * i / (records.length - 1),
    chartBaseline - (measurement - .08) * 1600
  ]);
  const interval = 600;
  let current = 0;
  let playing = false;
  let automatic = false;
  let timer;

  function show(i) {
    current = i;
    const [x, y] = points[i];
    const line = points.slice(0, i + 1).map(point => point.map(v => v.toFixed(2)).join(",")).join(" ");
    trace.setAttribute("points", line);
    area.setAttribute("d", i ? "M" + points[0][0] + "," + chartBaseline + " L" + line + " L" + x + "," + chartBaseline + " Z" : "");
    cursor.setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ")");
    value.textContent = mm.format(records[i][1]) + " mm";
    timestamp.textContent = records[i][0] + " UTC · Leitura " + n2(i + 1) + "/" + n2(records.length);
  }

  function updateControl() {
    icon.textContent = playing ? "Ⅱ" : current === records.length - 1 ? "↻" : "▶";
    label.textContent = playing ? "Pausar" : current === records.length - 1 ? "Rever série" : "Reproduzir";
  }

  function pause() {
    clearTimeout(timer);
    playing = false;
    updateControl();
  }

  function available() {
    return !slide.hidden && paper.hidden && canvas.hidden && !document.hidden;
  }

  function play() {
    if (playing || !available()) return;
    if (current === records.length - 1) show(0);
    playing = true;
    updateControl();
    const step = () => {
      if (!playing || !available()) { pause(); return; }
      show(current + 1);
      if (current < records.length - 1) timer = setTimeout(step, interval);
      else pause();
    };
    timer = setTimeout(step, interval);
  }

  function refresh() {
    if (slide.hidden) {
      automatic = false;
      pause();
      show(motion.matches ? records.length - 1 : 0);
      updateControl();
      return;
    }
    if (!available()) {
      if (playing) pause();
      return;
    }
    if (motion.matches && !playing) {
      show(records.length - 1);
      updateControl();
    } else if (!automatic) {
      automatic = true;
      play();
    }
  }

  toggle.addEventListener("click", () => {
    automatic = true;
    if (playing) pause();
    else play();
  });
  const observer = new MutationObserver(refresh);
  for (const element of [slide, paper, canvas]) observer.observe(element, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", refresh);
  motion.addEventListener("change", () => { if (motion.matches) pause(); refresh(); });
  refresh();
})();
