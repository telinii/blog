import { Suspense } from "react";
import Link from "next/link";
import { CategoryArt } from "@/components/category-art";
import { formatDate } from "@/lib/format";
import { getPosts } from "@/lib/api";

// Server Component: roda no servidor do Next, não no browser.
// Por isso o fetch não sofre CORS e a API_URL não vaza para o cliente.

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      <section className="grid items-center gap-10 border-b border-line pb-12 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
            Diário de bordo
          </p>
          <h1 className="mt-3 max-w-lg font-serif text-4xl font-semibold leading-[1.08] tracking-tight sm:text-[2.9rem]">
            Ideias sobre código, produto e o que aprendi no caminho.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Textos curtos, escritos devagar. Sem newsletter, sem pop-up, sem
            contador de visitas.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-line shadow-[0_24px_50px_-32px_rgba(0,0,0,0.45)]">
          <CategoryArt
            categoria="dev"
            className="aspect-[4/3] md:aspect-[4/5]"
          />
        </div>
      </section>

      <Suspense fallback={<PostListSkeleton />}>
        <PostList />
      </Suspense>
    </main>
  );
}

async function PostList() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
        <p className="font-serif text-xl">Nada publicado ainda.</p>
        <p className="mt-2 text-sm text-muted">
          Quando o primeiro post sair, ele aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-2">
      {posts.map((post) => (
        <li key={post.id} className="border-b border-line last:border-b-0">
          <article className="group flex items-start gap-5 py-8">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                <span className="rounded-full bg-accent/10 px-2.5 py-1 font-medium text-accent">
                  {post.categoria}
                </span>
                <time dateTime={post.data} className="text-muted">
                  {formatDate(post.data)}
                </time>
              </div>

              <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug tracking-tight">
                <Link
                  href={`/posts/${post.id}`}
                  className="transition-colors group-hover:text-accent"
                >
                  {post.titulo}
                </Link>
              </h2>

              <p className="mt-2 line-clamp-2 leading-relaxed text-muted">
                {post.conteudo}
              </p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted">por {post.usuario.nome}</span>
                <Link
                  href={`/posts/${post.id}`}
                  className="font-medium text-accent transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                >
                  Ler post →
                </Link>
              </div>
            </div>

            <CategoryArt
              categoria={post.categoria}
              className="aspect-square w-20 shrink-0 overflow-hidden rounded-xl border border-line transition-transform duration-300 group-hover:-translate-y-0.5 sm:aspect-[4/3] sm:w-32"
            />
          </article>
        </li>
      ))}
    </ul>
  );
}

function PostListSkeleton() {
  return (
    <ul className="mt-2 animate-pulse">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex gap-5 border-b border-line py-8 last:border-b-0">
          <div className="min-w-0 flex-1">
            <div className="h-5 w-20 rounded-full bg-line/70" />
            <div className="mt-4 h-7 w-3/4 rounded bg-line/70" />
            <div className="mt-3 h-4 w-full rounded bg-line/50" />
            <div className="mt-2 h-4 w-5/6 rounded bg-line/50" />
          </div>
          <div className="aspect-square w-20 shrink-0 rounded-xl bg-line/60 sm:aspect-[4/3] sm:w-32" />
        </li>
      ))}
    </ul>
  );
}
