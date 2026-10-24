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
| `npm start` | Serve o build em `http://localhost:3001` |
| `npm run lint` | ESLint |

## Estrutura

```
frontend/
├── src/app/
│   ├── layout.tsx       Layout raiz
│   ├── page.tsx         Listagem de posts (Server Component)
│   ├── globals.css      Tailwind
│   └── favicon.ico
├── next.config.ts       cacheComponents, prefetching e loader do Tailwind
└── tsconfig.json
```

## Como funciona

`src/app/page.tsx` é um Server Component: ele faz `fetch` em `${API_URL}/posts`
no servidor do Next e renderiza a lista com Suspense/skeleton. Cada post mostra
título, categoria, autor e conteúdo. A resposta da API já vem sem a senha do
autor.

## Solução de problemas

| Problema | Solução |
| --- | --- |
| Página sem posts | Confirme que o backend está em `http://localhost:3000` |
| `fetch failed` / erro 500 na página | API fora do ar ou `API_URL` incorreta |
| Porta 3001 ocupada | Encerre o processo anterior (`pkill -f 'next dev'`) |
| Mudou `API_URL` e não refletiu | Reinicie o `npm run dev` |
