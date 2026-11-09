(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const markers = document.getElementById('markers');
  const counter = document.getElementById('counter');
  const prev = document.getElementById('previous');
  const next = document.getElementById('next');
  const fullscreen = document.getElementById('fullscreen');
  const replay = document.getElementById('replay');
  const evidenceAirspace = document.querySelector('.evidence-airspace');
  let current = Math.max(0, slides.findIndex(s => `#${s.id}` === location.hash));

  slides.forEach((slide, index) => {
    slide.tabIndex = -1;
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Slide ${index + 1} · ${slide.dataset.title}`);
    button.addEventListener('click', () => show(index));
    markers.appendChild(button);
  });

  function show(index, updateHash = true) {
    const previous = current;
    current = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    if (slides[current].id === 'evidencias') layoutEvidenceFlight();
    [...markers.children].forEach((button, i) => {
      button.classList.toggle('active', i === current);
      button.setAttribute('aria-current', i === current ? 'step' : 'false');
    });
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    if (updateHash) history.replaceState(null, '', `#${slides[current].id}`);
    if (previous !== current) {
      slides[current].focus({preventScroll: true});
      window.scrollTo(0, 0);
    }
  }

  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  fullscreen.addEventListener('click', toggleFullscreen);
  replay.addEventListener('click', replayMotion);

  function replayMotion() {
    const slide = slides[current];
    if (slide.id === 'evidencias') layoutEvidenceFlight();
    slide.classList.add('motion-paused');
    void slide.offsetWidth;
    slide.classList.remove('motion-paused');
  }

  function layoutEvidenceFlight() {
    const bounds = evidenceAirspace.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const aircraft = evidenceAirspace.querySelector('.evidence-aircraft-eb1');
    const sprite = aircraft.getBoundingClientRect();
    const jet = aircraft.querySelector('.evidence-jet').getBoundingClientRect();
    const flow = evidenceAirspace.parentElement;
    const setTarget = (name, x, y) => {
      evidenceAirspace.style.setProperty(`--${name}-x`, `${Math.round(x - bounds.left)}px`);
      evidenceAirspace.style.setProperty(`--${name}-y`, `${Math.round(y - bounds.top)}px`);
    };

    flow.querySelectorAll('.evidence-docs').forEach((docs, index) => {
      const area = docs.getBoundingClientRect();
      setTarget(`drop-${index + 1}`, area.left + area.width / 2, area.top - sprite.height * .33);
    });
    flow.querySelectorAll('.evidence-dimensions b').forEach((badge, index) => {
      const area = badge.getBoundingClientRect();
      setTarget(`paint-${index + 1}`,
        area.left + area.width / 2 + sprite.width * .30 + jet.width * .86,
        area.top + area.height / 2 - sprite.height * .29 - jet.height * .88);
    });
    evidenceAirspace.classList.add('flight-ready');
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen?.();
    } catch {
      fullscreen.title = 'Use o comando de tela cheia do navegador';
    }
  }

  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.matches?.('input, textarea, select, [contenteditable]')) return;
    const isSpaceNavigation = event.key === ' ' && !event.target.closest?.('button, a');
    if (['ArrowRight', 'PageDown'].includes(event.key) || isSpaceNavigation) { event.preventDefault(); show(current + 1); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); show(current - 1); }
    if (event.key === 'Home') show(0);
    if (event.key === 'End') show(slides.length - 1);
    if (event.key.toLowerCase() === 'f') toggleFullscreen();
    if (event.key.toLowerCase() === 'r') replayMotion();
  });

  let touchStart = null;
  const stage = document.getElementById('stage');
  stage.addEventListener('touchstart', event => {
    if (event.target.closest('a, button, .gate-line')) return;
    const {clientX, clientY} = event.changedTouches[0];
    touchStart = {clientX, clientY};
  }, {passive:true});
  stage.addEventListener('touchend', event => {
    if (touchStart === null) return;
    const {clientX, clientY} = event.changedTouches[0];
    const deltaX = clientX - touchStart.clientX;
    const deltaY = clientY - touchStart.clientY;
    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > 1.5 * Math.abs(deltaY)) show(current + (deltaX < 0 ? 1 : -1));
    touchStart = null;
  }, {passive:true});
  stage.addEventListener('touchcancel', () => { touchStart = null; });

  let timerSeconds = 0, timerHandle = null;
  const timerValue = document.getElementById('timerValue');
  const timerPlay = document.getElementById('timerPlay');
  const timerPause = document.getElementById('timerPause');
  const timerStop = document.getElementById('timerStop');
  const renderTimer = () => timerValue.textContent = `${String(Math.floor(timerSeconds / 60)).padStart(2,'0')}:${String(timerSeconds % 60).padStart(2,'0')}`;
  timerPlay.addEventListener('click', () => {
    if (timerHandle) return;
    timerHandle = setInterval(() => { timerSeconds += 1; renderTimer(); }, 1000);
    timerPlay.disabled = true; timerPause.disabled = false; timerStop.disabled = false;
  });
  timerPause.addEventListener('click', () => {
    clearInterval(timerHandle); timerHandle = null; timerPlay.disabled = false; timerPause.disabled = true;
  });
  timerStop.addEventListener('click', () => {
    clearInterval(timerHandle); timerHandle = null; timerSeconds = 0; renderTimer();
    timerPlay.disabled = false; timerPause.disabled = true; timerStop.disabled = true;
  });
  window.addEventListener('hashchange', () => {
    const found = slides.findIndex(s => `#${s.id}` === location.hash);
    if (found >= 0) show(found, false);
  });
  new ResizeObserver(layoutEvidenceFlight).observe(evidenceAirspace.parentElement);
  show(current, !location.hash);

  const repairCover = document.querySelector('.repair-cover');
  if (repairCover) {
    const texture = new Image();
    texture.src = 'concreto-texturas-v3.jpg';
    const drone = repairCover.querySelector('.repair-flight img');
    Promise.allSettled([texture.decode(), drone.decode()]).then(() => {
      repairCover.classList.remove('repair-pending');
    });
  }
})();
