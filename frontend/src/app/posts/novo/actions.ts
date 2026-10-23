"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

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

  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // o backend lê o usuário daqui
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    // Token inválido/expirado: descarta o cookie velho e pede login de novo
    cookieStore.delete("token");
    redirect("/login");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ erro: "" }));
    return { erro: data.erro ?? "Não foi possível criar o post." };
  }

  // A home busca os posts a cada acesso (fetch sem cache),
  // então basta voltar para ela para o post novo aparecer.
  redirect("/");
}
