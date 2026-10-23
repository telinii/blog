"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { login } from "@/lib/api";

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

  const result = await login(email, senha);

  if (!result.ok) {
    return { erro: result.erro };
  }

  const cookieStore = await cookies();
  cookieStore.set("token", result.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1h: igual ao expiresIn do token no backend
  });

  // redirect() lança uma exceção interna do Next — nunca coloque dentro de try/catch
  redirect("/posts/novo");
}
