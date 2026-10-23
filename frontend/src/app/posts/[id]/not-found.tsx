import Link from "next/link";

// Mais específico: substitui apenas o conteúdo de /posts/[id],
// mantendo o layout raiz. É o boundary mais próximo de onde
// o notFound() é lançado, então tem prioridade sobre o da raiz.
export default function PostNotFound() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Post não encontrado</h1>
      <p className="mt-2 text-gray-600">
        Esse post não existe ou foi removido.
      </p>

      <Link href="/" className="mt-6 inline-block text-blue-600 hover:underline">
        ← Voltar para a lista
      </Link>
    </main>
  );
}
