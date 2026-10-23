"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

type FormState = { erro: string };

// Server Action: roda no servidor do Next, nunca no browser.
// Por isso o token fica em cookie httpOnly (o JS da página não consegue ler).
export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  if (res.status === 401) {
    return { erro: "E-mail ou senha inválidos." };
  }

  if (!res.ok) {
    return { erro: "Não foi possível entrar. Tente de novo." };
  }

  const { token } = await res.json();

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1h: igual ao expiresIn do token no backend
  });

  // redirect() lança uma exceção interna do Next — nunca coloque dentro de try/catch
  redirect("/posts/novo");
}
