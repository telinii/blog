import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PostForm } from "./post-form";

export const instant = false;

export default async function NewPostPage() {
  // cookies() é dado de requisição. Com instant = false a rota bloqueia
  // (sem shell antecipado), então o redirect acontece no servidor.
  const cookieStore = await cookies();

  if (!cookieStore.get("token")) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Voltar para a home
      </Link>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Novo post
        </h1>
        <p className="mt-2 text-sm text-muted">
          Escreva, revise e publique. Dá para editar depois.
        </p>

        <PostForm />
      </div>
    </main>
  );
}
