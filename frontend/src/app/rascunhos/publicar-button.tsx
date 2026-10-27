"use client";

import { useState, useTransition } from "react";
import { publicarPostAction } from "./actions";

// Mesmo padrão do botão de excluir: a ação devolve erro (ou nada, quando
// deu certo) e o erro aparece embaixo, sem tirar o usuário da aba.
export function PublicarButton({ postId }: { postId: number }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function publicar() {
    setErro(null);

    startTransition(async () => {
      const resultado = await publicarPostAction(String(postId));
      if (resultado?.erro) setErro(resultado.erro);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={publicar}
        disabled={pendente}
        className="text-sm font-medium text-accent transition-opacity hover:opacity-70 disabled:opacity-50"
      >
        {pendente ? "Publicando..." : "Publicar"}
      </button>

      {erro && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {erro}
        </span>
      )}
    </div>
  );
}
