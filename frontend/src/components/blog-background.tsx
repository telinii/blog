"use client";

import { useEffect, useRef } from "react";
import { CURVA } from "@/lib/curva";

// Fundo do site: céu em gradiente, brilhos e uma grade de pontos. A palavra e a
// curva que ela percorre ficam em BlogWord, só na home.
//
// Camadas que deslizam com o scroll. O desenho (linhas e a curva) fica parado
// de propósito: transformar um ancestral de <svg> faz o Chrome rasterizar a
// área com um véu claro em volta do conteúdo. Chão parado, luz em movimento.
const FATORES = [0.1, 0.05];

export function BlogBackground() {
  const brilho = useRef<HTMLDivElement>(null);
  const pontos = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Quem pediu menos animação no sistema fica com o fundo imóvel.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const camadas = [brilho.current, pontos.current];

    let alvo = window.scrollY;
    let atual = alvo;
    let quadro = 0;
    let limite = window.innerHeight * 0.16;

    const aplicar = () => {
      for (let i = 0; i < camadas.length; i++) {
        const camada = camadas[i];
        if (!camada) continue;

        // Saturação suave: o deslocamento tende ao limite sem nunca encostar
        // nele, então a camada não descobre a borda em páginas longas.
        const deslocamento =
          -limite * (1 - Math.exp(-(atual * FATORES[i]) / limite));

        camada.style.transform = `translate(0, ${deslocamento.toFixed(2)}px)`;
      }
    };

    // O laço para quando encosta no alvo: nada aqui anima sozinho, então não
    // faz sentido gastar quadro com a página parada.
    const animar = () => {
      const diferenca = alvo - atual;

      if (Math.abs(diferenca) < 0.15) {
        atual = alvo;
        aplicar();
        quadro = 0;
        return;
      }

      atual += diferenca * 0.14;
      aplicar();
      quadro = requestAnimationFrame(animar);
    };

    const acordar = () => {
      if (!quadro) quadro = requestAnimationFrame(animar);
    };

    const aoRolar = () => {
      alvo = window.scrollY;
      acordar();
    };

    const aoRedimensionar = () => {
      limite = window.innerHeight * 0.16;
      alvo = window.scrollY;
      atual = alvo;
      aplicar();
    };

    aplicar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRedimensionar);

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
      {/* Céu: navy embaixo, violeta em cima (no claro, areia e lilás) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--bg-sky-bottom),var(--bg-sky-top))]" />

      {/* Brilhos: violeta no alto à direita, breu embaixo à esquerda */}
      <div ref={brilho} className="absolute -inset-[18%]">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_78%_6%,var(--bg-veil-1)_0%,transparent_62%)] opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_16%_98%,var(--bg-veil-2)_0%,transparent_62%)] opacity-70" />
      </div>

      {/* Grade de pontos: some nas bordas para dar profundidade */}
      <div ref={pontos} className="grade absolute -inset-[10%]" />

      {/* Linhas geométricas: poucas, finas, quase invisíveis */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <g fill="none" stroke="var(--bg-hair)" strokeWidth="1">
          {/* A própria curva, como fio de cabelo: a palavra anda sobre ela */}
          <path d={CURVA} opacity="0.7" />
          <path d="M -60 690 L 1660 330" />
          <path d="M -60 810 L 1660 450" />
          <path d="M 250 -60 L 820 960" />
          <circle cx="1230" cy="215" r="260" />
          <circle cx="1230" cy="215" r="380" opacity="0.55" />
        </g>
      </svg>

      {/* Grão não se move: é textura, não profundidade */}
      <div className="grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />
    </div>
  );
}
