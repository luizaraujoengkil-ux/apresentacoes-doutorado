# Apresentações — Doutorado em Transportes

Apresentações interativas em **HTML, CSS e JavaScript** (formato 16:9, tema escuro/técnico),
organizadas por matéria. Cada matéria tem a sua própria pasta, com `index.html` e `assets/` isolados.

Abra **`inicio.html`** para o índice (hub) com a navegação entre as matérias.

## Estrutura

```
.
├── inicio.html                                   # página principal (hub)
├── index.html                                    # apenas redireciona para inicio.html
│
├── problemas-especiais-ciencia-dados-deep-learning/
│   └── index.html        # Resiliência da Rede Viária diante da Interdição de OAEs Críticas (OAE-SIM)
│
├── metodos-estatisticos-modelos-transporte/      # (em preparação)
└── planejamento-transportes/                     # (em preparação)
```

## Apresentações

| Matéria | Tema | Status |
|---|---|---|
| Problemas Especiais: Ciência de Dados e Aprendizado Profundo aplicados aos Transportes | Resiliência da Rede Viária diante da Interdição de OAEs Críticas · **OAE-SIM** (8 slides) | Pronta |
| Métodos Estatísticos para Modelos de Transporte | — | Em preparação |
| Planejamento de Transportes | — | Em preparação |

## Como abrir

- **Simples:** abra `inicio.html` no navegador.
- **Servidor local** (recomendado para carregar imagens sem restrições):

```bash
python -m http.server 5500
# depois acesse http://127.0.0.1:5500/
```

## Navegação nos slides

`→` / espaço / scroll = próximo · `←` = anterior · `Home` / `End` · `F` = tela cheia.

---

Cada apresentação é um único arquivo `index.html` autocontido (HTML/CSS/JS embutidos), sem dependências de build.
