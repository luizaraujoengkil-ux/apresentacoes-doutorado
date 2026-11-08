(() => {
  const slide = document.querySelector('.problema-slide');
  if (!slide) return;

  const steps = [...slide.querySelectorAll('.problema-passo')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const durations = [4000, 5000, 6000];
  let current = 0;
  let pending;

  function show(index) {
    current = index;
    slide.dataset.problemaEtapa = String(index + 1);
    steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
  }

  function stop() {
    window.clearTimeout(pending);
    slide.dataset.problemaPlaying = 'false';
  }

  function schedule() {
    pending = window.setTimeout(() => {
      if (current === steps.length - 1) {
        stop();
        return;
      }
      show(current + 1);
      schedule();
    }, durations[current]);
  }

  function start() {
    if (current === steps.length - 1) show(0);
    slide.dataset.problemaPlaying = 'true';
    schedule();
  }

  function onSlideVisibility() {
    stop();
    if (slide.hidden) return;
    show(0);
    if (!reducedMotion.matches) start();
  }

  steps.forEach((button, index) => button.addEventListener('click', () => {
    show(index);
    stop();
  }));
  new MutationObserver(onSlideVisibility).observe(slide, {attributes: true, attributeFilter: ['hidden']});
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) stop();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  onSlideVisibility();
})();
