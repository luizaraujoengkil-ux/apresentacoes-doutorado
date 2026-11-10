(() => {
  const cover = document.getElementById('capa');
  const title = cover?.querySelector('#title-cover');
  const treatment = cover?.querySelector('.cover-treatment');
  const rust = cover?.querySelector('.repair-rust-layer');
  const steel = cover?.querySelector('.repair-steel-layer');
  if (!title || !treatment || !rust || !steel) return;

  // Character index, position within glyph, bar angle and dimensions in em.
  const marks = [
    { at: 0,  letter: 'A', x: .765, y: .49, angle: 70, length: .55, depth: .36, runoff: .60 },
    { at: 16, letter: 't', x: .66, y: .88, angle: 1, length: .38, depth: .30 },
    { at: 25, letter: 'p', x: .19, y: .49, angle: 88, length: .66, depth: .35, runoff: .60 },
    { at: 28, letter: 'i', x: .51, y: .63, angle: 91, length: .30, depth: .29, runoff: .39 },
    { at: 30, letter: 'i', x: .50, y: .70, angle: 87, length: .36, depth: .30 },
    { at: 33, letter: 'p', x: .19, y: .49, angle: 93, length: .58, depth: .33, runoff: .57 },
    { at: 35, letter: 'o', x: .81, y: .46, angle: 82, length: .36, depth: .33 },
    { at: 38, letter: 't', x: .49, y: .51, angle: 87, length: .46, depth: .32, runoff: .46 },
    { at: 40, letter: 'd', x: .84, y: .47, angle: 88, length: .55, depth: .34, runoff: .59 },
    { at: 48, letter: 'd', x: .82, y: .43, angle: 93, length: .61, depth: .36, runoff: .59 },
    { at: 50, letter: 'o', x: .81, y: .55, angle: 103, length: .36, depth: .33 },
  ];
  const measure = document.createElement('canvas').getContext('2d');
  const namespace = 'http://www.w3.org/2000/svg';

  function glyphNodes() {
    const nodes = [];
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function addSymbol(parent, symbol, x, y, rotation, length, depth) {
    const instance = document.createElementNS(namespace, 'use');
    instance.setAttribute('href', '#' + symbol);
    instance.setAttribute('x', '-50');
    instance.setAttribute('y', '-26');
    instance.setAttribute('width', '100');
    instance.setAttribute('height', '54');
    instance.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation}) scale(${length / 100} ${depth / 54})`);
    parent.append(instance);
  }

  let lastSignature = '';
  function draw(force = false) {
    const bounds = treatment.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const style = getComputedStyle(title);
    const em = parseFloat(style.fontSize);
    const signature = [bounds.width, bounds.height, style.fontSize, style.fontFamily].join('/');
    if (signature === lastSignature && !force) return;
    lastSignature = signature;
    if (measure) measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const nodes = glyphNodes();
    const rustFragment = document.createDocumentFragment();
    const steelFragment = document.createDocumentFragment();
    const range = document.createRange();

    for (const mark of marks) {
      let offset = mark.at;
      const node = nodes.find(text => {
        if (offset < text.length) return true;
        offset -= text.length;
        return false;
      });
      if (!node || node.data[offset] !== mark.letter) continue;
      range.setStart(node, offset);
      range.setEnd(node, offset + 1);
      const glyph = range.getBoundingClientRect();
      if (!glyph.width) continue;
      const metric = measure?.measureText(mark.letter);
      const ascent = metric?.fontBoundingBoxAscent ?? em * .8;
      const descent = metric?.fontBoundingBoxDescent ?? em * .2;
      const baseline = glyph.top + (glyph.height + ascent - descent) / 2 - bounds.top;
      const inkTop = baseline - (metric?.actualBoundingBoxAscent ?? em * .69);
      const inkBottom = baseline + (metric?.actualBoundingBoxDescent ?? 0);
      const x = glyph.left - bounds.left + glyph.width * mark.x;
      const y = inkTop + (inkBottom - inkTop) * mark.y;
      const depth = em * mark.depth;
      const length = em * mark.length;

      if (mark.runoff) {
        const runoffDepth = Math.min(em * mark.runoff, Math.max(0, (inkBottom - y) * 1.67));
        if (runoffDepth > 2) addSymbol(rustFragment, 'cover-spall-runoff', x, y, 0, em * .31, runoffDepth);
      }
      addSymbol(rustFragment, 'cover-spall-rust', x, y, mark.angle, length, depth);
      addSymbol(steelFragment, 'cover-spall-steel', x, y, mark.angle, length, depth);
    }

    for (const [layer, fragments] of [[rust, rustFragment], [steel, steelFragment]]) {
      layer.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
      layer.replaceChildren(fragments);
    }
  }

  new ResizeObserver(() => draw()).observe(treatment);
  document.fonts?.ready.then(() => draw(true));
  document.addEventListener('deck:slide', ({ detail }) => {
    if (detail === cover.id) draw();
  });
  draw();
})();
