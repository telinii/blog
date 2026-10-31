import { CURVA } from "@/lib/curva";
import { RibbonFan } from "@/components/ribbon-fan";

// A palavra do hero: "blog" escrito sobre a curva, centralizada nela.
//
// Fica presa à seção do hero (absolute), não ao viewport: assim ela rola embora
// com a página, em vez de ficar atrás dos posts.
//
// O SVG da palavra tem overflow visível: o halo pode passar do pé do hero e
// morrer suave sobre o conteúdo, sem a linha reta que o corte da seção criava.
// O eixo X continua recortado para a palavra não abrir rolagem horizontal.
//
// O <textPath> posiciona as letras e já gira cada uma conforme a tangente da
// curva no ponto, sem cálculo de ângulo. São duas cópias: uma desfocada atrás,
// fazendo o halo, e outra nítida em cima.
//
// Centralizar aqui é mais chato do que parece, por dois motivos:
//
// 1. O centro útil não é o centro do viewBox. Com "slice", a largura que sobra
//    é cortada — e de que lado ela é cortada depende da proporção da tela. Com
//    xMid o recorte é sempre simétrico, então o centro visível cai em x=800 em
//    qualquer largura. É isso que faz a palavra ficar centrada também no
//    celular, sem media query.
// 2. textAnchor="middle" centra pelo avanço dos glifos, não pela tinta. Sobra
//    um desvio que o olho pega. O startOffset é o ponto da curva onde a caixa
//    pintada das letras fica exatamente em x=800 — medido na Playfair, que
//    desenha a palavra um fio à esquerda do centro do avanço.
const CENTRO = "56.3%";

// O leque sobe essa quantidade em relação à linha de base. Desenhado na altura
// da curva, ele passa raspando o pé das letras e lê como sublinhado; levantado,
// corta o meio da palavra e lê como fita — que é a decoração do azul.com.
const FITA_Y = 55;

// A palavra desce esse tanto em relação à linha de base. Centrada no meio
// exato do leque a composição fica dura, simétrica demais; um dedo abaixo
// assenta as letras e deixa a fita cruzar a parte alta da palavra, em vez de
// cortá-la pelo meio.
const PALAVRA_Y = 40;

export function BlogWord() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-x-clip"
    >
      <RibbonFan
        id="hero-fita"
        d={CURVA}
        leque={{ copias: 11, passoY: 23, passoX: -1.6 }}
        espessura={2}
        corpo={0}
        opacidade={0.4}
        fade={{ de: 0.16, ate: 0.82 }}
        viewBox={`0 ${FITA_Y} 1600 600`}
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      />

      <svg
        viewBox="0 0 1600 600"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <path id="curva-blog" d={CURVA} fill="none" />
        </defs>

        <g className="palavra-grupo" transform={`translate(0 ${PALAVRA_Y})`}>
          <text className="palavra-brilho">
            <textPath href="#curva-blog" startOffset={CENTRO} textAnchor="middle">
              blog
            </textPath>
          </text>

          <text className="palavra">
            <textPath href="#curva-blog" startOffset={CENTRO} textAnchor="middle">
              blog
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}
