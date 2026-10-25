"use client";

import { useEffect, useRef } from "react";

// Fundo do site em parallax: as camadas ficam fixas na viewport, mas cada uma
// desliza um pouco para cima conforme a página rola. Quanto maior o fator,
// mais "perto" a camada parece estar. O deslocamento é limitado pela sobra
// (overscan) de cada camada, então nunca aparece borda.
//
// O movimento é suavizado com lerp em requestAnimationFrame: o scroll do mouse
// chega em saltos, a camada persegue o alvo e para quando encosta nele.
//
// Para usar uma foto temática, coloque o arquivo em `public/imagens/` e passe
// o caminho: <BlogBackground imagem="/imagens/fundo.webp" />.
const FATORES = [0.08, 0.12, 0.18, 0.1];

export function BlogBackground({ imagem }: { imagem?: string }) {
  const brilho = useRef<HTMLDivElement>(null);
  const argila = useRef<HTMLDivElement>(null);
  const tracos = useRef<HTMLDivElement>(null);
  const foto = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Quem pediu menos animação no sistema não recebe parallax.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const camadas = [brilho.current, argila.current, tracos.current, foto.current];

    let alvo = 0;
    let atual = 0;
    let quadro = 0;
    let limite = window.innerHeight * 0.15;

    const aplicar = () => {
      for (let i = 0; i < camadas.length; i++) {
        const camada = camadas[i];
        if (!camada) continue;

        // Saturação suave: o deslocamento tende ao limite sem nunca encostar
        // nele, então a camada nunca descobre a borda e as camadas continuam
        // em profundidades diferentes mesmo em páginas longas.
        const deslocamento =
          -limite * (1 - Math.exp(-(atual * FATORES[i]) / limite));
        camada.style.transform = `translate3d(0, ${deslocamento.toFixed(2)}px, 0)`;
      }
    };

    const animar = () => {
      const diferenca = alvo - atual;
      atual += diferenca * 0.14;

      // Perto o bastante: encosta no alvo e dorme até o próximo scroll.
      if (Math.abs(diferenca) < 0.15) {
        atual = alvo;
        aplicar();
        quadro = 0;
        return;
      }

      aplicar();
      quadro = requestAnimationFrame(animar);
    };

    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(animar);
    };

    const aoRolar = () => {
      alvo = window.scrollY;
      agendar();
    };

    const aoRedimensionar = () => {
      limite = window.innerHeight * 0.15;
      aoRolar();
    };

    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRedimensionar);
    aoRolar();

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
      {/* Mancha quente no canto superior direito */}
      <div
        ref={brilho}
        className="absolute -inset-[18%] will-change-transform"
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_88%_-12%,var(--bg-glow-1)_0%,transparent_58%)] opacity-80" />
      </div>

      {/* Mancha argila no canto inferior esquerdo */}
      <div
        ref={argila}
        className="absolute -inset-[18%] will-change-transform"
      >
        <div className="absolute inset-0 bg-[radial-gradient(95%_75%_at_-12%_104%,var(--bg-glow-2)_0%,transparent_58%)] opacity-70" />
      </div>

      {/* Traços finos: a camada que mais se move */}
      <div
        ref={tracos}
        className="absolute -inset-[18%] will-change-transform"
      >
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <g
            fill="none"
            stroke="var(--bg-stroke)"
            strokeWidth="1"
            opacity="0.06"
          >
            <circle cx="1180" cy="120" r="280" />
            <circle cx="1180" cy="120" r="420" />
            <circle cx="1180" cy="120" r="560" />
            <circle cx="120" cy="860" r="240" />
            <circle cx="120" cy="860" r="380" />
            <path d="M-40 620 C 320 520, 700 720, 1480 560" />
          </g>
        </svg>
      </div>

      {imagem && (
        <div
          ref={foto}
          className="absolute -inset-[18%] will-change-transform"
        >
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
