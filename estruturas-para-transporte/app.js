(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const markers = document.getElementById('markers');
  const counter = document.getElementById('counter');
  const prev = document.getElementById('previous');
  const next = document.getElementById('next');
  const fullscreen = document.getElementById('fullscreen');
  const replay = document.getElementById('replay');
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
    slide.classList.add('motion-paused');
    void slide.offsetWidth;
    slide.classList.remove('motion-paused');
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
  show(current, !location.hash);
})();
