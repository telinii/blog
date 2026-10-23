"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  // useActionState guarda o retorno da action (aqui, o erro) e o estado de envio
  const [state, formAction, pending] = useActionState(loginAction, { erro: "" });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.erro && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.erro}</p>
      )}

      <label className="block">
        <span className="text-sm font-medium">E-mail</span>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Senha</span>
        <input
          name="senha"
          type="password"
          required
          minLength={10}
          maxLength={20}
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
