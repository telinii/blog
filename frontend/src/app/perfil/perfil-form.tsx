"use client";

import { useActionState } from "react";
import type { Perfil } from "@/lib/api";
import { atualizarPerfilAction, type PerfilState } from "./actions";
import { buttonClass, errorClass, hintClass, inputClass, labelClass } from "@/lib/ui";

export function PerfilForm({ perfil }: { perfil: Perfil }) {
  const [state, formAction, pending] = useActionState<PerfilState, FormData>(
    atualizarPerfilAction,
    { erro: "", ok: false },
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.erro && <p className={errorClass}>{state.erro}</p>}
      {state.ok && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          Perfil atualizado.
        </p>
      )}

      <label className="block">
        <span className={labelClass}>E-mail</span>
        {/* Só leitura: trocar e-mail mexe em identidade e não é o assunto
            desta tela. Campo desabilitado não entra no FormData. */}
        <input
          value={perfil.email}
          disabled
          className={`${inputClass} cursor-not-allowed opacity-60`}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Nome</span>
        <input
          name="nome"
          required
          maxLength={25}
          defaultValue={perfil.nome}
          className={inputClass}
        />
        <span className={hintClass}>Até 25 caracteres.</span>
      </label>

      <label className="block">
        <span className={labelClass}>Bio</span>
        <textarea
          name="bio"
          rows={3}
          maxLength={250}
          defaultValue={perfil.bio}
          placeholder="Uma ou duas frases sobre você."
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <span className={hintClass}>
          Até 250 caracteres. Aparece embaixo do seu nome, nos seus posts.
        </span>
      </label>

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
