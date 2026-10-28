import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Imagem do Docker leva só o necessário em runtime (ver frontend/Dockerfile).
  // Ligado só no build da imagem: com `output: "standalone"` fixo, todo
  // `next start` local avisa que não serve esse tipo de build.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Server Action do novo post aceita upload de capa de até 5 MB.
    // O limite vale para o multipart inteiro, por isso a folga.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
