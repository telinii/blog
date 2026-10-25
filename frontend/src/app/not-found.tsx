import Link from "next/link";

// Raiz: cobre notFound() sem boundary mais próximo E URLs que não casam
// com nenhuma rota (ex.: /qualquer-coisa).
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
        Erro 404
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
        Página não encontrada
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-muted">
        O endereço que você tentou abrir não existe.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
      >
        ← Ir para a home
      </Link>
    </main>
  );
}
