import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Só existe porque Server Component não pode apagar cookie. A aba de
// rascunhos manda para cá quando a API responde 401; daqui o usuário vai
// para o login já sem o token velho.
export async function GET() {
  (await cookies()).delete("token");
  redirect("/login");
}
