"use client";

// Error boundary: precisa ser Client Component.
// O Next o renderiza no lugar da página quando um Server Component lança erro
// (fetch que falhou, API fora do ar, etc).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
        Erro 500
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
        Algo deu errado
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-muted">
        Não foi possível carregar o conteúdo. Verifique se a API está no ar e
        tente de novo.
      </p>

      {error.digest && (
        <p className="mt-3 text-xs text-muted/70">
          Código do erro: {error.digest}
        </p>
      )}

      <button
        onClick={() => reset()}
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
      >
        Tentar de novo
      </button>
    </main>
  );
}
