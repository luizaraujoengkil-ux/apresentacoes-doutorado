/* ============================================================================
   SIMULADOR ANALÍTICO PMAV — LÓGICA DA APRESENTAÇÃO
   ----------------------------------------------------------------------------
   Organização do arquivo:
     1) DATA .............. todos os DADOS num só lugar (cenários + gráficos)
     2) Helpers ........... formatação pt-BR e contador numérico animado
     3) Chart.js .......... 3 gráficos reais (capa, simulador, comparação)
     4) Deck .............. palco fixo 16:9, navegação, revelações por slide
     5) Interações ........ toggle de cenário (slide 7), QR, GSAP ambiente
   Para trocar números, edite SÓ o objeto DATA abaixo.
   ============================================================================ */
'use strict';

/* respeita "reduzir movimento" do sistema */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================================
   1) DATA — dados separados dos gráficos (fácil de editar)
   ============================================================================ */
const DATA = {
    /* Cenários do slide 7 (valores reais informados) */
    scenarios: {
        base:      { previsto: 12695387, ajustado: 11429442, sistemas: 15, imediatos: 10, preditivos: 50,
                     critico: 'Estrutural', maiorCusto: 'Eletromecânico' },
        agressivo: { previsto: 16050954, ajustado: 14425399, sistemas: 15, imediatos: 10, preditivos: 50,
                     critico: 'Estrutural', maiorCusto: 'Eletromecânico' }
    },
    /* variação percentual Base → Agressivo */
    delta: { previsto: 26.4, ajustado: 26.2 },

    /* custo previsto por sistema — ILUSTRATIVO (vitrine da interface, slides 1 e 6) */
    systemsCost: {
        labels: ['Eletromec.', 'Estrutural', 'Hidráulico', 'Elétrico', 'Cobertura', 'Vedação'],
        values: [3.40, 3.05, 2.10, 1.65, 1.30, 1.20]   // em R$ milhões
    },

    /* dados do gráfico de comparação (slide 7) — valores reais */
    compare: {
        labels: ['Custo previsto', 'Custo ajustado'],
        base:      [12695387, 11429442],
        agressivo: [16050954, 14425399]
    }
};

/* ============================================================================
   2) HELPERS — formatação pt-BR + contador animado (requisito do projeto)
   ============================================================================ */
const fmtInt   = v => Math.round(v).toLocaleString('pt-BR');               // 12.695.387
const fmtDec   = (v, d) => v.toFixed(d).replace('.', ',');                 // 26,4
const fmtMi    = v => 'R$ ' + fmtDec(v, 1) + ' M';                         // eixo dos gráficos

/* formata o valor atual de um contador conforme seus data-attributes */
function formatCounter(el, v) {
    const d = el.dataset;
    let s;
    if (d.money === '1') s = fmtInt(v);
    else if (+(d.decimals || 0) > 0) s = fmtDec(v, +d.decimals);
    else s = fmtInt(v);
    return (d.prefix || '') + s + (d.suffix || '');
}

/* anima um número de "from" até "count" com easeOutCubic */
function animateCounter(el) {
    const d = el.dataset;
    const to   = parseFloat(d.count);
    const from = d.from !== undefined ? parseFloat(d.from) : 0;
    const dur  = +(d.dur || 1400);
    const t0   = performance.now();

    function frame(now) {
        const t = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - t, 3);                 // easeOutCubic
        el.textContent = formatCounter(el, from + (to - from) * e);
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = formatCounter(el, to);
    }
    requestAnimationFrame(frame);
}

/* dispara todos os contadores de um slide, respeitando data-delay */
function runCounters(slide) {
    slide.querySelectorAll('[data-count]').forEach(el => {
        const start = el.dataset.from !== undefined ? parseFloat(el.dataset.from) : 0;
        el.textContent = formatCounter(el, start);        // estado inicial
        if (REDUCED) { el.textContent = formatCounter(el, parseFloat(el.dataset.count)); return; }
        setTimeout(() => animateCounter(el), +(el.dataset.delay || 0));
    });
}

/* faz as barras "crescerem" (largura 0 → alvo); reinicia a cada visita */
function runBars(slide) {
    slide.querySelectorAll('[data-bar]').forEach(b => {
        const target = b.dataset.bar + '%';
        b.style.width = '0%';
        if (REDUCED) { b.style.width = target; return; }
        requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = target; }));
    });
}
function resetBars(slide) { slide.querySelectorAll('[data-bar]').forEach(b => b.style.width = '0%'); }

/* ============================================================================
   3) CHART.JS — 3 gráficos reais (degradam com elegância se a CDN falhar)
   ============================================================================ */
const charts = {};   // guarda instâncias para não recriar

function chartReady() { return typeof window.Chart !== 'undefined'; }

function setupChartDefaults() {
    if (!chartReady()) return;
    Chart.defaults.font.family = "'Space Mono', monospace";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = '#8fa4c6';
    Chart.defaults.plugins.legend.display = false;
}

/* gradiente vertical reutilizável */
function vGrad(ctx, c1, c2, h = 240) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    return g;
}

/* gráfico "custo por sistema" (capa e simulador) */
function buildSystemsChart(canvasId) {
    if (!chartReady() || charts[canvasId]) return;
    const cv = document.getElementById(canvasId);
    if (!cv) return;
    const ctx = cv.getContext('2d');
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: DATA.systemsCost.labels,
            datasets: [{
                data: DATA.systemsCost.values,
                backgroundColor: DATA.systemsCost.values.map((_, i) =>
                    i === 0 ? vGrad(ctx, '#ffa630', 'rgba(255,68,94,.5)')      // Eletromec. = maior custo
                            : i === 1 ? vGrad(ctx, '#ff445e', 'rgba(255,68,94,.35)')  // Estrutural = crítico
                            : vGrad(ctx, '#2fe4d8', 'rgba(47,228,216,.25)')),
                borderRadius: 6, borderSkipped: false, maxBarThickness: 46
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: REDUCED ? 0 : 1200, easing: 'easeOutQuart' },
            plugins: { tooltip: { callbacks: { label: c => fmtMi(c.parsed.y) } } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, grid: { color: 'rgba(120,160,220,.1)' },
                     ticks: { callback: v => 'R$ ' + v + 'M', font: { size: 10 } } }
            }
        }
    });
}

/* gráfico de comparação Base × Agressivo (slide 7) */
function buildCompareChart() {
    if (!chartReady() || charts.compare) return;
    const cv = document.getElementById('compareChart');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    charts.compare = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: DATA.compare.labels,
            datasets: [
                { label: 'Base', data: DATA.compare.base,
                  backgroundColor: vGrad(ctx, '#2fe4d8', 'rgba(25,182,196,.45)'),
                  borderRadius: 7, borderSkipped: false, maxBarThickness: 60 },
                { label: 'Ambiente agressivo', data: DATA.compare.agressivo,
                  backgroundColor: vGrad(ctx, '#ffa630', 'rgba(255,68,94,.55)'),
                  borderRadius: 7, borderSkipped: false, maxBarThickness: 60 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: REDUCED ? 0 : 1400, easing: 'easeOutQuart', delay: REDUCED ? 0 : 600 },
            plugins: {
                legend: { display: true, position: 'top', labels: { boxWidth: 12, boxHeight: 12, padding: 14, font: { size: 11 } } },
                tooltip: { callbacks: { label: c => c.dataset.label + ': R$ ' + fmtInt(c.parsed.y) } }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, grid: { color: 'rgba(120,160,220,.1)' },
                     ticks: { callback: v => 'R$ ' + (v / 1e6).toFixed(0) + 'M', font: { size: 10 } } }
            }
        }
    });
}

/* ============================================================================
   4) DECK — palco fixo 16:9, navegação e revelações por slide
   ============================================================================ */
class Deck {
    constructor() {
        this.stage   = document.getElementById('deckStage');
        this.slides  = Array.from(document.querySelectorAll('.slide'));
        this.total   = this.slides.length;
        this.current = 0;
        this.wheelLock = false;

        this.btnPrev = document.getElementById('btnPrev');
        this.btnNext = document.getElementById('btnNext');
        this.curNum  = document.getElementById('curNum');
        this.totNum  = document.getElementById('totNum');
        this.bar     = document.getElementById('progressBar');
        this.dotsWrap = document.getElementById('deckDots');
        this.kbHint  = document.getElementById('kbHint');

        this.totNum.textContent = String(this.total).padStart(2, '0');
        this.buildDots();
        this.bindEvents();
        this.scaleStage();
        this.go(0, true);
    }

    /* escala o palco 1920×1080 para caber na janela (mantém 16:9) */
    scaleStage() {
        const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        const x = (window.innerWidth  - 1920 * s) / 2;
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

        document.addEventListener('keydown', e => {
            switch (e.key) {
                case 'ArrowRight': case ' ': case 'PageDown': case 'ArrowDown':
                    e.preventDefault(); this.next(); break;
                case 'ArrowLeft': case 'PageUp': case 'ArrowUp':
                    e.preventDefault(); this.prev(); break;
                case 'Home': e.preventDefault(); this.go(0); break;
                case 'End':  e.preventDefault(); this.go(this.total - 1); break;
                case 'f': case 'F': this.toggleFullscreen(); break;
            }
        });

        /* scroll travado: um gesto = um slide */
        window.addEventListener('wheel', e => {
            e.preventDefault();
            if (this.wheelLock || Math.abs(e.deltaY) < 14) return;
            this.wheelLock = true;
            (e.deltaY > 0) ? this.next() : this.prev();
            setTimeout(() => (this.wheelLock = false), 820);
        }, { passive: false });

        /* swipe (toque) */
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
        /* adiciona .visible no próximo frame para disparar as transições .reveal */
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

    /* ações específicas ao entrar em cada slide (0-based) */
    onEnter(i) {
        const slide = this.slides[i];
        runCounters(slide);
        runBars(slide);

        if (i === 0) buildSystemsChart('mockChart1');                 // capa
        if (i === 5) buildSystemsChart('simChart');                   // simulador
        if (i === 6) { buildCompareChart(); setScenario('comparar'); } // resultado
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
    }
}

/* ============================================================================
   5) INTERAÇÕES — toggle de cenário (slide 7), QR placeholder, GSAP ambiente
   ============================================================================ */

/* alterna Base / Agressivo / Comparar no slide 7 */
function setScenario(view) {
    document.querySelectorAll('#s7Toggle button').forEach(b =>
        b.classList.toggle('on', b.dataset.scn === view));

    const baseCol = document.querySelector('[data-scn-col="base"]');
    const agrCol  = document.querySelector('[data-scn-col="agressivo"]');
    if (baseCol) baseCol.classList.toggle('dim', view === 'agressivo');
    if (agrCol)  agrCol.classList.toggle('dim', view === 'base');

    if (charts.compare) {
        charts.compare.data.datasets[0].hidden = (view === 'agressivo'); // Base
        charts.compare.data.datasets[1].hidden = (view === 'base');      // Agressivo
        charts.compare.update();
    }
}

function bindScenarioToggle() {
    const wrap = document.getElementById('s7Toggle');
    if (!wrap) return;
    wrap.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (b) setScenario(b.dataset.scn);
    });
}

/* QR placeholder estilizado (decorativo) — 11×11 com 3 marcadores de canto */
function buildQR() {
    const grid = document.getElementById('qrGrid');
    if (!grid) return;
    const N = 11;
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const inFinder = (r, c) =>
        (r < 3 && c < 3) || (r < 3 && c > N - 4) || (r > N - 4 && c < 3);
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const cell = document.createElement('i');
            const on = inFinder(r, c)
                ? !((r === 1 || r === N - 2) && (c === 1 || c === N - 2)) // anel dos marcadores
                : rnd() > 0.52;
            cell.className = on ? 'on' : 'off';
            grid.appendChild(cell);
        }
    }
}

/* animações de ambiente com GSAP (só decorativo; ignora se a CDN falhar) */
function ambientGSAP() {
    if (typeof window.gsap === 'undefined' || REDUCED) return;
    gsap.to('[data-orb="1"]', { x: 34, y: 26, duration: 9,  repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('[data-orb="2"]', { x: -30, y: -22, duration: 11, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('[data-orb="3"]', { x: -26, y: 20, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

/* ============================================================================
   BOOT
   ============================================================================ */
window.addEventListener('DOMContentLoaded', () => {
    setupChartDefaults();
    buildQR();
    bindScenarioToggle();
    ambientGSAP();
    window.deck = new Deck();   // exposto p/ depuração no console
});
