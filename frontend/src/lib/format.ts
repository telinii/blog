// Formata a data ISO que vem da API (ex.: 2026-08-21T01:39:38.160Z)
// no padrão brasileiro: 21/08/2026
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
