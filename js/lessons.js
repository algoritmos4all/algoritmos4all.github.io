// Índice das lições — fonte única para montar o menu e validar rotas.
// Cada objeto: { id, ordem, titulo, arquivo }.
export const lessons = [
  {
    id: "o-que-e-algoritmo",
    ordem: 1,
    titulo: "O que é um algoritmo",
    arquivo: "licoes/01-o-que-e-algoritmo.html",
  },
  {
    id: "variaveis-e-tipos",
    ordem: 2,
    titulo: "Variáveis e tipos de dados",
    arquivo: "licoes/02-variaveis-e-tipos.html",
  },
  {
    id: "entrada-e-saida",
    ordem: 3,
    titulo: "Entrada e saída",
    arquivo: "licoes/03-entrada-e-saida.html",
  },
  {
    id: "operadores",
    ordem: 4,
    titulo: "Operadores",
    arquivo: "licoes/04-operadores.html",
  },
  {
    id: "condicionais",
    ordem: 5,
    titulo: "Condicionais",
    arquivo: "licoes/05-condicionais.html",
  },
  {
    id: "lacos-de-repeticao",
    ordem: 6,
    titulo: "Laços de repetição",
    arquivo: "licoes/06-lacos-de-repeticao.html",
  },
  {
    id: "juntando-tudo",
    ordem: 7,
    titulo: "Juntando tudo",
    arquivo: "licoes/07-juntando-tudo.html",
  },
  {
    id: "funcoes-e-modulos",
    ordem: 8,
    titulo: "Funções e módulos",
    arquivo: "licoes/08-funcoes-e-modulos.html",
  },
  {
    id: "vetores-e-listas",
    ordem: 9,
    titulo: "Vetores e listas",
    arquivo: "licoes/09-vetores-e-listas.html",
  },
  {
    id: "recursividade",
    ordem: 10,
    titulo: "Recursividade",
    arquivo: "licoes/10-recursividade.html",
  },
  {
    id: "dicionarios-e-tuplas",
    ordem: 11,
    titulo: "Dicionários e tuplas",
    arquivo: "licoes/11-dicionarios-e-tuplas.html",
  },
  {
    id: "strings",
    ordem: 12,
    titulo: "Strings",
    arquivo: "licoes/12-strings.html",
  },
  {
    id: "arquivos-e-dados",
    ordem: 13,
    titulo: "Arquivos e dados",
    arquivo: "licoes/13-arquivos-e-dados.html",
  },
];

// Busca uma lição pelo id. Retorna undefined se não existir.
export function getLesson(id) {
  return lessons.find((l) => l.id === id);
}

// Retorna { anterior, proxima } para a navegação no rodapé.
export function getNeighbors(id) {
  const i = lessons.findIndex((l) => l.id === id);
  return {
    anterior: i > 0 ? lessons[i - 1] : null,
    proxima: i >= 0 && i < lessons.length - 1 ? lessons[i + 1] : null,
  };
}
