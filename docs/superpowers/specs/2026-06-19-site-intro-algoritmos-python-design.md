# Site de Introdução a Algoritmos e Programação em Python — Design

Data: 2026-06-19

## Objetivo

Criar um site educacional, em português do Brasil, que introduza iniciantes
(sem experiência prévia) a algoritmos e programação usando Python. O site é
publicado no GitHub Pages (`algoritmos4all.github.io`) e permite executar
código Python diretamente no navegador.

## Decisões

- **Público:** iniciantes absolutos, idioma português do Brasil.
- **Stack:** HTML/CSS/JS puro, sem etapa de build. Publicação direta no
  GitHub Pages.
- **Interatividade:** editor de Python no navegador via Pyodide
  (CPython compilado para WebAssembly), carregado sob demanda (lazy).
- **Currículo (v1):** fundamentos essenciais, ~7 lições.
- **Exercícios:** cada lição termina com exercícios e solução oculta.

## Arquitetura

Aplicação de página única (SPA) com roteamento por hash. Uma "casca"
(`index.html`) contém cabeçalho, menu lateral e rodapé únicos; cada lição é um
fragmento HTML carregado dinamicamente. Isso elimina a duplicação de layout —
o principal risco de manutenção quando não há build.

Como o Pyodide já exige JavaScript, depender de JS para a navegação não
adiciona custo relevante.

### Estrutura de arquivos

```
index.html              # casca: cabeçalho, menu lateral, área de conteúdo, rodapé
css/style.css           # tema claro/escuro, tipografia, layout responsivo
js/app.js               # roteador por hash, carrega lições, monta o menu
js/playground.js        # editor + execução via Pyodide (lazy load)
js/lessons.js           # índice das lições (id, título, arquivo, ordem)
licoes/01-o-que-e-algoritmo.html
licoes/02-variaveis-e-tipos.html
licoes/03-entrada-e-saida.html
licoes/04-operadores.html
licoes/05-condicionais.html
licoes/06-lacos-de-repeticao.html
licoes/07-juntando-tudo.html
```

## Componentes

### Casca (`index.html` + `js/app.js`)
- Menu lateral listando as lições na ordem definida em `lessons.js`, com
  indicação da lição atual e progresso (lições visitadas).
- Roteamento por hash: `#/licao/<id>`. A home (`#/`) mostra uma apresentação.
- Navegação "anterior / próxima" no rodapé do conteúdo.
- Menu colapsável ("hambúrguer") no mobile.
- Alternância de tema claro/escuro, persistida em `localStorage`.
- Fonte única de layout: mudar o menu/rodapé afeta todas as lições.

### Lição (fragmento HTML em `licoes/`)
- Explicação didática com linguagem acessível a iniciantes.
- Exemplos de código com botão "Executar" que envia o código ao playground.
- Bloco de exercícios ao final, cada um com solução oculta via `<details>`
  ("Mostrar solução").

### Playground (`js/playground.js`)
- Editor de texto com destaque de sintaxe Python.
- Botão "Executar" e área de saída (stdout + erros).
- Pyodide inicializado na primeira execução, com indicador
  "carregando Python…". Reutilizado nas execuções seguintes.
- `input()` tratado via `prompt()` do navegador (ou aviso quando não suportado).

### Índice de lições (`js/lessons.js`)
- Array de objetos `{ id, ordem, titulo, arquivo }`.
- Fonte única para montar o menu e validar rotas.

## Fluxo de dados

1. `app.js` lê `lessons.js` e monta o menu lateral.
2. Ao navegar para `#/licao/<id>`, faz `fetch` do fragmento correspondente.
3. Injeta o HTML em `<main>` e ativa os botões "Executar".
4. "Executar" chama `playground.js`, que (na 1ª vez) carrega o Pyodide,
   roda o código e exibe a saída.

## Currículo (v1)

1. O que é um algoritmo
2. Variáveis e tipos de dados
3. Entrada e saída (`print`, `input`)
4. Operadores (aritméticos, comparação, lógicos)
5. Condicionais (`if` / `elif` / `else`)
6. Laços de repetição (`while`, `for`)
7. Juntando tudo (mini-projeto)

## Tratamento de erros

- Falha no `fetch` de uma lição → mensagem amigável na área de conteúdo.
- Erro de execução Python → traceback exibido na área de saída do playground.
- Falha ao carregar o Pyodide → aviso com link de fallback (ex.: Google Colab).
- Rota inválida → redireciona para a home com aviso.

## Identidade visual

- Tema acolhedor para iniciantes; alternância claro/escuro.
- Layout responsivo (desktop e mobile).
- Tipografia legível; blocos de código com destaque de sintaxe.

## Fora de escopo (v1)

- Estruturas de dados avançadas (listas, dicionários), funções, arquivos,
  recursão, ordenação/busca e complexidade — possíveis em versões futuras.
- Backend, contas de usuário ou persistência de progresso além do
  `localStorage`.
- Internacionalização (somente português na v1).
```
