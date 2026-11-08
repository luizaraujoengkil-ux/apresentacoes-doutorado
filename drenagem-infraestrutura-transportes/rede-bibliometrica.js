(() => {
  'use strict';
  const panel = document.querySelector('.graph-panel');
  if (!panel) return;

  const { nodes, links } = window.literatureGraph;
  const svg = panel.querySelector('svg');
  const status = panel.querySelector('.graph-status');
  const buttons = Array.from(document.querySelectorAll('[data-theme]'));
  const play = panel.querySelector('.graph-play');
  const ns = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = [
    { x: 224, y: 178, color: '#73e2f8', label: 'Hidráulica e erosão' },
    { x: 556, y: 178, color: '#c3afff', label: 'Monitoramento e gestão' },
  ];
  const themes = {
    water: { label: 'Água e drenagem', ids: [1, 4, 7, 12, 13, 24, 29, 37, 40] },
    maintenance: { label: 'Deterioração e manutenção', ids: [9, 10, 39, 28, 5, 14, 25, 27, 30] },
    digital: { label: 'BIM e BrIM', ids: [3, 6, 8, 11, 19, 20] },
  };
  const aliases = { 1:'Erosão localizada', 2:'Pilar de ponte', 3:'Gêmeo digital', 4:'Inundação', 5:'Monitoramento estrutural', 6:'BIM', 8:'Aprendizado de máquina', 9:'Manutenção', 10:'Inspeção', 11:'Inteligência artificial', 19:'BrIM', 25:'Gestão de pontes', 28:'Dano', 37:'Hidráulica', 39:'Detecção de danos' };
  const anchors = new Map();
  const rendered = new Map();
  let playback;
  let activeTheme = 'all';
  let activeNode = null;

  function element(tag, attrs, parent = svg) {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    parent.append(node);
    return node;
  }

  for (const [index, group] of groups.entries()) {
    const terms = nodes.filter(node => node.cluster === index + 1).sort((a,b) => b.frequency - a.frequency);
    element('ellipse', {cx:group.x, cy:group.y, rx:139, ry:115, fill:'none', stroke:group.color, 'stroke-dasharray':'3 8', opacity:'.22'});
    const heading = element('text', {x:group.x, y:28, 'text-anchor':'middle', fill:group.color, 'font-size':15, 'font-weight':700});
    heading.textContent = group.label;
    terms.forEach((node, position) => {
      const angle = position * 2.399963 + index * .75;
      const radius = Math.sqrt(position / (terms.length - 1));
      anchors.set(node.id, {x:group.x + Math.cos(angle)*radius*130, y:group.y + Math.sin(angle)*radius*111, color:group.color});
    });
  }

  const edges = links.map(({source,target,weight}) => {
    const a = anchors.get(source), b = anchors.get(target);
    return {source,target, line:element('line', {x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'graph-edge','stroke-width':Math.min(3.3, .65 + Math.sqrt(weight)*.25)})};
  });

  for (const node of nodes) {
    const { x,y,color } = anchors.get(node.id);
    const radius = 4 + Math.sqrt(node.frequency) * .6;
    const group = element('g', {class:'graph-node',tabindex:0,role:'button','aria-pressed':'false','aria-label':node.label + ', ' + node.frequency + ' documentos'});
    element('circle',{cx:x,cy:y,r:radius+8,fill:color,class:'halo'},group);
    element('circle',{cx:x,cy:y,r:radius,fill:color,stroke:'#f1f8ff','stroke-width':.75},group);
    element('title',{},group).textContent = node.label;
    const select = () => {
      stopPlayback();
      activeNode = activeNode === node.id ? null : node.id;
      draw(false);
    };
    group.addEventListener('click',select);
    group.addEventListener('keydown',event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select();
      }
    });
    rendered.set(node.id,group);
  }

  const labels = element('g', {class:'graph-labels','aria-hidden':'true'});

  function draw(animate) {
    svg.getAnimations({subtree:true}).forEach(animation => animation.cancel());
    const theme = themes[activeTheme];
    const ids = theme ? new Set(theme.ids) : null;
    const neighbors = activeNode === null ? null : new Set(edges.flatMap(edge =>
      edge.source === activeNode ? [edge.target] : edge.target === activeNode ? [edge.source] : []));
    const primary = activeNode === null ? ids : new Set([activeNode, ...neighbors]);
    buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.theme === activeTheme)));
    for (const [id, group] of rendered) {
      group.classList.toggle('is-dim', !!primary && !primary.has(id));
      group.classList.toggle('is-topic', !!ids && ids.has(id));
      if (animate && !reduce.matches && (!primary || primary.has(id))) {
        group.animate([{opacity:0,scale:.55},{opacity:1,scale:1}], {
          duration:580, delay:(id % 7)*55, easing:'ease-out', fill:'backwards',
        });
      }
      group.setAttribute('aria-pressed',String(id === activeNode));
    }
    for (const {source,target,line} of edges) {
      const lit = activeNode !== null ? source === activeNode || target === activeNode : !!ids && (ids.has(source) || ids.has(target));
      line.classList.toggle('is-lit', lit);
      line.classList.toggle('is-dim', !!primary && !lit);
      if (animate && !reduce.matches && (!primary || lit)) {
        const length = Math.hypot(line.x2.baseVal.value - line.x1.baseVal.value, line.y2.baseVal.value - line.y1.baseVal.value);
        line.animate([
          {opacity:0, strokeDasharray:length, strokeDashoffset:length},
          {opacity:lit ? .78 : .23, strokeDasharray:length, strokeDashoffset:0},
        ], {duration:850, delay:850, easing:'ease-out', fill:'backwards'});
      }
    }
    labels.replaceChildren();
    const featured = activeNode !== null ? [activeNode] : theme ? theme.ids.slice(0, 3) : [1, 3, 6, 9];
    for (const id of featured) {
      const {x,y} = anchors.get(id);
      const node = nodes.find(term => term.id === id);
      const label = element('text', {x, y:y + 20 + Math.sqrt(node.frequency)*.6, 'text-anchor':'middle'}, labels);
      label.textContent = aliases[id] || node.label;
    }
    if (animate && !reduce.matches) labels.animate([{opacity:0},{opacity:1}], {duration:350,delay:550,fill:'backwards'});
    const selected = nodes.find(node => node.id === activeNode);
    status.textContent = selected
      ? (aliases[selected.id] || selected.label) + ' · ' + selected.frequency + ' documentos · ' + neighbors.size + ' conexões na rede.'
      : theme ? theme.label + ' · ' + theme.ids.slice(0,4).map(id => aliases[id] || nodes.find(node => node.id === id).label).join(' · ')
      : '40 termos · 76 ligações · Selecione um tema ou toque em um termo.';
  }

  function stopPlayback() {
    clearTimeout(playback);
    playback = undefined;
    play.textContent = '▶ Reproduzir animação';
  }

  play.addEventListener('click', () => {
    if (playback !== undefined) {
      stopPlayback();
      return;
    }
    const sequence = Object.keys(themes);
    play.textContent = '■ Parar sequência';
    let index = 0;
    function advance() {
      activeTheme = sequence[index++];
      activeNode = null;
      draw(true);
      if (index < sequence.length) playback = setTimeout(advance, 3600);
      else playback = setTimeout(stopPlayback, 3600);
    }
    advance();
  });

  for (const button of buttons) {
    button.addEventListener('click', () => {
      stopPlayback();
      activeTheme = button.dataset.theme;
      activeNode = null;
      draw(true);
    });
  }
  draw(false);
})();
