(() => {
  const slide = document.getElementById('conclusao');
  const art = slide?.querySelector('.closing-bridge-svg');
  const aircraft = art?.querySelector('.closing-aircraft');
  const nozzle = aircraft?.querySelector('.closing-nozzle');
  const coating = art?.querySelector('.closing-panel-coat');
  if (!aircraft || !nozzle || !coating) return;

  const damage = {
    x: Number(art.dataset.damageX),
    y: Number(art.dataset.damageY),
  };
  const panel = {
    x: Number(art.dataset.panelX),
    y: Number(art.dataset.panelY),
    width: Number(art.dataset.panelWidth),
    height: Number(art.dataset.panelHeight),
  };
  if (![damage.x, damage.y, panel.x, panel.y, panel.width, panel.height].every(Number.isFinite)
      || panel.width <= 0 || panel.height <= 0) return;

  const scale = Number(art.dataset.droneScale) || .83;
  const nozzleLength = 49 * scale;
  const standoff = Number(art.dataset.standoff) || 82;
  const damageMarker = art.querySelector('.closing-damage-marker');
  const panelTarget = art.querySelector('.closing-panel-target');
  const panelFinish = art.querySelector('.closing-panel-finish');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function shape(tag, attrs, parent) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    parent.append(el);
    return el;
  }

  const defs = art.querySelector('defs') || shape('defs', {}, art);
  const clip = shape('clipPath', { id: 'closing-panel-pass-clip' }, defs);
  const rowCount = 4;
  const rowHeight = panel.height / rowCount;
  const rows = Array.from({ length: rowCount }, (_, row) => shape('rect', {
    y: panel.y + row * rowHeight,
    height: rowHeight + (row === rowCount - 1 ? 0 : .6),
    width: 0,
  }, clip));
  coating.setAttribute('clip-path', 'url(#closing-panel-pass-clip)');

  const gradient = shape('linearGradient', { id: 'closing-panel-jet-light' }, defs);
  shape('stop', { 'stop-color': '#f7deaf', 'stop-opacity': .96 }, gradient);
  shape('stop', { offset: .54, 'stop-color': '#f3c384', 'stop-opacity': .58 }, gradient);
  shape('stop', { offset: 1, 'stop-color': '#eaba78', 'stop-opacity': .26 }, gradient);
  const jet = shape('g', { class: 'closing-panel-jet', 'aria-hidden': 'true' }, art);
  art.insertBefore(jet, aircraft);
  const plume = shape('path', { fill: 'url(#closing-panel-jet-light)' }, jet);
  const streak = shape('path', {
    fill: 'none',
    stroke: '#ffe3b6',
    'stroke-width': 1.35,
    'stroke-linecap': 'round',
    opacity: .9,
  }, jet);
  const impact = shape('ellipse', { rx: 3, ry: rowHeight * .43, fill: '#ffe4af', opacity: .38 }, jet);
  const particles = Array.from({ length: 8 }, (_, i) =>
    shape('circle', { r: i % 3 === 0 ? 1.6 : 1, fill: '#ffeac8' }, jet));

  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => {
    const p = clamp(value);
    return p * p * (3 - 2 * p);
  };
  const mix = (a, b, p) => a + (b - a) * p;
  const tween = (a, b, p) => ({ x: mix(a.x, b.x, p), y: mix(a.y, b.y, p) });
  const opacity = (node, value) => {
    if (node) node.style.opacity = String(value);
  };

  const edge = Math.min(12, panel.width * .1);
  const rowPoint = (row, progress) => ({
    x: mix(panel.x + edge, panel.x + panel.width - edge, row % 2 === 0 ? progress : 1 - progress),
    y: panel.y + rowHeight * (row + .5),
  });
  const mount = target => ({ x: target.x - nozzleLength - standoff, y: target.y });
  const first = mount(rowPoint(0, 0));
  const last = mount(rowPoint(rowCount - 1, 1));
  const inspect = { x: damage.x - 18, y: damage.y + nozzleLength + 61 };
  const enter = { x: inspect.x - 185, y: inspect.y + 89 };
  const retreat = { x: Math.min(inspect.x, first.x) - 99, y: first.y - 49 };
  const exit = { x: last.x - 175, y: Math.min(last.y + 60, 545) };

  const passStart = 4.14;
  const passDuration = .88;
  const turnDuration = .18;
  const rowDuration = passDuration + turnDuration;
  const passEnd = passStart + rowCount * rowDuration - turnDuration;
  const finishAt = passEnd + 1.24;

  function spray(point, target, elapsed) {
    const tipX = point.x + nozzleLength;
    const tipY = point.y;
    const spread = rowHeight * (.5 + .035 * Math.sin(elapsed * 26));
    plume.setAttribute('d', `M${tipX} ${tipY - 2} Q${(tipX + target.x) / 2} ${tipY - 4} ${target.x} ${target.y - spread} V${target.y + spread} Q${(tipX + target.x) / 2} ${tipY + 4} ${tipX} ${tipY + 2}Z`);
    streak.setAttribute('d', `M${tipX} ${tipY} L${target.x} ${target.y} M${tipX} ${tipY} L${target.x} ${target.y + spread * .66}`);
    impact.setAttribute('cx', target.x);
    impact.setAttribute('cy', target.y);
    particles.forEach((dot, i) => {
      const distance = (elapsed * 5.8 + i / particles.length) % 1;
      const shift = Math.sin(i * 13.7) * spread * distance;
      dot.setAttribute('cx', mix(tipX, target.x, distance));
      dot.setAttribute('cy', mix(tipY, target.y, distance) + shift);
    });
  }

  function paint(elapsed) {
    let point = enter;
    let angle = 0;
    let target = null;
    let currentRow = -1;
    let progress = 0;
    let airOpacity = ease(elapsed / .42);

    if (elapsed < 1.68) {
      point = tween(enter, inspect, ease(elapsed / 1.68));
    } else if (elapsed < 2.42) {
      point = { x: inspect.x, y: inspect.y + Math.sin(elapsed * 6) * 1.7 };
    } else if (elapsed < 3.42) {
      const p = ease((elapsed - 2.42) / 1);
      point = tween(inspect, retreat, p);
      angle = 68 * p;
    } else if (elapsed < passStart) {
      const p = ease((elapsed - 3.42) / (passStart - 3.42));
      point = tween(retreat, first, p);
      angle = mix(68, 90, p);
    } else if (elapsed < passEnd) {
      const passElapsed = elapsed - passStart;
      currentRow = Math.min(rowCount - 1, Math.floor(passElapsed / rowDuration));
      const rowElapsed = passElapsed - currentRow * rowDuration;
      progress = clamp(rowElapsed / passDuration);
      const currentPoint = rowPoint(currentRow, progress);
      angle = 90;
      if (rowElapsed <= passDuration) {
        target = currentPoint;
        point = mount(target);
      } else {
        const next = rowPoint(currentRow + 1, 0);
        point = mount(tween(currentPoint, next, ease((rowElapsed - passDuration) / turnDuration)));
      }
    } else {
      currentRow = rowCount;
      const p = ease((elapsed - passEnd) / (finishAt - passEnd));
      point = tween(last, exit, p);
      angle = mix(90, 28, p);
      airOpacity = 1 - ease((p - .23) / .67);
    }

    aircraft.setAttribute('transform', `translate(${point.x} ${point.y}) scale(${scale})`);
    nozzle.setAttribute('transform', `rotate(${angle})`);
    opacity(aircraft, airOpacity);
    opacity(damageMarker, ease((elapsed - .72) / .47) * (1 - .36 * ease((elapsed - 2.52) / .72)));
    opacity(panelTarget, ease((elapsed - 2.94) / .68) * (1 - ease((elapsed - passEnd) / .45)));
    opacity(panelFinish, ease((elapsed - passEnd) / .7));
    opacity(jet, target ? 1 : 0);
    if (target) spray(point, target, elapsed);

    rows.forEach((rect, row) => {
      const width = panel.width * (row < currentRow ? 1 : row === currentRow ? progress : 0);
      rect.setAttribute('x', row % 2 === 0 ? panel.x : panel.x + panel.width - width);
      rect.setAttribute('width', width);
    });
  }

  let frame = 0;
  let started = null;
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    started = null;
  }

  function advance(now) {
    if (started === null) started = now;
    const elapsed = Math.min(finishAt, (now - started) / 1000);
    paint(elapsed);
    frame = elapsed < finishAt ? requestAnimationFrame(advance) : 0;
  }

  function start() {
    stop();
    if (reduced.matches) {
      paint(finishAt);
      return;
    }
    paint(0);
    frame = requestAnimationFrame(advance);
  }

  document.addEventListener('deck:slide', event => {
    if (event.detail === slide.id) start();
    else stop();
  });
  document.addEventListener('deck:replay', event => {
    if (event.detail === slide.id) start();
  });
  reduced.addEventListener('change', () => {
    if (slide.classList.contains('active')) start();
  });
  if (slide.classList.contains('active')) start();
})();
