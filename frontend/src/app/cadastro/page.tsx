import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-accent"
      >
        ← Voltar para a home
      </Link>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-7 shadow-[0_1px_2px_rgba(27,26,23,0.04)] sm:p-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Criar conta
        </h1>
        <p className="mt-2 text-sm text-muted">
          Depois de criar, você já entra direto para publicar.
        </p>

        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
