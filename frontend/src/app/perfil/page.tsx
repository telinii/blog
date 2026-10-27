import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/api";
import { PerfilForm } from "./perfil-form";

// Lê o cookie e busca o perfil: nada aqui pode ser pré-renderizado.
export const instant = false;

export const metadata: Metadata = { title: "Editar perfil" };

export default async function PerfilPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const perfil = await getMe(token);

  // Token vencido ou conta apagada: limpa o cookie e manda entrar de novo.
  if (!perfil) redirect("/rascunhos/limpar-sessao");

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12 sm:py-16">
      <Link
        href="/rascunhos"
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Voltar para os rascunhos
      </Link>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Editar perfil
        </h1>
        <p className="mt-2 text-sm text-muted">
          O nome e a bio aparecem nos seus posts. O e-mail não muda por aqui.
        </p>

        <PerfilForm perfil={perfil} />
      </div>
    </main>
  );
}
