"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { buttonClass, errorClass, inputClass, labelClass } from "@/lib/ui";

export function LoginForm() {
  // useActionState guarda o retorno da action (aqui, o erro) e o estado de envio
  const [state, formAction, pending] = useActionState(loginAction, { erro: "" });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.erro && <p className={errorClass}>{state.erro}</p>}

      <label className="block">
        <span className={labelClass}>E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@exemplo.com"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Senha</span>
        <input
          name="senha"
          type="password"
          required
          minLength={10}
          maxLength={20}
          autoComplete="current-password"
          className={inputClass}
        />
      </label>

      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
