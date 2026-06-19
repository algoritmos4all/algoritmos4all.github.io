# Módulos Enriquecidos para Engenharia — Plano (Piloto)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o "molde de ouro" da nova didática — o módulo **06 — Laços de repetição** reescrito com analogias de engenharia, ilustração SVG inline, ~15 exercícios graduados e soluções com/sem gráfico (matplotlib) — junto das mudanças de plataforma que o habilitam (renderização de matplotlib no playground + CSS de apoio).

**Architecture:** Site estático SPA, sem build. O playground (`js/playground.js`) ganha a capacidade de renderizar figuras matplotlib do Pyodide como `<img>` PNG, carregando o pacote sob demanda. O CSS ganha componentes para selos de engenharia, faixas de dificuldade, soluções duplas e contêineres de SVG/gráfico. O conteúdo vive num fragmento HTML em `licoes/06-lacos-de-repeticao.html`.

**Tech Stack:** HTML/CSS/JS puro (ES modules), Pyodide 0.26.4 (CPython em WASM), matplotlib (pacote Pyodide), SVG inline. Publicação no GitHub Pages.

## Global Constraints

- **Sem etapa de build.** Tudo roda direto do estático no GitHub Pages.
- **Sem test runner no repositório.** Verificação é manual no navegador, com código exato para colar e saída/imagem esperada. Não introduzir framework de testes (YAGNI).
- **Pyodide já é carregado sob demanda** na primeira execução. O pacote `matplotlib` (vários MB) só pode ser baixado quando o código do usuário realmente o usa — lições sem gráfico não podem pagar esse custo.
- **Tkinter é proibido** (não roda no Pyodide). "Interface gráfica" = matplotlib.
- **Tema claro/escuro** via variáveis CSS já definidas em `css/style.css` (`--cor-*`). Todo SVG e estilo novo deve usar essas variáveis / `currentColor`, nunca cores fixas.
- **Idioma:** português do Brasil, tom acolhedor (mesmo registro das lições atuais).
- **Áreas de engenharia e ícones (fixos):** ⚙️ Mecânica, ⚡ Elétrica, 📡 Telecomunicações.
- **Faixas de dificuldade (fixas):** 🟢 Aquecimento, 🟡 Praticando, 🔴 Desafio de engenharia.
- **Markup de exemplo executável** (padrão existente, não alterar a estrutura):
  ```html
  <div class="exemplo">
    <div class="exemplo-barra"><span>Python</span>
      <button class="btn btn-executar">▶ Executar</button></div>
    <pre><code>...código...</code></pre>
  </div>
  ```
  Exemplos que usam matplotlib recebem `data-mpl` no `.exemplo`.

---

### Task 1: Renderização de matplotlib no playground

**Files:**
- Modify: `js/playground.js` (função `executar`, ~linhas 43-109; e `prepararExemplo` ~linhas 140-196 para `data-mpl`)
- Modify: `css/style.css` (acrescentar bloco "Gráfico do playground" após a seção `.saida`, ~linha 613)

**Interfaces:**
- Consumes: API do Pyodide já em uso — `pyodide.loadPackage(nome)`, `pyodide.runPythonAsync(codigo)`, `pyodide.setStdout/seStderr`, `pyodide.globals`.
- Produces:
  - Comportamento: quando o código contém `matplotlib`, o playground baixa o pacote, executa, captura todas as figuras abertas e as exibe como `<img class="saida-grafico">` logo após a `<pre class="saida">`.
  - Função interna nova `renderizarFiguras(pyodide, exemploEl)` → `Promise<void>`.
  - Helper `usaMatplotlib(codigo)` → `boolean` (regex `/\bmatplotlib\b/`).
  - Classe CSS pública: `.saida-grafico` (imagem do gráfico).

- [ ] **Step 1: Definir o critério de detecção (verificação manual com a regex)**

Adicionar, perto do topo do módulo (após os `const` de URL), o helper:

```javascript
// Detecta se um trecho de código usa matplotlib (para baixar o pacote só então).
function usaMatplotlib(codigo) {
  return /\bmatplotlib\b/.test(codigo);
}
```

Verificação (cole no console do navegador depois de carregar o site, ou num node REPL):
- `usaMatplotlib("import matplotlib.pyplot as plt")` → `true`
- `usaMatplotlib("print('oi')")` → `false`
- `usaMatplotlib("# nada de matplotlibrary aqui")` → `true` (aceitável: `\b` casa em "matplotlibrary"? Não — `\bmatplotlib\b` exige limite após "matplotlib"; "matplotlibrary" NÃO casa). Confirme: deve dar `false`.

- [ ] **Step 2: Carregar o pacote matplotlib sob demanda dentro de `executar`**

Em `js/playground.js`, dentro de `executar(codigo, elSaida, elBotao)`, logo após obter o `pyodide` e antes de `pyodide.runPythonAsync(codigo)` (após o bloco que injeta o `input`), inserir:

```javascript
    const comGrafico = usaMatplotlib(codigo);
    if (comGrafico) {
      status("Carregando matplotlib… (só na primeira vez)");
      await pyodide.loadPackage("matplotlib");
      elSaida.textContent = "";
      // Backend sem display + cores legíveis no tema atual.
      const escuro = document.documentElement.dataset.tema === "escuro";
      pyodide.globals.set("__tema_escuro__", escuro);
      await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use("AGG")
import matplotlib.pyplot as plt
plt.close("all")
_fg = "#f0e9e0" if __tema_escuro__ else "#2b2724"
_bg = "#241f1a" if __tema_escuro__ else "#ffffff"
matplotlib.rcParams.update({
    "figure.facecolor": _bg, "axes.facecolor": _bg, "savefig.facecolor": _bg,
    "text.color": _fg, "axes.labelcolor": _fg, "axes.edgecolor": _fg,
    "xtick.color": _fg, "ytick.color": _fg, "grid.color": _fg,
    "axes.titlecolor": _fg, "figure.figsize": (6.2, 3.8),
})
`);
    }
```

(`status` já é definido no início de `executar`.)

- [ ] **Step 3: Capturar e renderizar as figuras após executar o código**

Logo após `await pyodide.runPythonAsync(codigo);` (e antes do `if (elSaida.textContent.trim() === "")`), inserir:

```javascript
    if (comGrafico) {
      const figsB64 = await pyodide.runPythonAsync(`
import base64, io
import matplotlib.pyplot as plt
__figs__ = []
for _n in plt.get_fignums():
    _f = plt.figure(_n)
    _buf = io.BytesIO()
    _f.savefig(_buf, format="png", dpi=120, bbox_inches="tight")
    __figs__.append(base64.b64encode(_buf.getvalue()).decode())
plt.close("all")
__figs__
`);
      const lista = figsB64.toJs ? figsB64.toJs() : figsB64;
      for (const b64 of lista) {
        const img = document.createElement("img");
        img.className = "saida-grafico";
        img.alt = "Gráfico gerado pelo seu código";
        img.src = `data:image/png;base64,${b64}`;
        elSaida.parentElement.insertBefore(img, elSaida.nextSibling);
      }
      if (typeof figsB64.destroy === "function") figsB64.destroy();
    }
```

Nota: as imagens são inseridas como irmãs da `.saida`, dentro do `.exemplo`. Por isso, no início de `executar`, é preciso **remover gráficos antigos**. Ver Step 4.

- [ ] **Step 4: Limpar gráficos anteriores a cada execução**

No início de `executar`, logo após `elSaida.textContent = "";` (~linha 52), inserir:

```javascript
  // Remove imagens de gráficos de execuções anteriores deste exemplo.
  const exemploEl = elSaida.closest(".exemplo");
  if (exemploEl) {
    exemploEl.querySelectorAll(".saida-grafico").forEach((el) => el.remove());
  }
```

- [ ] **Step 5: Estilo da imagem do gráfico**

Em `css/style.css`, após o bloco `.saida ...` (depois da linha do `.saida .saida-status`, ~linha 613), adicionar:

```css
/* Gráfico (matplotlib) renderizado pelo playground. */
.saida-grafico {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  border-top: 1px solid #000;
  background: var(--cor-superficie);
}
```

- [ ] **Step 6: Verificação manual no navegador (tema claro e escuro)**

Servir o site localmente:

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000/#/licao/lacos-de-repeticao`. Num exemplo, colar e Executar:

```python
import matplotlib.pyplot as plt
ts = list(range(0, 20))
vs = [t * t for t in ts]
plt.plot(ts, vs, marker="o")
plt.title("Teste")
plt.xlabel("t"); plt.ylabel("v")
plt.show()
```

Esperado:
- Aparece o status "Carregando matplotlib…" na primeira vez.
- Surge uma imagem de gráfico (parábola) abaixo da área de saída.
- Alternar para tema escuro (botão 🌙/☀️) e Executar de novo: fundo do gráfico escuro, texto/eixos claros e legíveis.
- Executar um exemplo SÓ com `print(...)` (sem matplotlib) **não** dispara download do matplotlib (checar aba Network: nenhum request de `matplotlib*.whl`).

- [ ] **Step 7: Commit**

```bash
git add js/playground.js css/style.css
git commit -m "feat: renderiza figuras matplotlib no playground (carregamento sob demanda)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: CSS dos componentes didáticos

**Files:**
- Modify: `css/style.css` (acrescentar nova seção "Didática (engenharia)" antes da seção Responsivo, ~linha 661; e variáveis de área no `:root` e `[data-tema="escuro"]`)

**Interfaces:**
- Consumes: variáveis de tema existentes (`--cor-*`, `--raio*`, `--sombra`).
- Produces (classes/contratos de markup que a Task 3 vai usar):
  - `.analogia` — bloco de abertura com analogia de engenharia.
  - `.ilustracao` — contêiner responsivo para um `<svg>` inline.
  - `.eng-grid` — grade da seção "Na Engenharia".
  - `.eng-card` com modificadores `.eng-mec`, `.eng-ele`, `.eng-tel` — cartão por área (cor da borda/selo por área).
  - `.eng-card .eng-selo` — selo com ícone+nome da área.
  - `.exercicio` com modificadores `.nivel-facil`, `.nivel-medio`, `.nivel-dificil` — faixa de dificuldade (cor da borda esquerda + rótulo via `::before` no `.exercicio-faixa`).
  - `.exercicio-faixa` — rótulo textual do nível (🟢/🟡/🔴).
  - `.solucao-dupla` — wrapper de duas soluções.
  - `.solucao-bloco` com `.solucao-rotulo` — uma das soluções ("Sem gráfico" / "Com gráfico").

- [ ] **Step 1: Variáveis de cor por área de engenharia**

No `:root` (após `--cor-saida-fundo`, ~linha 23) adicionar:

```css
  --cor-mec: #2563eb;   /* Mecânica */
  --cor-ele: #ca8a04;   /* Elétrica */
  --cor-tel: #7c3aed;   /* Telecom  */
```

No `[data-tema="escuro"]` (após `--cor-saida-fundo`, ~linha 55) adicionar:

```css
  --cor-mec: #60a5fa;
  --cor-ele: #fbbf24;
  --cor-tel: #c4b5fd;
```

- [ ] **Step 2: Estilos da analogia e da ilustração SVG**

Antes da seção Responsivo (`@media (max-width: 820px)`, ~linha 663), inserir um bloco novo:

```css
/* --------------------------------------------------------------------------- Didática (engenharia) */

.analogia {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  background: var(--cor-superficie);
  border: 1px solid var(--cor-borda);
  border-left: 4px solid var(--cor-marca);
  border-radius: var(--raio);
  padding: 1rem 1.2rem;
  margin: 1.25rem 0 1.75rem;
  box-shadow: var(--sombra);
}

.analogia .analogia-icone {
  font-size: 1.6rem;
  line-height: 1.2;
}

.analogia p {
  margin: 0;
}

.ilustracao {
  margin: 1.5rem 0;
  text-align: center;
}

.ilustracao svg {
  max-width: 100%;
  height: auto;
}

.ilustracao figcaption {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--cor-texto-suave);
}
```

- [ ] **Step 3: Estilos da seção "Na Engenharia"**

Logo abaixo, no mesmo bloco:

```css
.eng-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  margin: 1.25rem 0;
}

.eng-card {
  border: 1px solid var(--cor-borda);
  border-top: 3px solid var(--cor-borda);
  border-radius: var(--raio);
  padding: 1rem 1.1rem;
  background: var(--cor-superficie);
  box-shadow: var(--sombra);
}

.eng-card .eng-selo {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
}

.eng-mec { border-top-color: var(--cor-mec); }
.eng-mec .eng-selo { color: var(--cor-mec); }
.eng-ele { border-top-color: var(--cor-ele); }
.eng-ele .eng-selo { color: var(--cor-ele); }
.eng-tel { border-top-color: var(--cor-tel); }
.eng-tel .eng-selo { color: var(--cor-tel); }
```

- [ ] **Step 4: Estilos das faixas de dificuldade dos exercícios**

Continuação do bloco:

```css
.exercicio-faixa {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  margin-bottom: 0.5rem;
}

.nivel-facil { border-left: 4px solid var(--cor-ok); }
.nivel-facil .exercicio-faixa { background: rgba(21, 128, 61, 0.14); color: var(--cor-ok); }
.nivel-medio { border-left: 4px solid var(--cor-ele); }
.nivel-medio .exercicio-faixa { background: rgba(202, 138, 4, 0.16); color: var(--cor-ele); }
.nivel-dificil { border-left: 4px solid var(--cor-erro); }
.nivel-dificil .exercicio-faixa { background: rgba(185, 28, 28, 0.14); color: var(--cor-erro); }
```

- [ ] **Step 5: Estilos das soluções duplas (com/sem gráfico)**

Continuação do bloco:

```css
.solucao-dupla {
  display: grid;
  gap: 1rem;
  margin-top: 0.5rem;
}

@media (min-width: 720px) {
  .solucao-dupla { grid-template-columns: 1fr 1fr; }
}

.solucao-bloco {
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  overflow: hidden;
}

.solucao-rotulo {
  display: block;
  padding: 0.4rem 0.75rem;
  background: var(--cor-superficie-2);
  border-bottom: 1px solid var(--cor-borda);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--cor-texto-suave);
}

.solucao-bloco .exemplo {
  margin: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
}
```

- [ ] **Step 6: Verificação manual (smoke test do CSS)**

Como o conteúdo que usa essas classes só chega na Task 3, validar agora com um fragmento temporário: abrir `http://localhost:8000/#/licao/lacos-de-repeticao` após colar, **temporariamente**, no topo de `licoes/06-lacos-de-repeticao.html`:

```html
<div class="analogia"><span class="analogia-icone">⚡</span><p>Teste de analogia.</p></div>
<div class="eng-grid">
  <div class="eng-card eng-mec"><span class="eng-selo">⚙️ Mecânica</span><p>x</p></div>
  <div class="eng-card eng-ele"><span class="eng-selo">⚡ Elétrica</span><p>x</p></div>
  <div class="eng-card eng-tel"><span class="eng-selo">📡 Telecom</span><p>x</p></div>
</div>
```

Esperado: bloco de analogia com barra colorida; três cartões com bordas superiores azul/amarela/roxa e selos coloridos. Conferir em tema claro e escuro. **Remover o trecho temporário** antes de commitar.

- [ ] **Step 7: Commit**

```bash
git add css/style.css
git commit -m "feat: estilos didáticos (analogia, ilustração, cards de engenharia, níveis, solução dupla)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Reescrever o módulo 06 — Laços de repetição (piloto)

**Files:**
- Modify (substituir conteúdo): `licoes/06-lacos-de-repeticao.html`

**Interfaces:**
- Consumes: classes CSS da Task 2 (`.analogia`, `.ilustracao`, `.eng-grid`, `.eng-card .eng-*`, `.exercicio .nivel-*`, `.exercicio-faixa`, `.solucao-dupla`, `.solucao-bloco`, `.solucao-rotulo`); renderização matplotlib da Task 1 (`.exemplo[data-mpl]`).
- Produces: fragmento HTML completo da lição, no padrão "molde de ouro", carregado pelo roteador existente. Sem `<html>/<head>/<body>` (é fragmento injetado em `<article class="licao">`).

Estrutura obrigatória da página, na ordem:
1. `<h1>Laços de repetição</h1>`
2. Bloco `.analogia` (ícone ⚡ + amostragem periódica de um sinal).
3. `.ilustracao` com **SVG inline** do ciclo do laço (condição → corpo → atualização → volta), usando `currentColor`/variáveis de tema.
4. Explicação progressiva de `while` e `for` com `range()` (reaproveitar/expandir o conteúdo atual, mantendo exemplos executáveis e o `.callout` de laço infinito).
5. `<h2>Na engenharia</h2>` + `.eng-grid` com um `.eng-card` por área (⚙️ Mecânica, ⚡ Elétrica, 📡 Telecom), cada um com um exemplo executável curto.
6. `<section class="exercicios">` com **15 exercícios** graduados: 5 🟢 `nivel-facil`, 6 🟡 `nivel-medio`, 4 🔴 `nivel-dificil`. Cada exercício é `<div class="exercicio nivel-...">` contendo `<span class="exercicio-faixa">`, enunciado e `<details>` com solução. Os 4 desafios usam `.solucao-dupla` (bloco "Sem gráfico" + bloco "Com gráfico" `data-mpl`).

- [ ] **Step 1: Cabeçalho, analogia e ilustração SVG**

Substituir o início de `licoes/06-lacos-de-repeticao.html` por:

```html
<h1>Laços de repetição</h1>

<div class="analogia">
  <span class="analogia-icone">⚡</span>
  <p>
    Pense num osciloscópio medindo uma tensão: ele <strong>repete</strong> a
    mesma medição a cada intervalo de tempo, milhares de vezes por segundo. Um
    <strong>laço</strong> é exatamente isso — repetir um bloco de instruções sem
    cansar. Amostrar um sinal, varrer uma faixa de frequências, integrar passo a
    passo uma simulação: tudo são laços.
  </p>
</div>

<figure class="ilustracao">
  <svg viewBox="0 0 420 170" role="img"
       aria-label="Ciclo de um laço: testa a condição, executa o corpo, atualiza e volta a testar."
       fill="none" stroke="currentColor" stroke-width="2" color="var(--cor-acento)">
    <rect x="20" y="60" width="110" height="50" rx="8"
          stroke="var(--cor-marca)"/>
    <text x="75" y="90" text-anchor="middle" fill="var(--cor-texto)"
          stroke="none" font-size="13" font-family="sans-serif">condição?</text>
    <rect x="170" y="20" width="110" height="50" rx="8"/>
    <text x="225" y="50" text-anchor="middle" fill="var(--cor-texto)"
          stroke="none" font-size="13" font-family="sans-serif">corpo</text>
    <rect x="170" y="100" width="110" height="50" rx="8"/>
    <text x="225" y="130" text-anchor="middle" fill="var(--cor-texto)"
          stroke="none" font-size="13" font-family="sans-serif">atualiza</text>
    <path d="M130 78 H170" marker-end="url(#seta)"/>
    <text x="150" y="70" text-anchor="middle" fill="var(--cor-ok)" stroke="none"
          font-size="11" font-family="sans-serif">V</text>
    <path d="M225 70 V100" marker-end="url(#seta)"/>
    <path d="M170 125 H150 V92" stroke-dasharray="0"/>
    <path d="M150 92 H75 V110 M75 110 V60" />
    <path d="M130 95 H75" marker-end="url(#seta)"/>
    <path d="M75 60 V35 H360 V90 H300" marker-end="url(#seta)"/>
    <path d="M300 90 H280"/>
    <text x="350" y="120" text-anchor="middle" fill="var(--cor-erro)"
          stroke="none" font-size="11" font-family="sans-serif">F → fim</text>
    <path d="M130 70 Q360 30 360 80 V130 H285" marker-end="url(#seta)"/>
    <defs>
      <marker id="seta" markerWidth="8" markerHeight="8" refX="6" refY="3"
              orient="auto" markerUnits="strokeWidth">
        <path d="M0 0 L6 3 L0 6 Z" fill="currentColor" stroke="none"/>
      </marker>
    </defs>
  </svg>
  <figcaption>
    O laço testa a condição; se for verdadeira (V), executa o corpo, atualiza e
    volta a testar. Quando fica falsa (F), o laço termina.
  </figcaption>
</figure>
```

Nota ao implementador: o SVG acima é didático e propositalmente simples. Se ao
abrir no navegador as setas ficarem confusas, ajuste apenas as coordenadas dos
`<path>` para um fluxo legível (condição→corpo→atualiza→condição, com saída
"fim"); mantenha as cores via variáveis de tema e o `<defs>` do marcador.

- [ ] **Step 2: Explicação de `while` e `for` (reaproveitar conteúdo atual)**

Logo após a ilustração, manter a explicação didática já existente — copiar do arquivo atual os blocos: seção `<h2>O while...</h2>` com seu `.exemplo`, o `.callout` de laço infinito, a seção `<h2>O for...</h2>` com os dois `.exemplo` de `range`, e a seção `<h2>Somando dentro de um laço</h2>` com seu `.exemplo`. (Esse conteúdo já está validado; preservar verbatim.)

- [ ] **Step 3: Seção "Na engenharia" (um exemplo por área)**

Após a seção "Somando dentro de um laço" e antes dos exercícios, inserir:

```html
<h2>Na engenharia</h2>
<p>O mesmo laço resolve problemas das três engenharias. Repare no padrão.</p>

<div class="eng-grid">
  <div class="eng-card eng-mec">
    <span class="eng-selo">⚙️ Mecânica</span>
    <p>Posição de um corpo em queda a cada 0,5 s (sem resistência do ar):</p>
    <div class="exemplo">
      <div class="exemplo-barra"><span>Python</span>
        <button class="btn btn-executar">▶ Executar</button></div>
      <pre><code>g = 9.81
t = 0.0
while t <= 2.0:
    altura = 0.5 * g * t**2
    print(f"t={t:.1f}s  queda={altura:.2f} m")
    t = t + 0.5</code></pre>
    </div>
  </div>

  <div class="eng-card eng-ele">
    <span class="eng-selo">⚡ Elétrica</span>
    <p>Tensão de um capacitor carregando, amostrada a cada constante de tempo:</p>
    <div class="exemplo">
      <div class="exemplo-barra"><span>Python</span>
        <button class="btn btn-executar">▶ Executar</button></div>
      <pre><code>import math
V = 5.0
for k in range(6):
    v = V * (1 - math.exp(-k))
    print(f"{k} tau -> {v:.3f} V")</code></pre>
    </div>
  </div>

  <div class="eng-card eng-tel">
    <span class="eng-selo">📡 Telecomunicações</span>
    <p>Amostrando um sinal senoidal de 2 Hz a cada 0,1 s:</p>
    <div class="exemplo">
      <div class="exemplo-barra"><span>Python</span>
        <button class="btn btn-executar">▶ Executar</button></div>
      <pre><code>import math
for n in range(10):
    t = n * 0.1
    amostra = math.sin(2 * math.pi * 2 * t)
    print(f"t={t:.1f}s  amostra={amostra:+.3f}")</code></pre>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Exercícios fáceis (🟢 Aquecimento — 5 itens)**

Substituir a `<section class="exercicios">` atual por uma nova. Começar com o cabeçalho e os 5 exercícios fáceis. Cada um segue o padrão abaixo (item 1 mostrado completo; itens 2–5 com enunciado + solução em texto análogos):

```html
<section class="exercicios">
  <h2>Exercícios</h2>
  <p>
    Faça na ordem. 🟢 aquecem a sintaxe, 🟡 combinam ideias, 🔴 aplicam à
    engenharia. Tente antes de abrir a solução.
  </p>

  <div class="exercicio nivel-facil">
    <span class="exercicio-faixa">🟢 Aquecimento</span>
    <p><strong>1.</strong> Use um <code>for</code> para mostrar a tabuada do 9
      (de <code>9 x 1</code> até <code>9 x 10</code>).</p>
    <details>
      <summary>Mostrar solução</summary>
      <div class="exemplo">
        <div class="exemplo-barra"><span>Python</span>
          <button class="btn btn-executar">▶ Executar</button></div>
        <pre><code>for i in range(1, 11):
    print(f"9 x {i} = {9 * i}")</code></pre>
      </div>
    </details>
  </div>

  <!-- 2. Contar de 1 a 20 com for/range. -->
  <!-- 3. Somar os números de 1 a 50 com acumulador. -->
  <!-- 4. while que conta de 10 até 1 (contagem regressiva) + "Fogo! 🚀". -->
  <!-- 5. Imprimir só os pares de 0 a 20 (range com passo 2). -->
```

Implementar os itens 2–5 como `<div class="exercicio nivel-facil">` no mesmo
formato do item 1, cada um com `<span class="exercicio-faixa">🟢 Aquecimento</span>`,
enunciado numerado e `<details>` contendo um `.exemplo` executável com a solução.
Soluções de referência:
- **2.** `for i in range(1, 21): print(i)`
- **3.** `s = 0` / `for n in range(1, 51): s += n` / `print(s)` → 1275
- **4.** `n = 10` / `while n >= 1: print(n); n -= 1` / `print("Fogo! 🚀")`
- **5.** `for n in range(0, 21, 2): print(n)`

- [ ] **Step 5: Exercícios médios (🟡 Praticando — 6 itens)**

Adicionar 6 `<div class="exercicio nivel-medio">` com `<span class="exercicio-faixa">🟡 Praticando</span>`. Enunciados e soluções de referência:

- **6.** Média de 5 notas lidas com `input()`:
  `s = 0` / `for _ in range(5): s += float(input("Nota: "))` / `print(f"Média: {s/5:.2f}")`
- **7.** Fatorial de N (lido) com laço:
  `n = int(input("N: "))` / `f = 1` / `for k in range(2, n+1): f *= k` / `print(f)`
- **8.** Maior de uma sequência: ler 6 números e imprimir o maior:
  `maior = float(input())` / `for _ in range(5):` / `    x = float(input())` / `    if x > maior: maior = x` / `print(maior)`
- **9.** Contar quantos números de 1 a 100 são múltiplos de 7:
  `c = 0` / `for n in range(1, 101):` / `    if n % 7 == 0: c += 1` / `print(c)` → 14
- **10.** Tabela de conversão °C→°F de 0 a 100 de 10 em 10:
  `for c in range(0, 101, 10): print(f"{c} C = {c*9/5+32} F")`
- **11.** Soma dos termos da série 1 + 1/2 + 1/3 + … + 1/10:
  `s = 0` / `for k in range(1, 11): s += 1/k` / `print(f"{s:.4f}")`

Cada item no mesmo formato (faixa + enunciado + `<details>` com `.exemplo`
executável).

- [ ] **Step 6: Desafios de engenharia (🔴 — 4 itens, com solução dupla)**

Adicionar 4 `<div class="exercicio nivel-dificil">` com `<span class="exercicio-faixa">🔴 Desafio de engenharia</span>`. Cada `<details>` contém um `.solucao-dupla` com dois `.solucao-bloco`: "Sem gráfico" (texto) e "Com gráfico" (`.exemplo` com `data-mpl`). Item 12 mostrado completo:

```html
<div class="exercicio nivel-dificil">
  <span class="exercicio-faixa">🔴 Desafio de engenharia</span>
  <p><strong>12. (📡 Telecom)</strong> Amostre o sinal
    <code>s(t) = sin(2π·5·t)</code> (5 Hz) de 0 a 1 s com passo 0,02 s.
    Mostre as amostras e depois plote a forma de onda.</p>
  <details>
    <summary>Mostrar solução</summary>
    <div class="solucao-dupla">
      <div class="solucao-bloco">
        <span class="solucao-rotulo">Sem gráfico (texto)</span>
        <div class="exemplo">
          <div class="exemplo-barra"><span>Python</span>
            <button class="btn btn-executar">▶ Executar</button></div>
          <pre><code>import math
t = 0.0
while t <= 1.0:
    s = math.sin(2 * math.pi * 5 * t)
    print(f"t={t:.2f}s  s={s:+.3f}")
    t += 0.02</code></pre>
        </div>
      </div>
      <div class="solucao-bloco">
        <span class="solucao-rotulo">Com gráfico (matplotlib)</span>
        <div class="exemplo" data-mpl>
          <div class="exemplo-barra"><span>Python</span>
            <button class="btn btn-executar">▶ Executar</button></div>
          <pre><code>import math
import matplotlib.pyplot as plt
ts, ss = [], []
t = 0.0
while t <= 1.0:
    ts.append(t)
    ss.append(math.sin(2 * math.pi * 5 * t))
    t += 0.02
plt.plot(ts, ss, marker=".")
plt.title("Sinal 5 Hz amostrado")
plt.xlabel("t (s)"); plt.ylabel("s(t)")
plt.grid(True)
plt.show()</code></pre>
        </div>
      </div>
    </div>
  </details>
</div>
```

Itens 13–15 no mesmo formato (solução dupla), com estes enunciados/soluções:

- **13. (⚙️ Mecânica)** Queda livre: altura `h(t)=0.5*9.81*t²` de 0 a 3 s, passo 0,2 s. Texto imprime `t` e `h`; gráfico plota `h` × `t` (`plt.plot(ts, hs)`).
- **14. (⚡ Elétrica)** Carga de capacitor `v(t)=5*(1-exp(-t/τ))`, τ=1, de 0 a 5 s, passo 0,1 s. Texto imprime amostras; gráfico plota `v` × `t`.
- **15. (⚙️ Mecânica/geral)** Aproxime a soma da série `Σ 1/k²` para k de 1 a N e mostre como ela se aproxima de `π²/6 ≈ 1.6449`. Texto imprime a soma parcial a cada 10 termos até N=100; gráfico plota a soma parcial × número de termos com uma linha horizontal em `π²/6` (`plt.axhline(math.pi**2/6)`).

Fechar a `</section>` ao final.

- [ ] **Step 7: Verificação manual — executar TODOS os exemplos**

Servir (`python3 -m http.server 8000`) e abrir
`http://localhost:8000/#/licao/lacos-de-repeticao`. Conferir:
- A ilustração SVG aparece e é legível em tema claro e escuro.
- Os 3 cartões de "Na engenharia" executam sem erro e imprimem o esperado.
- Abrir cada um dos 15 exercícios, Executar **todas** as soluções:
  - 🟢/🟡: produzem a saída de texto esperada (conferir nºs: ex. 3→1275, 9→14).
  - 🔴: o bloco "Sem gráfico" imprime amostras; o bloco "Com gráfico" renderiza
    a figura (onda/curva) abaixo da saída.
- Nenhum erro vermelho de Python em nenhum exemplo.
- Faixas 🟢/🟡/🔴 com as cores corretas; soluções duplas lado a lado no desktop e
  empilhadas no mobile (largura < 720px).

Anotar qualquer exemplo que falhe e corrigir o código antes do commit.

- [ ] **Step 8: Commit**

```bash
git add licoes/06-lacos-de-repeticao.html
git commit -m "feat: reescreve módulo 06 (laços) no padrão didático de engenharia

Analogia de amostragem, ilustração SVG do ciclo do laço, seção Na Engenharia
com um exemplo por área, 15 exercícios graduados e soluções com/sem gráfico.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Validação final do piloto e checklist de molde

**Files:**
- (Nenhum arquivo de código.) Produz uma checagem consolidada que vira o critério
  de aceite para replicar o padrão nos outros módulos.

**Interfaces:**
- Consumes: tudo das Tasks 1–3.
- Produces: confirmação de que o "molde de ouro" está pronto para o usuário
  validar; lista de pendências (se houver).

- [ ] **Step 1: Checklist de conformidade do molde**

Reabrir a lição e confirmar, item a item:
- [ ] Abre com `.analogia` de engenharia.
- [ ] Tem ilustração SVG inline temática e theme-aware.
- [ ] Tem seção "Na engenharia" com ⚙️/⚡/📡.
- [ ] Tem 15 exercícios: 5 🟢 + 6 🟡 + 4 🔴.
- [ ] Os 4 desafios têm solução dupla (texto + matplotlib).
- [ ] Todos os exemplos executam sem erro (claro e escuro).
- [ ] Lição sem gráfico não baixa matplotlib (Task 1, Step 6).

- [ ] **Step 2: Verificação de regressão das outras lições**

Abrir uma lição ainda não migrada (ex.
`#/licao/condicionais`) e Executar um exemplo de texto. Esperado: continua
funcionando, e o matplotlib **não** é baixado (as mudanças da Task 1 são
retrocompatíveis).

- [ ] **Step 3: Relatar ao usuário para validação**

Resumir o que foi entregue e pedir validação do molde antes de replicar nos
módulos 01–05, 07 e criar 08–14. Sem commit (tarefa de verificação).

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura do spec:**
- Analogias de engenharia → Task 3 Step 1, Step 3. ✔
- Ilustrações SVG inline theme-aware → Task 2 Steps 2, Task 3 Step 1. ✔
- 10–20 exercícios graduados → Task 3 Steps 4–6 (15 exercícios, 3 faixas). ✔
- Soluções com/sem interface gráfica (matplotlib) → Task 1 (renderização) + Task 3 Step 6. ✔
- Carregamento de matplotlib sob demanda → Task 1 Steps 1–2, verificado em Step 6. ✔
- Direcionamento Mecânica/Elétrica/Telecom → Task 2 Step 1/3 (cores+selos), Task 3 Steps 3, 6. ✔
- Módulos novos (08–14) → **fora deste plano por design** (piloto primeiro; replicação é plano seguinte, conforme decisão de sequenciamento do spec). ✔ (gap intencional e declarado)
- CSS de apoio → Task 2. ✔

**Placeholder scan:** sem TBD/TODO de implementação; os comentários `<!-- ... -->` na Task 3 Step 4 são acompanhados das soluções de referência exatas logo abaixo. Os enunciados 13–15 trazem fórmula e função de plotagem explícitas. ✔

**Consistência de tipos/nomes:** classes CSS definidas na Task 2 (`.analogia`, `.ilustracao`, `.eng-card`, `.eng-mec/ele/tel`, `.eng-selo`, `.nivel-facil/medio/dificil`, `.exercicio-faixa`, `.solucao-dupla`, `.solucao-bloco`, `.solucao-rotulo`) são exatamente as usadas na Task 3. `.saida-grafico` definida na Task 1 Step 5 e usada no Step 3. `usaMatplotlib`/`data-mpl` consistentes entre Task 1 e Task 3. ✔
```
