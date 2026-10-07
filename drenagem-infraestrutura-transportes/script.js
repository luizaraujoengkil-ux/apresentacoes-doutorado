/* ===========================================================================
   DRENAGEM · BrIM — comportamento
   - escala o palco 1920×1080 para caber em qualquer janela (sem distorcer)
   - navegação por teclado (← → PageUp PageDown espaço Home End) e tela cheia (F)
   - gera as linhas de chuva da capa
   =========================================================================== */
(function(){
    const stage  = document.getElementById('stage');
    const slides = Array.from(document.querySelectorAll('.slide'));
    const TOTAL  = slides.length;
    const notesPanel = document.getElementById('notesPanel');
    let idx = 0;

    /* ---------- escala 16:9 ---------- */
    function fit(){
        const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
    window.addEventListener('resize', fit);
    fit();

    /* ---------- navegação ---------- */
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('tot').textContent = pad(TOTAL);

    // atualiza contador, barra de progresso, rodapé, notas e o #número na URL
    function sync(){
        document.getElementById('cur').textContent = pad(idx + 1);
        document.getElementById('progBar').style.width = ((idx + 1) / TOTAL * 100) + '%';
        stage.classList.toggle('on-cover', idx === 0);
        const n = slides[idx].querySelector('.notes');
        notesPanel.textContent = n ? n.textContent.replace(/\s+/g, ' ').trim() : '';
        history.replaceState(null, '', '#' + (idx + 1));
    }

    function go(i){
        if(i < 0 || i >= slides.length || i === idx) return;
        slides[idx].classList.remove('active');
        idx = i;
        slides[idx].classList.add('active');
        sync();
    }

    // abre direto no slide indicado na URL (ex.: index.html#3)
    const start = parseInt(location.hash.slice(1), 10);
    if(start >= 2 && start <= TOTAL){
        slides[0].classList.remove('active');
        idx = start - 1;
        slides[idx].classList.add('active');
    }
    sync();

    function toggleFs(){
        if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen();
    }
    const toggleNotes = () => notesPanel.classList.toggle('open');
    document.getElementById('btnFs').addEventListener('click', toggleFs);
    document.getElementById('btnNotes').addEventListener('click', toggleNotes);
    document.getElementById('btnPrev').addEventListener('click', () => go(idx - 1));
    document.getElementById('btnNext').addEventListener('click', () => go(idx + 1));

    document.addEventListener('keydown', e => {
        if(['ArrowRight','PageDown',' '].includes(e.key)){ e.preventDefault(); go(idx + 1); }
        else if(['ArrowLeft','PageUp'].includes(e.key)){ e.preventDefault(); go(idx - 1); }
        else if(e.key === 'Home') go(0);
        else if(e.key === 'End')  go(slides.length - 1);
        else if(e.key === 'f' || e.key === 'F') toggleFs();
        else if(e.key === 'n' || e.key === 'N') toggleNotes();
    });

    /* ---------- chuva da capa (linhas finas, pseudoaleatórias e estáveis) ---------- */
    const NS = 'http://www.w3.org/2000/svg';
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    function rain(layer, n, len){
        const g = document.querySelector('.rain-layer.' + layer);
        if(!g) return;
        for(let k = 0; k < n; k++){
            const x = rnd() * 1260, y = -40 + rnd() * 700;
            const l = document.createElementNS(NS, 'line');
            l.setAttribute('x1', x); l.setAttribute('y1', y);
            l.setAttribute('x2', x - len * .28); l.setAttribute('y2', y + len);
            g.appendChild(l);
        }
    }
    rain('r1', 150, 26);
    rain('r2', 200, 16);
})();
