"use client";

import { useActionState } from "react";
import { createPostAction } from "./actions";
import { buttonClass, errorClass, inputClass, labelClass } from "@/lib/ui";

export function PostForm() {
  const [state, formAction, pending] = useActionState(createPostAction, {
    erro: "",
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.erro && <p className={errorClass}>{state.erro}</p>}

      <label className="block">
        <span className={labelClass}>Título</span>
        <input
          name="titulo"
          required
          maxLength={100}
          placeholder="Um título que dá vontade de clicar"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Categoria</span>
        <input
          name="categoria"
          required
          maxLength={50}
          placeholder="Dev, Produto, Carreira..."
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Conteúdo</span>
        <textarea
          name="conteudo"
          required
          rows={10}
          maxLength={5000}
          placeholder="Escreva aqui. Linhas em branco viram parágrafos."
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </label>

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Publicando..." : "Publicar"}
      </button>
    </form>
  );
}
