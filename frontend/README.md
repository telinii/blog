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
| `npm start` | Serve o build em `http://localhost:3001` (exige `npm run build` antes; aborta se o build estiver mais velho que o código — `SKIP_BUILD_CHECK=1` ignora) |
| `npm run lint` | ESLint |

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Home paginada (`?pagina=N`, 10 por página; página 1 em `/`) |
| `/posts/[id]` | Detalhe do post; `404` amigável se não existir; autor vê "Editar post" e, se for rascunho, o selo "Rascunho" |
| `/posts/[id]/editar` | Edição restrita ao autor (texto, categoria, troca/remoção de capa) |
| `/login` | Formulário de login (Server Action grava o token em cookie `httpOnly`) |
| `/cadastro` | Formulário de cadastro |
| `/posts/novo` | Criar post com capa opcional: "Publicar" ou "Salvar rascunho" (exige login) |
| `/rascunhos` | Rascunhos do próprio autor: continuar escrevendo, publicar, editar perfil |
| `/perfil` | Editar nome e bio (e-mail só leitura) |
| `/rascunhos/limpar-sessao` | Route handler que apaga o cookie vencido e volta ao login |
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
│   ├── rascunhos/            Aba de rascunhos + publicar + limpar-sessao
│   ├── perfil/               Página + action + formulário de perfil
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

- **Leituras** (`/`, `/posts/[id]`, `/rascunhos`, `/perfil`): Server Components
  chamam `lib/api.ts`, que faz `fetch` em `${API_URL}` no servidor do Next. A API
  não sofre CORS e a URL não vaza para o browser.
- **Escritas** (login, cadastro, novo post): Server Actions validam no servidor,
  chamam a API e tratam os erros. O login grava o JWT em cookie `httpOnly`
  (`sameSite=lax`, validade de 1h), inacessível ao JavaScript da página.
- **Capa do post**: o formulário mostra uma prévia local e envia a imagem junto
  com os campos via `multipart/form-data`. O limite é 5 MB (Server Action
  configurada para 6 MB por causa do overhead do multipart). Sem capa, o post
  usa a arte gerada da categoria.
- **Token expirado/inválido**: ao publicar, um `401` da API apaga o cookie e
  redireciona para `/login`. Em `/rascunhos` e `/perfil` o cookie é apagado por
  `/rascunhos/limpar-sessao` (Server Component não pode mexer em cookie) antes
  do redirect.
- **Rascunhos**: só o autor vê o próprio rascunho. A API responde `404` para os
  outros — o mesmo corpo de um post inexistente —, então a tela de "Post não
  encontrado" é idêntica.
- **Bio**: aparece embaixo do nome do autor, cortada em duas linhas
  (`line-clamp-2`), e só quando não está vazia.
- **Edição**: o detalhe mostra "Editar post" só quando o id do JWT é o do autor.
  A página de edição repete a checagem no servidor e a API responde `403` se
  alguém tentar pela rede. Trocar a capa apaga a antiga; também há opção de
  removê-la.
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
| `Build de produção desatualizado` no `npm start` | `.next` é mais antigo que `src/` (típico depois de `git pull`); rotas novas não existiriam no bundle | Rode `npm run build` de novo — a checagem é o `scripts/check-build.mjs` no `prestart` |
| `Cannot find module ...` após `git pull` | Rode `npm install` |
| Prévia da capa aparece, mas o post sai sem foto | Arquivo acima de 5 MB ou formato não suportado | Usar JPG/PNG/WEBP/GIF/AVIF até 5 MB |
