# Frontend — Blog

Interface web do blog, construída com Next.js 16 (App Router), React 19 e
Tailwind CSS 4.

> Visão geral do projeto e instruções completas: [`../README.md`](../README.md)

## Requisitos

- Node.js 22.x
- API do blog rodando (veja `backend/README.md`)

## Configuração

```bash
npm install
```

Opcional — para apontar para outra API, crie `frontend/.env.local`:

```dotenv
API_URL="http://localhost:3000"
```

Sem essa variável, o padrão é `http://localhost:3000`.

A variável é lida no servidor (Server Component), então não é exposta ao
browser e não há CORS envolvido.

## Rodando

```bash
npm run dev
```

Acesse **http://localhost:3001**.

> A porta é fixa em `3001` nos scripts `dev` e `start`, para não conflitar com a
> API na porta `3000`.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em `http://localhost:3001` |
| `npm run build` | Build de produção |
| `npm start` | Serve o build em `http://localhost:3001` (exige `npm run build` antes) |
| `npm run lint` | ESLint |

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Home com a lista de posts (Server Component) |
| `/posts/[id]` | Detalhe do post; `404` amigável se não existir |
| `/login` | Formulário de login (Server Action grava o token em cookie `httpOnly`) |
| `/cadastro` | Formulário de cadastro |
| `/posts/novo` | Publicar post (exige login; sem cookie redireciona para `/login`) |
| `/logout` | Server Action que apaga o cookie e volta para a home |

## Estrutura

```
frontend/src/
├── app/
│   ├── layout.tsx            Layout raiz (header, footer, fundo, tema)
│   ├── page.tsx              Home: lista de posts
│   ├── error.tsx             Erro amigável quando a API falha
│   ├── not-found.tsx         404
│   ├── login/                Página + action + formulário
│   ├── cadastro/             Página + action + formulário
│   ├── logout/               Action de logout
│   └── posts/
│       ├── [id]/             Detalhe do post + 404
│       └── novo/             Página + action + formulário de publicação
├── components/               Header, footer, menu de auth, tema, arte/fundo
└── lib/
    ├── api.ts                Único ponto de contato com a API Express
    ├── category-theme.ts     Cores/arte por categoria
    ├── format.ts             Formatação de data
    └── ui.ts / curva.ts / ribbon.ts   Helpers visuais
```

## Como funciona

- **Leituras** (`/` e `/posts/[id]`): Server Components chamam `lib/api.ts`,
  que faz `fetch` em `${API_URL}` no servidor do Next. A API não sofre CORS e a
  URL não vaza para o browser.
- **Escritas** (login, cadastro, novo post): Server Actions validam no servidor,
  chamam a API e tratam os erros. O login grava o JWT em cookie `httpOnly`
  (`sameSite=lax`, validade de 1h), inacessível ao JavaScript da página.
- **Token expirado/inválido**: ao publicar, um `401` da API apaga o cookie e
  redireciona para `/login`.
- **Tema** claro/escuro é aplicado antes da hidratação e salvo em
  `localStorage`.

## Solução de problemas

| Problema | Solução |
| --- | --- |
| Página sem posts | Confirme que o backend está em `http://localhost:3000` |
| `fetch failed` / erro 500 na página | API fora do ar ou `API_URL` incorreta |
| Porta 3001 ocupada | Encerre o processo anterior (`pkill -f 'next dev'`) |
| Mudou `API_URL` e não refletiu | Reinicie o `npm run dev` |
| `Could not find a production build` | Rode `npm run build` antes de `npm start` |
| `Cannot find module ...` após `git pull` | Rode `npm install` |
