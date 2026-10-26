import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCover } from "@/components/post-cover";
import { formatDate } from "@/lib/format";
import { getPost } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

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
  const post = await getPost(id);

  // Interrompe a renderização e mostra a página de not-found
  if (!post) notFound();

  return (
    <article className="mt-6">
      <div className="overflow-hidden rounded-2xl border border-line shadow-[0_24px_50px_-34px_rgba(0,0,0,0.45)]">
        <PostCover
          categoria={post.categoria}
          capa={post.capa}
          className="aspect-[16/9] sm:aspect-[21/9]"
        />
      </div>

      <span className="mt-7 inline-block rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
        {post.categoria}
      </span>

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
