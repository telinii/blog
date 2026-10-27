"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { deletePost } from "@/lib/api";

export type DeletePostState = { erro: string } | null;

// Exclusão disparada pelo botão da página do post. No caminho feliz não há
// retorno: redireciona para a home. Só volta valor quando deu errado.
export async function deletePostAction(
  postId: string,
): Promise<DeletePostState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  if (!/^\d+$/.test(postId)) {
    return { erro: "Post inválido." };
  }

  const result = await deletePost(token, postId);

  if (!result.ok) {
    // Token inválido/expirado: descarta o cookie velho e pede login de novo
    if (result.status === 401) {
      cookieStore.delete("token");
      redirect("/login");
    }

    if (result.status === 404) {
      return { erro: "Este post já não existe." };
    }

    if (result.status === 403) {
      return { erro: "Você só pode excluir seus próprios posts." };
    }

    return { erro: result.erro };
  }

  // A home lista os posts: sem isto ela continuaria mostrando o excluído.
  revalidatePath("/");
  redirect("/");
}
