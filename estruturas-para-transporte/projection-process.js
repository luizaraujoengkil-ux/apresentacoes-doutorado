(() => {
  const slide = document.getElementById('sistema');
  const art = slide?.querySelector('.process-scene-art');
  if (!art) return;

  const find = selector => slide.querySelector(selector);
  const aircraft = find('.process-aircraft');
  const nozzle = find('.process-nozzle');
  const speed = find('.process-velocity');
  const wind = find('.process-wind');
  const downwash = find('.process-downwash');
  const deposit = find('.process-deposit');
  const play = find('[data-process-play]');
  const count = find('[data-process-count]');
  const title = find('[data-process-title]');
  const copy = find('[data-process-copy]');
  const status = find('[data-process-status]');
  const explainer = find('#process-explainer');
  const buttons = [...slide.querySelectorAll('[data-process-step]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stages = [
    [3000, 'Distância até o tabuleiro', 'O drone se aproxima e mede a folga entre o bico e a face inferior da ponte. Essa distância afeta onde o jato chega.', 'Medindo a folga', 'measure'],
    [3100, 'Ângulo de incidência', 'O drone baixa para ajustar a posição. O bico se orienta pela perpendicular ao tabuleiro para evitar uma camada desigual.', 'Ajustando o bico', 'measure'],
    [2850, 'Velocidade do passe', 'O drone começa a projetar enquanto avança. Com a mesma vazão, passar mais devagar deposita mais material por trecho.', 'Projetando em movimento', 'spray'],
    [3600, 'Vazão e pressão', 'Vazão é o volume que sai por segundo. A pressão faz a mistura passar pela mangueira e pelo bico.', 'Bomba em operação', 'spray'],
    [4700, 'Correção após a rajada', 'Se a rajada tirar o drone da posição, o jato é interrompido. A projeção só é retomada após recuperar o alinhamento.', 'Projetando', 'spray'],
    [4500, 'Ar das hélices (downwash)', 'As hélices empurram ar para baixo. Esse fluxo pode desviar partículas do jato e alterar a camada depositada.', 'Ar gerado pelo próprio drone', 'air'],
  ];

  function shape(tag, attrs, parent = art) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    parent.append(el);
    return el;
  }

  function label(text, x, y, opts = {}, parent = art) {
    const el = shape('text', { x, y, fill: '#d8e9ef', 'font-size': 17, 'font-weight': 720, ...opts }, parent);
    el.textContent = text;
    return el;
  }

  const defs = art.querySelector('defs');
  const depositClip = shape('clipPath', { id: 'process-layer-clip' }, defs);
  const depositRect = shape('rect', { x: 360, y: 87, width: 0, height: 16 }, depositClip);
  deposit.setAttribute('clip-path', 'url(#process-layer-clip)');
  deposit.setAttribute('transform', 'translate(-18 0)');
  nozzle.removeAttribute('style');
  label('Tabuleiro', 66, 67, { fill: '#f5fafb', 'font-size': 22 });

  const gradient = shape('linearGradient', { id: 'process-live-jet', x2: 0, y2: 1 }, defs);
  shape('stop', { 'stop-color': '#f5b966', 'stop-opacity': .2 }, gradient);
  shape('stop', { offset: 1, 'stop-color': '#ffe4b4', 'stop-opacity': .97 }, gradient);
  const jet = shape('g', { class: 'process-live-spray', 'aria-hidden': 'true' });
  art.insertBefore(jet, aircraft);
  const plume = shape('path', { fill: 'url(#process-live-jet)' }, jet);
  const streak = shape('path', { fill: 'none', stroke: '#ffda9d', 'stroke-width': 1.65, 'stroke-linecap': 'round' }, jet);
  const particles = Array.from({ length: 9 }, (_, i) =>
    shape('circle', { r: i % 3 === 0 ? 1.9 : 1.25, fill: '#ffe8c5' }, jet));

  const guidance = shape('g', { fill: 'none', stroke: '#83ebe0', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const guideLines = shape('path', { 'stroke-dasharray': '4 5', opacity: .66 }, guidance);
  const guideMark = shape('path', {}, guidance);
  const guideLabel = label('', 0, 0, { stroke: 'none', fill: '#9cf1e9' }, guidance);

  const feed = shape('path', { d: 'M290 278h19q17 0 23-13l17-29', fill: 'none', stroke: '#ffda9d', 'stroke-width': 3, 'stroke-dasharray': '5 6' }, aircraft);
  const pumpReadout = shape('g', { class: 'process-pump-readout' });
  shape('rect', { x: 593, y: 137, width: 165, height: 69, rx: 10, fill: '#0b2532', stroke: '#795d43' }, pumpReadout);
  label('Vazão regulada', 606, 163, { fill: '#f8d5a3', 'font-size': 16 }, pumpReadout);
  label('Pressão monitorada', 606, 188, { fill: '#f8d5a3', 'font-size': 15 }, pumpReadout);

  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
  const rad = degrees => degrees * Math.PI / 180;
  const rotate = (x, y, cx, cy, degrees) => {
    const a = rad(degrees);
    return [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
  };
  const visible = (node, show) => { node.style.visibility = show ? 'visible' : 'hidden'; };
  let active = false;
  let mode = 'idle';
  let index = 0;
  let elapsed = 0;
  let previousTime = null;
  let frame = 0;
  let lastStatus = '';

  function updateStatus(text, tone) {
    if (lastStatus === text) return;
    status.textContent = text;
    status.dataset.tone = tone;
    lastStatus = text;
  }

  function announce() {
    const [, heading, explanation, statusText, tone] = stages[index];
    count.textContent = String(index + 1).padStart(2, '0');
    title.textContent = heading;
    copy.textContent = explanation;
    updateStatus(statusText, tone);
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }

  function paint(p, seconds) {
    let x = 0, y = 0, angle = 0, bank = 0, emit = false, end = 342, gust = 0;
    switch (index) {
      case 0:
        x = -245 * (1 - ease(p / .43));
        y = -20;
        angle = -22;
        break;
      case 1:
        y = -20 * (1 - ease(p / .46));
        angle = -22 * (1 - ease((p - .22) / .58));
        if (p > .83) updateStatus('Bico alinhado', 'measure');
        break;
      case 2:
        x = 64 * p;
        emit = true;
        end = 351 + x + 12;
        break;
      case 3:
        x = 64 + 80 * p;
        emit = true;
        end = 351 + x + 12;
        break;
      case 4: {
        gust = ease((p - .06) / .27) * (1 - ease((p - .36) / .32));
        const resume = clamp((p - .72) / .28);
        x = 144 + 45 * gust + 51 * resume;
        y = 16 * gust;
        bank = -8 * gust;
        emit = p < .14 || p >= .72;
        end = 351 + 144 + 12 + 51 * resume;
        if (p >= .72) updateStatus('Projeção retomada', 'spray');
        else if (p >= .14) updateStatus('Jato interrompido', 'pause');
        else updateStatus('Projetando', 'spray');
        break;
      }
      case 5:
        x = 195 + 40 * ease(p / .79);
        emit = p < .84;
        end = 351 + x + 12;
        break;
    }

    aircraft.setAttribute('transform', `translate(${x} ${y}) rotate(${bank} 260 248)`);
    nozzle.setAttribute('transform', `rotate(${angle - 11} 351 233)`);
    const [tipLocalX, tipLocalY] = rotate(351, 184, 351, 233, angle);
    const [tipX, tipY] = rotate(tipLocalX, tipLocalY, 260, 248, bank).map((n, i) => n + (i ? y : x));
    const targetX = tipX + (tipY - 92) * Math.tan(rad(angle + bank));

    visible(deposit, end > 342);
    depositRect.setAttribute('width', Math.max(0, end - 342));
    visible(jet, emit);
    if (emit) {
      const width = 11 + Math.sin(seconds * 26) * 1.75;
      const offset = index === 5 ? Math.sin(seconds * 7) * 2.1 : 0;
      const target = targetX + offset;
      plume.setAttribute('d', `M${tipX - 2} ${tipY} L${target - width} 92 H${target + width} L${tipX + 2} ${tipY}Z`);
      streak.setAttribute('d', `M${tipX} ${tipY} L${target} 92 M${tipX} ${tipY} L${target + width * .6} 94`);
      particles.forEach((dot, i) => {
        const t = (seconds * 4 + i / particles.length) % 1;
        const jitter = Math.sin(i * 13.7) * width * t;
        dot.setAttribute('cx', tipX + (target - tipX) * t + jitter);
        dot.setAttribute('cy', tipY - (tipY - 94) * t);
      });
    }

    visible(speed, index === 2);
    visible(wind, index === 4 && p > .06 && p < .71);
    wind.setAttribute('transform', `translate(${75 + 210 * clamp(p / .73)} 0)`);
    wind.style.opacity = String(clamp(gust * 1.6));
    visible(downwash, index === 5);
    downwash.style.opacity = String(.78 + .22 * Math.sin(seconds * 8));
    visible(pumpReadout, index === 3);
    visible(feed, index === 3);
    feed.setAttribute('stroke-dashoffset', String(-seconds * 35));

    const measuring = (index === 0 && p > .34) || index === 1;
    visible(guidance, measuring);
    if (index === 0 && measuring) {
      const dx = tipX + 66;
      guideLines.setAttribute('d', `M${tipX} 94 H${dx + 7} M${tipX} ${tipY} H${dx + 7}`);
      guideMark.setAttribute('d', `M${dx} 97 V${tipY - 3} m-5 -7 5 7 5 -7 M${dx - 5} 104 l5 -7 5 7`);
      guideLabel.textContent = 'Distância';
      guideLabel.setAttribute('x', dx + 12);
      guideLabel.setAttribute('y', (94 + tipY) / 2 + 5);
    } else if (index === 1) {
      const pivotY = 233 + y;
      const radius = 73;
      const arcX = 351 + radius * Math.sin(rad(angle));
      const arcY = pivotY - radius * Math.cos(rad(angle));
      guideLines.setAttribute('d', `M351 ${pivotY - 15} V95 M${tipX} ${tipY} L${targetX} 95`);
      guideMark.setAttribute('d', `M${arcX} ${arcY} A${radius} ${radius} 0 0 1 351 ${pivotY - radius} M351 111h15v-15`);
      guideLabel.textContent = 'Perpendicular';
      guideLabel.setAttribute('x', 373);
      guideLabel.setAttribute('y', 124);
    }
  }

  function stopFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = null;
  }

  function setMode(value) {
    mode = value;
    const running = mode === 'auto' || mode === 'single';
    const action = running ? 'Pausar sequência da projeção' : 'Iniciar ou continuar sequência da projeção';
    play.textContent = running ? 'Ⅱ' : '▶';
    play.title = action;
    play.setAttribute('aria-label', action);
    explainer.setAttribute('aria-live', mode === 'auto' ? 'off' : 'polite');
  }

  function step(now) {
    if (!active || (mode !== 'auto' && mode !== 'single')) return;
    if (previousTime !== null) elapsed += Math.min(85, now - previousTime);
    previousTime = now;
    const duration = stages[index][0];
    paint(reduced.matches ? (index === 4 ? .43 : 1) : clamp(elapsed / duration), reduced.matches ? 0 : elapsed / 1000);
    if (elapsed >= duration) {
      if (mode === 'single' || index === stages.length - 1) {
        stopFrame();
        setMode(mode === 'single' ? 'paused' : 'done');
        return;
      }
      index += 1;
      elapsed = 0;
      announce();
    }
    frame = requestAnimationFrame(step);
  }

  function startAt(next, modeToRun) {
    stopFrame();
    index = next;
    elapsed = 0;
    setMode(modeToRun);
    announce();
    const runs = modeToRun === 'auto' || modeToRun === 'single';
    paint(reduced.matches ? (index === 4 ? .43 : 1) : runs ? 0 : 1, 0);
    if (runs) frame = requestAnimationFrame(step);
  }

  buttons.forEach((button, i) => button.addEventListener('click', () => startAt(i, reduced.matches ? 'paused' : 'single')));
  play.addEventListener('click', () => {
    if (mode === 'auto' || mode === 'single') {
      stopFrame();
      setMode('paused');
    } else if (mode === 'done' || mode === 'idle') {
      startAt(0, 'auto');
    } else if (elapsed >= stages[index][0]) {
      startAt((index + 1) % stages.length, 'auto');
    } else {
      setMode('auto');
      frame = requestAnimationFrame(step);
    }
  });

  document.addEventListener('deck:slide', ({ detail }) => {
    if (detail === slide.id) {
      if (!active) {
        active = true;
        startAt(0, reduced.matches ? 'idle' : 'auto');
      }
    } else if (active) {
      active = false;
      stopFrame();
      setMode('idle');
    }
  });
  document.addEventListener('deck:replay', ({ detail }) => {
    if (detail === slide.id) startAt(0, reduced.matches ? 'idle' : 'auto');
  });
})();
