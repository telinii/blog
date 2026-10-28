# Imagem do frontend. `BUILD_STANDALONE=1` liga o `output: "standalone"` do
# next.config.ts: o build empacota só as dependências usadas em runtime, então
# a imagem final não precisa de node_modules nem do Next CLI. Fora do Docker a
# variável não existe e `next start` segue sendo o caminho normal.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=1
# API_URL não é embutida no bundle: quem lê a API é o servidor do Next em
# runtime, então a URL certa é a do container (ver docker-compose.yml).
RUN npm run build

FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN useradd --create-home --shell /usr/sbin/nologin nextjs

COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public

USER nextjs
EXPOSE 3000

# Gerado pelo standalone: sobe o servidor Next já com as rotas compiladas.
CMD ["node", "server.js"]
