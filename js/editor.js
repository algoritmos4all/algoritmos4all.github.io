// Editor de código: CodeMirror 6 com destaque de sintaxe Python.
//
// Carregado sob demanda (como o Pyodide): os módulos ESM só são baixados na
// primeira vez que uma lição com exemplos é aberta. Os blocos de código do
// site têm fundo escuro nos DOIS temas (ver --cor-codigo-fundo no style.css),
// então usamos sempre o tema escuro do CodeMirror (oneDark), que combina com o
// layout, sem precisar trocar o tema do editor junto com o do site.

let cmPromise = null; // promessa cacheada: importa o CodeMirror só uma vez.

function carregarCodeMirror() {
  if (cmPromise) return cmPromise;

  cmPromise = (async () => {
    // Importação dinâmica dos módulos ESM. A esm.sh deduplica as dependências
    // internas compartilhadas (@codemirror/state, @codemirror/view), o que
    // evita o erro clássico de "múltiplas instâncias" ao usar CM6 sem build.
    // Versões fixas de propósito: `codemirror@^6` resolve, na esm.sh, para uma
    // linha 6.65.x que NÃO é o metapacote do CM6 (não exporta `basicSetup`).
    // O metapacote correto é o 6.0.x.
    const [cm, py, dark] = await Promise.all([
      import("https://esm.sh/codemirror@6.0.2"),
      import("https://esm.sh/@codemirror/lang-python@6.2.1"),
      import("https://esm.sh/@codemirror/theme-one-dark@6.1.3"),
    ]);
    return {
      EditorView: cm.EditorView,
      basicSetup: cm.basicSetup,
      python: py.python,
      oneDark: dark.oneDark,
    };
  })();

  // Se falhar, limpa o cache para permitir nova tentativa (e o fallback).
  cmPromise.catch(() => {
    cmPromise = null;
  });

  return cmPromise;
}

// Cria um editor CodeMirror (sem montá-lo em lugar nenhum ainda) com o código
// inicial. Quem chama insere `view.dom` no DOM. Lança se a biblioteca não
// carregar: nesse caso o playground usa o fallback de texto editável.
export async function montarEditor(codigoInicial) {
  const { EditorView, basicSetup, python, oneDark } = await carregarCodeMirror();

  // Ajustes finos para o editor combinar com os blocos de código do site.
  const temaSite = EditorView.theme({
    "&": {
      backgroundColor: "var(--cor-codigo-fundo)",
      fontSize: "0.9rem",
    },
    ".cm-scroller": {
      fontFamily: "var(--fonte-mono)",
      lineHeight: "1.6",
      padding: "0.5rem 0",
    },
    ".cm-gutters": {
      backgroundColor: "var(--cor-codigo-fundo)",
      border: "none",
    },
    "&.cm-focused": { outline: "none" },
  });

  return new EditorView({
    doc: codigoInicial,
    // oneDark primeiro; temaSite depois, para que nossos ajustes prevaleçam.
    extensions: [basicSetup, python(), oneDark, temaSite],
  });
}
