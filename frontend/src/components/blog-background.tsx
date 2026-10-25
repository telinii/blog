// Fundo do site: camadas fixas atrás do conteúdo. Nada de imagem externa por
// padrão — gradientes quentes + traços finos + grão, tudo na mesma paleta.
//
// Para usar uma foto temática, coloque o arquivo em `public/imagens/` e passe
// o caminho: <BlogBackground imagem="/imagens/fundo.webp" />. A foto entra
// por cima dos gradientes, bem apagada, então o texto continua legível.
export function BlogBackground({ imagem }: { imagem?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Mancha quente no canto superior direito */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_88%_-12%,#f4d9b4_0%,transparent_58%)] opacity-80" />

      {/* Mancha argila no canto inferior esquerdo */}
      <div className="absolute inset-0 bg-[radial-gradient(95%_75%_at_-12%_104%,#e9cdbd_0%,transparent_58%)] opacity-70" />

      {/* Traços finos, quase invisíveis, para o fundo não ficar chapado */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <g fill="none" stroke="#8a6a4b" strokeWidth="1" opacity="0.045">
          <circle cx="1180" cy="120" r="280" />
          <circle cx="1180" cy="120" r="420" />
          <circle cx="1180" cy="120" r="560" />
          <circle cx="120" cy="860" r="240" />
          <circle cx="120" cy="860" r="380" />
          <path d="M-40 620 C 320 520, 700 720, 1480 560" />
        </g>
      </svg>

      {imagem && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.16] mix-blend-multiply"
          style={{ backgroundImage: `url(${imagem})` }}
        />
      )}

      {/* Grão: tira o aspecto de gradiente liso */}
      <div className="grain absolute inset-0 opacity-[0.06] mix-blend-multiply" />
    </div>
  );
}
