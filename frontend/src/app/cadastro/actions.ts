"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

type FormState = { erro: string };

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const body = {
    nome: String(formData.get("nome") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    senha: String(formData.get("senha") ?? ""),
  };

  if (!body.nome || !body.email || !body.senha) {
    return { erro: "Preencha nome, e-mail e senha." };
  }

  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    return { erro: "Esse e-mail já está cadastrado." };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ erro: "" }));
    return { erro: data.erro ?? "Não foi possível criar a conta." };
  }

  // Conta criada: já entra, para não obrigar a digitar tudo de novo
  const loginRes = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, senha: body.senha }),
  });

  if (!loginRes.ok) {
    // Cadastro deu certo, mas o login automático falhou: manda logar na mão
    redirect("/login");
  }

  const { token } = await loginRes.json();

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  redirect("/posts/novo");
}
