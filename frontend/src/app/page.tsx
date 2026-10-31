import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogWord } from "@/components/blog-word";
import { Pagination } from "@/components/pagination";
import { PostCover } from "@/components/post-cover";
import { formatDate } from "@/lib/format";
import { getPosts, POSTS_POR_PAGINA } from "@/lib/api";

// Server Component: roda no servidor do Next, não no browser.
// Por isso o fetch não sofre CORS e a API_URL não vaza para o cliente.

type Params = { searchParams: Promise<{ pagina?: string }> };

// "abc", "0", "-3", "1.5" e ausente caem todos na página 1: um link velho ou
// digitado à mão não pode virar erro.
function paginaValida(bruto: string | undefined): number {
  const n = Number(bruto);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

// A página 1 é a canônica. Da 2 em diante, cada página responde por si.
export async function generateMetadata({
  searchParams,
}: Params): Promise<Metadata> {
  const pagina = paginaValida((await searchParams).pagina);

  return {
    alternates: {
      canonical: pagina === 1 ? "/" : `/?pagina=${pagina}`,
    },
  };
}

export default function Home({ searchParams }: Params) {
  return (
    <main className="w-full">
      {/* Hero de largura total: a palavra atravessa a seção e é cortada pelas
          bordas dela. O conteúdo fica em cima, na coluna de sempre. */}
      <section className="relative isolate h-[44vh] min-h-[300px] lg:h-[60vh] lg:min-h-[420px] overflow-x-clip">
        <BlogWord />
      </section>

      <div className="mx-auto w-full max-w-3xl px-6 pt-10">
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

      <div className="mx-auto w-full max-w-3xl px-6 pb-10 pt-6">
        <Suspense fallback={<PostListSkeleton />}>
          {/* A Promise desce sem ser resolvida: com cacheComponents, a
              leitura de searchParams precisa acontecer dentro do Suspense. */}
          <PostList searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function PostList({ searchParams }: Params) {
  const pagina = paginaValida((await searchParams).pagina);
  const { posts, total } = await getPosts(pagina);
  const totalPaginas = Math.max(1, Math.ceil(total / POSTS_POR_PAGINA));

  // Página além do fim: 404, não redirect. Um link antigo não deve cair
  // silenciosamente em outro conteúdo.
  if (total > 0 && pagina > totalPaginas) notFound();

  if (posts.length === 0) {
    return (
      <div className="mt-2 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
        <p className="font-serif text-xl">Nada publicado ainda.</p>
        <p className="mt-2 text-sm text-muted">
          Quando o primeiro post sair, ele aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul>
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

            <PostCover
              categoria={post.categoria}
              capa={post.capa}
              className="aspect-square w-20 shrink-0 overflow-hidden rounded-xl border border-line transition-transform duration-300 group-hover:-translate-y-0.5 sm:aspect-[4/3] sm:w-32"
            />
          </article>
        </li>
        ))}
      </ul>

      <Pagination pagina={pagina} totalPaginas={totalPaginas} />
    </>
  );
}

function PostListSkeleton() {
  return (
    <ul className="animate-pulse">
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
