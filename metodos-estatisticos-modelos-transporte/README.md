# Simulador Analítico PMAV — Apresentação

Apresentação em **HTML + CSS + JavaScript puro** (sem build, sem React).
Matéria: **Métodos Estatísticos para Modelos de Transporte** · Doutorado em Transportes.

Tema: o **Simulador Analítico PMAV** — previsão de custos, simulação de cenários e
apoio à decisão em manutenção preventiva de ativos.

## Como abrir

- **Mais simples:** dê duplo clique em `index.html` (abre no navegador).
- **Recomendado (VS Code):** instale a extensão **Live Server** → clique direito em
  `index.html` → **Open with Live Server**. Garante o carregamento das CDNs (gráficos/animações).

> Com internet, os gráficos (Chart.js) e as animações (GSAP) carregam via CDN.
> Sem internet, a apresentação continua funcionando — gráficos e efeitos são degradados com elegância.

## Navegação

| Ação            | Como                                              |
| --------------- | ------------------------------------------------- |
| Avançar         | `→` · `Espaço` · `PageDown` · scroll para baixo · botão ▸ |
| Voltar          | `←` · `PageUp` · scroll para cima · botão ◂        |
| Ir a um slide   | clique nos **dots** à direita                     |
| Início / Fim    | `Home` / `End`                                    |
| Tela cheia      | `F`                                               |

## Estrutura

```
metodos-estatisticos-modelos-transporte/
├── index.html     ← os 8 slides (texto editável em cada <section class="slide">)
├── styles.css     ← tema, layout e animações (variáveis em :root)
├── script.js      ← navegação + dados dos gráficos (objeto DATA) + contadores
├── assets/        ← imagens (opcional)
└── README.md
```

## Os 8 slides

1. **Capa** — tese central + mockup do simulador
2. **Problema** — dados dispersos → decisão limitada → PMAV analítico
3. **Originalidade** — Dados → Modelo → Simulação → Painel → Decisão
4. **Base teórica** — rede de temas e posicionamento
5. **Metodologia** — 5 etapas + fórmula da regressão (OLS)
6. **O simulador** — interface recriada com chamadas
7. **Resultado** — Base × Ambiente agressivo (+26,4% / +26,2%)
8. **Conclusão** — apoio à decisão + link e QR do simulador

## Como editar

- **Texto:** direto no `index.html`, dentro de cada `<section class="slide ...">`.
- **Números dos cenários e gráficos:** no `script.js`, objeto **`DATA`** (topo do arquivo).
- **Cores e tipografia:** no `styles.css`, bloco **`:root`** (variáveis `--cyan`, `--amber`, fontes, etc.).
- **Autor / instituição / contato:** placeholders `[ ... ]` nos slides 1 e 8.

## Simulador

Link da ferramenta: <https://simulador-pmav-vistopred.streamlit.app>

O botão **ARTIGO (PDF)** no slide 8 aponta para `assets/artigo-pmav.pdf` — coloque o PDF do artigo nesse caminho/nome.
