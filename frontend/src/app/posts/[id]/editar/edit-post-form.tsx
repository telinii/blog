"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/api";
import { updatePostAction } from "./actions";
import {
  buttonClass,
  errorClass,
  hintClass,
  inputClass,
  labelClass,
} from "@/lib/ui";

export function EditPostForm({
  post,
  capaUrl,
}: {
  post: Post;
  capaUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(updatePostAction, {
    erro: "",
  });

  // Prévia da imagem nova; null = mostra a capa atual (ou nada).
  const [novaPreview, setNovaPreview] = useState<string | null>(null);
  const [remover, setRemover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = novaPreview ?? (remover ? null : capaUrl);

  // URL.createObjectURL precisa ser revogada para não vazar memória.
  useEffect(() => {
    if (!novaPreview) return;
    return () => URL.revokeObjectURL(novaPreview);
  }, [novaPreview]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="postId" value={post.id} />

      {state.erro && <p className={errorClass}>{state.erro}</p>}

      <label className="block">
        <span className={labelClass}>Título</span>
        <input
          name="titulo"
          required
          maxLength={100}
          defaultValue={post.titulo}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Categoria</span>
        <input
          name="categoria"
          required
          maxLength={50}
          defaultValue={post.categoria}
          className={inputClass}
        />
      </label>

      <div>
        <span className={labelClass}>Capa</span>

        <div className="mt-1.5 overflow-hidden rounded-xl border border-line bg-surface">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Prévia da capa do post"
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center bg-accent/5 px-6 text-center text-sm text-muted">
              Sem foto, o post usa a arte da categoria.
            </div>
          )}
        </div>

        {capaUrl && (
          <label className="mt-3 flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="removerCapa"
              value="true"
              checked={remover}
              onChange={(event) => {
                const marcar = event.target.checked;
                setRemover(marcar);

                // Remover e enviar outra foto ao mesmo tempo não faz sentido.
                if (marcar) {
                  setNovaPreview(null);
                  if (fileRef.current) fileRef.current.value = "";
                }
              }}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Remover capa atual
          </label>
        )}

        <input
          ref={fileRef}
          name="capa"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={(event) => {
            const arquivo = event.target.files?.[0];
            if (!arquivo) {
              setNovaPreview(null);
              return;
            }

            setRemover(false);
            setNovaPreview(URL.createObjectURL(arquivo));
          }}
          className="mt-3 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent hover:file:bg-accent/15"
        />
        <span className={hintClass}>
          JPG, PNG, WEBP, GIF ou AVIF, até 5 MB. Sem arquivo novo, a capa atual
          é mantida.
        </span>
      </div>

      <label className="block">
        <span className={labelClass}>Conteúdo</span>
        <textarea
          name="conteudo"
          required
          rows={10}
          maxLength={5000}
          defaultValue={post.conteudo}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </label>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
        <Link
          href={`/posts/${post.id}`}
          className="text-sm text-muted transition-colors hover:text-accent"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
