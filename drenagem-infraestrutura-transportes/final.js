'use strict';

const slides = Array.from(document.querySelectorAll('.slide'));
const markers = document.getElementById('markers');
const previous = document.getElementById('previous');
const next = document.getElementById('next');
const fullscreen = document.getElementById('fullscreen');
const counter = document.getElementById('counter');
let active = 0;

const dots = slides.map((slide, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', `Slide ${index + 1} · ${slide.querySelector('h1, h2').textContent}`);
  button.setAttribute('aria-controls', slide.id);
  button.addEventListener('click', () => show(index));
  markers.append(button);
  return button;
});

function show(index, updateAddress = true) {
  active = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, position) => {
    slide.hidden = position !== active;
    if (position === active) dots[position].setAttribute('aria-current', 'step');
    else dots[position].removeAttribute('aria-current');
  });
  previous.disabled = active === 0;
  next.disabled = active === slides.length - 1;
  counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  if (updateAddress) {
    history.replaceState(null, '', `#${slides[active].id}`);
    window.scrollTo(0, 0);
  }
}

function showHash() {
  const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
  if (index >= 0) show(index, false);
}

async function toggleFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen();
  else if (document.fullscreenEnabled) await document.documentElement.requestFullscreen();
}

previous.addEventListener('click', () => show(active - 1));
next.addEventListener('click', () => show(active + 1));
fullscreen.hidden = !document.fullscreenEnabled;
fullscreen.addEventListener('click', toggleFullscreen);
window.addEventListener('hashchange', showHash);
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest('button, a, input, select, textarea') && event.key === ' ') return;
  const direction = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ' ': 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 };
  if (Object.hasOwn(direction, event.key)) {
    event.preventDefault();
    show(active + (event.shiftKey && event.key === ' ' ? -1 : direction[event.key]));
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    show(event.key === 'Home' ? 0 : slides.length - 1);
  } else if (event.key.toLowerCase() === 'f' && document.fullscreenEnabled) {
    toggleFullscreen();
  }
});

show(0, false);
showHash();
