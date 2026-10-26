import { CURVA } from "@/lib/curva";
import { RibbonFan } from "@/components/ribbon-fan";

// A palavra do hero: "blog" escrito sobre a curva.
//
// Fica presa à seção do hero (absolute), não ao viewport: assim ela é cortada
// pelas bordas do hero — entra pelo canto inferior esquerdo — e rola embora com
// a página, em vez de ficar atrás dos posts.
//
// O <textPath> posiciona as letras e já gira cada uma conforme a tangente da
// curva no ponto, sem cálculo de ângulo. São duas cópias: uma desfocada atrás,
// fazendo o halo, e outra nítida em cima.
//
// Atrás das duas passa o leque: a mesma curva repetida em cópias paralelas,
// formando a fita. A palavra deixa de andar sobre um risco e passa a andar
// sobre uma superfície.
export function BlogWord() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <RibbonFan
        id="hero-fita"
        d={CURVA}
        leque={{ copias: 11, passoY: 23, passoX: -1.6 }}
        espessura={2}
        corpo={0}
        opacidade={0.4}
        fade={{ de: 0.16, ate: 0.82 }}
        viewBox="0 0 1600 600"
        preserveAspectRatio="xMinYMax slice"
        className="absolute inset-0 h-full w-full"
      />

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
