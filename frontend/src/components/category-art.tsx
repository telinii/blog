import { temaDaCategoria } from "@/lib/category-theme";

// Arte decorativa da categoria: gradiente + formas geométricas em SVG.
// Nada de arquivo de imagem, nada de request externo — só a paleta do site.
//
// As cores vêm de variáveis CSS (`--art-<tema>-de`, `-ate`, `-forma`), então
// a mesma arte troca de paleta sozinha quando o tema escuro entra.
//
// Os ids de <defs> repetem quando a mesma categoria aparece várias vezes na
// página. Isso é intencional: o conteúdo do def é idêntico, então o browser
// reaproveita o primeiro e o resultado é o mesmo.
export function CategoryArt({
  categoria,
  className = "",
}: {
  categoria: string;
  className?: string;
}) {
  const tema = temaDaCategoria(categoria);
  const id = `art-${tema.chave}`;
  const de = `var(--art-${tema.chave}-de)`;
  const ate = `var(--art-${tema.chave}-ate)`;
  const cor = `var(--art-${tema.chave}-forma)`;

  return (
    <div aria-hidden className={`relative ${className}`}>
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={de} />
            <stop offset="100%" stopColor={ate} />
          </linearGradient>
        </defs>

        <rect width="400" height="300" fill={`url(#${id}-bg)`} />
        <Formas variante={tema.variante} cor={cor} />
      </svg>

      <div className="grain pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-overlay" />
    </div>
  );
}

function Formas({ variante, cor }: { variante: number; cor: string }) {
  if (variante === 0) {
    return (
      <>
        <circle cx="312" cy="64" r="150" fill={cor} opacity="0.24" />
        <circle cx="64" cy="256" r="110" fill={cor} opacity="0.16" />
        <path
          d="M0 214 C 90 172, 190 252, 400 186"
          fill="none"
          stroke={cor}
          strokeWidth="1.5"
          opacity="0.45"
        />
        <circle cx="118" cy="104" r="6" fill={cor} opacity="0.55" />
        <circle cx="196" cy="228" r="3" fill={cor} opacity="0.4" />
      </>
    );
  }

  if (variante === 1) {
    return (
      <>
        <g stroke={cor} strokeWidth="14" opacity="0.2">
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={i}
              x1={-120 + i * 58}
              y1="320"
              x2={40 + i * 58}
              y2="-20"
            />
          ))}
        </g>
        <circle cx="318" cy="242" r="92" fill={cor} opacity="0.24" />
        <circle cx="96" cy="86" r="34" fill={cor} opacity="0.2" />
      </>
    );
  }

  if (variante === 2) {
    return (
      <>
        {[56, 96, 136, 176].map((r) => (
          <circle
            key={r}
            cx="112"
            cy="164"
            r={r}
            fill="none"
            stroke={cor}
            strokeWidth="1.5"
            opacity="0.42"
          />
        ))}
        <circle cx="330" cy="84" r="48" fill={cor} opacity="0.24" />
        <circle cx="286" cy="248" r="14" fill={cor} opacity="0.35" />
      </>
    );
  }

  return (
    <>
      <g fill={cor} opacity="0.38">
        {Array.from({ length: 6 }).flatMap((_, linha) =>
          Array.from({ length: 8 }, (_, coluna) => (
            <circle
              key={`${linha}-${coluna}`}
              cx={42 + coluna * 34}
              cy={54 + linha * 34}
              r="2.5"
            />
          )),
        )}
      </g>
      <rect
        x="228"
        y="150"
        width="132"
        height="132"
        rx="10"
        fill={cor}
        opacity="0.2"
        transform="rotate(12 294 216)"
      />
      <path d="M228 60 L296 130 L228 130 Z" fill={cor} opacity="0.26" />
    </>
  );
}
