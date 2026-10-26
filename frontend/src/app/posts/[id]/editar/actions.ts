"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updatePost } from "@/lib/api";

type FormState = { erro: string };

const TIPOS_ACEITOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB, mesmo limite do backend

export async function updatePostAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const postId = String(formData.get("postId") ?? "");
  if (!/^\d+$/.test(postId)) {
    return { erro: "Post inválido." };
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();

  if (!titulo || !conteudo || !categoria) {
    return { erro: "Preencha todos os campos." };
  }

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
  if (capa) body.set("capa", capa);
  if (formData.get("removerCapa") === "true") {
    body.set("removerCapa", "true");
  }

  const result = await updatePost(token, postId, body);

  if (!result.ok) {
    // Token inválido/expirado: descarta o cookie velho e pede login de novo
    if (result.status === 401) {
      cookieStore.delete("token");
      redirect("/login");
    }

    if (result.status === 404) {
      return { erro: "Post não encontrado." };
    }

    return { erro: result.erro };
  }

  // Home e página do post precisam refletir o texto/capa novos.
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}
