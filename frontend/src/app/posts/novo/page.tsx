import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PostForm } from "./post-form";

export const instant = false;

export default async function NewPostPage() {
  // cookies() é dado de requisição. Com instant = false a rota bloqueia
  // (sem shell antecipado), então o redirect acontece no servidor.
  const cookieStore = await cookies();

  if (!cookieStore.get("token")) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Voltar para a home
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Novo post</h1>

      <PostForm />
    </main>
  );
}
