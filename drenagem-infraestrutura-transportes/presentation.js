(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const dots = [...document.querySelectorAll('[data-slide]')];
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const counter = document.getElementById('slide-counter');
  const progress = document.getElementById('progress-fill');
  const data = window.DECK_CONTENT || {};
  let index = 0;
  let lastFocused = null;

  function resize() {
    const availableHeight = Math.max(100, window.innerHeight - 74);
    const scale = Math.min(window.innerWidth / 1600, availableHeight / 900);
    document.documentElement.style.setProperty('--scale', String(scale));
  }
  function showSlide(nextIndex, updateHash = true) {
    index = Math.max(0, Math.min(slides.length - 1, nextIndex));
    slides.forEach((slide, i) => { slide.hidden = i !== index; slide.classList.toggle('is-active', i === index); });
    dots.forEach((dot, i) => { if (i === index) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current'); });
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / 04`;
    progress.style.width = `${(index + 1) * 25}%`;
    document.title = `${slides[index].dataset.name} · BrIM e risco hidrológico · IME`;
    if (updateHash) history.replaceState(null, '', `#${index + 1}`);
    if (window.innerWidth <= 700) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    const existing = document.querySelector('dialog[open]');
    if (existing) existing.close();
    lastFocused = document.activeElement;
    dialog.showModal();
  }
  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message; el.hidden = false;
    window.setTimeout(() => { el.hidden = true; }, 4500);
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { toast('Use F11 no navegador para abrir a apresentação em tela cheia.'); }
  }

  previous.addEventListener('click', () => showSlide(index - 1));
  next.addEventListener('click', () => showSlide(index + 1));
  dots.forEach(dot => dot.addEventListener('click', () => showSlide(Number(dot.dataset.slide))));
  document.getElementById('fullscreen').addEventListener('click', fullscreen);
  document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.dialog)));
  document.querySelectorAll('[data-switch-dialog]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.switchDialog)));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { if (lastFocused?.isConnected) lastFocused.focus(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || document.querySelector('dialog[open]')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); showSlide(index + 1); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); showSlide(index - 1); }
    if (event.key === 'Home') { event.preventDefault(); showSlide(0); }
    if (event.key === 'End') { event.preventDefault(); showSlide(3); }
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); fullscreen(); }
  });
  window.addEventListener('resize', resize);
  window.addEventListener('hashchange', () => { const n = Number(location.hash.slice(1)); if (Number.isInteger(n) && n >= 1 && n <= 4) showSlide(n - 1, false); });

  const queries = document.getElementById('query-list');
  (data.queries || []).forEach(query => {
    const details = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = query.label;
    const pre = document.createElement('pre'); pre.textContent = query.expression;
    details.append(summary, pre); queries.append(details);
  });

  function makeEvidenceTable(container) {
    if (!data.evidence?.length) return;
    const wrap = document.createElement('div'); wrap.className = 'evidence-overflow';
    const table = document.createElement('table'); table.className = 'evidence-table';
    const thead = document.createElement('thead'); const header = document.createElement('tr');
    ['Estudo', 'Objetivo', 'Método', 'Resultados', 'Conclusão e uso no artigo'].forEach(label => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; header.append(th); });
    thead.append(header); table.append(thead);
    const tbody = document.createElement('tbody');
    data.evidence.forEach(study => {
      const row = document.createElement('tr');
      const lead = document.createElement('td');
      const title = document.createElement('strong'); title.textContent = study.title;
      const author = document.createElement('small'); author.textContent = study.authors;
      const link = document.createElement('a'); link.href = study.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Artigo original ↗';
      lead.append(title, author, link); row.append(lead);
      [study.objective, study.method, study.results, study.conclusion].forEach(value => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); });
      tbody.append(row);
    });
    table.append(tbody); wrap.append(table); container.append(wrap);
  }
  makeEvidenceTable(document.getElementById('evidence-table'));

  const networkContainer = document.getElementById('network-container');
  if (data.networkSvg) {
    networkContainer.innerHTML = data.networkSvg;
    const svg = networkContainer.querySelector('svg');
    if (svg) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Rede exploratória de coocorrência de 25 termos em 131 documentos do OpenAlex.'); svg.removeAttribute('width'); svg.removeAttribute('height'); }
  } else {
    const img = document.createElement('img'); img.src = 'assets/rede_coocorrencia_131_wide.svg'; img.alt = 'Rede de coocorrência de termos em 131 documentos do OpenAlex'; networkContainer.append(img);
  }
  if (data.networkNotes) document.getElementById('network-detail').textContent = data.networkNotes;

  resize();
  const initialHash = Number(location.hash.slice(1));
  showSlide(Number.isInteger(initialHash) && initialHash >= 1 && initialHash <= 4 ? initialHash - 1 : 0, false);
})();
