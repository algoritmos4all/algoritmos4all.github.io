// Casca da aplicação: roteador por hash, montagem do menu, tema e mobile.
import { lessons, getLesson, getNeighbors } from "./lessons.js";
import { ativarBotoesExecutar } from "./playground.js";

const CHAVE_TEMA = "a4a:tema";
const CHAVE_VISITADAS = "a4a:visitadas";

const elMenu = document.getElementById("menu-licoes");
const elConteudo = document.getElementById("conteudo");
const elTemaToggle = document.querySelector(".tema-toggle");
const elTemaIcone = document.querySelector(".tema-icone");
const elMenuToggle = document.querySelector(".menu-toggle");
const elOverlay = document.getElementById("overlay");

// --------------------------------------------------------------------------
// Tema claro/escuro
// --------------------------------------------------------------------------

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  elTemaIcone.textContent = tema === "escuro" ? "☀️" : "🌙";
  elTemaToggle.setAttribute(
    "aria-label",
    tema === "escuro" ? "Mudar para tema claro" : "Mudar para tema escuro"
  );
}

function temaInicial() {
  const salvo = localStorage.getItem(CHAVE_TEMA);
  if (salvo === "claro" || salvo === "escuro") return salvo;
  const prefereEscuro = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  return prefereEscuro ? "escuro" : "claro";
}

elTemaToggle.addEventListener("click", () => {
  const novo =
    document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro";
  localStorage.setItem(CHAVE_TEMA, novo);
  aplicarTema(novo);
});

// --------------------------------------------------------------------------
// Progresso (lições visitadas)
// --------------------------------------------------------------------------

function lerVisitadas() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CHAVE_VISITADAS) || "[]"));
  } catch {
    return new Set();
  }
}

function marcarVisitada(id) {
  const visitadas = lerVisitadas();
  visitadas.add(id);
  localStorage.setItem(CHAVE_VISITADAS, JSON.stringify([...visitadas]));
}

// --------------------------------------------------------------------------
// Menu lateral
// --------------------------------------------------------------------------

function montarMenu() {
  const visitadas = lerVisitadas();
  elMenu.innerHTML = "";
  for (const licao of lessons) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#/licao/${licao.id}`;
    a.textContent = licao.titulo;
    a.dataset.id = licao.id;
    if (visitadas.has(licao.id)) a.classList.add("visitado");
    li.appendChild(a);
    elMenu.appendChild(li);
  }
}

function destacarMenu(idAtual) {
  for (const a of elMenu.querySelectorAll("a")) {
    const ativo = a.dataset.id === idAtual;
    a.classList.toggle("ativo", ativo);
    if (ativo) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

// --------------------------------------------------------------------------
// Menu mobile
// --------------------------------------------------------------------------

function abrirMenu() {
  document.body.classList.add("menu-aberto");
  elMenuToggle.setAttribute("aria-expanded", "true");
  elOverlay.hidden = false;
}

function fecharMenu() {
  document.body.classList.remove("menu-aberto");
  elMenuToggle.setAttribute("aria-expanded", "false");
  elOverlay.hidden = true;
}

elMenuToggle.addEventListener("click", () => {
  if (document.body.classList.contains("menu-aberto")) fecharMenu();
  else abrirMenu();
});
elOverlay.addEventListener("click", fecharMenu);
elMenu.addEventListener("click", (e) => {
  if (e.target.closest("a")) fecharMenu();
});

// --------------------------------------------------------------------------
// Renderização do conteúdo
// --------------------------------------------------------------------------

function mostrarEstado(html, ehErro = false) {
  elConteudo.innerHTML = `<div class="estado-msg${
    ehErro ? " erro" : ""
  }">${html}</div>`;
}

function renderHome() {
  destacarMenu(null);
  const cards = lessons
    .map(
      (l) => `
        <li>
          <a href="#/licao/${l.id}">
            <span class="card-num">${String(l.ordem).padStart(2, "0")}</span>
            <span class="card-titulo">${l.titulo}</span>
          </a>
        </li>`
    )
    .join("");

  elConteudo.innerHTML = `
    <section class="home-hero">
      <h1>Aprenda a programar do zero</h1>
      <p class="sub">
        Uma introdução acolhedora a <strong>algoritmos e programação em Python</strong>,
        em português. Sem instalar nada: o código roda direto aqui no navegador.
      </p>
      <a class="home-cta" href="#/licao/${lessons[0].id}">Começar a primeira lição →</a>
    </section>
    <h2>Trilha de lições</h2>
    <p>Siga na ordem — cada lição se apoia na anterior.</p>
    <ol class="home-cards">${cards}</ol>
  `;
  elConteudo.focus();
  window.scrollTo(0, 0);
  document.title = "Algoritmos para Todos — Introdução à programação em Python";
}

async function renderLicao(id) {
  const licao = getLesson(id);
  if (!licao) {
    // Rota inválida → volta para a home com aviso.
    mostrarEstado(
      "Essa lição não foi encontrada. Voltando para o início…",
      true
    );
    setTimeout(() => {
      location.hash = "#/";
    }, 1500);
    return;
  }

  destacarMenu(id);
  mostrarEstado('<span class="carregando"></span> Carregando lição…');

  let html;
  try {
    const resp = await fetch(licao.arquivo);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    html = await resp.text();
  } catch (err) {
    mostrarEstado(
      `Não foi possível carregar esta lição. Verifique sua conexão e tente novamente.
       <br /><br /><a href="#/">Voltar ao início</a>`,
      true
    );
    console.error("Falha ao carregar lição:", err);
    return;
  }

  const { anterior, proxima } = getNeighbors(id);
  elConteudo.innerHTML = `
    <article class="licao">
      <p class="licao-numero">Lição ${String(licao.ordem).padStart(2, "0")}</p>
      ${html}
    </article>
    ${montarNavLicao(anterior, proxima)}
  `;

  ativarBotoesExecutar(elConteudo);
  marcarVisitada(id);
  document.querySelector(`.menu-licoes a[data-id="${id}"]`)?.classList.add(
    "visitado"
  );

  elConteudo.focus();
  window.scrollTo(0, 0);
  document.title = `${licao.titulo} · Algoritmos para Todos`;
}

function montarNavLicao(anterior, proxima) {
  const antHtml = anterior
    ? `<a class="nav-ant" href="#/licao/${anterior.id}">
         <span class="nav-rotulo">← Anterior</span>
         <span class="nav-titulo">${anterior.titulo}</span>
       </a>`
    : `<a class="nav-ant" href="#/"><span class="nav-rotulo">←</span>
         <span class="nav-titulo">Início</span></a>`;

  const proxHtml = proxima
    ? `<a class="nav-prox" href="#/licao/${proxima.id}">
         <span class="nav-rotulo">Próxima →</span>
         <span class="nav-titulo">${proxima.titulo}</span>
       </a>`
    : `<a class="nav-prox" href="#/"><span class="nav-rotulo">Concluído! 🎉</span>
         <span class="nav-titulo">Voltar ao início</span></a>`;

  return `<nav class="licao-nav" aria-label="Navegação entre lições">${antHtml}${proxHtml}</nav>`;
}

// --------------------------------------------------------------------------
// Roteador por hash
// --------------------------------------------------------------------------

function rotear() {
  const hash = location.hash || "#/";
  const m = hash.match(/^#\/licao\/([\w-]+)$/);
  if (m) {
    renderLicao(m[1]);
  } else {
    renderHome();
  }
}

window.addEventListener("hashchange", rotear);

// --------------------------------------------------------------------------
// Início
// --------------------------------------------------------------------------

aplicarTema(temaInicial());
montarMenu();
rotear();
