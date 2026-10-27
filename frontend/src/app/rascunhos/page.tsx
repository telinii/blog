import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PostCover } from "@/components/post-cover";
import { formatDate } from "@/lib/format";
import { getDrafts } from "@/lib/api";
import { PublicarButton } from "./publicar-button";

// Lê o cookie para saber de quem são os rascunhos: não dá para pré-renderizar.
export const instant = false;

export const metadata: Metadata = { title: "Rascunhos" };

export default async function RascunhosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/login");

  const resultado = await getDrafts(token);

  // Token vencido: some com o cookie velho (num route handler, porque Server
  // Component não pode mexer em cookie) e manda logar de novo. Sem isso, o
  // cabeçalho continuaria dizendo que há alguém logado.
  if (!resultado.ok && resultado.status === 401) {
    redirect("/rascunhos/limpar-sessao");
  }

  if (!resultado.ok) {
    throw new Error(`A API respondeu ${resultado.status}`);
  }

  const rascunhos = resultado.posts;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 sm:py-14">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
        Só você vê esta página
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        Rascunhos
      </h1>
      <p className="mt-3 leading-relaxed text-muted">
        Textos que ainda não foram publicados. Ninguém mais consegue abri-los.
      </p>

      {rascunhos.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
          <p className="font-serif text-xl">Nenhum rascunho guardado.</p>
          <p className="mt-2 text-sm text-muted">
            Comece um texto e escolha &ldquo;Salvar rascunho&rdquo; para ele
            aparecer aqui.
          </p>
          <Link
            href="/posts/novo"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
          >
            Escrever um post
          </Link>
        </div>
      ) : (
        <ul className="mt-6">
          {rascunhos.map((post) => (
            <li key={post.id} className="border-b border-line last:border-b-0">
              <article className="flex items-start gap-5 py-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                    <span className="rounded-full border border-line px-2.5 py-1 font-medium text-muted">
                      Rascunho
                    </span>
                    <span className="text-muted">{post.categoria}</span>
                    <time dateTime={post.data} className="text-muted">
                      {formatDate(post.data)}
                    </time>
                  </div>

                  <h2 className="mt-3 font-serif text-xl font-semibold leading-snug tracking-tight">
                    <Link
                      href={`/posts/${post.id}`}
                      className="transition-colors hover:text-accent"
                    >
                      {post.titulo}
                    </Link>
                  </h2>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <Link
                      href={`/posts/${post.id}/editar`}
                      className="text-muted transition-colors hover:text-ink"
                    >
                      Continuar escrevendo
                    </Link>
                    <PublicarButton postId={post.id} />
                  </div>
                </div>

                <PostCover
                  categoria={post.categoria}
                  capa={post.capa}
                  className="aspect-square w-16 shrink-0 overflow-hidden rounded-xl border border-line sm:w-24"
                />
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
