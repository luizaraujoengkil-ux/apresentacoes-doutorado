(() => {
  "use strict";

  const cover = document.querySelector("#capa");
  const projection = cover.querySelector(".projection");
  const canvas = cover.querySelector("#cover-canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  const elementLabel = cover.querySelector(".projection-element");
  const dataLabel = cover.querySelector(".projection-data");
  const readingsCanvas = cover.querySelector("#cover-readings");
  const controls = cover.querySelector(".cover-controls");
  const play = controls.querySelector(".cover-play");
  const steps = Array.from(controls.querySelectorAll("[data-cover-step]"));
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const end = 7650;

  // O modelo.glb do pacote ERI-DEMO-001 contém sete volumes ortogonais em metros.
  const bounds = [
    ["V01", [-18, 4.85, 2.075], [18, 6, 2.725]],
    ["V02", [-18, 4.85, -2.725], [18, 6, -2.075]],
    ["P01", [-6.7, 0, -2.9], [-5.3, 4.85, 2.9]],
    ["P02", [5.3, 0, -2.9], [6.7, 4.85, 2.9]],
    ["TAB-01", [-18, 6, -4.5], [18, 6.6, 4.5]],
    ["E01", [-18.55, 0, -4.5], [-17.45, 6, 4.5]],
    ["E02", [17.45, 0, -4.5], [18.55, 6, 4.5]]
  ];
  const volumes = bounds.map(([code, [x0, y0, z0], [x1, y1, z1]]) => ({
    selected: code === "V01",
    vertices: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
               [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]
  }));
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
                 [0, 4], [1, 5], [2, 6], [3, 7]];
  const faces = [[3, 2, 6, 7], [0, 3, 7, 4], [4, 5, 6, 7]];
  const shades = [0.68, 0.28, 0.47];

  // Deslocamentos simulados, em mm, extraídos de leituras.csv (SIM-DISP-01).
  const readings = [0.123, 0.1396, 0.1503, 0.1529, 0.1473, 0.1354, 0.12, 0.1046,
    0.0927, 0.0871, 0.0897, 0.1004, 0.117, 0.1354, 0.1503, 0.1571,
    0.1533, 0.1396, 0.12, 0.1004, 0.0867, 0.0829, 0.0897, 0.1046];

  let width = 0;
  let height = 0;
  let elapsed = 0;
  let frame = null;
  let started = false;
  let paused = false;
  let phase = -1;

  const clamp = (value) => Math.max(0, Math.min(1, value));
  const ease = (value) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;

  function line(points, color, weight = 1) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    context.strokeStyle = color;
    context.lineWidth = weight;
    context.stroke();
  }

  function polygon(points, color) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    context.closePath();
    context.fillStyle = color;
    context.fill();
  }

  function dot(point, radius, color) {
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  }

  function camera() {
    const yaw = mix(.64, .46, ease(elapsed / end));
    const pitch = .48;
    const cosine = Math.cos(yaw);
    const sine = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const scale = Math.min(width * .84 / 36, height * .86 / 24);
    return ([x, y, z]) => {
      const u = x * cosine + z * sine;
      const v = z * cosine - x * sine;
      const depth = y * sinPitch + v * cosPitch;
      const perspective = scale * (1 + depth * .008);
      return { x: width * .49 + u * perspective, y: height * .60 + (v * sinPitch - y * cosPitch) * perspective, depth };
    };
  }

  function drawGrid(project) {
    for (let x = -24; x <= 24; x += 3) {
      line([project([x, -.12, -12]), project([x, -.12, 12])], "rgba(111, 217, 228, .17)");
    }
    for (let z = -12; z <= 12; z += 3) {
      line([project([-24, -.12, z]), project([24, -.12, z])], "rgba(111, 217, 228, .17)");
    }
    const a = project([-18, 0, 6.2]);
    const b = project([18, 0, 6.2]);
    const color = "rgba(149, 233, 235, .49)";
    line([a, b], color);
    for (const x of [-18, 18]) {
      line([project([x, 0, 5.5]), project([x, 0, 6.9])], color);
    }
    const label = project([0, 0, 6.2]);
    context.textAlign = "center";
    context.font = "600 11px Consolas, monospace";
    context.fillStyle = "#b0d8df";
    context.fillText("36 m", label.x, label.y + 16);
  }

  function drawBridge(project) {
    const highlight = ease((elapsed - 2450) / 700);
    const illuminate = ease(elapsed / 1350);
    const projected = volumes.map(({ selected, vertices }) => ({ selected, points: vertices.map(project) }));
    const visibleFaces = projected.flatMap(({ selected, points }) => faces.map((face, index) => {
      const corners = face.map((vertex) => points[vertex]);
      const depth = corners.reduce((sum, point) => sum + point.depth, 0) / corners.length;
      return { selected, corners, depth, shade: shades[index] };
    }));
    visibleFaces.sort((a, b) => a.depth - b.depth);
    for (const { selected, corners, shade } of visibleFaces) {
      const alpha = (.22 + .30 * illuminate) * shade;
      const color = selected && highlight > 0
        ? "rgba(255, 185, 90, " + mix(alpha, shade * 1.1, highlight) + ")"
        : "rgba(91, 212, 221, " + alpha * (1 - highlight * .24) + ")";
      polygon(corners, color);
    }

    for (const { selected, points } of projected) {
      if (!selected) {
        for (const [a, b] of edges) {
          line([points[a], points[b]], "rgba(146, 237, 239, " + mix(.46, .34, highlight) + ")");
        }
      }
    }
    const beam = projected.find(({ selected }) => selected);
    if (highlight > 0) {
      context.save();
      context.shadowColor = "#ffbc67";
      context.shadowBlur = 12 * highlight;
      for (const [a, b] of edges) line([beam.points[a], beam.points[b]], "rgba(255, 213, 143, " + highlight + ")", 1.5);
      context.restore();
    } else {
      for (const [a, b] of edges) line([beam.points[a], beam.points[b]], "rgba(146, 237, 239, .62)");
    }
  }

  function drawScan(project) {
    if (elapsed >= 2450) return;
    const progress = ease(elapsed / 2450);
    const x = mix(-21, 21, progress);
    const alpha = Math.sin(Math.PI * progress);
    const corners = [[x, -.15, -6], [x, -.15, 6], [x, 9, 6], [x, 9, -6]].map(project);
    polygon(corners, "rgba(86, 255, 225, " + alpha * .18 + ")");
    line([...corners, corners[0]], "rgba(143, 255, 238, " + alpha * .72 + ")", 1.3);
  }

  function drawLinks(project) {
    if (phase === 0) return;
    const anchor = project([2.3, 5.42, 2.725]);
    const label = { x: elementLabel.offsetLeft, y: elementLabel.offsetTop + elementLabel.offsetHeight / 2 };
    const bend = { x: label.x - Math.min(width * .09, 52), y: label.y };
    line([anchor, bend, label], "rgba(255, 211, 139, .8)");
    dot(anchor, 6, "rgba(255, 206, 127, .25)");
    dot(anchor, 2.7, "#ffdfab");

    if (phase < 2) return;
    const panel = { x: width * .24, y: dataLabel.offsetTop };
    const turn = { x: panel.x + width * .10, y: panel.y - height * .08 };
    context.save();
    context.setLineDash([3, 5]);
    line([anchor, turn, panel], "rgba(118, 223, 215, .78)");
    context.restore();
    const t = ease((elapsed - 5150) / 1600);
    const [from, to, fraction] = t < .7 ? [anchor, turn, t / .7] : [turn, panel, (t - .7) / .3];
    dot({ x: mix(from.x, to.x, fraction), y: mix(from.y, to.y, fraction) }, 2.7, "#95fff2");
  }

  function drawReadings() {
    if (phase < 2) return;
    const graph = readingsCanvas.getContext("2d");
    if (!graph) return;
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    const w = readingsCanvas.clientWidth * pixelRatio;
    const h = readingsCanvas.clientHeight * pixelRatio;
    if (readingsCanvas.width !== w || readingsCanvas.height !== h) {
      readingsCanvas.width = w;
      readingsCanvas.height = h;
    }
    graph.clearRect(0, 0, w, h);
    graph.strokeStyle = "#8ee9df";
    graph.lineWidth = 1.25 * pixelRatio;
    graph.beginPath();
    const count = Math.max(2, Math.round(mix(2, readings.length, ease((elapsed - 5150) / 1150))));
    readings.slice(0, count).forEach((value, index) => {
      const x = 1 + index * (w - 2) / (readings.length - 1);
      const y = h - 1 - (value - .08) / .08 * (h - 2);
      if (index === 0) graph.moveTo(x, y);
      else graph.lineTo(x, y);
    });
    graph.stroke();
  }

  function render() {
    if (!width || !height || cover.hidden) return;
    const nextPhase = elapsed >= 5150 ? 2 : elapsed >= 2450 ? 1 : 0;
    if (phase !== nextPhase) {
      phase = nextPhase;
      projection.dataset.phase = String(phase);
      elementLabel.hidden = phase === 0;
      dataLabel.hidden = phase < 2;
      steps.forEach((step, index) => step.setAttribute("aria-pressed", String(index === phase)));
    }
    context.clearRect(0, 0, width, height);
    const project = camera();
    drawGrid(project);
    drawBridge(project);
    drawScan(project);
    drawLinks(project);
    drawReadings();
  }

  function resize() {
    if (cover.hidden) return;
    width = projection.clientWidth;
    height = projection.clientHeight;
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    render();
  }

  function updatePlay() {
    play.textContent = frame !== null ? "Pausar animação" : paused ? "Retomar animação" : "Rever animação";
  }

  function stop(continueLater = false) {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    paused = continueLater;
    updatePlay();
  }

  function animate() {
    const start = performance.now() - (paused ? elapsed : 0);
    paused = false;
    const tick = (now) => {
      elapsed = Math.min(end, now - start);
      render();
      if (elapsed < end) frame = requestAnimationFrame(tick);
      else stop();
    };
    frame = requestAnimationFrame(tick);
    updatePlay();
  }

  function jump(index) {
    stop();
    elapsed = [2200, 4800, end][index];
    render();
  }

  function showCover() {
    if (cover.hidden || document.hidden) {
      if (frame !== null) stop(true);
      return;
    }
    resize();
    if (started) return;
    started = true;
    if (motion.matches) jump(2);
    else animate();
  }

  projection.classList.add("is-ready");
  controls.hidden = false;
  play.addEventListener("click", () => {
    if (frame !== null) stop(true);
    else animate();
  });
  steps.forEach((step, index) => step.addEventListener("click", () => jump(index)));
  new ResizeObserver(resize).observe(projection);
  new MutationObserver(showCover).observe(cover, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", showCover);
  motion.addEventListener("change", () => {
    if (motion.matches) jump(2);
  });
  showCover();
})();
