// Classes compartilhadas dos formulários. Ficam aqui para login, cadastro e
// novo post não divergirem no visual (e para o Tailwind achar as strings).

export const labelClass = "block text-sm font-medium text-ink";

export const inputClass =
  "mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink " +
  "placeholder:text-muted/70 transition-colors " +
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15";

export const buttonClass =
  "inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 " +
  "text-sm font-medium text-on-accent transition-colors " +
  "hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60";

export const errorClass =
  "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 " +
  "dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";

export const hintClass = "mt-1.5 block text-xs text-muted";
