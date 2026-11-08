(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function bindSequence(slide) {
    const steps = [...slide.querySelectorAll('.problema-passo')];
    const panels = [...slide.querySelectorAll('[data-metodos-conteudo]')];
    const durations = slide.dataset.etapasAutomaticas.split(' ').map(Number);
    let current = 0;
    let pending;

    function show(index) {
      current = index;
      slide.dataset.problemaEtapa = String(index + 1);
      steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
      panels.forEach((panel, i) => { panel.hidden = i !== current; });
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

    function onSlideVisibility() {
      stop();
      if (slide.hidden) return;
      show(0);
      if (reducedMotion.matches) return;
      slide.dataset.problemaPlaying = 'true';
      schedule();
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
  }

  document.querySelectorAll('[data-etapas-automaticas]').forEach(bindSequence);
})();
