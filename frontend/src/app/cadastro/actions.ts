"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createUser, login } from "@/lib/api";

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

  const created = await createUser(body);

  if (!created.ok) {
    return { erro: created.erro };
  }

  // Conta criada: já entra, para não obrigar a digitar tudo de novo
  const session = await login(body.email, body.senha);

  if (!session.ok) {
    // Cadastro deu certo, mas o login automático falhou: manda logar na mão
    redirect("/login");
  }

  const cookieStore = await cookies();
  cookieStore.set("token", session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  redirect("/posts/novo");
}
