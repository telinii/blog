import Link from "next/link";

// Mais específico: substitui apenas o conteúdo de /posts/[id],
// mantendo o layout raiz. É o boundary mais próximo de onde
// o notFound() é lançado, então tem prioridade sobre o da raiz.
export default function PostNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
        Erro 404
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
        Post não encontrado
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-muted">
        Esse post não existe ou foi removido.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
      >
        ← Voltar para a lista
      </Link>
    </main>
  );
}
