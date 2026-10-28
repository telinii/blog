# Blog

[![CI](https://github.com/telinii/blog/actions/workflows/ci.yml/badge.svg)](https://github.com/telinii/blog/actions/workflows/ci.yml)

Aplicação de blog full stack: API REST com autenticação JWT + interface web em Next.js.

O projeto é dividido em dois apps independentes:

```
blog/
├── backend/    API REST (Express + TypeScript + Prisma + MariaDB/MySQL)
└── frontend/   Interface web (Next.js + React + Tailwind CSS)
```

## Stack

| Camada | Tecnologias |
| --- | --- |
| Backend | Node.js, TypeScript, Express 5, Prisma 7, MariaDB/MySQL, Zod, bcrypt, JSON Web Token |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript |
| Testes | `node:test` (suíte de integração da API) |

## Funcionalidades

- Cadastro de usuários com senha hasheada (bcrypt, 10 rounds)
- Login com emissão de token JWT (HS256, expira em 1h)
- Criação de posts protegida por autenticação Bearer
- Capa opcional por post: upload de imagem (JPG, PNG, WEBP, GIF ou AVIF, até 5 MB), com fallback para a arte da categoria
- Edição pelo próprio autor (texto, categoria e capa), bloqueada para os demais
- Listagem pública de posts e página de detalhe, com os dados do autor (nunca a senha)
- Rate limit por IP contra força bruta no login e spam de cadastro
- Validação de entrada com Zod e mensagens de erro em português
- Frontend com home, login, cadastro, publicação e detalhe do post
  (Server Components e Server Actions, token em cookie `httpOnly`)

## Requisitos

- **Node.js 22.x** (testado com 22.22.3)
- **npm** 10.x
- **MySQL 8.x** ou **MariaDB 10.x/11.x** rodando na porta `3306`
- Git

## Como rodar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/telinii/blog.git
cd blog
```

### 2. Crie o banco de dados

Conecte no MySQL/MariaDB como root:

```bash
mysql -u root -p
```

E execute:

```sql
CREATE DATABASE IF NOT EXISTS bloggers;
CREATE DATABASE IF NOT EXISTS bloggers_test CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'blog_user'@'localhost' IDENTIFIED BY 'SUA_SENHA';
GRANT ALL PRIVILEGES ON bloggers.* TO 'blog_user'@'localhost';
GRANT ALL PRIVILEGES ON bloggers_test.* TO 'blog_user'@'localhost';
FLUSH PRIVILEGES;
```

> `bloggers_test` é usado pela suíte de testes (`npm test`). Ela aplica as
> migrations e roda contra esse banco, sem tocar no banco de desenvolvimento.

> Para usar `npx prisma migrate dev` em desenvolvimento (ele cria um banco
> temporário de shadow), conceda privilégio global:
> `GRANT ALL PRIVILEGES ON *.* TO 'blog_user'@'localhost';`
> Para apenas rodar o projeto, o grant em `bloggers.*` já basta.

### 3. Configure o backend

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env`:

```dotenv
DATABASE_URL="mysql://blog_user:SUA_SENHA@localhost:3306/bloggers"
DATABASE_URL_TEST="mysql://blog_user:SUA_SENHA@localhost:3306/bloggers_test"
JWT_SECRET="uma-string-longa-e-aleatoria"
```

Variáveis opcionais de rate limit (os valores abaixo são os padrões):

```dotenv
LOGIN_RATE_LIMIT_MAX=5        # tentativas falhas de login por 15 min
CADASTRO_RATE_LIMIT_MAX=10    # cadastros por hora
# TRUST_PROXY=1               # só atrás de proxy confiável (Railway/Nginx)
```

Gere um segredo forte com:

```bash
openssl rand -base64 32
```

> Use a senha real do usuário `blog_user` na `DATABASE_URL`. Se ela tiver
> caracteres especiais (`@`, `:`, `/`, `#`), eles precisam ser
> percent-encoded na URL.

### 4. Instale as dependências e prepare o banco

```bash
# dentro de backend/
npm install
npx prisma generate
npx prisma migrate deploy
```

- `prisma generate` cria o Prisma Client em `src/generated/prisma`.
- `prisma migrate deploy` aplica as migrations e cria as tabelas.

### 5. Suba a API (terminal 1)

```bash
cd backend
npm run dev
```

A API ficará disponível em **http://localhost:3000**.

Verifique:

```bash
curl http://localhost:3000
# {"message":"API Blog online","endpoints":["/users","/login","/posts"]}
```

> Na primeira requisição pode aparecer um `pool timeout`: é o pool de conexões
> do Prisma aquecendo. Basta repetir a requisição.

### 6. Suba o frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

A interface ficará disponível em **http://localhost:3001**.

O frontend consome a API em `http://localhost:3000` por padrão. Para apontar
para outra URL, crie `frontend/.env.local`:

```dotenv
API_URL="http://localhost:3000"
```

> `API_URL` é lida apenas no servidor (Server Component), então não é exposta
> ao browser e não sofre CORS.

### Imagens de capa

As imagens enviadas ficam em `backend/uploads/` (ignorada pelo Git) e são
servidas pela API em `/uploads/<uuid>.<ext>`. O campo `capa` guarda esse
caminho, não o binário.

Em produção com disco efêmero (Railway, containers), essa pasta some a cada
deploy. Nesse caso use um volume persistente ou um storage externo (S3/R2) e
guarde a URL completa no campo `capa`.

## Endpoints da API

Base: `http://localhost:3000`

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | — | Health check |
| `POST` | `/users` | — | Cria um usuário |
| `POST` | `/login` | — | Autentica e retorna `{ token }` |
| `POST` | `/posts` | Bearer token | Cria um post (JSON ou `multipart/form-data` com `capa`); `publicado: false` cria rascunho |
| `PATCH` | `/posts/:id` | Bearer token (autor) | Edita o post; `403` se não for o autor; aceita `publicado` |
| `DELETE` | `/posts/:id` | Bearer token (autor) | Apaga o post e a capa do disco; `403` se não for o autor; responde `204` |
| `GET` | `/posts` | — | Lista posts publicados com o autor, paginados (`limit`/`offset`, total em `X-Total-Count`) |
| `GET` | `/posts/:id` | — | Retorna um post com o autor (`400` id inválido, `404` não encontrado); rascunho só para o autor |
| `GET` | `/rascunhos` | Bearer token | Rascunhos do dono do token, paginados (total em `X-Total-Count`) |
| `GET` | `/users/me` | Bearer token | Perfil do dono do token |
| `PATCH` | `/users/me` | Bearer token | Atualiza `nome` e `bio` do dono do token |

### Exemplos com curl

Criar usuário (senha de 10 a 20 caracteres):

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria","email":"maria@example.com","bio":"Learning dev","senha":"senha12345"}'
```

Login:

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","senha":"senha12345"}'
# {"token":"eyJhbGciOiJIUzI1NiIs..."}
```

Criar post (o autor vem do token, não do body):

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","senha":"senha12345"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"titulo":"Meu primeiro post","conteudo":"Conteúdo do post","categoria":"Dev"}'
```

Com capa (multipart; a imagem é opcional):

```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F "titulo=Meu primeiro post" \
  -F "conteudo=Conteúdo do post" \
  -F "categoria=Dev" \
  -F "capa=@/caminho/para/foto.jpg"
```

Editar o próprio post (só o autor; `403` para os demais):

```bash
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -F "titulo=Título revisado" \
  -F "conteudo=Texto novo" \
  -F "categoria=Dev" \
  -F "capa=@/caminho/para/nova-foto.jpg"

# Remover a capa sem enviar outra foto:
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"removerCapa":true}'
```

Listar posts:

```bash
curl http://localhost:3000/posts
```

## Testes

Os testes são de integração e se viram sozinhos — **não precisa** da API rodando:

```bash
cd backend
npm test
```

A suíte aplica as migrations no banco de `DATABASE_URL_TEST` (`bloggers_test`),
sobe a própria API na porta 3100 e derruba no fim. Não encosta no banco de
desenvolvimento. O arquivo `rateLimit.test.mjs` sobe outra instância na 3101
com limites baixos para validar os `429`.

Variáveis opcionais:

- `BASE_URL` — usa um servidor já no ar e pula o spawn e as migrations
- `JWT_SECRET` — lida do `backend/.env`

Os mesmos testes rodam no CI (`.github/workflows/ci.yml`) a cada push na `main`
e em pull request: MySQL 8 como serviço, `prisma migrate deploy` no banco de
teste e, no frontend, lint + `tsc --noEmit` + build.

A suíte cobre cadastro, login, autenticação, validação, criação, edição (incluindo `403` para post de outra pessoa) e listagem de
posts, rate limit (`429` após o limite) e casos de segurança (senha nunca
retornada, mensagens de erro genéricas no login, algoritmo do token fixado em
HS256).

## Segurança

- Senhas são hasheadas com bcrypt (10 rounds) antes de ir para o banco.
- Nenhuma resposta retorna o campo `senha`.
- `POST /login` responde `401 {"erro":"Erro no login"}` tanto para e-mail
  inexistente quanto para senha errada, sem revelar qual falhou.
- Rotas protegidas exigem `Authorization: Bearer <token>`.
- O middleware fixa o algoritmo `HS256` e exige um `id` numérico no payload.
- Rate limit por IP: login 5/15min, cadastro 10/hora.

## Scripts

### Backend (`backend/`)

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Sobe a API com `tsx` em modo watch |
| `npm test` | Sobe a API de teste na 3100 e roda a suíte |
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm start` | Roda a versão compilada |

### Frontend (`frontend/`)

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Sobe o Next.js em `http://localhost:3001` |
| `npm run build` | Build de produção |
| `npm start` | Serve o build em `http://localhost:3001` (exige `npm run build` antes) |
| `npm run lint` | Roda o ESLint |

## Solução de problemas

| Problema | Causa provável | Solução |
| --- | --- | --- |
| `JWT_SECRET não está definida no .env` | `backend/.env` ausente ou incompleto | Criar o `.env` a partir de `.env.example` |
| `DATABASE_URL não está definida no .env` | Variável ausente | Conferir `backend/.env` |
| `pool timeout` na primeira request | Pool do Prisma aquecendo | Repetir a requisição |
| `Can't reach database server` | MySQL/MariaDB parado ou porta errada | Iniciar o serviço e conferir a porta `3306` |
| Frontend sem posts | API parada ou `API_URL` errada | Subir o backend e conferir `frontend/.env.local` |
| `Email já cadastrado` | E-mail duplicado | Usar outro e-mail |
| `Cannot find module ...` após `git pull` | Dependência nova não instalada | Rodar `npm install` no app correspondente |
| `429 Muitas tentativas` | Rate limit por IP | Esperar a janela (15 min login / 1 h cadastro) ou ajustar `LOGIN_RATE_LIMIT_MAX` / `CADASTRO_RATE_LIMIT_MAX` |
| `Could not find a production build` | `npm start` sem build | Rodar `npm run build` antes, ou usar `npm run dev` |
| Capa não aparece | Arquivo não enviado, formato inválido ou backend reiniciado sem a pasta | Conferir se o post tem `capa`, testar a URL `/uploads/...` e revisar `backend/uploads/` |
| Erro de migration por permissão | Falta de grant para shadow database | `GRANT ALL PRIVILEGES ON *.* TO 'blog_user'@'localhost';` |

## Documentação adicional

- [`backend/README.md`](backend/README.md) — detalhes da API
- [`frontend/README.md`](frontend/README.md) — detalhes do frontend
