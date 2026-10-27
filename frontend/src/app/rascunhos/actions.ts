"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { publicarPost } from "@/lib/api";

// Publicar um rascunho é só virar a chave: título, texto e capa já estão
// salvos. Devolve { erro } quando falha; no sucesso a lista se atualiza
// sozinha pelo revalidatePath.
export async function publicarPostAction(
  id: string,
): Promise<{ erro: string } | void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Sem sessão não há o que publicar; a página já redireciona, isto é só
  // uma rede de segurança para um POST forjado.
  if (!token) return { erro: "Sua sessão expirou. Entre de novo." };

  const resultado = await publicarPost(token, id);

  if (!resultado.ok) {
    if (resultado.status === 401) {
      return { erro: "Sua sessão expirou. Entre de novo." };
    }
    return { erro: resultado.erro };
  }

  // A linha sai da aba e o post entra na home — as duas precisam saber.
  revalidatePath("/rascunhos");
  revalidatePath("/");
}
