import Link from "next/link";

// Navegação entre páginas da home. A página 1 mora em "/" — o parâmetro só
// aparece da 2 em diante, para a URL canônica continuar limpa.
//
// Sem botão desabilitado: quando não há página anterior ou seguinte, o link
// simplesmente não é renderizado.
export function Pagination({
  pagina,
  totalPaginas,
}: {
  pagina: number;
  totalPaginas: number;
}) {
  // Uma página só não precisa de navegação nenhuma.
  if (totalPaginas <= 1) return null;

  const href = (n: number) => (n === 1 ? "/" : `/?pagina=${n}`);
  const linkClass =
    "text-muted transition-colors hover:text-accent";

  return (
    <nav className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-6 text-sm">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} className={linkClass} rel="prev">
          ← Anterior
        </Link>
      ) : (
        <span />
      )}

      <span className="text-muted">
        Página {pagina} de {totalPaginas}
      </span>

      {pagina < totalPaginas ? (
        <Link href={href(pagina + 1)} className={linkClass} rel="next">
          Próxima →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
