(() => {
  'use strict';
  const slide = document.getElementById('slide-5');
  const blocks = [...slide.querySelectorAll('.closing-block')];
  const button = document.getElementById('closing-advance');
  let step = 1;
  let timer;
  function draw(animate = false) {
    clearTimeout(timer);
    slide.dataset.step = String(step);
    blocks.forEach((block, i) => {
      const visible = i < step && step < 5;
      block.classList.toggle('is-revealed', visible);
      block.classList.toggle('is-current', i + 1 === step);
      block.classList.toggle('is-entering', animate && i + 1 === step);
      block.querySelector('p').setAttribute('aria-hidden', String(!visible));
    });
    slide.querySelector('.closing-blocks').setAttribute('aria-hidden', String(step === 5));
    slide.querySelector('.closing-message').setAttribute('aria-hidden', String(step !== 5));
    button.textContent = step === 5 ? 'Rever proposta ↺' : step === 4 ? 'Encerrar →' : 'Próxima etapa →';
    slide.querySelector('.closing-live').textContent = step === 5 ? 'Da integração das informações à priorização da manutenção.' : `${step} de 4. ${blocks[step-1].querySelector('h3').textContent}`;
    timer = setTimeout(() => blocks.forEach(block => block.classList.remove('is-entering')), 1100);
    document.dispatchEvent(new Event('closing-step'));
  }
  window.DECK_CLOSING = {
    get step() { return step; },
    reset() { step = 1; draw(true); },
    move(delta) { const target = Math.max(1, Math.min(5, step + delta)); if (target === step) return false; step = target; draw(true); return true; }
  };
  button.addEventListener('click', () => step === 5 ? window.DECK_CLOSING.reset() : window.DECK_CLOSING.move(1));
  draw();
})();
