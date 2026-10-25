"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";
import {
  buttonClass,
  errorClass,
  hintClass,
  inputClass,
  labelClass,
} from "@/lib/ui";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, {
    erro: "",
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.erro && <p className={errorClass}>{state.erro}</p>}

      <label className="block">
        <span className={labelClass}>Nome</span>
        <input
          name="nome"
          required
          maxLength={25}
          autoComplete="name"
          placeholder="Como quer ser chamado"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>E-mail</span>
        <input
          name="email"
          type="email"
          required
          maxLength={191}
          autoComplete="email"
          placeholder="voce@exemplo.com"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Bio</span>
        <textarea
          name="bio"
          rows={3}
          maxLength={250}
          placeholder="Conte em uma linha quem você é"
          className={`${inputClass} resize-y`}
        />
        <span className={hintClass}>Opcional.</span>
      </label>

      <label className="block">
        <span className={labelClass}>Senha</span>
        <input
          name="senha"
          type="password"
          required
          minLength={10}
          maxLength={20}
          autoComplete="new-password"
          className={inputClass}
        />
        <span className={hintClass}>De 10 a 20 caracteres.</span>
      </label>

      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>
        {pending ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
