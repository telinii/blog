"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPost } from "@/lib/api";

type FormState = { erro: string };

const TIPOS_ACEITOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB, mesmo limite do backend

export async function createPostAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Sem cookie (ou expirado), não dá para publicar: manda logar
  if (!token) {
    redirect("/login");
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();

  if (!titulo || !conteudo || !categoria) {
    return { erro: "Preencha todos os campos." };
  }

  // Validação antecipada: evita gastar upload e dá uma mensagem melhor.
  const arquivo = formData.get("capa");
  const capa = arquivo instanceof File && arquivo.size > 0 ? arquivo : null;

  if (capa) {
    if (!TIPOS_ACEITOS.has(capa.type)) {
      return { erro: "Envie uma imagem JPG, PNG, WEBP, GIF ou AVIF." };
    }
    if (capa.size > TAMANHO_MAXIMO) {
      return { erro: "A imagem deve ter no máximo 5 MB." };
    }
  }

  const body = new FormData();
  body.set("titulo", titulo);
  body.set("conteudo", conteudo);
  body.set("categoria", categoria);
  // O botão clicado decide se nasce publicado. Sem "acao" (ex.: Enter no
  // formulário), o padrão é publicar — é o que o visitante espera.
  const publicado = formData.get("acao") !== "rascunho";
  body.set("publicado", String(publicado));
  if (capa) body.set("capa", capa);

  const result = await createPost(token, body);

  if (!result.ok) {
    // Token inválido/expirado: descarta o cookie velho e pede login de novo
    if (result.status === 401) {
      cookieStore.delete("token");
      redirect("/login");
    }

    return { erro: result.erro };
  }

  // Rascunho volta para a lista de rascunhos, onde dá para publicar depois;
  // publicado volta para a home, onde o post já aparece no topo.
  redirect(publicado ? "/" : "/rascunhos");
}
