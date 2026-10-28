# Imagem da API. Multi-stage: dependências e build do TypeScript ficam nas
# etapas de cima; a imagem final leva só o necessário para rodar.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
# Gera o client do Prisma (src/generated/prisma) e compila para dist/.
RUN npm run build

# Dependências de runtime separadas: sem tsc/tsx. `prisma` é dependency (não
# devDependency) porque roda `migrate deploy` no boot do container.
FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Usuário antes dos COPYs + --chown em cada um: `chown -R` depois copiaria o
# /app inteiro de novo para um layer extra (a imagem dobrava de tamanho).
RUN useradd --create-home --shell /usr/sbin/nologin app

COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=app:app /app/src/env.ts ./src/env.ts
COPY --chown=app:app package.json docker-entrypoint.sh ./

# Capas vão para o volume `uploads`; sem root, o processo só escreve aqui.
RUN chmod +x docker-entrypoint.sh && mkdir -p uploads && chown app:app uploads

USER app

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
