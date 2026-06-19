# Módulos Enriquecidos para Engenharia — Design

Data: 2026-06-19

## Objetivo

Evoluir as lições do site (atualmente básicas e curtas) para um material rico,
lúdico e direcionado a estudantes de **Engenharia Mecânica, Elétrica e de
Telecomunicações**. Cada módulo passa a ter analogias de engenharia, ilustrações
gráficas (SVG inline), 10–20 exercícios graduados e soluções de exemplo **com e
sem interface gráfica** (matplotlib, que roda no navegador via Pyodide).

Adiciona ainda os módulos que faltam: funções/módulos, vetores/listas,
recursividade, entre outros.

## Contexto e restrições

- **Stack atual:** SPA em HTML/CSS/JS puro, sem build, publicada no GitHub Pages.
  Python roda no navegador via **Pyodide** (CPython em WebAssembly).
- Lições são fragmentos HTML em `licoes/`, indexados em `js/lessons.js`.
- O roteador (`js/app.js`) injeta o fragmento e ativa os botões "Executar"
  (`js/playground.js`), que tornam cada `<pre><code>` editável e executável.
- **Restrição-chave:** toolkits de GUI desktop (Tkinter) **não funcionam no
  Pyodide** (sem display). A versão "com interface gráfica" usa **matplotlib**,
  que renderiza no navegador.

## Decisões (resultado do brainstorming)

- **"Com interface gráfica" = matplotlib.** Solução "sem GUI" imprime no
  terminal; solução "com GUI" plota um gráfico. Encaixa bem em engenharia
  (sinais, forças, trajetórias, varreduras de tensão) e roda 100% no site.
- **Ilustrações = SVG inline desenhado à mão.** Nítidas, adaptam-se ao tema
  claro/escuro via variáveis CSS, sem dependências nem binários no repositório.
- **Sequenciamento = piloto + replicação.** Primeiro reformamos UM módulo por
  completo como "molde de ouro"; após validação, replicamos nos demais e criamos
  os novos.
- **Módulo piloto = 06 — Laços de repetição.** Hoje tem só 2 exercícios (ganho
  visível) e rende ótimas analogias de engenharia e gráficos matplotlib naturais.
- **Faixa de exercícios = 10–20 por módulo**, graduados em três níveis.
- **Áreas cobertas = Mecânica (⚙️), Elétrica (⚡), Telecomunicações (📡)**,
  alternando entre exemplos.

## Anatomia padrão de um módulo (molde de ouro)

Cada fragmento HTML em `licoes/` segue esta estrutura:

1. **Abertura com analogia de engenharia** — parágrafo que ancora o conceito num
   cenário de Mecânica/Elétrica/Telecom (ex.: laço = amostragem periódica de um
   sinal).
2. **Ilustração SVG inline** — diagrama lúdico do conceito (laço = seta circular
   com contador; lista = caixas indexadas; recursão = bonecas russas), com cores
   ligadas às variáveis de tema.
3. **Explicação progressiva** — prosa didática mantendo o tom acolhedor atual,
   com exemplos executáveis curtos (`.exemplo` com botão "Executar").
4. **Seção "Na Engenharia"** — 3 mini-aplicações rotuladas por ícone de área
   (⚙️ Mecânica, ⚡ Elétrica, 📡 Telecom).
5. **Exercícios (10–20)** — graduados em três faixas:
   - 🟢 **Aquecimento** — fixa a sintaxe básica.
   - 🟡 **Praticando** — combina o conceito com os anteriores.
   - 🔴 **Desafio de engenharia** — problema aplicado a uma das três áreas.
   Cada exercício traz solução oculta via `<details>` ("Mostrar solução").
6. **Solução dupla** — exercícios de engenharia trazem dois blocos:
   - **"Sem gráfico"** — saída em texto (`print`).
   - **"Com gráfico"** — matplotlib renderizado no navegador.

## Componentes e mudanças

### Playground: suporte a matplotlib (`js/playground.js`)

Hoje o playground só captura stdout/stderr como texto. Mudanças:

- Após executar o código, detectar figuras matplotlib abertas e renderizá-las
  como `<img>` (PNG em base64) na área de saída, abaixo do texto.
- Carregar o pacote `matplotlib` do Pyodide **sob demanda**, apenas quando o
  código o importa — preservando o carregamento leve das lições sem gráfico.
  (Detecção simples: o código contém `matplotlib`/`import matplotlib`, ou o
  bloco está marcado com `data-mpl`.)
- Usar o backend `AGG` e capturar a figura com `savefig` para buffer PNG; limpar
  as figuras entre execuções para não acumular.
- Erros de carregamento do matplotlib seguem o mesmo tratamento amigável já
  existente para falhas do Pyodide.

Marcador de bloco: `.exemplo[data-mpl]` sinaliza exemplos que usam matplotlib
(permite, por exemplo, pré-carregar o pacote ao abrir a solução).

### Ilustrações SVG (inline nos fragmentos HTML)

Conjunto de padrões reutilizáveis, escritos inline no HTML de cada lição:

- **caixa-de-variável** — retângulo rotulado com nome + valor.
- **fluxograma** — blocos de decisão/processo com setas.
- **seta-de-laço** — ciclo circular com contador.
- **pilha** — quadros empilhados (para recursão / escopo).
- **vetor-indexado** — fileira de caixas com índices 0..n.

Cores via `currentColor` e variáveis CSS de tema (definidas em `css/style.css`),
para acompanhar claro/escuro. Sem dependências externas.

### CSS de apoio (`css/style.css`)

Novos estilos para:

- Faixas de exercício (🟢/🟡/🔴) com cor e rótulo.
- Blocos/abas de solução "Sem gráfico" vs "Com gráfico".
- Ícones e selos de área de engenharia (⚙️/⚡/📡).
- Container responsivo para os SVGs e para a imagem do matplotlib.

### Índice de lições (`js/lessons.js`)

Acrescentar as entradas dos módulos novos (id, ordem, título, arquivo) à medida
que forem criados. A navegação anterior/próxima e o menu derivam daqui
automaticamente.

## Currículo alvo

**Existentes (a enriquecer):**

1. O que é um algoritmo
2. Variáveis e tipos de dados
3. Entrada e saída
4. Operadores
5. Condicionais
6. Laços de repetição  ← **piloto**
7. Juntando tudo

**Novos (a criar):**

8. Funções e módulos
9. Vetores e listas
10. Recursividade
11. Dicionários e tuplas
12. Strings
13. Arquivos e dados (CSV)
14. NumPy e Matplotlib para engenharia

## Entrega do piloto

Módulo **06 — Laços de repetição**, reescrito por completo no padrão acima:

- Analogia de abertura: amostragem periódica de um sinal.
- Ilustração SVG do ciclo do laço (condição → corpo → atualização).
- Seção "Na Engenharia" com um exemplo por área.
- **~15 exercícios** graduados nas três faixas.
- Soluções duplas nos desafios: texto + gráfico de um sinal amostrado
  (matplotlib).

Acompanham o piloto:

- Extensão do `js/playground.js` para renderizar figuras matplotlib.
- CSS de apoio (faixas de exercício, blocos de solução dupla, ícones de área,
  container de SVG/imagem).

Após validação do piloto, o mesmo padrão é replicado nos módulos 01–05 e 07 e
aplicado na criação dos módulos 08–14.

## Tratamento de erros

- Reaproveita o tratamento atual: falha de `fetch` da lição, traceback de erro
  Python, falha ao carregar o Pyodide (com fallback para Colab).
- Falha ao carregar o matplotlib → mensagem amigável na área de saída,
  sugerindo rodar o código localmente/Colab.

## Testes / validação

- Cada exemplo e cada solução do piloto deve **executar sem erro** no playground
  (validação manual no navegador).
- Verificar renderização do matplotlib em tema claro e escuro.
- Verificar responsividade dos SVGs e da imagem do gráfico no mobile.
- Conferir que lições sem gráfico **não** baixam o pacote matplotlib.

## Fora de escopo

- Backend, contas de usuário ou persistência de progresso além do `localStorage`
  já existente.
- Etapa de build / bundlers.
- Internacionalização (somente português).
- Toolkits de GUI desktop (Tkinter) — incompatíveis com o Pyodide.
