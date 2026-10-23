"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, {
    erro: "",
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.erro && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.erro}</p>
      )}

      <label className="block">
        <span className="text-sm font-medium">Nome</span>
        <input
          name="nome"
          required
          maxLength={25}
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">E-mail</span>
        <input
          name="email"
          type="email"
          required
          maxLength={191}
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Bio</span>
        <textarea
          name="bio"
          rows={3}
          maxLength={250}
          placeholder="Conte em uma linha quem você é"
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
        <span className="mt-1 block text-xs text-gray-500">
          De 10 a 20 caracteres.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
