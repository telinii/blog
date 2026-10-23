import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Post = {
  id: number;
  titulo: string;
  conteudo: string;
  categoria: string;
  publicado: boolean;
  data: string;
  usuario: { id: number; nome: string; bio: string };
};

const API_URL = process.env.API_URL ?? "http://localhost:3000";

async function getPost(id: string): Promise<Post | null> {
  const res = await fetch(`${API_URL}/posts/${id}`);

  // 404 = não existe, 400 = id malformado ("abc"). Nos dois casos,
  // para o usuário o resultado é o mesmo: essa página não existe.
  if (res.status === 404 || res.status === 400) return null;

  if (!res.ok) {
    throw new Error(`A API respondeu ${res.status}`);
  }

  return res.json();
}

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
        {post.categoria} · {post.usuario.nome}
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

