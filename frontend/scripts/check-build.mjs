// Guarda contra build velho: `npm start` serve o que está em `.next/`, não o
// código-fonte. Depois de um `git pull` que muda arquivos, o build antigo
// continua respondendo — rotas novas simplesmente não existem e a tela parece
// quebrada, sem nenhum erro.
//
// Este script roda no `prestart` e compara a data do build com o arquivo mais
// novo do projeto. Se o código for mais novo, aborta com instrução clara.
// Para servir de propósito um build antigo: SKIP_BUILD_CHECK=1 npm start

import { existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const MARCADOR = join(RAIZ, ".next", "BUILD_ID");

// O que entra no build. `node_modules` e `.next` nunca são varridos.
const VIGIADOS = [
  "src",
  "public",
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
];

// Arquivos escritos depois do BUILD_ID ainda podem ser do próprio build
// (cache do Turbopack, cópia de assets), então damos uma folga pequena em vez
// de comparar milissegundo a milissegundo.
const FOLGA_MS = 2_000;

if (process.env.SKIP_BUILD_CHECK === "1") process.exit(0);

if (!existsSync(MARCADOR)) {
  console.error(
    "\n✖ Build de produção não encontrado.\n" +
      "  Rode `npm run build` antes de `npm start` (ou use `npm run dev`).\n",
  );
  process.exit(1);
}

const dataBuild = statSync(MARCADOR).mtimeMs;

// Devolve [caminho, mtime] do arquivo mais recente abaixo de `entrada`.
function maisRecente(entrada) {
  const info = statSync(entrada);

  if (!info.isDirectory()) return [[entrada, info.mtimeMs]];

  return readdirSync(entrada, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(entrada, item.name);

    // Symlink pode apontar para fora da árvore (ou para node_modules).
    if (item.isSymbolicLink()) return [];
    if (item.isDirectory()) {
      return item.name === "node_modules" || item.name === ".next"
        ? []
        : maisRecente(caminho);
    }

    return maisRecente(caminho);
  });
}

const arquivos = VIGIADOS.filter((alvo) => existsSync(join(RAIZ, alvo))).flatMap(
  (alvo) => maisRecente(join(RAIZ, alvo)),
);

const [caminho, dataArquivo] = arquivos.reduce(
  (maisNovo, atual) => (atual[1] > maisNovo[1] ? atual : maisNovo),
  ["", 0],
);

if (dataArquivo > dataBuild + FOLGA_MS) {
  const quando = (ms) =>
    new Date(ms).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  console.error(
    "\n✖ Build de produção desatualizado.\n" +
      `  build:  ${quando(dataBuild)}\n` +
      `  código: ${quando(dataArquivo)}  (${caminho.slice(RAIZ.length)})\n\n` +
      "  `next start` serve o build, não o código: rotas novas ficariam de fora.\n" +
      "  Rode `npm run build` de novo (ou use `npm run dev`).\n" +
      "  Para ignorar esta checagem: SKIP_BUILD_CHECK=1 npm start\n",
  );
  process.exit(1);
}
