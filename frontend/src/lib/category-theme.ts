// Tema visual por categoria. As cores ficam em variáveis CSS (globals.css),
// então claro e escuro usam a mesma estrutura e mudam só os valores.

export type TemaCategoria = {
  chave: string;
  variante: 0 | 1 | 2 | 3;
};

const temas: TemaCategoria[] = [
  { chave: "ambar", variante: 0 },
  { chave: "areia", variante: 1 },
  { chave: "argila", variante: 2 },
  { chave: "musgo", variante: 3 },
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
