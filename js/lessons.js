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
