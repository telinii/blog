# Backend — API do Blog

API REST de um blog com autenticação JWT, construída com TypeScript, Express 5,
Prisma 7 e MySQL/MariaDB.

> Visão geral do projeto e instruções completas: [`../README.md`](../README.md)

## Stack

- TypeScript + Express 5
- Prisma ORM 7 (driver adapter `@prisma/adapter-mariadb`)
- MySQL 8.x ou MariaDB 10.x/11.x
- Zod (validação, mensagens em pt-BR)
- bcrypt (hash de senha, 10 rounds)
- jsonwebtoken (JWT Bearer, HS256, 1h)

## Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma          Models User e Post
│   └── migrations/            Migrations aplicadas com prisma migrate deploy
├── src/
│   ├── index.ts               App Express: middlewares, rotas, 404 e erros
│   ├── env.ts                 Carrega o .env (dotenv silencioso)
│   ├── prisma.ts              Singleton do PrismaClient + adapter
│   ├── controllers/           createUser, login, createPost, listPosts
│   ├── middlewares/auth.ts    Valida Authorization: Bearer <token>
│   ├── routes/                Rotas de usuários e posts
│   ├── schemas/               Schemas Zod (user, login, post)
│   └── types/                 Tipos do payload JWT e extensão do Request
└── tests/api.test.mjs         Testes de integração com node:test
```

## Requisitos

- Node.js 22.x (testado com 22.22.3)
- MySQL 8.x ou MariaDB 10.x/11.x na porta `3306`
- Banco `bloggers` e usuário `blog_user` criados

## Configuração

```bash
npm install
cp .env.example .env
```

Preencha `backend/.env`:

```dotenv
DATABASE_URL="mysql://blog_user:SUA_SENHA@localhost:3306/bloggers"
JWT_SECRET="uma-string-longa-e-aleatoria"
```

Gere o segredo com `openssl rand -base64 32`.

Depois:

```bash
npx prisma generate
npx prisma migrate deploy
```

## Rodando

```bash
npm run dev
```

API em **http://localhost:3000**.

Scripts:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Sobe com `tsx` (watch) |
| `npm test` | Roda os testes de integração (API precisa estar rodando) |
| `npm run build` | `prisma generate` + compilação TypeScript |
| `npm start` | Executa `dist/index.js` |

## Endpoints

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | — | Health check |
| `POST` | `/users` | — | Cria usuário (retorna sem `senha`) |
| `POST` | `/login` | — | Retorna `{ token }` |
| `POST` | `/posts` | Bearer | Cria post (autor vem do token) |
| `GET` | `/posts` | — | Lista posts com autor (sem `senha`) |

### Validação

- `POST /users`: `nome` 1–25, `email` válido até 191, `bio` até 250,
  `senha` 10–20. Campos desconhecidos → `400`.
- `POST /login`: `email` e `senha` nos mesmos limites.
- `POST /posts`: `titulo` 1–100, `conteudo` 1–5000, `categoria` 1–50.
  `publicado` e `data` são definidos pelo servidor.

### Erros

- `400` — validação ou JSON inválido
- `401` — token ausente, inválido ou credenciais erradas
- `404` — rota inexistente (JSON)
- `409` — e-mail já cadastrado
- `413` — body acima de 100kb
- `500` — erro interno genérico, sem stack trace

## Testando a API

### Insomnia / Postman

1. `POST http://localhost:3000/users` com
   `{"nome":"Maria","email":"maria@example.com","bio":"Learning dev","senha":"senha12345"}`
2. `POST http://localhost:3000/login` com e-mail e senha → copie o `token`
3. `POST http://localhost:3000/posts` → Auth → Bearer Token → `{"titulo":"...","conteudo":"...","categoria":"Dev"}`
4. `GET http://localhost:3000/posts`

### curl

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria","email":"maria@example.com","bio":"Learning dev","senha":"senha12345"}'

curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","senha":"senha12345"}'

TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","senha":"senha12345"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"titulo":"Meu post","conteudo":"Conteúdo","categoria":"Dev"}'

curl http://localhost:3000/posts
```

## Testes

Com a API rodando:

```bash
npm test
```

A suíte cria usuários e posts reais no banco e valida cadastro, login,
autenticação (incluindo algoritmo errado, token sem `id` e `bearer` minúsculo),
validação e listagem sem vazamento de senha.

Variáveis opcionais: `BASE_URL` (padrão `http://localhost:3000`) e
`JWT_SECRET` (lida do `.env`).

## Segurança

- Senha hasheada com bcrypt (10 rounds), nunca retornada em resposta.
- Login com resposta idêntica para e-mail inexistente e senha errada.
- JWT HS256 com expiração de 1h; algoritmo fixado no `verify`.
- Autor do post vem do token, nunca do body (campo `usuarioId` é rejeitado).
- Erros inesperados retornam JSON genérico, sem stack trace.
