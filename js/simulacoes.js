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
