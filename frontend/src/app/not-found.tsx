import Link from "next/link";

// Raiz: cobre notFound() sem boundary mais próximo E URLs que não casam
// com nenhuma rota (ex.: /qualquer-coisa).
export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-gray-600">
        O endereço que você tentou abrir não existe.
      </p>

      <Link href="/" className="mt-6 inline-block text-blue-600 hover:underline">
        ← Ir para a home
      </Link>
    </main>
  );
}
