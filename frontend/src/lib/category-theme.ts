// Tema visual por categoria. Sem imagem externa: cada categoria ganha uma
// "arte" (gradiente + formas) na mesma paleta quente do site, então o visual
// fica coerente mesmo quando o texto do post não tem foto.

export type TemaCategoria = {
  chave: string;
  de: string; // início do gradiente
  ate: string; // fim do gradiente
  forma: string; // cor das formas
  variante: 0 | 1 | 2 | 3;
};

const temas: TemaCategoria[] = [
  { chave: "ambar", de: "#f7e2c6", ate: "#e8c69c", forma: "#b45309", variante: 0 },
  { chave: "areia", de: "#f2e6d2", ate: "#dbc7a6", forma: "#8a6a4b", variante: 1 },
  { chave: "argila", de: "#f4ded4", ate: "#e2bdaa", forma: "#9a3412", variante: 2 },
  { chave: "musgo", de: "#e8edd7", ate: "#ccd6b0", forma: "#5f6b45", variante: 3 },
];

// Categorias conhecidas caem num tema fixo; o resto usa um hash estável,
// então a mesma categoria sempre recebe a mesma arte.
const porNome: Record<string, number> = {
  dev: 0,
  desenvolvimento: 0,
  codigo: 0,
  frontend: 0,
  backend: 0,
  produto: 2,
  product: 2,
  design: 2,
  carreira: 3,
  vida: 3,
  carreira_e_vida: 3,
};

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function hash(texto: string) {
  let valor = 0;
  for (const char of texto) {
    valor = (valor * 31 + char.charCodeAt(0)) % 997;
  }
  return valor;
}

export function temaDaCategoria(categoria: string): TemaCategoria {
  const chave = normalizar(categoria);
  const indice = porNome[chave] ?? hash(chave) % temas.length;
  return temas[indice];
}
