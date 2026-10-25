import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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
          Entrar
        </h1>
        <p className="mt-2 text-sm text-muted">
          Precisa de uma conta para publicar.
        </p>

        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-accent hover:underline">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
