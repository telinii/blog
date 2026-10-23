import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "@/app/logout/actions";

// Server Component que lê o cookie para decidir o que mostrar.
// Por ler dado de requisição, ele precisa estar dentro de um <Suspense>.
export async function AuthMenu() {
  const cookieStore = await cookies();
  const logged = Boolean(cookieStore.get("token"));

  if (!logged) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">
          Entrar
        </Link>
        <Link
          href="/cadastro"
          className="rounded bg-black px-3 py-1.5 text-white"
        >
          Criar conta
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href="/posts/novo"
        className="rounded bg-black px-3 py-1.5 text-white"
      >
        Novo post
      </Link>

      {/* <form action={serverAction}> funciona sem JS: o Next injeta
          campos ocultos e o POST vai direto para a action. */}
      <form action={logoutAction}>
        <button type="submit" className="text-gray-600 hover:underline">
          Sair
        </button>
      </form>
    </div>
  );
}
