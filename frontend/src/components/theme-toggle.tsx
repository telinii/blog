"use client";

// Botão de tema. Não guarda estado em React: lê e escreve o atributo
// data-theme no <html>, que é o que o CSS usa. Assim o ícone certo já vem
// no HTML (via classes dark:) e não há mismatch na hidratação.
export function ThemeToggle() {
  function alternar() {
    const raiz = document.documentElement;
    const novo = raiz.dataset.theme === "dark" ? "light" : "dark";

    raiz.dataset.theme = novo;
    localStorage.setItem("tema", novo);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Alternar entre tema claro e escuro"
      title="Alternar tema"
      className="rounded-lg border border-line p-2 text-muted transition-colors hover:bg-line/40 hover:text-ink"
    >
      {/* Sol: aparece no tema claro */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="h-4 w-4 dark:hidden"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
      </svg>

      {/* Lua: aparece no tema escuro */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden h-4 w-4 dark:block"
      >
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}
