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
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Algo deu errado</h1>
      <p className="mt-2 text-gray-600">
        Não foi possível carregar o conteúdo. Verifique se a API está no ar e
        tente de novo.
      </p>

      {error.digest && (
        <p className="mt-2 text-xs text-gray-400">Código do erro: {error.digest}</p>
      )}

      <button
        onClick={() => reset()}
        className="mt-6 rounded bg-black px-4 py-2 text-white"
      >
        Tentar de novo
      </button>
    </main>
  );
}
