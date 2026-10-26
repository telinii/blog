import { CURVA } from "@/lib/curva";

// A palavra da home: "blog" escrito sobre a curva do fundo.
//
// Fica fora do BlogBackground de propósito — só a home tem a palavra, e assim
// quem decide isso é a página (Server Component), sem consultar a rota no
// cliente e arriscar diferença entre o HTML do servidor e a primeira pintura.
//
// O <textPath> posiciona as letras e já gira cada uma conforme a tangente da
// curva no ponto, sem cálculo de ângulo. São duas cópias: uma desfocada atrás,
// fazendo o halo, e outra nítida em cima.
export function BlogWord() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="palavra-mascara pointer-events-none fixed inset-0 -z-10 hidden h-full w-full md:block"
    >
      <defs>
        <path id="curva-blog" d={CURVA} fill="none" />
      </defs>

      <g className="palavra-grupo">
        <text className="palavra-brilho">
          <textPath href="#curva-blog" startOffset="37%" textAnchor="middle">
            blog
          </textPath>
        </text>

        <text className="palavra">
          <textPath href="#curva-blog" startOffset="37%" textAnchor="middle">
            blog
          </textPath>
        </text>
      </g>
    </svg>
  );
}
