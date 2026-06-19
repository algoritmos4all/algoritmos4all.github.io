// Playground: executa Python no navegador via Pyodide (CPython em WebAssembly).
// O Pyodide é grande (~vários MB), então só é carregado na primeira execução.

import { montarEditor } from "./editor.js";

const PYODIDE_VERSAO = "0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSAO}/full/`;

let pyodidePromise = null; // promessa cacheada — inicializa o Pyodide só uma vez.

// Carrega o script do Pyodide sob demanda e inicializa o interpretador.
function carregarPyodide(aoProgredir) {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    aoProgredir?.("Baixando o Python… (só na primeira vez)");

    // Injeta o <script> do loader do Pyodide, se ainda não estiver presente.
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `${PYODIDE_URL}pyodide.js`;
        s.onload = resolve;
        s.onerror = () => reject(new Error("Falha ao baixar o Pyodide"));
        document.head.appendChild(s);
      });
    }

    aoProgredir?.("Inicializando o Python…");
    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_URL });
    return pyodide;
  })();

  // Se falhar, limpa o cache para permitir nova tentativa.
  pyodidePromise.catch(() => {
    pyodidePromise = null;
  });

  return pyodidePromise;
}

// Executa um trecho de código, escrevendo a saída em `elSaida`.
async function executar(codigo, elSaida, elBotao) {
  const escrever = (texto, classe) => {
    const span = document.createElement("span");
    if (classe) span.className = classe;
    span.textContent = texto;
    elSaida.appendChild(span);
    elSaida.scrollTop = elSaida.scrollHeight;
  };

  elSaida.textContent = "";
  elBotao.disabled = true;
  const rotuloOriginal = elBotao.innerHTML;

  try {
    const status = (msg) => {
      elSaida.textContent = "";
      escrever(msg, "saida-status");
    };

    if (!pyodidePromise || !(await jaPronto())) {
      elBotao.innerHTML = '<span class="carregando"></span> Carregando…';
    }

    const pyodide = await carregarPyodide(status);
    elBotao.innerHTML = "Executando…";
    elSaida.textContent = "";

    // Redireciona stdout/stderr do Python para a área de saída.
    pyodide.setStdout({ batched: (t) => escrever(t + "\n") });
    pyodide.setStderr({ batched: (t) => escrever(t + "\n", "saida-erro") });

    // input() do Python → prompt() do navegador.
    pyodide.globals.set("__input_navegador__", (mensagem) => {
      const r = window.prompt(mensagem ?? "");
      return r === null ? "" : r;
    });
    await pyodide.runPythonAsync(`
import builtins
def input(prompt=""):
    return __input_navegador__(str(prompt))
builtins.input = input
`);

    await pyodide.runPythonAsync(codigo);

    if (elSaida.textContent.trim() === "") {
      escrever("(o programa terminou sem produzir saída)", "saida-status");
    }
  } catch (err) {
    // Erros de execução Python chegam como PythonError, com o traceback na mensagem.
    const msg = String(err.message || err);
    if (/Falha ao (baixar|carregar) o Pyodide/i.test(msg)) {
      elSaida.textContent = "";
      escrever(
        "Não foi possível carregar o Python no navegador. " +
          "Verifique sua conexão e tente novamente. Você também pode rodar " +
          "este código no Google Colab (colab.research.google.com).",
        "saida-erro"
      );
    } else {
      escrever("\n" + limparTraceback(msg), "saida-erro");
    }
  } finally {
    elBotao.disabled = false;
    elBotao.innerHTML = rotuloOriginal;
  }
}

// Verifica, sem lançar, se o Pyodide já terminou de carregar.
async function jaPronto() {
  if (!pyodidePromise) return false;
  try {
    await Promise.race([
      pyodidePromise,
      new Promise((_, rej) => setTimeout(rej, 0)),
    ]);
    return true;
  } catch {
    return false;
  }
}

// Remove as linhas internas do Pyodide do traceback, deixando só o relevante.
function limparTraceback(msg) {
  const linhas = msg.split("\n");
  const inicio = linhas.findIndex((l) => /Traceback/.test(l));
  return inicio >= 0 ? linhas.slice(inicio).join("\n") : msg;
}

// Liga cada bloco .exemplo dentro de `raiz` ao seu botão "Executar" e o torna
// editável — preferindo o CodeMirror, com fallback de texto puro.
export function ativarBotoesExecutar(raiz) {
  for (const exemplo of raiz.querySelectorAll(".exemplo")) {
    prepararExemplo(exemplo);
  }
}

function prepararExemplo(exemplo) {
  const botao = exemplo.querySelector(".btn-executar");
  const pre = exemplo.querySelector("pre");
  const codigoEl = exemplo.querySelector("code");
  if (!botao || !pre || !codigoEl) return;

  const codigoInicial = codigoEl.textContent;

  // Área de saída logo após o bloco de código.
  let saida = exemplo.querySelector(".saida");
  if (!saida) {
    saida = document.createElement("pre");
    saida.className = "saida";
    saida.setAttribute("aria-live", "polite");
    exemplo.appendChild(saida);
  }

  // Fallback imediato: o <code> já fica editável enquanto o CodeMirror baixa
  // (ou caso ele falhe). Assim a promessa "o código é editável" vale sempre.
  codigoEl.contentEditable = "true";
  codigoEl.spellcheck = false;
  codigoEl.setAttribute("role", "textbox");
  codigoEl.setAttribute("aria-label", "Editor de código Python (edite à vontade)");

  // `lerCodigo` aponta para a fonte atual do código (code → CodeMirror → textarea).
  let lerCodigo = () => codigoEl.textContent;

  botao.addEventListener("click", () => executar(lerCodigo(), saida, botao));

  // Aprimoramento: troca o bloco estático pelo editor CodeMirror.
  montarEditor(codigoInicial)
    .then((view) => {
      pre.replaceWith(view.dom);
      lerCodigo = () => view.state.doc.toString();

      // Editores dentro de <details> ficam com altura zero até serem abertos;
      // remede a geometria quando o usuário expande a solução.
      const det = exemplo.closest("details");
      if (det) {
        det.addEventListener("toggle", () => {
          if (det.open) view.requestMeasure();
        });
      }
    })
    .catch(() => {
      // CodeMirror indisponível: usa um <textarea>, mais confiável que o
      // contenteditable para edição multilinha.
      const ta = document.createElement("textarea");
      ta.className = "editor-fallback";
      ta.value = codigoInicial;
      ta.spellcheck = false;
      ta.rows = Math.max(3, codigoInicial.split("\n").length);
      ta.setAttribute("aria-label", "Editor de código Python");
      pre.replaceWith(ta);
      lerCodigo = () => ta.value;
    });
}
