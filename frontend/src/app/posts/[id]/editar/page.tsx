import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { assetUrl, getPost } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { EditPostForm } from "./edit-post-form";

export const instant = false;

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();

  if (!cookieStore.get("token")) {
    redirect("/login");
  }

  // Com o token, o autor abre o próprio rascunho no formulário.
  const post = await getPost(id, cookieStore.get("token")?.value);
  if (!post) notFound();

  const user = await getSessionUser();

  // Post de outra pessoa: para o visitante, ele "não existe" como editável.
  // A API também responde 403 se alguém tentar burlar a interface.
  if (!user || user.id !== post.usuario.id) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <Link
        href={`/posts/${post.id}`}
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Voltar para o post
      </Link>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Editar post
        </h1>
        <p className="mt-2 text-sm text-muted">
          Ajuste o texto, a categoria ou a capa. Só você pode editar este post.
        </p>

        <EditPostForm
          post={post}
          capaUrl={post.capa ? assetUrl(post.capa) : null}
        />
      </div>
    </main>
  );
}
