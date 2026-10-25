export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Um blog simples, feito com Next.js e Express.</p>
        <p className="text-xs">Posts em português, sem pressa.</p>
      </div>
    </footer>
  );
}
