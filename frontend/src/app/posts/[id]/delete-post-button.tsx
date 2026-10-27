"use client";

import { useState, useTransition } from "react";
import { deletePostAction } from "./actions";

// Excluir com confirmação no próprio lugar: o primeiro clique troca o botão
// por "Excluir de vez?" e o segundo apaga. Sem window.confirm — o diálogo
// nativo ignora o tema do site e bloqueia a página inteira.
export function DeletePostButton({ postId }: { postId: number }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function excluir() {
    setErro(null);

    startTransition(async () => {
      const resultado = await deletePostAction(String(postId));

      // Só volta valor quando falhou: no sucesso a action redireciona.
      if (resultado?.erro) {
        setErro(resultado.erro);
        setConfirmando(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1 text-sm">
      {confirmando ? (
        <span className="flex items-center gap-3">
          <span className="text-muted">Excluir de vez?</span>
          <button
            type="button"
            onClick={excluir}
            disabled={pendente}
            className="font-medium text-red-600 transition-opacity hover:opacity-70 disabled:opacity-50 dark:text-red-400"
          >
            {pendente ? "Excluindo..." : "Sim"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={pendente}
            className="text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            Não
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="text-muted transition-colors hover:text-red-600 dark:hover:text-red-400"
        >
          Excluir
        </button>
      )}

      {erro && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {erro}
        </span>
      )}
    </div>
  );
}
