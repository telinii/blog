import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "@/app/logout/actions";

const ghostLink =
  "rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-line/50 hover:text-ink";

const solidLink =
  "rounded-lg bg-ink px-3.5 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-accent";

// Server Component que lê o cookie para decidir o que mostrar.
// Por ler dado de requisição, ele precisa estar dentro de um <Suspense>.
export async function AuthMenu() {
  const cookieStore = await cookies();
  const logged = Boolean(cookieStore.get("token"));

  if (!logged) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/login" className={ghostLink}>
          Entrar
        </Link>
        <Link href="/cadastro" className={solidLink}>
          Criar conta
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2">
      <Link href="/posts/novo" className={solidLink}>
        Novo post
      </Link>

      <Link href="/rascunhos" className={ghostLink}>
        Rascunhos
      </Link>

      {/* <form action={serverAction}> funciona sem JS: o Next injeta
          campos ocultos e o POST vai direto para a action. */}
      <form action={logoutAction}>
        <button type="submit" className={ghostLink}>
          Sair
        </button>
      </form>
    </nav>
  );
}
