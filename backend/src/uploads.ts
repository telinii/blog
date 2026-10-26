import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Pasta onde as imagens de capa ficam. Pode ser trocada por UPLOADS_DIR
// (a suíte de testes usa uma pasta temporária para não sujar a real).
export const UPLOADS_DIR = path.resolve(
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads"),
);

// Só formatos que o browser renderiza com segurança. SVG fica de fora:
// ele aceita <script> e poderia virar XSS servido pelo nosso domínio.
const EXTENSAO_POR_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export function extensaoDaImagem(mimetype: string): string | undefined {
  return EXTENSAO_POR_MIME[mimetype];
}

// Grava o arquivo em memória no disco e devolve o caminho público.
// O nome é aleatório: dois arquivos com o mesmo nome nunca se sobrescrevem.
export async function salvarCapa(file: Express.Multer.File): Promise<string> {
  const extensao = extensaoDaImagem(file.mimetype);
  if (!extensao) {
    throw new Error("Formato de imagem não suportado");
  }

  await mkdir(UPLOADS_DIR, { recursive: true });

  const nome = `${randomUUID()}${extensao}`;
  await writeFile(path.join(UPLOADS_DIR, nome), file.buffer);

  return `/uploads/${nome}`;
}

// Remove uma capa que ficou órfã (validação falhou ou o banco recusou o post).
// Nunca apaga nada fora da pasta de uploads.
export async function removerCapa(caminho: string): Promise<void> {
  if (!caminho.startsWith("/uploads/")) return;
  const nome = path.basename(caminho);
  await unlink(path.join(UPLOADS_DIR, nome)).catch(() => {});
}
