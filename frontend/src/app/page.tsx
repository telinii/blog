import { Suspense } from "react";
import Link from "next/link";
import { AuthMenu } from "@/components/auth-menu";
import { formatDate } from "@/lib/format";
import { getPosts } from "@/lib/api";

// Server Component: roda no servidor do Next, não no browser.
// Por isso o fetch não sofre CORS e a API_URL não vaza para o cliente.

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blog</h1>
        <Suspense fallback={<div className="h-8 w-36" />}>
          <AuthMenu />
        </Suspense>
      </header>

      <Suspense fallback={<PostListSkeleton />}>
        <PostList />
      </Suspense>
    </main>
  );
}

async function PostList() {
  const posts = await getPosts();

  return (
    <ul className="mt-6 space-y-4">
      {posts.map((post) => (
        <li key={post.id} className="rounded border p-4">
          <h2 className="text-xl font-semibold">
            <Link href={`/posts/${post.id}`} className="hover:underline">
              {post.titulo}
            </Link>
          </h2>
          <p className="text-sm text-gray-500">
            {post.categoria} · {post.usuario.nome} · {formatDate(post.data)}
          </p>
          <p className="mt-2">{post.conteudo}</p>
        </li>
      ))}
    </ul>
  );
}

function PostListSkeleton() {
  return (
    <ul className="mt-6 space-y-4">
      {[0, 1, 2].map((i) => (
        <li key={i} className="rounded border p-4">
          <div className="h-6 w-2/3 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}
