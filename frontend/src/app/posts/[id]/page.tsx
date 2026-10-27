import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCover } from "@/components/post-cover";
import { DeletePostButton } from "./delete-post-button";
import { formatDate } from "@/lib/format";
import { getPost } from "@/lib/api";
import { getSessionToken, getSessionUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // Sem o token aqui, o título do rascunho sairia "Post não encontrado".
  const post = await getPost(id, (await getSessionToken()) ?? undefined);

  if (!post) {
    return { title: "Post não encontrado" };
  }

  return {
    title: post.titulo,
    // Primeiros 160 caracteres: é o limite prático antes do Google cortar
    description: post.conteudo.slice(0, 160),
  };
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10 sm:py-14">
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Todos os posts
      </Link>

      <Suspense fallback={<PostSkeleton />}>
        <PostContent params={params} />
      </Suspense>
    </main>
  );
}

async function PostContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // O token deixa o autor ver o próprio rascunho; para os outros a API
  // responde 404, então nem chega aqui a informação de que ele existe.
  const post = await getPost(id, (await getSessionToken()) ?? undefined);

  // Interrompe a renderização e mostra a página de not-found
  if (!post) notFound();

  const user = await getSessionUser();
  const podeEditar = user?.id === post.usuario.id;

  return (
    <article className="mt-6">
      <div className="overflow-hidden rounded-2xl border border-line shadow-[0_24px_50px_-34px_rgba(0,0,0,0.45)]">
        <PostCover
          categoria={post.categoria}
          capa={post.capa}
          className="aspect-[16/9] sm:aspect-[21/9]"
        />
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            {post.categoria}
          </span>
          {/* Só o autor chega a ver um rascunho: a API responde 404 para os
              outros. O selo é neutro de propósito, sem chamar atenção. */}
          {!post.publicado && (
            <span className="inline-block rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted">
              Rascunho
            </span>
          )}
        </div>
        {podeEditar && (
          <div className="flex items-center gap-4">
            <Link
              href={`/posts/${post.id}/editar`}
              className="text-sm font-medium text-accent transition-opacity hover:opacity-70"
            >
              Editar post
            </Link>
            <DeletePostButton postId={post.id} />
          </div>
        )}
      </div>

      <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        {post.titulo}
      </h1>

      <div className="mt-6 flex items-center gap-3 border-b border-line pb-6">
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-serif text-sm font-semibold text-paper"
        >
          {post.usuario.nome.charAt(0).toUpperCase()}
        </span>
        <div className="text-sm leading-tight">
          <p className="font-medium">{post.usuario.nome}</p>
          <time dateTime={post.data} className="text-muted">
            {formatDate(post.data)}
          </time>
          {/* Só quando existe: bio vazia não reserva espaço. Duas linhas no
              máximo para não empurrar o texto do post para baixo. */}
          {post.usuario.bio && (
            <p className="mt-1 line-clamp-2 text-muted">{post.usuario.bio}</p>
          )}
        </div>
      </div>

      <div className="mt-8 whitespace-pre-line text-[1.0625rem] leading-relaxed">
        {post.conteudo}
      </div>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="aspect-[16/9] rounded-2xl bg-line/60 sm:aspect-[21/9]" />
      <div className="mt-7 h-5 w-24 rounded-full bg-line/70" />
      <div className="mt-4 h-9 w-3/4 rounded bg-line/70" />
      <div className="mt-6 h-10 w-48 rounded bg-line/50" />
      <div className="mt-8 h-4 w-full rounded bg-line/50" />
      <div className="mt-2 h-4 w-full rounded bg-line/50" />
      <div className="mt-2 h-4 w-2/3 rounded bg-line/50" />
    </div>
  );
}
