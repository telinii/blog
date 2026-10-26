import { deslocamentos, type Leque } from "@/lib/ribbon";

type Props = {
  /** Prefixo único dos ids internos (gradiente, máscara, path base). */
  id: string;
  /** Caminho da curva que o leque segue. */
  d: string;
  leque: Leque;
  /** Espessura do traço de cada cópia do leque. */
  espessura?: number;
  /** Espessura do traço grosso que dá corpo à fita. 0 desliga. */
  corpo?: number;
  /** Opacidade do grupo inteiro. */
  opacidade?: number;
  /** Onde a máscara começa e termina a dissolver, em fração do comprimento. */
  fade?: { de: number; ate: number };
  className?: string;
  viewBox?: string;
  preserveAspectRatio?: string;
};

// A fita do azul.com, refeita sobre uma curva qualquer.
//
// Três decisões que fazem isso funcionar:
//
// 1. O gradiente usa objectBoundingBox na horizontal (x1=0 → x2=1). Como cada
//    cópia tem seu próprio bbox, o gradiente acompanha cada uma — é o mesmo
//    efeito do original, onde cada curva tem um gradiente deslocado junto com
//    ela. O resultado é cor constante ao longo da fita e transição só no
//    comprimento.
// 2. A máscara apaga as duas pontas. Sem ela a fita termina em corte seco na
//    borda do viewBox, que é o que denuncia decoração feita no improviso.
// 3. O corpo é um traço grosso da mesma curva, bem apagado. Faz o papel da
//    onda orgânica preenchida do site deles sem precisar de um path fechado.
export function RibbonFan({
  id,
  d,
  leque,
  espessura = 1.5,
  corpo = 96,
  opacidade = 1,
  fade = { de: 0.14, ate: 0.86 },
  className,
  viewBox = "0 0 1600 900",
  preserveAspectRatio = "xMidYMid slice",
}: Props) {
  const gradiente = `${id}-grad`;
  const mascara = `${id}-mascara`;
  const base = `${id}-base`;

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradiente} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--ribbon-de)" />
          <stop offset="0.62" stopColor="var(--ribbon-meio)" />
          <stop offset="1" stopColor="var(--ribbon-ate)" />
        </linearGradient>

        <linearGradient id={`${mascara}-grad`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset={fade.de} stopColor="#fff" />
          <stop offset={fade.ate} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>

        <mask id={mascara}>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${mascara}-grad)`}
          />
        </mask>

        <path id={base} d={d} fill="none" />
      </defs>

      {/* A força vem de fora (--ribbon-forca) porque a mesma fita precisa de
          pesos diferentes: sobre o céu claro ela já aparece com pouco, sobre o
          violeta profundo do tema escuro precisa acender mais para existir. */}
      <g
        mask={`url(#${mascara})`}
        style={{ opacity: `calc(${opacidade} * var(--ribbon-forca, 1))` }}
      >
        {corpo > 0 && (
          <use
            href={`#${base}`}
            stroke={`url(#${gradiente})`}
            strokeWidth={corpo}
            opacity="0.07"
          />
        )}

        {deslocamentos(leque).map(({ dx, dy }, i) => (
          <use
            key={i}
            href={`#${base}`}
            transform={`translate(${dx} ${dy})`}
            stroke={`url(#${gradiente})`}
            strokeWidth={espessura}
          />
        ))}
      </g>
    </svg>
  );
}
