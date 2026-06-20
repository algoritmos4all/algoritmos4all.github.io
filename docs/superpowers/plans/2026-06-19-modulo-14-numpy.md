# Módulo 14 (NumPy e Matplotlib) + Suporte a NumPy no Playground — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o módulo 14 — NumPy e Matplotlib para engenharia — fechando os módulos novos do spec, e estender o playground para carregar o pacote `numpy` sob demanda (hoje só carrega `matplotlib`).

**Architecture:** Uma extensão pequena e retrocompatível em `js/playground.js` (carregar numpy quando o código contém `numpy`), depois o conteúdo do módulo 14 (fragmento HTML) seguindo o molde validado, e o registro em `js/lessons.js`.

**Tech Stack:** HTML fragmento + SVG inline; Pyodide; numpy e matplotlib (pacotes Pyodide, carregados sob demanda); CSS/JS puro.

## Global Constraints

- **Sem build.** Carregamento de pacotes Pyodide só sob demanda — `numpy` só baixa quando o código do usuário o usa (palavra `numpy`); lições sem numpy não pagam o custo. Mesma regra já vale para matplotlib.
- **Retrocompatível:** a mudança no playground não pode quebrar as lições existentes (texto puro continua leve; exemplos matplotlib continuam funcionando; matplotlib já puxa numpy como dependência, então exemplos com `import matplotlib` seguem ok).
- **Molde canônico = `licoes/06-lacos-de-repeticao.html`**; estrutura idêntica aos módulos 08–13.
- **Estrutura obrigatória do módulo (mesma dos 08–13):** `<h1>` → `.analogia` (`.analogia-icone` + analogia) → `<figure class="ilustracao">` com `<svg>` theme-aware (`var(--cor-*)`/`currentColor`, `role="img"`+`aria-label`, `<figcaption>`, `<defs>` só se houver setas) → explicação progressiva com `.exemplo` executáveis + `.callout` → `<h2>Na engenharia</h2>` + `.eng-grid` com 3 `.eng-card` (`.eng-mec` ⚙️, `.eng-ele` ⚡, `.eng-tel` 📡, cada um com `.eng-selo`) → `<section class="exercicios">` com **15 exercícios** (5 `.nivel-facil` 🟢 + 6 `.nivel-medio` 🟡 + 4 `.nivel-dificil` 🔴), numerados 1–15.
- **Markup de exemplo** idêntico ao módulo 06; **4 🔴** com `.solucao-dupla` (bloco texto + bloco `data-mpl` com `import matplotlib.pyplot as plt` e `plt.show()`).
- **Linhas de referência (`axhline`) com `linestyle="--"`.**
- **Escape em `<pre><code>`:** `<`/`>` crus como no módulo 06; nunca `<` colado a letra.
- **Pré-requisitos:** módulos 1–13 já existem. O módulo 14 usa listas, laços, funções (para contrastar com a vetorização) e introduz numpy.
- **Convenções numpy:** `import numpy as np`; arrays imprimem como `[1 2 3 4]` (sem vírgulas) — considerar isso ao descrever saídas. Os blocos gráfico 🔴 usam numpy E matplotlib (ambos carregam); os blocos texto 🔴 e os exercícios 🟢/🟡 usam só numpy (carrega só numpy).
- **Commit** termina com: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Verificação:** estática + (no portão do usuário) navegador. Sem node/navegador no ambiente de execução.

---

### Task 1: Suporte a NumPy sob demanda no playground

**Files:**
- Modify: `js/playground.js` (helper junto a `usaMatplotlib` ~linha 11; bloco de carga de pacotes em `executar` ~linhas 98–120)

**Interfaces:**
- Consumes: `pyodide.loadPackage(nomeOuLista)`, `status(msg)` (já definidos).
- Produces: comportamento — quando o código contém `numpy`, o playground baixa `numpy`; quando contém `matplotlib`, baixa `matplotlib` (que já traz numpy); quando contém ambos, baixa os dois numa só chamada. O setup de tema do matplotlib e a captura de figura continuam SÓ quando há matplotlib. Helper novo: `usaNumpy(codigo)` → `boolean`.

- [ ] **Step 1: Adicionar o helper `usaNumpy`**

Em `js/playground.js`, logo após a função `usaMatplotlib` (a que contém `return /\bmatplotlib\b/.test(codigo);`), adicionar:

```javascript
// Detecta se um trecho de código usa numpy (para baixar o pacote só então).
function usaNumpy(codigo) {
  return /\bnumpy\b/.test(codigo);
}
```

- [ ] **Step 2: Restruturar a carga de pacotes em `executar`**

Substituir o trecho atual (de `const comGrafico = usaMatplotlib(codigo);` até o `}` que fecha o `if (comGrafico) {` do setup de rcParams, ou seja, as linhas que hoje vão de `const comGrafico = ...` até logo após o `});` do `runPythonAsync` do rcParams) por:

```javascript
    const comGrafico = usaMatplotlib(codigo);
    const comNumpy = usaNumpy(codigo);
    if (comNumpy || comGrafico) {
      // matplotlib já traz numpy como dependência; carregamos numa só chamada.
      const pacotes = [];
      if (comNumpy) pacotes.push("numpy");
      if (comGrafico) pacotes.push("matplotlib");
      status(`Carregando ${pacotes.join(" e ")}… (só na primeira vez)`);
      await pyodide.loadPackage(pacotes);
      elSaida.textContent = "";
    }
    if (comGrafico) {
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

(O bloco seguinte — `await pyodide.runPythonAsync(codigo);` e a captura de figura `if (comGrafico) { ... }` — permanece inalterado. A captura de figura e a mensagem "sem saída" continuam guardadas por `comGrafico`.)

- [ ] **Step 3: Autorrevisão estática**

Reler a função `executar` inteira e confirmar: `comGrafico` e `comNumpy` em escopo onde usados; pacotes carregados numa única `loadPackage` quando ambos; `loadPackage([])` nunca é chamado (o `if (comNumpy || comGrafico)` garante lista não-vazia); o setup de rcParams e a captura de figura permanecem SÓ sob `comGrafico`; código texto-puro não dispara nenhuma carga. Como não há node/navegador, marcar a verificação de runtime (numpy-só carrega numpy; numpy+matplotlib carrega ambos; texto puro não baixa nada) como PENDENTE para o portão do usuário.

- [ ] **Step 4: Commit**

```bash
git add js/playground.js
git commit -m "feat: playground carrega numpy sob demanda (além de matplotlib)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Módulo 14 — NumPy e Matplotlib para engenharia

**Files:** Create: `licoes/14-numpy-e-matplotlib.html`

**Interfaces:** Consumes molde 06 + módulos 08–13; CSS didático; carga numpy/matplotlib do playground (Task 1). Produces fragmento da lição 14. Id de rota (Task 3): `numpy-e-matplotlib`.

**Design:**
- **Analogia (⚡):** NumPy é uma *calculadora vetorial*: em vez de tratar número por número num laço, ela opera no vetor inteiro de uma vez — como processar um sinal completo de medições numa única conta. O Matplotlib transforma esses vetores em gráficos.
- **Ilustração SVG:** um vetor `[1, 2, 3, 4]` passando por uma operação `× 2` e produzindo `[2, 4, 6, 8]` — ilustrando a operação vetorizada (o array inteiro de uma vez), contrastando com "antes: um laço número por número".
- **Explicação progressiva (exemplos executáveis):** (a) `import numpy as np`; criar `np.array([1, 2, 3, 4])`; (b) operação vetorizada `a * 2`, `a + 10`; (c) `np.arange(0, 10)` e `np.linspace(0, 1, 5)`; (d) funções `np.sin`, `np.exp` sobre um array; (e) agregações `a.mean()`, `a.std()`, `a.max()`; (f) plotar `plt.plot(x, y)` com x/y arrays. `.callout`: a vetorização opera no array todo de uma vez — mais limpo (e rápido) que um laço para muitos dados.
- **Na engenharia (3 cards):**
  - ⚙️ Mecânica: `import numpy as np` / `t = np.linspace(0, 2, 5)` / `y = 0.5 * 9.81 * t**2` / `print(y)` (posições da queda livre, vetorizado).
  - ⚡ Elétrica: `import numpy as np` / `tensoes = np.array([4.9, 5.1, 5.0, 4.8, 5.2])` / `print(tensoes.mean(), tensoes.std())`.
  - 📡 Telecom: `import numpy as np` / `t = np.linspace(0, 1, 5)` / `s = np.sin(2 * np.pi * 2 * t)` / `print(s)`.

**Blueprint dos 15 exercícios (enunciado + solução de referência):**

🟢 (5):
1. Criar `a = np.array([1, 2, 3, 4])` e imprimir. — `import numpy as np` / `a = np.array([1, 2, 3, 4])` / `print(a)`  (saída `[1 2 3 4]`)
2. Multiplicar `a = np.array([1, 2, 3])` por 2 (vetorizado). — `import numpy as np` / `a = np.array([1, 2, 3])` / `print(a * 2)`  (saída `[2 4 6]`)
3. Criar `np.arange(0, 10)` e imprimir. — `import numpy as np` / `print(np.arange(0, 10))`  (0..9)
4. Somar dois arrays elemento a elemento. — `import numpy as np` / `a = np.array([1, 2, 3])` / `b = np.array([10, 20, 30])` / `print(a + b)`  (`[11 22 33]`)
5. Criar 5 pontos igualmente espaçados de 0 a 1 com `np.linspace`. — `import numpy as np` / `print(np.linspace(0, 1, 5))`  (`[0. 0.25 0.5 0.75 1. ]`)
🟡 (6):
6. Média de `np.array([10, 20, 30, 40])`. — `import numpy as np` / `a = np.array([10, 20, 30, 40])` / `print(a.mean())`  (25.0)
7. Desvio padrão de `np.array([2, 4, 4, 4, 5, 5, 7, 9])`. — `import numpy as np` / `a = np.array([2, 4, 4, 4, 5, 5, 7, 9])` / `print(a.std())`  (2.0)
8. Máximo e mínimo de `np.array([3, 9, 2, 7, 5])`. — `import numpy as np` / `a = np.array([3, 9, 2, 7, 5])` / `print(a.max(), a.min())`  (9 2)
9. Aplicar `np.sin` a um array de ângulos `[0, π/2, π]`. — `import numpy as np` / `angulos = np.array([0, np.pi/2, np.pi])` / `print(np.sin(angulos))`  (≈ `[0. 1. 0.]`)
10. Soma de todos os elementos de `np.arange(1, 101)`. — `import numpy as np` / `print(np.arange(1, 101).sum())`  (5050)
11. Converter um array de Celsius em Fahrenheit de uma vez (vetorizado). — `import numpy as np` / `c = np.array([0, 20, 37, 100])` / `f = c * 9/5 + 32` / `print(f)`  (`[ 32.  68.  98.6 212. ]`)
🔴 (4) — solução dupla (texto + matplotlib; o bloco gráfico usa numpy E matplotlib):
12. (📡 Telecom) Sinal `s = sin(2π·5·t)`, t de 0 a 1 com 200 pontos. Texto imprime estatísticas (média, máx); gráfico plota a forma de onda.
   - Texto: `import numpy as np` / `t = np.linspace(0, 1, 200)` / `s = np.sin(2 * np.pi * 5 * t)` / `print("média:", s.mean())` / `print("máximo:", s.max())`
   - Gráfico: `import numpy as np` / `import matplotlib.pyplot as plt` / `t = np.linspace(0, 1, 200)` / `s = np.sin(2 * np.pi * 5 * t)` / `plt.plot(t, s)` / `plt.title("Sinal 5 Hz (NumPy)")` / `plt.xlabel("t (s)")` / `plt.ylabel("s(t)")` / `plt.grid(True)` / `plt.show()`
13. (⚙️ Mecânica) Queda livre `y = 0.5·9.81·t²`, t de 0 a 3 com 100 pontos. Texto imprime a posição final; gráfico plota a trajetória.
   - Texto: `import numpy as np` / `t = np.linspace(0, 3, 100)` / `y = 0.5 * 9.81 * t**2` / `print("posição final:", y[-1])`
   - Gráfico: `import numpy as np` / `import matplotlib.pyplot as plt` / `t = np.linspace(0, 3, 100)` / `y = 0.5 * 9.81 * t**2` / `plt.plot(t, y)` / `plt.title("Queda livre (NumPy)")` / `plt.xlabel("t (s)")` / `plt.ylabel("y (m)")` / `plt.grid(True)` / `plt.show()`
14. (⚡ Elétrica) Carga do capacitor `v = 5·(1 - exp(-t/τ))`, τ=1, t de 0 a 5 com 100 pontos. Texto imprime a tensão final; gráfico plota a curva com a assíntota (`axhline` tracejada em 5).
   - Texto: `import numpy as np` / `t = np.linspace(0, 5, 100)` / `v = 5 * (1 - np.exp(-t / 1.0))` / `print("tensão final:", v[-1])`
   - Gráfico: `import numpy as np` / `import matplotlib.pyplot as plt` / `t = np.linspace(0, 5, 100)` / `v = 5 * (1 - np.exp(-t / 1.0))` / `plt.plot(t, v, label="v(t)")` / `plt.axhline(5, color="red", linestyle="--", label="5 V")` / `plt.title("Carga do capacitor (NumPy)")` / `plt.xlabel("t (s)")` / `plt.ylabel("v (V)")` / `plt.legend()` / `plt.grid(True)` / `plt.show()`
15. (📡/geral) Soma de dois sinais: `s1 = sin(2π·2·t)`, `s2 = sin(2π·5·t)`, `soma = s1 + s2`. Texto imprime o máximo da soma; gráfico plota os três (s1, s2 e a soma).
   - Texto: `import numpy as np` / `t = np.linspace(0, 1, 300)` / `s1 = np.sin(2 * np.pi * 2 * t)` / `s2 = np.sin(2 * np.pi * 5 * t)` / `soma = s1 + s2` / `print("máximo da soma:", soma.max())`
   - Gráfico: `import numpy as np` / `import matplotlib.pyplot as plt` / `t = np.linspace(0, 1, 300)` / `s1 = np.sin(2 * np.pi * 2 * t)` / `s2 = np.sin(2 * np.pi * 5 * t)` / `soma = s1 + s2` / `plt.plot(t, s1, label="2 Hz")` / `plt.plot(t, s2, label="5 Hz")` / `plt.plot(t, soma, label="soma")` / `plt.title("Soma de sinais")` / `plt.xlabel("t (s)")` / `plt.ylabel("amplitude")` / `plt.legend()` / `plt.grid(True)` / `plt.show()`

- [ ] **Step 1: Ler o molde** (`licoes/06-lacos-de-repeticao.html`) e um módulo recente (ex.: `licoes/13-arquivos-e-dados.html`).
- [ ] **Step 2: Escrever `licoes/14-numpy-e-matplotlib.html`** com `<h1>NumPy e Matplotlib para engenharia</h1>` e toda a estrutura obrigatória (analogia ⚡, SVG do vetor `×2`, explicação progressiva, 3 cards, 15 exercícios; 4 🔴 com solução dupla).
- [ ] **Step 3: Autorrevisão estática** — 15 (5/6/4), numeração 1–15; 4 🔴 com `.solucao-dupla` + `data-mpl`/`import matplotlib`/`plt.show()`; os blocos texto 🔴 usam só numpy (sem `import matplotlib`); resultados conferidos (6→25.0, 7→2.0, 8→9 2, 10→5050); `axhline` (item 14) com `linestyle="--"`; classes batem; Python relido.
- [ ] **Step 4: Commit**
```bash
git add licoes/14-numpy-e-matplotlib.html
git commit -m "feat: módulo 14 — NumPy e Matplotlib para engenharia (molde)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Registrar o módulo 14 na trilha

**Files:** Modify: `js/lessons.js` (acrescentar 1 entrada após `arquivos-e-dados`)

**Interfaces:** Consumes o arquivo da Task 2 e seu id (`numpy-e-matplotlib`). Produces a lição 14 no menu/rotas.

- [ ] **Step 1: Acrescentar a entrada** — em `js/lessons.js`, após o objeto `arquivos-e-dados` (ordem 13) e antes do `];`:
```javascript
  {
    id: "numpy-e-matplotlib",
    ordem: 14,
    titulo: "NumPy e Matplotlib",
    arquivo: "licoes/14-numpy-e-matplotlib.html",
  },
```
- [ ] **Step 2: Autorrevisão** — vírgula correta, `ordem` 14, `arquivo` aponta para o arquivo criado, `id` bate. Array válido (14 entradas).
- [ ] **Step 3: Commit**
```bash
git add js/lessons.js
git commit -m "feat: registra módulo 14 na trilha de lições

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review (autor do plano)

**Cobertura:** extensão numpy sob demanda → Task 1 (retrocompatível; matplotlib continua, numpy carrega quando usado). Módulo 14 (NumPy+Matplotlib para engenharia) com molde completo → Task 2. Registro → Task 3. ✔

**Placeholder scan:** os 15 exercícios + 3 cards têm solução de referência exata. O código JS da Task 1 está completo (helper + bloco restruturado). Sem "TBD". ✔

**Consistência:** `usaNumpy` espelha `usaMatplotlib`; o `if (comGrafico || comNumpy)` evita `loadPackage([])`; rcParams/captura de figura permanecem sob `comGrafico` (não quebram nada). Id `numpy-e-matplotlib` e caminho idênticos entre Task 2 (Produces) e Task 3. `axhline` com `linestyle="--"` (item 14). ✔

**Escopo:** enriquecimento dos módulos 01–05/07 fica para o ciclo final.
