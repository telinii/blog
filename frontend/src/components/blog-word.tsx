import { CURVA } from "@/lib/curva";

// A palavra do hero: "blog" escrito sobre a curva.
//
// Fica presa à seção do hero (absolute), não ao viewport: assim ela é cortada
// pelas bordas do hero — entra pelo canto inferior esquerdo — e rola embora com
// a página, em vez de ficar atrás dos posts.
//
// O <textPath> posiciona as letras e já gira cada uma conforme a tangente da
// curva no ponto, sem cálculo de ângulo. São duas cópias: uma desfocada atrás,
// fazendo o halo, e outra nítida em cima.
export function BlogWord() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 1600 600"
        preserveAspectRatio="xMinYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <path id="curva-blog" d={CURVA} fill="none" />
        </defs>

        <g className="palavra-grupo">
          <text className="palavra-brilho">
            <textPath href="#curva-blog" startOffset="3%" textAnchor="start">
              blog
            </textPath>
          </text>

          <text className="palavra">
            <textPath href="#curva-blog" startOffset="3%" textAnchor="start">
              blog
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}
