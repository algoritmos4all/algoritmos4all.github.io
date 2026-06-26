// Simulações e animações interativas das lições.
//
// Como o conteúdo da lição é injetado via innerHTML (e o navegador não executa
// <script> inserido assim), cada lição traz apenas um marcador, por exemplo:
//
//     <div class="sim" data-sim="condicional"></div>
//
// Depois da injeção, app.js chama ativarSimulacoes(raiz), que varre os
// marcadores e entrega cada um ao construtor registrado, que monta toda a
// interface dentro do elemento. Assim os arquivos de lição ficam enxutos e a
// lógica fica concentrada e testável aqui.

const construtores = {};

// Registra o construtor de um tipo de simulação.
function registrar(tipo, fn) {
  construtores[tipo] = fn;
}

// Varre `raiz` e ativa cada marcador [data-sim] ainda não ativado.
export function ativarSimulacoes(raiz) {
  for (const el of raiz.querySelectorAll("[data-sim]")) {
    if (el.dataset.simAtiva === "1") continue;
    const construtor = construtores[el.dataset.sim];
    if (!construtor) continue;
    el.dataset.simAtiva = "1";
    try {
      construtor(el);
    } catch (err) {
      console.error("Falha ao montar simulação", el.dataset.sim, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Ajudantes para montar DOM com pouco ruído.
// ---------------------------------------------------------------------------

function elem(tag, attrs = {}, filhos = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.slice(2), v);
    } else if (v !== null && v !== undefined) {
      el.setAttribute(k, v);
    }
  }
  for (const f of [].concat(filhos)) {
    if (f) el.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
  }
  return el;
}

// Cabeçalho padrão de uma simulação (título + legenda opcional).
function moldura(host, titulo, legenda) {
  host.classList.add("sim-box");
  host.appendChild(
    elem("p", { class: "sim-titulo" }, [
      elem("span", { class: "sim-icone", "aria-hidden": "true" }, "🧪"),
      titulo,
    ])
  );
  const corpo = elem("div", { class: "sim-corpo" });
  host.appendChild(corpo);
  if (legenda) {
    host.appendChild(elem("p", { class: "sim-legenda" }, legenda));
  }
  return corpo;
}

// ===========================================================================
// Simulação: condicional (proteção térmica de um motor)
// ===========================================================================
//
// Engenharia: um controlador lê a temperatura de um motor e decide, sozinho,
// se deve desligá-lo para proteção. É exatamente a estrutura if/else.

registrar("condicional", (host) => {
  const LIMITE = 90; // °C
  const corpo = moldura(
    host,
    "Simulador: proteção térmica de um motor",
    "Arraste a temperatura medida pelo sensor. O controlador avalia " +
      "a condição e decide a ação, igual a um if/else."
  );

  let temp = 70;

  const valorTemp = elem("output", { class: "sim-valor" });
  const slider = elem("input", {
    type: "range",
    min: "20",
    max: "150",
    value: String(temp),
    step: "1",
    "aria-label": "Temperatura do motor em graus Celsius",
  });

  const condTexto = elem("code", { class: "sim-cond" });
  const condTag = elem("span", { class: "sim-bool" });
  const acao = elem("p", { class: "sim-acao" });

  // Mini fluxograma que acende o caminho ativo.
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 320 150");
  svg.setAttribute("class", "sim-fluxo");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    "Fluxograma: a condição temperatura maior que 90 leva a desligar (V) ou manter (F)."
  );
  svg.innerHTML = `
    <polygon id="f-cond" points="160,8 250,55 160,102 70,55" fill="none" stroke-width="2"/>
    <text x="160" y="52" text-anchor="middle" font-size="12" font-family="sans-serif">temp &gt; 90?</text>
    <rect id="f-v" x="232" y="110" width="80" height="34" rx="7" fill="none" stroke-width="2"/>
    <text x="272" y="131" text-anchor="middle" font-size="11" font-family="sans-serif">desligar</text>
    <rect id="f-f" x="8" y="110" width="80" height="34" rx="7" fill="none" stroke-width="2"/>
    <text x="48" y="131" text-anchor="middle" font-size="11" font-family="sans-serif">manter</text>
    <path id="a-v" d="M210,80 L260,110" fill="none" stroke-width="2"/>
    <path id="a-f" d="M110,80 L60,110" fill="none" stroke-width="2"/>
    <text x="232" y="98" font-size="10" font-family="sans-serif" font-weight="bold">V</text>
    <text x="78" y="98" font-size="10" font-family="sans-serif" font-weight="bold">F</text>
  `;

  function atualizar() {
    temp = Number(slider.value);
    valorTemp.textContent = `${temp} °C`;
    const ligar = temp > LIMITE;

    condTexto.textContent = `temperatura > ${LIMITE}  →  ${ligar ? "True" : "False"}`;
    condTag.textContent = ligar ? "VERDADEIRO" : "FALSO";
    condTag.className = "sim-bool " + (ligar ? "is-v" : "is-f");
    acao.innerHTML = ligar
      ? "🔴 <strong>Desligar o motor</strong> (temperatura acima do limite seguro)."
      : "🟢 <strong>Manter funcionando</strong> (temperatura dentro do limite).";

    // Acende o caminho ativo no fluxograma.
    svg.querySelector("#f-v").classList.toggle("ativo", ligar);
    svg.querySelector("#a-v").classList.toggle("ativo", ligar);
    svg.querySelector("#f-f").classList.toggle("ativo", !ligar);
    svg.querySelector("#a-f").classList.toggle("ativo", !ligar);
    host.classList.toggle("sim-alerta", ligar);
  }

  slider.addEventListener("input", atualizar);

  const controles = elem("div", { class: "sim-controles" }, [
    elem("label", { class: "sim-campo" }, [
      elem("span", {}, "Temperatura do sensor"),
      slider,
    ]),
    valorTemp,
  ]);

  const painel = elem("div", { class: "sim-painel" }, [
    elem("p", { class: "sim-linha" }, [
      elem("span", { class: "sim-rotulo" }, "Condição avaliada: "),
      condTexto,
      condTag,
    ]),
    acao,
  ]);

  corpo.appendChild(svg);
  corpo.appendChild(elem("div", { class: "sim-paineis" }, [controles, painel]));
  atualizar();
});

// Atalhos para botões da simulação.
function botao(texto, secundario) {
  return elem("button", {
    class: "btn sim-btn" + (secundario ? " sim-btn-sec" : ""),
    type: "button",
  }, texto);
}

// Movimento reduzido: respeita a preferência do sistema operacional.
const SEM_ANIMACAO = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// ===========================================================================
// Lição 01: algoritmo como sequência de passos (partida de uma bomba)
// ===========================================================================

registrar("passos", (host) => {
  const corpo = moldura(
    host,
    "Simulador: execução passo a passo",
    "Um algoritmo é uma sequência de passos em uma ordem obrigatória. " +
      "Avance um passo de cada vez e acompanhe o procedimento de partida de uma bomba."
  );

  const passos = [
    "Verificar o nível do reservatório",
    "Abrir a válvula de sucção",
    "Conferir a pressão do óleo",
    "Energizar o motor",
    "Confirmar a vazão na saída",
  ];

  let i = -1;
  const lista = elem("ol", { class: "sim-passos" });
  const itens = passos.map((p) => {
    const li = elem("li", {}, p);
    lista.appendChild(li);
    return li;
  });

  const status = elem("p", { class: "sim-acao" });
  const btnProx = botao("Próximo passo ▶");
  const btnReset = botao("Reiniciar ↺", true);

  function render() {
    itens.forEach((li, idx) => {
      li.classList.toggle("feito", idx < i);
      li.classList.toggle("atual", idx === i);
    });
    if (i < 0) status.textContent = "Pronto para iniciar a partida.";
    else if (i < passos.length)
      status.innerHTML = "Executando: <strong>" + passos[i] + "</strong>";
    else
      status.innerHTML =
        "✅ <strong>Bomba operando</strong> (todos os passos concluídos na ordem certa).";
    btnProx.disabled = i >= passos.length;
  }

  btnProx.addEventListener("click", () => {
    if (i < passos.length) i++;
    render();
  });
  btnReset.addEventListener("click", () => {
    i = -1;
    render();
  });

  corpo.appendChild(lista);
  corpo.appendChild(elem("div", { class: "sim-botoes" }, [btnProx, btnReset]));
  corpo.appendChild(status);
  render();
});

// ===========================================================================
// Lição 02: variáveis e tipos (a caixa de memória)
// ===========================================================================

registrar("variaveis", (host) => {
  const corpo = moldura(
    host,
    "Simulador: a caixa de memória",
    "Uma variável é uma caixa rotulada que guarda um valor. Digite algo, " +
      "guarde na caixa e veja qual tipo o Python reconhece automaticamente."
  );

  const campo = elem("input", {
    type: "text",
    value: "12.5",
    "aria-label": "Valor a guardar na variável",
  });
  const btn = botao("Guardar");

  const caixaRotulo = elem("span", { class: "sim-caixa-rotulo" }, "medida");
  const caixaVal = elem("div", { class: "sim-caixa-valor" });
  const caixaTipo = elem("span", { class: "sim-tag-tipo" });
  const explica = elem("p", { class: "sim-acao" });

  function detectar(v) {
    const t = v.trim();
    if (t === "True" || t === "False") return ["bool", "🔵", "valor lógico (verdadeiro ou falso)"];
    if (/^-?\d+$/.test(t)) return ["int", "🔢", "número inteiro"];
    if (/^-?\d*\.\d+$/.test(t)) return ["float", "📐", "número decimal"];
    return ["str", "📝", "texto (sequência de caracteres)"];
  }

  function guardar() {
    const v = campo.value;
    const [tipo, ic, desc] = detectar(v);
    caixaVal.textContent = tipo === "str" ? '"' + v + '"' : v;
    caixaTipo.textContent = ic + " " + tipo;
    caixaTipo.className = "sim-tag-tipo tipo-" + tipo;
    explica.innerHTML =
      "Em Python: <code>medida = " +
      (tipo === "str" ? '"' + v + '"' : v) +
      "</code> guarda um <strong>" +
      tipo +
      "</strong> (" +
      desc +
      ").";
  }

  btn.addEventListener("click", guardar);
  campo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") guardar();
  });
  campo.addEventListener("input", guardar);

  corpo.appendChild(
    elem("div", { class: "sim-controles" }, [
      elem("label", { class: "sim-campo" }, [
        elem("span", {}, "Valor digitado"),
        campo,
      ]),
      btn,
    ])
  );
  corpo.appendChild(
    elem("div", { class: "sim-caixa" }, [caixaRotulo, caixaVal, caixaTipo])
  );
  corpo.appendChild(explica);
  guardar();
});

// ===========================================================================
// Lição 03: entrada, processamento e saída (conversor de unidades)
// ===========================================================================

registrar("pipeline", (host) => {
  const corpo = moldura(
    host,
    "Simulador: entrada → processo → saída",
    "Todo programa segue esse fluxo. Mude a temperatura de entrada e veja-a " +
      "atravessar o processamento até virar a saída em graus Fahrenheit."
  );

  const campo = elem("input", {
    type: "number",
    value: "25",
    step: "1",
    "aria-label": "Temperatura de entrada em graus Celsius",
  });

  const vIn = elem("strong", {});
  const vOut = elem("strong", {});
  const caixaIn = elem("div", { class: "sim-cx sim-cx-in" }, [
    elem("span", { class: "sim-cx-rot" }, "ENTRADA"),
    vIn,
  ]);
  const caixaProc = elem("div", { class: "sim-cx sim-cx-proc" }, [
    elem("span", { class: "sim-cx-rot" }, "PROCESSO"),
    elem("code", {}, "C * 9/5 + 32"),
  ]);
  const caixaOut = elem("div", { class: "sim-cx sim-cx-out" }, [
    elem("span", { class: "sim-cx-rot" }, "SAÍDA"),
    vOut,
  ]);

  function atualizar() {
    const c = Number(campo.value);
    const f = c * 9 / 5 + 32;
    vIn.textContent = `${c} °C`;
    vOut.textContent = `${Number(f.toFixed(1))} °F`;
    caixaProc.classList.remove("pulsar");
    if (!SEM_ANIMACAO) {
      // Reinicia a animação de pulso a cada mudança.
      void caixaProc.offsetWidth;
      caixaProc.classList.add("pulsar");
    }
  }

  campo.addEventListener("input", atualizar);

  corpo.appendChild(
    elem("div", { class: "sim-controles" }, [
      elem("label", { class: "sim-campo" }, [
        elem("span", {}, "Temperatura de entrada"),
        campo,
      ]),
    ])
  );
  corpo.appendChild(
    elem("div", { class: "sim-pipeline" }, [
      caixaIn,
      elem("span", { class: "sim-seta", "aria-hidden": "true" }, "→"),
      caixaProc,
      elem("span", { class: "sim-seta", "aria-hidden": "true" }, "→"),
      caixaOut,
    ])
  );
  atualizar();
});

// ===========================================================================
// Lição 04: operadores (calculadora visual)
// ===========================================================================

registrar("operadores", (host) => {
  const corpo = moldura(
    host,
    "Simulador: a calculadora de operadores",
    "Escolha dois valores e um operador. Operadores aritméticos devolvem um " +
      "número; operadores de comparação e lógicos devolvem um booleano."
  );

  const a = elem("input", { type: "number", value: "8", "aria-label": "Primeiro valor" });
  const b = elem("input", { type: "number", value: "3", "aria-label": "Segundo valor" });
  const op = elem("select", { "aria-label": "Operador" });
  const ops = [
    ["+", "soma"], ["-", "subtração"], ["*", "multiplicação"],
    ["/", "divisão"], ["//", "divisão inteira"], ["%", "resto"], ["**", "potência"],
    ["==", "igual a"], ["!=", "diferente de"], [">", "maior que"],
    ["<", "menor que"], [">=", "maior ou igual"], ["<=", "menor ou igual"],
  ];
  ops.forEach(([s, nome]) =>
    op.appendChild(elem("option", { value: s }, `${s}  (${nome})`))
  );

  const expr = elem("code", { class: "sim-expr" });
  const res = elem("span", { class: "sim-res" });

  function calcula(x, y, o) {
    switch (o) {
      case "+": return x + y;
      case "-": return x - y;
      case "*": return x * y;
      case "/": return y === 0 ? "ZeroDivisionError" : Number((x / y).toFixed(4));
      case "//": return y === 0 ? "ZeroDivisionError" : Math.floor(x / y);
      case "%": return y === 0 ? "ZeroDivisionError" : x % y;
      case "**": return Number(Math.pow(x, y).toFixed(4));
      case "==": return x === y;
      case "!=": return x !== y;
      case ">": return x > y;
      case "<": return x < y;
      case ">=": return x >= y;
      case "<=": return x <= y;
    }
  }

  function atualizar() {
    const x = Number(a.value), y = Number(b.value), o = op.value;
    const r = calcula(x, y, o);
    expr.textContent = `${x} ${o} ${y}`;
    if (typeof r === "boolean") {
      res.textContent = r ? "True" : "False";
      res.className = "sim-res " + (r ? "is-true" : "is-false");
    } else {
      res.textContent = String(r);
      res.className = "sim-res is-num" + (r === "ZeroDivisionError" ? " is-erro" : "");
    }
  }

  [a, b].forEach((c) => c.addEventListener("input", atualizar));
  op.addEventListener("change", atualizar);

  corpo.appendChild(
    elem("div", { class: "sim-calc" }, [
      a, op, b,
      elem("span", { class: "sim-igual" }, "="),
      res,
    ])
  );
  corpo.appendChild(
    elem("p", { class: "sim-linha" }, [
      elem("span", { class: "sim-rotulo" }, "Em Python: "),
      expr,
    ])
  );
  atualizar();
});

// ===========================================================================
// Lição 06: laços de repetição (visualizador de laço)
// ===========================================================================

registrar("laco", (host) => {
  const corpo = moldura(
    host,
    "Simulador: o laço em câmera lenta",
    "Um laço repete um bloco várias vezes. Defina quantas voltas e rode: " +
      "veja o contador avançar e a soma acumular a cada iteração."
  );

  const slider = elem("input", {
    type: "range", min: "1", max: "10", value: "5",
    "aria-label": "Número de repetições",
  });
  const nLabel = elem("output", { class: "sim-valor" });
  const btn = botao("Rodar o laço ▶");

  const codigo = elem("pre", { class: "sim-codigo" });
  const blocos = elem("div", { class: "sim-blocos" });
  const status = elem("p", { class: "sim-acao" });

  let timer = null;

  function pintarCodigo(iAtivo) {
    codigo.innerHTML =
      `soma = 0\n` +
      `<span class="${iAtivo >= 0 ? "ln-ativa" : ""}">for i in range(${slider.value}):</span>\n` +
      `<span class="${iAtivo >= 0 ? "ln-ativa" : ""}">    soma = soma + i</span>\n` +
      `print(soma)`;
  }

  function parar() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function rodar() {
    parar();
    const n = Number(slider.value);
    blocos.innerHTML = "";
    let i = 0, soma = 0;
    btn.disabled = true;

    const passo = () => {
      if (i >= n) {
        parar();
        btn.disabled = false;
        status.innerHTML = `✅ Laço concluído. <code>soma = ${soma}</code> depois de ${n} repetições.`;
        pintarCodigo(-1);
        return;
      }
      soma += i;
      const b = elem("span", { class: "sim-bloco" }, `i=${i}\nsoma=${soma}`);
      blocos.appendChild(b);
      status.innerHTML = `Iteração com <code>i = ${i}</code>: soma passa a valer <strong>${soma}</strong>.`;
      pintarCodigo(i);
      i++;
    };

    if (SEM_ANIMACAO) {
      while (i < n) passo();
    } else {
      passo();
      timer = setInterval(passo, 650);
    }
  }

  slider.addEventListener("input", () => {
    nLabel.textContent = `${slider.value} repetições`;
    pintarCodigo(-1);
  });
  btn.addEventListener("click", rodar);

  corpo.appendChild(
    elem("div", { class: "sim-controles" }, [
      elem("label", { class: "sim-campo" }, [
        elem("span", {}, "Quantas repetições"),
        slider,
      ]),
      nLabel,
      btn,
    ])
  );
  corpo.appendChild(codigo);
  corpo.appendChild(blocos);
  corpo.appendChild(status);
  nLabel.textContent = `${slider.value} repetições`;
  pintarCodigo(-1);
});

// ===========================================================================
// Lição 07: minijogo "Adivinhe o número" (junta input + condicional + laço)
// ===========================================================================

registrar("adivinha", (host) => {
  const corpo = moldura(
    host,
    "Minijogo: adivinhe o número",
    "O computador sorteou um número de 1 a 100. Tente adivinhar: a cada " +
      "palpite o programa usa uma condicional para dizer se é maior ou menor."
  );

  let segredo, tentativas, fim;
  const campo = elem("input", {
    type: "number", min: "1", max: "100",
    "aria-label": "Seu palpite (1 a 100)",
  });
  const btn = botao("Tentar 🎯");
  const btnNovo = botao("Novo jogo ↺", true);
  const dica = elem("p", { class: "sim-acao" });
  const historico = elem("div", { class: "sim-historico" });

  function novo() {
    segredo = Math.floor(Math.random() * 100) + 1;
    tentativas = 0;
    fim = false;
    campo.value = "";
    campo.disabled = false;
    btn.disabled = false;
    historico.innerHTML = "";
    dica.innerHTML = "Digite um palpite de <strong>1 a 100</strong> e clique em Tentar.";
  }

  function tentar() {
    if (fim) return;
    const p = Number(campo.value);
    if (!p || p < 1 || p > 100) {
      dica.innerHTML = "⚠️ Digite um número inteiro de <strong>1 a 100</strong>.";
      return;
    }
    tentativas++;
    let marca, classe;
    if (p === segredo) {
      fim = true;
      campo.disabled = true;
      btn.disabled = true;
      marca = "🎉 acertou!";
      classe = "acerto";
      dica.innerHTML = `🎉 <strong>Acertou!</strong> Era ${segredo}, em ${tentativas} tentativa(s).`;
    } else if (p < segredo) {
      marca = "↑ maior";
      classe = "baixo";
      dica.innerHTML = `O número é <strong>maior</strong> que ${p}.`;
    } else {
      marca = "↓ menor";
      classe = "alto";
      dica.innerHTML = `O número é <strong>menor</strong> que ${p}.`;
    }
    historico.appendChild(
      elem("span", { class: "sim-chip " + classe }, `${p} ${marca}`)
    );
    campo.value = "";
    campo.focus();
  }

  btn.addEventListener("click", tentar);
  btnNovo.addEventListener("click", novo);
  campo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tentar();
  });

  corpo.appendChild(
    elem("div", { class: "sim-controles sim-controles-linha" }, [campo, btn, btnNovo])
  );
  corpo.appendChild(dica);
  corpo.appendChild(historico);
  novo();
});

// ===========================================================================
// Lição 08: funções (a máquina que transforma entradas em saídas)
// ===========================================================================

registrar("funcao", (host) => {
  const corpo = moldura(
    host,
    "Simulador: a função como uma máquina",
    "Uma função recebe uma entrada, aplica sempre a mesma regra e devolve " +
      "uma saída. Mude o raio e veja a função calcular a área do círculo, " +
      "reaproveitando a mesma fórmula em cada chamada."
  );

  const slider = elem("input", {
    type: "range", min: "1", max: "20", value: "5", step: "1",
    "aria-label": "Raio em centímetros",
  });
  const entrada = elem("strong", {});
  const saida = elem("strong", {});
  const btnChamar = botao("Chamar a função");
  const historico = elem("div", { class: "sim-historico" });

  function area(r) {
    return Math.PI * r * r;
  }

  function atualizar() {
    const r = Number(slider.value);
    entrada.textContent = `r = ${r}`;
    saida.textContent = `${area(r).toFixed(1)} cm²`;
  }

  btnChamar.addEventListener("click", () => {
    const r = Number(slider.value);
    historico.appendChild(
      elem("span", { class: "sim-chip" }, `area_circulo(${r}) = ${area(r).toFixed(1)}`)
    );
  });
  slider.addEventListener("input", atualizar);

  corpo.appendChild(
    elem("div", { class: "sim-pipeline" }, [
      elem("div", { class: "sim-cx sim-cx-in" }, [
        elem("span", { class: "sim-cx-rot" }, "ENTRADA"),
        entrada,
      ]),
      elem("span", { class: "sim-seta", "aria-hidden": "true" }, "→"),
      elem("div", { class: "sim-cx sim-cx-proc" }, [
        elem("span", { class: "sim-cx-rot" }, "area_circulo(r)"),
        elem("code", {}, "π * r ** 2"),
      ]),
      elem("span", { class: "sim-seta", "aria-hidden": "true" }, "→"),
      elem("div", { class: "sim-cx sim-cx-out" }, [
        elem("span", { class: "sim-cx-rot" }, "SAÍDA"),
        saida,
      ]),
    ])
  );
  corpo.appendChild(
    elem("div", { class: "sim-controles" }, [
      elem("label", { class: "sim-campo" }, [elem("span", {}, "Raio (cm)"), slider]),
      btnChamar,
    ])
  );
  corpo.appendChild(
    elem("p", { class: "sim-rotulo" }, "Chamadas reaproveitando a mesma função:")
  );
  corpo.appendChild(historico);
  atualizar();
});

// ===========================================================================
// Lição 09: listas + minijogo de ordenação (bubble sort animado)
// ===========================================================================

registrar("lista", (host) => {
  const corpo = moldura(
    host,
    "Simulador: lista de medições e ordenação",
    "Uma lista guarda vários valores em slots numerados a partir do 0. " +
      "Adicione e remova leituras, e use Ordenar para ver o algoritmo " +
      "comparar e trocar os elementos passo a passo."
  );

  let dados = [37, 12, 58, 25, 9];
  let ocupado = false;
  const barras = elem("div", { class: "sim-barras" });
  const status = elem("p", { class: "sim-acao" });

  const btnAdd = botao("Adicionar leitura +");
  const btnRem = botao("Remover última −", true);
  const btnSort = botao("Ordenar (bubble sort) ▶");

  const MAX = Math.max(60, ...dados);

  function desenhar(destaque = [], travados = []) {
    barras.innerHTML = "";
    const maxV = Math.max(MAX, ...dados, 1);
    dados.forEach((v, idx) => {
      const col = elem("div", { class: "sim-col" });
      const barra = elem("div", { class: "sim-barra" }, [
        elem("span", { class: "sim-barra-val" }, String(v)),
      ]);
      barra.style.height = `${20 + (v / maxV) * 120}px`;
      if (destaque.includes(idx)) barra.classList.add("comparando");
      if (travados.includes(idx)) barra.classList.add("ordenado");
      col.appendChild(barra);
      col.appendChild(elem("span", { class: "sim-idx" }, `[${idx}]`));
      barras.appendChild(col);
    });
  }

  function setBotoes(lig) {
    [btnAdd, btnRem, btnSort].forEach((b) => (b.disabled = !lig));
  }

  btnAdd.addEventListener("click", () => {
    if (ocupado || dados.length >= 9) return;
    const v = Math.floor(Math.random() * 60) + 1;
    dados.push(v);
    desenhar();
    status.innerHTML = `<code>leituras.append(${v})</code> adiciona no índice [${dados.length - 1}].`;
  });
  btnRem.addEventListener("click", () => {
    if (ocupado || dados.length <= 1) return;
    const v = dados.pop();
    desenhar();
    status.innerHTML = `<code>leituras.pop()</code> remove o ${v} do fim da lista.`;
  });

  async function ordenar() {
    if (ocupado) return;
    ocupado = true;
    setBotoes(false);
    const n = dados.length;
    const travados = [];
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        desenhar([j, j + 1], travados);
        status.innerHTML = `Comparando [${j}]=${dados[j]} e [${j + 1}]=${dados[j + 1]}.`;
        if (!SEM_ANIMACAO) await espera(450);
        if (dados[j] > dados[j + 1]) {
          [dados[j], dados[j + 1]] = [dados[j + 1], dados[j]];
          desenhar([j, j + 1], travados);
          if (!SEM_ANIMACAO) await espera(300);
        }
      }
      travados.unshift(n - 1 - i);
    }
    travados.unshift(0);
    desenhar([], travados);
    status.innerHTML = "✅ Lista ordenada do menor para o maior.";
    ocupado = false;
    setBotoes(true);
  }

  btnSort.addEventListener("click", ordenar);

  corpo.appendChild(barras);
  corpo.appendChild(
    elem("div", { class: "sim-botoes" }, [btnAdd, btnRem, btnSort])
  );
  corpo.appendChild(status);
  desenhar();
  status.innerHTML = "Lista inicial com 5 leituras. Experimente os botões.";
});

// ===========================================================================
// Lição 10: minijogo Torre de Hanói (recursividade na prática)
// ===========================================================================

registrar("hanoi", (host) => {
  const corpo = moldura(
    host,
    "Minijogo: Torre de Hanói",
    "Mova toda a pilha para a haste da direita. Só é permitido mover um disco " +
      "por vez, e nunca um disco maior sobre um menor. Resolver na unha é difícil; " +
      "veja como a recursão resolve sozinha."
  );

  const N = 3;
  let torres, selecionada, movimentos, ocupado;

  const hastesEl = elem("div", { class: "sim-hanoi" });
  const status = elem("p", { class: "sim-acao" });
  const btnReset = botao("Reiniciar ↺", true);
  const btnAuto = botao("Resolver com recursão 🤖");

  const cores = ["var(--cor-mec)", "var(--cor-ele)", "var(--cor-tel)", "var(--cor-marca)"];

  function novo() {
    torres = [[], [], []];
    for (let d = N; d >= 1; d--) torres[0].push(d);
    selecionada = null;
    movimentos = 0;
    ocupado = false;
    desenhar();
    status.innerHTML = "Clique em uma haste para pegar o disco do topo.";
  }

  function desenhar() {
    hastesEl.innerHTML = "";
    torres.forEach((pilha, t) => {
      const haste = elem("div", { class: "sim-haste" + (selecionada === t ? " sel" : "") });
      haste.dataset.t = String(t);
      const coluna = elem("div", { class: "sim-haste-discos" });
      pilha.forEach((d) => {
        const disco = elem("div", { class: "sim-disco" }, String(d));
        disco.style.width = `${30 + d * 22}px`;
        disco.style.background = cores[(d - 1) % cores.length];
        coluna.appendChild(disco);
      });
      haste.appendChild(coluna);
      haste.appendChild(elem("div", { class: "sim-base" }));
      hastesEl.appendChild(haste);
    });
  }

  function mover(de, para) {
    const d = torres[de][torres[de].length - 1];
    torres[de].pop();
    torres[para].push(d);
    movimentos++;
  }

  function clique(t) {
    if (ocupado) return;
    if (selecionada === null) {
      if (!torres[t].length) {
        status.textContent = "Essa haste está vazia. Escolha outra.";
        return;
      }
      selecionada = t;
      desenhar();
      status.innerHTML = `Disco do topo da haste ${t + 1} selecionado. Agora escolha o destino.`;
      return;
    }
    if (t === selecionada) {
      selecionada = null;
      desenhar();
      return;
    }
    const disco = torres[selecionada][torres[selecionada].length - 1];
    const topoDestino = torres[t][torres[t].length - 1];
    if (topoDestino && disco > topoDestino) {
      status.innerHTML = "🚫 Não pode pôr um disco maior sobre um menor.";
      selecionada = null;
      desenhar();
      return;
    }
    mover(selecionada, t);
    selecionada = null;
    desenhar();
    if (torres[2].length === N) {
      status.innerHTML = `🎉 Resolvido em <strong>${movimentos}</strong> movimentos! O mínimo é ${Math.pow(2, N) - 1}.`;
    } else {
      status.innerHTML = `Movimentos: ${movimentos}.`;
    }
  }

  hastesEl.addEventListener("click", (e) => {
    const haste = e.target.closest(".sim-haste");
    if (haste) clique(Number(haste.dataset.t));
  });

  async function auto() {
    if (ocupado) return;
    novo();
    ocupado = true;
    btnAuto.disabled = true;
    const passos = [];
    const resolver = (n, de, para, aux) => {
      if (n === 0) return;
      resolver(n - 1, de, aux, para);
      passos.push([de, para]);
      resolver(n - 1, aux, para, de);
    };
    resolver(N, 0, 2, 1);
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    for (const [de, para] of passos) {
      mover(de, para);
      desenhar();
      status.innerHTML = `🤖 A recursão moveu da haste ${de + 1} para a ${para + 1}. Movimentos: ${movimentos}.`;
      await espera(SEM_ANIMACAO ? 0 : 600);
    }
    status.innerHTML = `🎉 A recursão resolveu em ${movimentos} movimentos (o mínimo possível).`;
    btnAuto.disabled = false;
    ocupado = false;
  }

  btnReset.addEventListener("click", novo);
  btnAuto.addEventListener("click", auto);

  corpo.appendChild(hastesEl);
  corpo.appendChild(elem("div", { class: "sim-botoes" }, [btnAuto, btnReset]));
  corpo.appendChild(status);
  novo();
});

// ===========================================================================
// Lição 11: dicionários (busca por chave em um catálogo de materiais)
// ===========================================================================

registrar("dicionario", (host) => {
  const corpo = moldura(
    host,
    "Simulador: busca por chave",
    "Um dicionário associa uma chave a um valor e acha a resposta direto, " +
      "sem percorrer tudo. Escolha um material e busque sua densidade."
  );

  const densidades = {
    aluminio: 2.70,
    aco: 7.85,
    cobre: 8.96,
    titanio: 4.51,
    chumbo: 11.34,
  };

  const select = elem("select", { "aria-label": "Material (chave)" });
  Object.keys(densidades).forEach((k) =>
    select.appendChild(elem("option", { value: k }, k))
  );
  const campoLivre = elem("input", {
    type: "text", placeholder: "ou digite uma chave...",
    "aria-label": "Chave digitada",
  });
  const btn = botao("Buscar 🔎");
  const res = elem("p", { class: "sim-acao" });
  const dictEl = elem("pre", { class: "sim-codigo" });

  function pintarDict(chaveAtiva) {
    const linhas = Object.entries(densidades).map(([k, v]) => {
      const ativa = k === chaveAtiva ? " ln-ativa" : "";
      return `<span class="${ativa}">    "${k}": ${v.toFixed(2)},</span>`;
    });
    dictEl.innerHTML = "densidades = {\n" + linhas.join("\n") + "\n}";
  }

  function buscar() {
    const chave = (campoLivre.value.trim() || select.value).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(densidades, chave)) {
      res.innerHTML = `<code>densidades["${chave}"]</code> devolve <strong>${densidades[chave].toFixed(2)} g/cm³</strong>.`;
      pintarDict(chave);
    } else {
      res.innerHTML = `🚫 <code>densidades["${chave}"]</code> gera <strong>KeyError</strong>: essa chave não existe.`;
      pintarDict(null);
    }
  }

  btn.addEventListener("click", buscar);
  select.addEventListener("change", () => {
    campoLivre.value = "";
    buscar();
  });
  campoLivre.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscar();
  });

  corpo.appendChild(dictEl);
  corpo.appendChild(
    elem("div", { class: "sim-controles sim-controles-linha" }, [select, campoLivre, btn])
  );
  corpo.appendChild(res);
  buscar();
});

// ===========================================================================
// Lição 12: strings (índices, fatias e métodos)
// ===========================================================================

registrar("strings", (host) => {
  const corpo = moldura(
    host,
    "Simulador: anatomia de uma string",
    "Uma string é uma sequência de caracteres indexada a partir do 0. " +
      "Digite um texto e veja índices, fatias e transformações."
  );

  const campo = elem("input", {
    type: "text", value: "ENGENHARIA",
    "aria-label": "Texto a analisar",
  });
  const grade = elem("div", { class: "sim-chars" });
  const ini = elem("input", { type: "range", min: "0", value: "0", "aria-label": "Início da fatia" });
  const fim = elem("input", { type: "range", min: "0", value: "4", "aria-label": "Fim da fatia" });
  const sliceOut = elem("p", { class: "sim-acao" });
  const metodos = elem("div", { class: "sim-historico" });

  function render() {
    const s = campo.value;
    ini.max = String(s.length);
    fim.max = String(s.length);
    if (Number(ini.value) > s.length) ini.value = String(s.length);
    if (Number(fim.value) > s.length) fim.value = String(s.length);
    const a = Math.min(Number(ini.value), Number(fim.value));
    const b = Math.max(Number(ini.value), Number(fim.value));

    grade.innerHTML = "";
    [...s].forEach((ch, idx) => {
      const dentro = idx >= a && idx < b;
      const cel = elem("div", { class: "sim-char" + (dentro ? " sel" : "") }, [
        elem("span", { class: "sim-char-letra" }, ch === " " ? "␣" : ch),
        elem("span", { class: "sim-char-idx" }, String(idx)),
      ]);
      grade.appendChild(cel);
    });

    sliceOut.innerHTML = `<code>texto[${a}:${b}]</code> = <strong>"${s.slice(a, b)}"</strong>`;

    metodos.innerHTML = "";
    const ms = [
      ["len(texto)", s.length],
      ["texto.upper()", s.toUpperCase()],
      ["texto.lower()", s.toLowerCase()],
      ["texto[::-1]", [...s].reverse().join("")],
    ];
    ms.forEach(([nome, val]) =>
      metodos.appendChild(elem("span", { class: "sim-chip" }, `${nome} → ${val}`))
    );
  }

  campo.addEventListener("input", render);
  [ini, fim].forEach((r) => r.addEventListener("input", render));

  corpo.appendChild(
    elem("div", { class: "sim-controles" }, [
      elem("label", { class: "sim-campo" }, [elem("span", {}, "Texto"), campo]),
    ])
  );
  corpo.appendChild(grade);
  corpo.appendChild(
    elem("div", { class: "sim-paineis" }, [
      elem("label", { class: "sim-campo" }, [elem("span", {}, "Início da fatia"), ini]),
      elem("label", { class: "sim-campo" }, [elem("span", {}, "Fim da fatia"), fim]),
    ])
  );
  corpo.appendChild(sliceOut);
  corpo.appendChild(metodos);
  render();
});

// ===========================================================================
// Lição 13: arquivos e dados (ler um CSV linha a linha)
// ===========================================================================

registrar("csv", (host) => {
  const corpo = moldura(
    host,
    "Simulador: lendo um arquivo CSV",
    "Arquivos de dados costumam ser lidos uma linha por vez. Avance a leitura " +
      "e veja cada linha do log do sensor virar uma linha da tabela, com a média sendo atualizada."
  );

  const linhas = [
    ["tempo_s", "tensao_V"],
    ["0", "0.0"],
    ["1", "1.8"],
    ["2", "3.0"],
    ["3", "2.4"],
    ["4", "1.1"],
  ];

  let lida = 0;
  const arquivo = elem("pre", { class: "sim-codigo sim-arquivo" });
  const tabela = elem("table", { class: "sim-tabela" });
  const status = elem("p", { class: "sim-acao" });
  const btn = botao("Ler próxima linha ▶");
  const btnReset = botao("Reiniciar ↺", true);

  function render() {
    arquivo.innerHTML = linhas
      .map((c, idx) => {
        const cls = idx < lida ? "ln-feita" : idx === lida ? "ln-ativa" : "";
        return `<span class="${cls}">${c.join(",")}</span>`;
      })
      .join("\n");

    tabela.innerHTML = "";
    const valores = [];
    linhas.slice(0, Math.max(lida, 1)).forEach((c, idx) => {
      const tr = elem("tr", idx === 0 ? { class: "sim-th" } : {});
      c.forEach((cel) => tr.appendChild(elem(idx === 0 ? "th" : "td", {}, cel)));
      tabela.appendChild(tr);
      if (idx > 0 && idx < lida) valores.push(Number(c[1]));
    });

    if (lida <= 1) {
      status.innerHTML = "Cabeçalho lido. Continue para carregar as medições.";
    } else if (lida < linhas.length) {
      const m = valores.reduce((s, v) => s + v, 0) / valores.length;
      status.innerHTML = `${valores.length} leitura(s) carregada(s). Média da tensão: <strong>${m.toFixed(2)} V</strong>.`;
    } else {
      const m = valores.reduce((s, v) => s + v, 0) / valores.length;
      status.innerHTML = `✅ Arquivo inteiro lido. Média final da tensão: <strong>${m.toFixed(2)} V</strong>.`;
    }
    btn.disabled = lida >= linhas.length;
  }

  btn.addEventListener("click", () => {
    if (lida < linhas.length) lida++;
    render();
  });
  btnReset.addEventListener("click", () => {
    lida = 0;
    render();
  });

  corpo.appendChild(
    elem("div", { class: "sim-paineis" }, [arquivo, tabela])
  );
  corpo.appendChild(elem("div", { class: "sim-botoes" }, [btn, btnReset]));
  corpo.appendChild(status);
  render();
});

// ===========================================================================
// Lição 14: NumPy e Matplotlib (onda senoidal interativa em canvas)
// ===========================================================================

registrar("onda", (host) => {
  const corpo = moldura(
    host,
    "Simulador: sinal senoidal",
    "Com NumPy geramos muitos pontos de uma vez e com Matplotlib os plotamos. " +
      "Ajuste amplitude e frequência e veja o gráfico do sinal mudar na hora."
  );

  const amp = elem("input", { type: "range", min: "10", max: "100", value: "60", "aria-label": "Amplitude" });
  const freq = elem("input", { type: "range", min: "1", max: "10", value: "3", step: "1", "aria-label": "Frequência" });
  const ampOut = elem("output", { class: "sim-valor-mini" });
  const freqOut = elem("output", { class: "sim-valor-mini" });
  const canvas = elem("canvas", { class: "sim-canvas", width: "560", height: "200" });
  const formula = elem("code", { class: "sim-expr" });

  function cor(nome, fallback) {
    const v = getComputedStyle(host).getPropertyValue(nome).trim();
    return v || fallback;
  }

  function desenhar() {
    const A = Number(amp.value);
    const f = Number(freq.value);
    ampOut.textContent = `A = ${A}`;
    freqOut.textContent = `f = ${f}`;
    formula.textContent = `y = ${A} * np.sin(${f} * x)`;

    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height, meio = h / 2;
    ctx.clearRect(0, 0, w, h);

    // Eixo central.
    ctx.strokeStyle = cor("--cor-borda", "#ccc");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, meio);
    ctx.lineTo(w, meio);
    ctx.stroke();

    // Onda.
    ctx.strokeStyle = cor("--cor-marca", "#c2410c");
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 0; px <= w; px++) {
      const x = (px / w) * 2 * Math.PI;
      const y = meio - A * Math.sin(f * x);
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
  }

  [amp, freq].forEach((r) => r.addEventListener("input", desenhar));

  corpo.appendChild(canvas);
  corpo.appendChild(
    elem("div", { class: "sim-paineis" }, [
      elem("label", { class: "sim-campo" }, [
        elem("span", {}, "Amplitude"), amp, ampOut,
      ]),
      elem("label", { class: "sim-campo" }, [
        elem("span", {}, "Frequência"), freq, freqOut,
      ]),
    ])
  );
  corpo.appendChild(
    elem("p", { class: "sim-linha" }, [
      elem("span", { class: "sim-rotulo" }, "Em Python: "),
      formula,
    ])
  );
  desenhar();
});
