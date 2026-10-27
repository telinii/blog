"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateProfile } from "@/lib/api";

export type PerfilState = { erro: string; ok: boolean };

// Mesmos limites do perfilSchema do backend. Validar aqui só serve para
// mostrar a mensagem antes da viagem; a API é quem manda.
const NOME_MAX = 25;
const BIO_MAX = 250;

export async function atualizarPerfilAction(
  _prev: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!nome) {
    return { erro: "O nome não pode ficar vazio.", ok: false };
  }
  if (nome.length > NOME_MAX) {
    return { erro: `O nome deve ter no máximo ${NOME_MAX} caracteres.`, ok: false };
  }
  if (bio.length > BIO_MAX) {
    return { erro: `A bio deve ter no máximo ${BIO_MAX} caracteres.`, ok: false };
  }

  const result = await updateProfile(token, { nome, bio });

  if (!result.ok) {
    if (result.status === 401) {
      cookieStore.delete("token");
      redirect("/login");
    }

    return { erro: result.erro, ok: false };
  }

  // A bio aparece na página de cada post do autor: invalida todas.
  revalidatePath("/perfil");
  revalidatePath("/posts/[id]", "page");

  return { erro: "", ok: true };
}
