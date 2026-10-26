import { cookies } from "next/headers";

export type SessionUser = { id: number; email: string };

// Lê o usuário do JWT guardado no cookie httpOnly.
// O payload é só decodificado, NÃO verificado: serve para decidir o que
// mostrar na tela. Quem autoriza de verdade é a API, que valida a assinatura
// e a propriedade do post em toda escrita.
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;

  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const dados = JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as {
      id?: unknown;
      email?: unknown;
      exp?: unknown;
    };

    if (typeof dados.id !== "number") return null;

    // Token expirado não deve habilitar o botão de editar.
    if (typeof dados.exp === "number" && dados.exp * 1000 <= Date.now()) {
      return null;
    }

    return {
      id: dados.id,
      email: typeof dados.email === "string" ? dados.email : "",
    };
  } catch {
    return null;
  }
}
