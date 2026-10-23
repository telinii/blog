import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Voltar
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
    <article className="mt-4">
      <h1 className="text-3xl font-bold">{post.titulo}</h1>
      <p className="text-sm text-gray-500">
        {post.categoria} · {post.usuario.nome} · {formatDate(post.data)}
      </p>
      <p className="mt-4 whitespace-pre-line">{post.conteudo}</p>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="mt-4">
      <div className="h-8 w-2/3 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
      <div className="mt-4 h-24 rounded bg-gray-100" />
    </div>
  );
}

