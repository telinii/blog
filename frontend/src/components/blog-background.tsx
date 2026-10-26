"use client";

import { useEffect, useRef } from "react";
import { CIRCUITO, criarCircuito } from "@/lib/circuit";

// Fundo do site: núcleo de processador no centro, trilhas saindo dele em quatro
// direções, e o calor de fundo em parallax — a luz desliza um pouco para cima
// conforme a página rola, com saturação suave (nunca encosta na borda).
//
// O circuito fica parado de propósito: transformar um ancestral do <svg> faz o
// Chrome rasterizar um quadrado claro em volta do núcleo. A placa é o chão; a
// luz é que se move.
//
// O movimento é suavizado com lerp em requestAnimationFrame: o scroll do mouse
// chega em saltos, a camada persegue o alvo e para quando encosta nele.
//
// As cores vêm de variáveis CSS (globals.css), então claro e escuro usam o
// mesmo desenho com paletas diferentes.
const FATORES = [0.08, 0.12];

// Gerado uma vez, com semente fixa: servidor e cliente produzem o mesmo SVG.
const circuito = criarCircuito();

export function BlogBackground({ imagem }: { imagem?: string }) {
  const brilho = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const foto = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Quem pediu menos animação no sistema não recebe parallax nem pulso.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const camadas = [brilho.current, foto.current];
    const haloEl = halo.current;

    let alvo = 0;
    let atual = 0;
    let quadro = 0;
    let limite = window.innerHeight * 0.15;
    let inicio = performance.now();

    const aplicar = () => {
      for (let i = 0; i < camadas.length; i++) {
        const camada = camadas[i];
        if (!camada) continue;

        // Saturação suave: o deslocamento tende ao limite sem nunca encostar
        // nele, então a camada nunca descobre a borda e as camadas continuam
        // em profundidades diferentes mesmo em páginas longas.
        const deslocamento =
          -limite * (1 - Math.exp(-(atual * FATORES[i]) / limite));

        camada.style.transform = `translate(0, ${deslocamento.toFixed(2)}px)`;
      }
    };

    // Um único laço cuida do parallax e do pulso do núcleo. O pulso é escrito
    // como opacidade inline (e não com animation no CSS) porque o Chrome, ao
    // compor uma camada com animação de opacidade aqui, pintava um quadrado
    // claro em volta do halo.
    const animar = (agora: number) => {
      const diferenca = alvo - atual;

      if (Math.abs(diferenca) < 0.15) {
        atual = alvo;
      } else {
        atual += diferenca * 0.14;
      }

      aplicar();

      if (haloEl) {
        // 6s por ciclo: respira devagar, sem chamar atenção.
        const volta = ((agora - inicio) / 6000) * Math.PI * 2;
        const pulso = 0.5 + 0.5 * Math.sin(volta);
        haloEl.style.setProperty("--pulso", pulso.toFixed(3));
      }

      quadro = requestAnimationFrame(animar);
    };

    const aoRedimensionar = () => {
      limite = window.innerHeight * 0.15;
      alvo = window.scrollY;
      atual = alvo;
      aplicar();
    };

    const aoRolar = () => {
      alvo = window.scrollY;
    };

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRedimensionar);
    quadro = requestAnimationFrame((agora) => {
      inicio = agora;
      animar(agora);
    });

    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRedimensionar);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Calor de fundo: mancha quente em cima, argila embaixo */}
      <div ref={brilho} className="absolute -inset-[18%]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_88%_-12%,var(--bg-glow-1)_0%,transparent_58%)] opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(95%_75%_at_-12%_104%,var(--bg-glow-2)_0%,transparent_58%)] opacity-60" />
      </div>

      {/* Circuito: núcleo no centro e trilhas em quatro direções */}
      <div className="absolute -inset-[18%]">
        {/* Halo do núcleo: div com gradiente. A opacidade sai de --pulso,
            escrito pelo laço de animação (CSS animation aqui fazia o Chrome
            pintar um quadrado claro em volta). */}
        <div
          ref={halo}
          className="nucleo-pulso absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--bg-core-halo)_0%,transparent_68%)]"
        />

        <svg
          viewBox={`0 0 ${CIRCUITO.largura} ${CIRCUITO.altura}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          {/* Trilhas */}
          <g
            fill="none"
            stroke="var(--bg-trace)"
            strokeLinecap="square"
            strokeLinejoin="miter"
            className="opacity-[0.17] dark:opacity-[0.22]"
          >
            {circuito.trilhas.map((trilha, indice) => (
              <path
                key={indice}
                d={trilha.d}
                strokeWidth={trilha.espessura}
              />
            ))}
          </g>

          {/* Terminais: as pontas das trilhas, como pads de placa */}
          <g
            fill="var(--bg-pad)"
            className="opacity-[0.3] dark:opacity-[0.36]"
          >
            {circuito.terminais.map((terminal, indice) => (
              <circle
                key={indice}
                cx={terminal.x}
                cy={terminal.y}
                r={terminal.raio}
              />
            ))}
          </g>

          {/* Corpo do núcleo: cantos em colchete, sem caixa fechada — não
              vira um "cartão" atrás do texto */}
          <g
            fill="none"
            stroke="var(--bg-core)"
            strokeLinejoin="miter"
            strokeLinecap="square"
            opacity="0.3"
          >
            {[
              { x: -1, y: -1 },
              { x: 1, y: -1 },
              { x: 1, y: 1 },
              { x: -1, y: 1 },
            ].map(({ x, y }) => {
              const cantoX = CIRCUITO.centroX + x * CIRCUITO.nucleo;
              const cantoY = CIRCUITO.centroY + y * CIRCUITO.nucleo;
              const braco = 24;

              return (
                <path
                  key={`${x}:${y}`}
                  d={`M ${cantoX} ${cantoY - y * braco} L ${cantoX} ${cantoY} L ${cantoX - x * braco} ${cantoY}`}
                  strokeWidth="1.5"
                />
              );
            })}

            <rect
              x={CIRCUITO.centroX - CIRCUITO.nucleo * 0.2}
              y={CIRCUITO.centroY - CIRCUITO.nucleo * 0.2}
              width={CIRCUITO.nucleo * 0.4}
              height={CIRCUITO.nucleo * 0.4}
              rx="3"
              fill="var(--bg-core)"
              fillOpacity="0.25"
              opacity="0.8"
            />
          </g>
        </svg>
      </div>

      {imagem && (
        <div ref={foto} className="absolute -inset-[18%]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.16] mix-blend-multiply"
            style={{ backgroundImage: `url(${imagem})` }}
          />
        </div>
      )}

      {/* Grão não se move: é textura, não profundidade */}
      <div className="grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />
    </div>
  );
}
