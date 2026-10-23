import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md p-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Voltar para a home
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Criar conta</h1>
      <p className="mt-1 text-sm text-gray-600">
        Depois de criar, você já entra direto para publicar.
      </p>

      <RegisterForm />

      <p className="mt-6 text-sm text-gray-600">
        Já tem conta?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
