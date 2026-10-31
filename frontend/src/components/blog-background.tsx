import { MAPA_MUNDI, MAPA_VIEWBOX } from "@/components/world-map-path";

// Fundo do site: só o céu em gradiente e o mapa-múndi.
//
// O céu é fixo (não tem o que acompanhar: é uma cor só). O mapa é preso ao
// documento, não ao viewport: sobe junto com a página, como se estivesse
// impresso atrás do conteúdo. Por isso ele mora num <div> absoluto, não no
// mesmo bloco fixed do gradiente.
//
// O contorno não tem preenchimento e usa `--map-stroke`, que troca de branco
// para tinta escura junto com o tema. `non-scaling-stroke` mantém o fio com
// 1px de verdade em qualquer tamanho de tela, em vez de engordar junto com o
// SVG.
export function BlogBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 bg-[linear-gradient(to_top,var(--bg-sky-bottom),var(--bg-sky-top))]"
      />

      <div
        aria-hidden
        className="mapa-fundo pointer-events-none absolute inset-x-0 top-0 -z-10 h-[105vh] overflow-hidden"
      >
        <svg
          viewBox={MAPA_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
        >
          <path
            d={MAPA_MUNDI}
            fill="none"
            stroke="var(--map-stroke)"
            strokeWidth="1"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </>
  );
}
