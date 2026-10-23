"use client";

import { useActionState } from "react";
import { createPostAction } from "./actions";

export function PostForm() {
  const [state, formAction, pending] = useActionState(createPostAction, {
    erro: "",
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.erro && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.erro}</p>
      )}

      <label className="block">
        <span className="text-sm font-medium">Título</span>
        <input
          name="titulo"
          required
          maxLength={100}
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Categoria</span>
        <input
          name="categoria"
          required
          maxLength={50}
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Conteúdo</span>
        <textarea
          name="conteudo"
          required
          rows={8}
          maxLength={5000}
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Publicando..." : "Publicar"}
      </button>
    </form>
  );
}
