import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md p-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Voltar para a home
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Entrar</h1>
      <p className="mt-1 text-sm text-gray-600">
        Precisa de uma conta para publicar.
      </p>

      <LoginForm />
    </main>
  );
}
