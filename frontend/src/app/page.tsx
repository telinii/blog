import { Suspense } from "react";

// Server Component: roda no servidor do Next, não no browser.
// Por isso o fetch abaixo não sofre CORS e a API_URL não vaza para o cliente.
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

async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${API_URL}/posts`);

  if (!res.ok) {
    throw new Error(`A API respondeu ${res.status}`);
  }

  return res.json();
}

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Blog</h1>

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
          <h2 className="text-xl font-semibold">{post.titulo}</h2>
          <p className="text-sm text-gray-500">
            {post.categoria} · {post.usuario.nome}
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
