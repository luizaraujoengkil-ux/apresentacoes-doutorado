/* ============================================================================
   ALIME — LÓGICA DA APRESENTAÇÃO
   ----------------------------------------------------------------------------
   1) Helpers ...... formatação pt-BR + contador animado
   2) Barras ....... crescimento das barras (slide 7)
   3) Deck ......... palco fixo 16:9, navegação, revelações por slide
   4) Extras ....... QR do simulador + orbes (GSAP)
   Os textos ficam no index.html; os números animados usam data-count.
   ============================================================================ */
'use strict';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* modo de captura estática: index.html?still — mostra tudo sem animação (p/ revisão) */
const STILL = /[?&]still/.test(location.search);
const NOANIM = REDUCED || STILL;

/* ============================================================================
   1) HELPERS — formatação + contador
   ============================================================================ */
const fmtInt = v => Math.round(v).toLocaleString('pt-BR');
const fmtDec = (v, d) => v.toFixed(d).replace('.', ',');

function formatCounter(el, v) {
    const d = el.dataset;
    let s;
    if (d.money === '1') s = fmtInt(v);
    else if (+(d.decimals || 0) > 0) s = fmtDec(v, +d.decimals);
    else s = fmtInt(v);
    return (d.prefix || '') + s + (d.suffix || '');
}

function animateCounter(el) {
    const d = el.dataset;
    const to = parseFloat(d.count);
    const from = d.from !== undefined ? parseFloat(d.from) : 0;
    const dur = +(d.dur || 1400);
    const t0 = performance.now();
    function frame(now) {
        const t = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - t, 3);            // easeOutCubic
        el.textContent = formatCounter(el, from + (to - from) * e);
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = formatCounter(el, to);
    }
    requestAnimationFrame(frame);
}

function runCounters(slide) {
    slide.querySelectorAll('[data-count]').forEach(el => {
        const start = el.dataset.from !== undefined ? parseFloat(el.dataset.from) : 0;
        el.textContent = formatCounter(el, start);
        if (NOANIM) { el.textContent = formatCounter(el, parseFloat(el.dataset.count)); return; }
        setTimeout(() => animateCounter(el), +(el.dataset.delay || 0));
    });
}

/* ============================================================================
   2) BARRAS — crescem de 0 ao alvo (reinicia a cada visita)
   ============================================================================ */
function runBars(slide) {
    slide.querySelectorAll('[data-bar]').forEach(b => {
        const target = b.dataset.bar + '%';
        b.style.width = '0%';
        if (NOANIM) { b.style.width = target; return; }
        requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = target; }));
    });
}
function resetBars(slide) { slide.querySelectorAll('[data-bar]').forEach(b => b.style.width = '0%'); }

/* ============================================================================
   3) DECK — palco fixo 16:9, navegação e revelações
   ============================================================================ */
class Deck {
    constructor() {
        this.stage = document.getElementById('deckStage');
        this.slides = Array.from(document.querySelectorAll('.slide'));
        this.total = this.slides.length;
        this.current = 0;
        this.wheelLock = false;

        this.btnPrev = document.getElementById('btnPrev');
        this.btnNext = document.getElementById('btnNext');
        this.btnFs   = document.getElementById('btnFs');
        this.curNum = document.getElementById('curNum');
        this.totNum = document.getElementById('totNum');
        this.bar = document.getElementById('progressBar');
        this.dotsWrap = document.getElementById('deckDots');
        this.kbHint = document.getElementById('kbHint');

        this.totNum.textContent = String(this.total).padStart(2, '0');
        this.buildDots();
        this.bindEvents();
        this.scaleStage();
        this.go(0, true);
    }

    scaleStage() {
        const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        const x = (window.innerWidth - 1920 * s) / 2;
        const y = (window.innerHeight - 1080 * s) / 2;
        this.stage.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    }

    buildDots() {
        this.dots = this.slides.map((_, i) => {
            const b = document.createElement('button');
            b.setAttribute('aria-label', 'Slide ' + (i + 1));
            b.addEventListener('click', () => this.go(i));
            this.dotsWrap.appendChild(b);
            return b;
        });
    }

    bindEvents() {
        window.addEventListener('resize', () => this.scaleStage());
        this.btnPrev.addEventListener('click', () => this.prev());
        this.btnNext.addEventListener('click', () => this.next());
        if (this.btnFs) this.btnFs.addEventListener('click', () => this.toggleFullscreen());

        document.addEventListener('keydown', e => {
            switch (e.key) {
                case 'ArrowRight': case ' ': case 'PageDown': case 'ArrowDown':
                    e.preventDefault(); this.next(); break;
                case 'ArrowLeft': case 'PageUp': case 'ArrowUp':
                    e.preventDefault(); this.prev(); break;
                case 'Home': e.preventDefault(); this.go(0); break;
                case 'End': e.preventDefault(); this.go(this.total - 1); break;
                case 'f': case 'F': this.toggleFullscreen(); break;
            }
        });

        window.addEventListener('wheel', e => {
            e.preventDefault();
            if (this.wheelLock || Math.abs(e.deltaY) < 14) return;
            this.wheelLock = true;
            (e.deltaY > 0) ? this.next() : this.prev();
            setTimeout(() => (this.wheelLock = false), 820);
        }, { passive: false });

        let tx = 0, ty = 0;
        window.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
        window.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? this.next() : this.prev());
        }, { passive: true });
    }

    go(i, initial = false) {
        i = Math.max(0, Math.min(this.total - 1, i));
        if (i === this.current && !initial) return;

        this.slides.forEach((s, idx) => {
            if (idx !== i) { s.classList.remove('active', 'visible'); resetBars(s); }
        });

        const cur = this.slides[i];
        cur.classList.add('active');
        requestAnimationFrame(() => requestAnimationFrame(() => cur.classList.add('visible')));

        this.current = i;
        this.updateChrome();
        this.onEnter(i);
        if (!initial && this.kbHint) this.kbHint.classList.add('hide');
    }
    next() { this.go(this.current + 1); }
    prev() { this.go(this.current - 1); }

    updateChrome() {
        this.curNum.textContent = String(this.current + 1).padStart(2, '0');
        this.bar.style.width = ((this.current + 1) / this.total * 100) + '%';
        this.btnPrev.disabled = this.current === 0;
        this.btnNext.disabled = this.current === this.total - 1;
        this.dots.forEach((d, i) => d.classList.toggle('on', i === this.current));
    }

    onEnter(i) {
        const slide = this.slides[i];
        runCounters(slide);
        runBars(slide);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
    }
}

/* ============================================================================
   4) EXTRAS — QR do simulador + orbes (GSAP)
   ============================================================================ */
const SIM_URL = 'https://anzhkry7bnjfiwup4xjesf.streamlit.app';

function buildQR() {
    const grid = document.getElementById('qrGrid');
    if (!grid) return;

    if (typeof window.qrcode === 'function') {
        try {
            const qr = window.qrcode(0, 'M');
            qr.addData(SIM_URL);
            qr.make();
            grid.innerHTML = qr.createImgTag(5, 0);
            return;
        } catch (e) { /* cai no placeholder */ }
    }

    // placeholder offline (11×11 com marcadores de canto)
    grid.classList.add('placeholder');
    const N = 11;
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const inFinder = (r, c) => (r < 3 && c < 3) || (r < 3 && c > N - 4) || (r > N - 4 && c < 3);
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const cell = document.createElement('i');
            const on = inFinder(r, c)
                ? !((r === 1 || r === N - 2) && (c === 1 || c === N - 2))
                : rnd() > 0.52;
            if (on) cell.className = 'on';
            grid.appendChild(cell);
        }
    }
}

function ambientGSAP() {
    if (typeof window.gsap === 'undefined' || REDUCED) return;
    gsap.to('[data-orb="1"]', { x: 32, y: 24, duration: 9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('[data-orb="2"]', { x: -28, y: -20, duration: 11, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

/* ============================================================================
   BOOT
   ============================================================================ */
window.addEventListener('DOMContentLoaded', () => {
    if (STILL) document.body.classList.add('still');
    buildQR();
    ambientGSAP();
    window.deck = new Deck();

    /* deep-link opcional: index.html#5 abre direto no slide 5 */
    const jump = () => {
        const n = parseInt(location.hash.replace('#', ''), 10);
        if (n >= 1 && n <= window.deck.total) window.deck.go(n - 1);
    };
    jump();
    window.addEventListener('hashchange', jump);
});
