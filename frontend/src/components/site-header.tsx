import Link from "next/link";
import { Suspense } from "react";
import { AuthMenu } from "@/components/auth-menu";

// Header fixo, compartilhado por todas as páginas.
// O AuthMenu lê o cookie do login, então precisa estar dentro de um <Suspense>
// para o cacheComponents não travar a renderização.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-tight text-ink transition-colors hover:text-accent"
        >
          Blog<span className="text-accent">.</span>
        </Link>

        <Suspense fallback={<div className="h-9 w-40" />}>
          <AuthMenu />
        </Suspense>
      </div>
    </header>
  );
}
