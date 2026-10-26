"use client";

import { useActionState, useEffect, useState } from "react";
import { createPostAction } from "./actions";
import { buttonClass, errorClass, hintClass, inputClass, labelClass } from "@/lib/ui";

export function PostForm() {
  const [state, formAction, pending] = useActionState(createPostAction, {
    erro: "",
  });

  // Prévia local da imagem escolhida, antes de publicar.
  const [preview, setPreview] = useState<string | null>(null);

  // URL.createObjectURL precisa ser revogada para não vazar memória.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

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

      <div>
        <span className={labelClass}>Capa (opcional)</span>

        <div className="mt-1.5 overflow-hidden rounded-xl border border-line bg-surface">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Prévia da capa escolhida"
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center bg-accent/5 px-6 text-center text-sm text-muted">
              Sem foto, o post usa a arte da categoria.
            </div>
          )}
        </div>

        <input
          name="capa"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={(event) => {
            const arquivo = event.target.files?.[0];
            setPreview(arquivo ? URL.createObjectURL(arquivo) : null);
          }}
          className="mt-3 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/15"
        />
        <span className={hintClass}>
          JPG, PNG, WEBP, GIF ou AVIF, até 5 MB.
        </span>
      </div>

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
