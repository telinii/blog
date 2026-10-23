"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPost } from "@/lib/api";

type FormState = { erro: string };

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

  const body = {
    titulo: String(formData.get("titulo") ?? "").trim(),
    conteudo: String(formData.get("conteudo") ?? "").trim(),
    categoria: String(formData.get("categoria") ?? "").trim(),
  };

  if (!body.titulo || !body.conteudo || !body.categoria) {
    return { erro: "Preencha todos os campos." };
  }

  const result = await createPost(token, body);

  if (!result.ok) {
    // Token inválido/expirado: descarta o cookie velho e pede login de novo
    if (result.status === 401) {
      cookieStore.delete("token");
      redirect("/login");
    }

    return { erro: result.erro };
  }

  // A home busca os posts a cada acesso (fetch sem cache),
  // então basta voltar para ela para o post novo aparecer.
  redirect("/");
}
