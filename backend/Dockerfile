# Imagem da API. Multi-stage: as dependências e o build do TypeScript ficam
# nas etapas de cima; a imagem final leva só node_modules + dist + o necessário
# para rodar as migrations no boot.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Gera o client do Prisma (src/generated/prisma) e compila para dist/.
RUN npm run build

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# O Prisma CLI é devDependency, mas roda no boot (`prisma migrate deploy`):
# por isso o node_modules vem inteiro da etapa de dependências.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src/env.ts ./src/env.ts
COPY package.json ./
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh \
  && useradd --create-home --shell /usr/sbin/nologin app \
  && mkdir -p uploads \
  && chown -R app:app /app

# Rodar sem root: se alguém explorar um upload, o processo não escreve fora de
# /app/uploads.
USER app

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
