# Backend — API do Blog

API REST de um blog com autenticação JWT, construída com TypeScript, Express 5,
Prisma 7 e MySQL/MariaDB.

> Visão geral do projeto e instruções completas: [`../README.md`](../README.md)

## Stack

- TypeScript + Express 5
- Prisma ORM 7 (driver adapter `@prisma/adapter-mariadb`)
- MySQL 8.x ou MariaDB 10.x/11.x
- Zod (validação, mensagens em pt-BR)
- Multer (upload das capas)
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
│   ├── uploads.ts             Grava/remove as capas em uploads/
│   ├── controllers/           createUser, login, createPost, listPosts
│   ├── middlewares/auth.ts    Valida Authorization: Bearer <token>
│   ├── middlewares/rateLimit.ts  Limite de tentativas de login e cadastro
│   ├── routes/                Rotas de usuários e posts
│   ├── schemas/               Schemas Zod (user, login, post)
│   └── types/                 Tipos do payload JWT e extensão do Request
└── tests/                     Testes de integração com node:test
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
DATABASE_URL_TEST="mysql://blog_user:SUA_SENHA@localhost:3306/bloggers_test"
JWT_SECRET="uma-string-longa-e-aleatoria"
```

Gere o segredo com `openssl rand -base64 32`.

Crie o banco de teste uma vez (a suíte aplica as migrations nele sozinha):

```bash
mysql -u blog_user -p -e "CREATE DATABASE IF NOT EXISTS bloggers_test CHARACTER SET utf8mb4;"
```

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

As capas ficam em `uploads/` por padrão. Para usar outra pasta, defina
`UPLOADS_DIR=/caminho/absoluto` no ambiente (a suíte de testes já usa uma pasta
temporária).

Scripts:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Sobe com `tsx` (watch) |
| `npm test` | Sobe a API na 3100 com o banco de teste e roda a suíte |
| `npm run build` | `prisma generate` + compilação TypeScript |
| `npm start` | Executa `dist/index.js` |

## Endpoints

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | — | Health check |
| `POST` | `/users` | — | Cadastro; responde `202` genérico (novo ou e-mail existente) |
| `POST` | `/login` | — | Retorna `{ token }` |
| `POST` | `/posts` | Bearer | Cria post (JSON ou multipart com `capa`; autor vem do token). `publicado: false` cria rascunho |
| `GET` | `/posts` | — | Lista posts publicados, com autor e paginação (`limit`/`offset`) |
| `PATCH` | `/posts/:id` | Bearer | Edita post (só autor; `403` caso contrário). Aceita `publicado` para publicar/despublicar |
| `DELETE` | `/posts/:id` | Bearer | Apaga post (só autor; `403` caso contrário); a capa sai do disco |
| `GET` | `/posts/:id` | — | Retorna um post (`400` id inválido, `404` inexistente). Rascunho só para o autor, com token |
| `GET` | `/rascunhos` | Bearer | Rascunhos do dono do token, paginados, com `X-Total-Count` |
| `GET` | `/users/me` | Bearer | Perfil do dono do token: `{ id, nome, bio, email }` |
| `PATCH` | `/users/me` | Bearer | Atualiza `nome` e/ou `bio` do dono do token |

### Validação

- `POST /users`: `nome` 1–25, `email` válido até 191, `bio` até 250,
  `senha` 10–20. Campos desconhecidos → `400`.
- `POST /login`: `email` e `senha` nos mesmos limites.
- `POST /posts`: `titulo` 1–100, `conteudo` 1–5000, `categoria` 1–50.
  `data` é definido pelo servidor. `publicado` é opcional (`true`/`false` ou as
  strings `"true"`/`"false"`, porque multipart só carrega texto): sem ele o post
  nasce publicado, com `false` nasce rascunho. A listagem e o detalhe públicos só
  devolvem `publicado: true` — o autor vê o próprio rascunho no detalhe.
- `PATCH /users/me`: `nome` 1–25 e `bio` até 250, ambos opcionais, mas pelo
  menos um precisa vir. `email` e `senha` ficam de fora de propósito.
- `capa` (opcional): arquivo `capa` em `multipart/form-data`, JPG/PNG/WEBP/GIF/AVIF,
  até 5 MB. SVG é recusado de propósito (risco de XSS). O arquivo é gravado em
  `uploads/` com nome UUID e servido em `/uploads/...`.

### Paginação

`GET /posts` aceita `limit` (padrão 20, máximo 50) e `offset` (padrão 0).
A resposta continua sendo um array; o total de posts publicados vem no header
`X-Total-Count`.

```bash
curl "http://localhost:3000/posts?limit=10&offset=20" -D -
```

### Edição

`PATCH /posts/:id` aceita os mesmos campos, todos opcionais. O usuário do token
precisa ser o autor (`403` caso contrário; `404` se o post não existe). Enviar
`capa` troca a imagem (a antiga é apagada); `{"removerCapa":true}` remove a capa
sem enviar arquivo. `{"publicado":true}` publica um rascunho e
`{"publicado":false}` o devolve para rascunho.

### Rascunhos

`GET /rascunhos` devolve só os posts `publicado: false` do dono do token —
o filtro vem do token, nunca da query, então não há como pedir o rascunho de
outra pessoa. Usa a mesma paginação de `/posts` (padrão 20) e o mesmo
`X-Total-Count`.

`GET /posts/:id` responde `404` para rascunho de outra pessoa, com o mesmo
corpo de um post inexistente: o status não confirma que ele existe.

### Perfil

`GET /users/me` e `PATCH /users/me` usam `"me"` em vez de `:id`: o alvo é
sempre o dono do token. A resposta nunca inclui `senha`.

### Rate limit

`POST /login`: 5 tentativas por IP a cada 15 minutos. `POST /users`: 10
cadastros por IP por hora. `GET /posts`, `GET /posts/:id` e `GET /rascunhos`: 120 requisições
por IP por minuto. Passou disso, a resposta é `429` com `{ "erro": ... }` e o header
`Retry-After`.

Os contadores ficam em memória: reiniciar a API zera e cada instância tem o
seu (com mais de uma instância, troque o store por um compartilhado). Ajuste
com `LOGIN_RATE_LIMIT_MAX`, `CADASTRO_RATE_LIMIT_MAX` e
`PUBLIC_RATE_LIMIT_MAX`.

Atrás de proxy, defina `TRUST_PROXY=1` para o Express usar o IP de
`X-Forwarded-For`. Sem isso todo request parece vir do mesmo IP e o limite
derruba todos juntos. Não defina sem um proxy na frente: o header passa a ser
aceito e qualquer cliente falsifica o IP para escapar do limite.

### Erros

- `400` — validação, JSON inválido ou imagem inválida (formato/tamanho)
- `401` — token ausente, inválido ou credenciais erradas
- `403` — tentativa de editar post de outra pessoa
- `404` — rota inexistente, post inexistente ou post não publicado (JSON)
- `202` — cadastro aceito; resposta idêntica para e-mail novo ou existente
- `413` — body acima de 100kb
- `429` — rate limit de login, cadastro ou leitura pública
- `500` — erro interno genérico, sem stack trace

## Testando a API

### Insomnia / Postman

1. `POST http://localhost:3000/users` com
   `{"nome":"Maria","email":"maria@example.com","bio":"Learning dev","senha":"senha12345"}`
2. `POST http://localhost:3000/login` com e-mail e senha → copie o `token`
3. `POST http://localhost:3000/posts` → Auth → Bearer Token → `{"titulo":"...","conteudo":"...","categoria":"Dev"}`
4. `GET http://localhost:3000/posts`
5. `GET http://localhost:3000/posts/1`

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

```bash
npm test
```

A suíte se vira sozinha: aplica as migrations no banco de `DATABASE_URL_TEST`,
sobe uma API na porta 3100 apontando para ele, roda os testes e derruba o
servidor no fim. Não encosta no banco de desenvolvimento e não precisa de
`npm run dev` rodando.

Os testes de rate limit sobem outra instância, na 3101, com limites baixos
(`LOGIN_RATE_LIMIT_MAX=2`, `CADASTRO_RATE_LIMIT_MAX=2`), e conferem o `429`.
A suíte principal roda com `NODE_ENV=test`, onde o limiter fica desligado.

Os testes de upload usam uma pasta temporária (`UPLOADS_DIR`), conferem que a
capa é gravada e servida em `/uploads/...` e que um arquivo que não é imagem
recebe `400`. A edição é testada nos dois lados: autor atualiza, outro usuário
recebe `403`, além de `401`, `404`, body vazio e troca/remoção de capa.

Variáveis opcionais: `BASE_URL` (usa um servidor já no ar e pula o spawn e as
migrations) e `JWT_SECRET` (lida do `.env`).

## Segurança

- Senha hasheada com bcrypt (10 rounds), nunca retornada em resposta.
- Login com resposta idêntica para e-mail inexistente e senha errada.
- Cadastro com resposta `202` idêntica para e-mail novo ou já existente, sem
  devolver id/dados da conta. (Eliminação completa de enumeração exige
  verificação de e-mail; sem esse fluxo, o login continua sendo o único oráculo,
  limitado a 5 tentativas/15min.)
- Listagem e detalhe públicos só devolvem `publicado: true`; rascunhos não vazam.
- JWT HS256 com expiração de 1h; algoritmo fixado no `verify`.
- Autor do post vem do token, nunca do body (campo `usuarioId` é rejeitado).
- `PATCH /posts/:id` exige que o usuário do token seja o autor (`403`).
- Rate limit por IP no login (5/15min), cadastro (10/hora) e leitura pública
  (120/min).
- Upload valida MIME e tamanho, gera nome aleatório e recusa SVG.
- `X-Content-Type-Options: nosniff` em todas as respostas.
- `X-Powered-By` desligado na API e no Next.
- Erros inesperados retornam JSON genérico, sem stack trace.
