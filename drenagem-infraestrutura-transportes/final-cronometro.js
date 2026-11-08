(() => {
  'use strict';
  const timer = document.getElementById('presentation-timer');
  const display = document.getElementById('timer-display');
  const play = document.getElementById('timer-play');
  const pause = document.getElementById('timer-pause');
  const stop = document.getElementById('timer-stop');
  let elapsed = 0;
  let startedAt = null;

  function render() {
    const total = Math.floor((elapsed + (startedAt === null ? 0 : performance.now() - startedAt)) / 1000);
    const seconds = String(total % 60).padStart(2, '0');
    const minutes = String(Math.floor(total / 60) % 60).padStart(2, '0');
    const hours = Math.floor(total / 3600);
    display.textContent = hours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
    timer.dataset.running = String(startedAt !== null);
    play.disabled = startedAt !== null;
    pause.disabled = startedAt === null;
    stop.disabled = startedAt === null && elapsed === 0;
  }

  play.addEventListener('click', () => {
    if (startedAt !== null) return;
    startedAt = performance.now();
    render();
  });
  pause.addEventListener('click', () => {
    if (startedAt === null) return;
    elapsed += performance.now() - startedAt;
    startedAt = null;
    render();
  });
  stop.addEventListener('click', () => {
    elapsed = 0;
    startedAt = null;
    render();
  });
  window.setInterval(render, 250);
  render();
})();
