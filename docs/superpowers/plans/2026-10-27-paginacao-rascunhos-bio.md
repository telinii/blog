# Paginação, rascunhos e bio — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A home passa a paginar por URL (`?pagina=N`), o autor ganha rascunhos privados com uma aba própria, e a bio do autor aparece e pode ser editada.

**Architecture:** Backend Express ganha `authOpcional`, uma listagem autenticada (`GET /rascunhos`), visibilidade de rascunho no detalhe e `GET/PATCH /users/me`. O frontend consome isso por `src/lib/api.ts`, que passa a receber página e token; a home lê `searchParams`, e uma página nova `/rascunhos` concentra o que é do autor.

**Tech Stack:** Express 5 + TypeScript + Prisma 7 + MariaDB (backend), Next.js 16 App Router + React 19 + Tailwind 4 (frontend), `node --test` para a API.

**Spec:** `docs/superpowers/specs/2026-10-27-paginacao-rascunhos-bio-design.md`

## Global Constraints

- Sem dependência nova em nenhum dos dois apps.
- Rotas públicas nunca devolvem `senha` nem `email`. `/users/me` devolve o e-mail do próprio dono do token, e nada além.
- Rascunho de outra pessoa responde **404**, nunca 403, e com o mesmo corpo de um id inexistente.
- Toda mensagem de erro visível é em português.
- UI usa só as classes existentes de `@/lib/ui` (`buttonClass`, `inputClass`, `labelClass`, `errorClass`, `hintClass`) e as cores do tema (`text-muted`, `text-accent`, `border-line`, `bg-surface`). O desenho do site não muda.
- `POSTS_POR_PAGINA = 10` no frontend; o padrão da API continua 20.
- Backend: `npx tsc --noEmit` limpo e `npm test` verde antes de cada commit.
- Frontend: `npx tsc --noEmit`, `npx eslint` e `npm run build` limpos antes de cada commit.
- Frontend não tem runner de teste. Cada tarefa de frontend é verificada por build + um roteiro de navegador (Chrome headless via CDP, como já se faz neste projeto). Isso é a realidade do repositório, não uma escolha: adicionar um runner está fora do escopo.

## Review Focus

1. `?pagina=` com lixo (`abc`, `0`, `-1`, `1.5`, `1e9`, vazio) — a home nunca pode dar 500 nem mostrar lista vazia quando existem posts.
2. Rascunho alheio — nem `GET /posts/:id`, nem `GET /rascunhos`, nem o HTML da página podem revelar que ele existe.
3. Última página parcial (15 posts, 10 por página) — a página 2 mostra 5, não 10 nem 0.
4. Token expirado ou inválido abrindo rascunho — não pode entrar em loop de redirect nem mostrar 500.
5. Bio com 250 caracteres, com quebras de linha, ou vazia — não pode quebrar o bloco do autor.

---

### Task 1: `publicado` em criar e editar

**Files:**
- Modify: `backend/src/schemas/post.schema.ts`
- Modify: `backend/src/controllers/postController.ts` (`createPost`, `updatePost`)
- Test: `backend/tests/api.test.mjs`

**Interfaces:**
- Consumes: nada de tarefas anteriores.
- Produces: `postSchema` e `updatePostSchema` aceitam `publicado?: boolean | "true" | "false"`. `createPost` grava `publicado` (padrão `true`). `updatePost` aceita `publicado` no `data`. O tipo `Post` da API passa a devolver `publicado` fiel ao banco.

- [ ] **Step 1: Escrever os testes que falham**

Em `backend/tests/api.test.mjs`, ao final:

```js
test("POST /posts aceita publicado=false e o rascunho não aparece na listagem", async () => {
  const res = await postAuth(
    "/posts",
    { titulo: "Rascunho inicial", conteudo: "Conteudo", categoria: "Dev", publicado: false },
    token,
  );
  assert.equal(res.status, 201);
  const post = await res.json();
  assert.equal(post.publicado, false);

  const lista = await (await fetch(`${BASE}/posts?limit=50`)).json();
  assert.equal(lista.some((p) => p.id === post.id), false);
  assert.equal((await fetch(`${BASE}/posts/${post.id}`)).status, 404);
});

test("POST /posts sem publicado nasce publicado", async () => {
  const res = await postAuth(
    "/posts",
    { titulo: "Nasce publicado", conteudo: "Conteudo", categoria: "Dev" },
    token,
  );
  assert.equal(res.status, 201);
  assert.equal((await res.json()).publicado, true);
});

test("PATCH /posts/:id publica um rascunho", async () => {
  const criado = await postAuth(
    "/posts",
    { titulo: "Vai publicar", conteudo: "Conteudo", categoria: "Dev", publicado: false },
    token,
  );
  const { id } = await criado.json();

  const res = await patchAuth(`/posts/${id}`, { publicado: true }, token);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).publicado, true);
  assert.equal((await fetch(`${BASE}/posts/${id}`)).status, 200);
});

test("PATCH /posts/:id aceita publicado vindo como string do formulário", async () => {
  const criado = await postAuth(
    "/posts",
    { titulo: "String", conteudo: "Conteudo", categoria: "Dev", publicado: false },
    token,
  );
  const { id } = await criado.json();

  const res = await patchAuth(`/posts/${id}`, { publicado: "true" }, token);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).publicado, true);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test`
Expected: FAIL nos quatro — `post.publicado` vem `true` quando deveria ser `false`, e o `PATCH` com `publicado` responde 400 (campo desconhecido pelo `.strict()`).

- [ ] **Step 3: Implementar**

Em `post.schema.ts`, adicionar aos dois schemas o mesmo campo, e corrigir o comentário que hoje diz que `publicado` não entra:

```ts
publicado: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
```

Em `createPost`, trocar `publicado: true` por um valor derivado do schema, antes do `prisma.post.create`:

```ts
const publicado =
  dados.publicado === undefined
    ? true
    : dados.publicado === true || dados.publicado === "true";
```

Em `updatePost`, acrescentar `publicado?: boolean;` ao tipo local `data` e a linha `if (dados.publicado !== undefined) data.publicado = dados.publicado === true || dados.publicado === "true";`.

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: PASS nos 4 testes novos e nos 42 anteriores.

- [ ] **Step 5: Commit**

```bash
git add backend/src/schemas/post.schema.ts backend/src/controllers/postController.ts backend/tests/api.test.mjs
git commit -m "feat(backend): aceita publicado ao criar e editar post"
```

---

### Task 2: `GET /rascunhos`

**Files:**
- Modify: `backend/src/controllers/postController.ts` (`listDrafts` novo, `paginacao` reaproveitada)
- Modify: `backend/src/routes/postRoutes.ts`
- Test: `backend/tests/api.test.mjs`

**Interfaces:**
- Consumes: `paginacao(query)` e o padrão de `listPosts` (já existem); `auth` (já existe).
- Produces: `listDrafts(req, res)`; rota `GET /rascunhos` autenticada, paginada, com header `X-Total-Count`, devolvendo `Post[]` só do dono do token e só `publicado: false`, ordenado por `data desc, id desc`.

- [ ] **Step 1: Escrever os testes que falham**

```js
test("GET /rascunhos sem token responde 401", async () => {
  assert.equal((await fetch(`${BASE}/rascunhos`)).status, 401);
});

test("GET /rascunhos devolve só os rascunhos do dono do token", async () => {
  const meu = await postAuth(
    "/posts",
    { titulo: "Meu rascunho", conteudo: "Conteudo", categoria: "Dev", publicado: false },
    token,
  );
  const meuPost = await meu.json();

  const alheio = await postAuth(
    "/posts",
    { titulo: "Rascunho alheio", conteudo: "Conteudo", categoria: "Dev", publicado: false },
    outroToken,
  );
  const alheioPost = await alheio.json();

  const res = await fetch(`${BASE}/rascunhos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);

  const lista = await res.json();
  assert.equal(lista.some((p) => p.id === meuPost.id), true);
  assert.equal(lista.some((p) => p.id === alheioPost.id), false);
  assert.equal(lista.every((p) => p.publicado === false), true);
});

test("GET /rascunhos não devolve post já publicado", async () => {
  const criado = await postAuth(
    "/posts",
    { titulo: "Vai publicar mesmo", conteudo: "Conteudo", categoria: "Dev", publicado: false },
    token,
  );
  const { id } = await criado.json();
  await patchAuth(`/posts/${id}`, { publicado: true }, token);

  const res = await fetch(`${BASE}/rascunhos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const lista = await res.json();
  assert.equal(lista.some((p) => p.id === id), false);
});

test("GET /rascunhos pagina e manda X-Total-Count", async () => {
  for (let i = 0; i < 3; i += 1) {
    await postAuth(
      "/posts",
      { titulo: `Rascunho ${i}`, conteudo: "Conteudo", categoria: "Dev", publicado: false },
      token,
    );
  }

  const res = await fetch(`${BASE}/rascunhos?limit=2&offset=0`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).length, 2);
  assert.equal(Number(res.headers.get("x-total-count")) >= 3, true);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test`
Expected: FAIL — `GET /rascunhos` responde 404 (rota não existe).

- [ ] **Step 3: Implementar `listDrafts`**

Em `postController.ts`, logo depois de `listPosts`, mesmo formato de resposta e o mesmo `include` do autor (`select: { id, nome, bio }`):

```ts
export async function listDrafts(req: Request, res: Response) {
  // filter: { usuarioId: req.user!.id, publicado: false }
  // orderBy: [{ data: "desc" }, { id: "desc" }]
  // skip/take vindos de paginacao(req.query)
  // X-Total-Count com o total filtrado
}
```

Em `postRoutes.ts`, registrar antes das rotas de `/posts/:id` (é caminho distinto, mas manter a leitura de cima para baixo):

```ts
router.get("/rascunhos", auth, publicLimiter, listDrafts);
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: PASS nos 4 novos e em todos os anteriores.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/postController.ts backend/src/routes/postRoutes.ts backend/tests/api.test.mjs
git commit -m "feat(backend): listagem de rascunhos do próprio autor"
```

---

### Task 3: rascunho visível para o dono no detalhe

**Files:**
- Modify: `backend/src/middlewares/auth.ts` (`authOpcional`)
- Modify: `backend/src/controllers/postController.ts` (`getPost`)
- Modify: `backend/src/routes/postRoutes.ts`
- Test: `backend/tests/api.test.mjs`

**Interfaces:**
- Consumes: `getPost` atual, `auth` atual.
- Produces: `authOpcional(req, res, next)` que preenche `req.user` **se** houver token válido e segue em frente em qualquer caso (nunca responde 401). `GET /posts/:id` passa a devolver rascunho do próprio autor com 200, e 404 (corpo `{ erro: "Post não encontrado" }`) para qualquer outro caso não publicado.

- [ ] **Step 1: Escrever os testes que falham**

```js
test("GET /posts/:id devolve o próprio rascunho para o dono", async () => {
  const criado = await postAuth(
    "/posts",
    { titulo: "Rascunho do dono", conteudo: "Conteudo", categoria: "Dev", publicado: false },
    token,
  );
  const { id } = await criado.json();

  const res = await fetch(`${BASE}/posts/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).id, id);
});

test("GET /posts/:id de rascunho alheio responde 404 igual a post inexistente", async () => {
  const criado = await postAuth(
    "/posts",
    { titulo: "Rascunho secreto", conteudo: "Conteudo", categoria: "Dev", publicado: false },
    token,
  );
  const { id } = await criado.json();

  const alheio = await fetch(`${BASE}/posts/${id}`, {
    headers: { Authorization: `Bearer ${outroToken}` },
  });
  const inexistente = await fetch(`${BASE}/posts/999999`);

  assert.equal(alheio.status, 404);
  assert.equal(alheio.status, inexistente.status);
  assert.deepEqual(await alheio.json(), await inexistente.json());
});

test("GET /posts/:id com token inválido não vira 401 em rota pública", async () => {
  const criado = await postAuth(
    "/posts",
    { titulo: "Publicado com token podre", conteudo: "Conteudo", categoria: "Dev" },
    token,
  );
  const { id } = await criado.json();

  const res = await fetch(`${BASE}/posts/${id}`, {
    headers: { Authorization: "Bearer nao-e-um-token" },
  });
  assert.equal(res.status, 200);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test`
Expected: FAIL — o dono recebe 404 no próprio rascunho; e o token inválido ainda responde 200 só porque `getPost` hoje não lê o header.

- [ ] **Step 3: Implementar `authOpcional`**

Em `auth.ts`, extrair a leitura do header para um helper privado que devolve o payload ou `null`, e usá-lo nos dois middlewares. `auth` mantém exatamente os 401 atuais. `authOpcional` nunca responde: se o token falta ou é inválido, chama `next()` sem `req.user`.

- [ ] **Step 4: Implementar a visibilidade em `getPost`**

Trocar o `findFirst({ where: { id, publicado: true } })` por `findUnique({ where: { id }, include: … })` e, depois do `if (!post) 404`:

```ts
// Rascunho é do autor e de mais ninguém. 404, não 403: 403 confirmaria
// que o post existe.
if (!post.publicado && post.usuarioId !== req.user?.id) {
  res.status(404).json({ erro: "Post não encontrado" });
  return;
}
```

Em `postRoutes.ts`: `router.get("/posts/:id", authOpcional, publicLimiter, getPost);`

- [ ] **Step 5: Rodar e ver passar**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: PASS. O teste antigo `post não publicado não aparece na listagem nem no detalhe` continua verde (sem token).

- [ ] **Step 6: Commit**

```bash
git add backend/src/middlewares/auth.ts backend/src/controllers/postController.ts backend/src/routes/postRoutes.ts backend/tests/api.test.mjs
git commit -m "feat(backend): autor enxerga o próprio rascunho no detalhe"
```

---

### Task 4: `GET` e `PATCH /users/me`

**Files:**
- Modify: `backend/src/schemas/user.schema.ts` (`perfilSchema`)
- Modify: `backend/src/controllers/userController.ts` (`getMe`, `updateMe`)
- Modify: `backend/src/routes/userRoutes.ts`
- Test: `backend/tests/api.test.mjs`

**Interfaces:**
- Consumes: `auth`, `prisma`, `req.user.id`.
- Produces: `GET /users/me` → `{ id, nome, bio, email }` do dono do token (nunca `senha`). `PATCH /users/me` com `{ nome?, bio? }` → mesmo formato. `perfilSchema` em `user.schema.ts`.

- [ ] **Step 1: Escrever os testes que falham**

```js
test("GET /users/me devolve os dados do dono do token, sem senha", async () => {
  const res = await fetch(`${BASE}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);

  const me = await res.json();
  assert.equal(me.id, fixtureId);
  assert.equal(typeof me.nome, "string");
  assert.equal(typeof me.bio, "string");
  assert.equal("senha" in me, false);
});

test("GET /users/me sem token responde 401", async () => {
  assert.equal((await fetch(`${BASE}/users/me`)).status, 401);
});

test("PATCH /users/me atualiza bio e nome", async () => {
  const res = await fetch(`${BASE}/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ bio: "Escrevo sobre código.", nome: "Fixture Nova" }),
  });
  assert.equal(res.status, 200);

  const me = await res.json();
  assert.equal(me.bio, "Escrevo sobre código.");
  assert.equal(me.nome, "Fixture Nova");
  assert.equal("senha" in me, false);
});

test("PATCH /users/me vazio responde 400 e campo desconhecido também", async () => {
  const vazio = await fetch(`${BASE}/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  assert.equal(vazio.status, 400);

  const desconhecido = await fetch(`${BASE}/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email: "outro@example.com" }),
  });
  assert.equal(desconhecido.status, 400);
});

test("PATCH /users/me com bio acima de 250 responde 400", async () => {
  const res = await fetch(`${BASE}/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ bio: "a".repeat(251) }),
  });
  assert.equal(res.status, 400);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npm test`
Expected: FAIL — as duas rotas respondem 404 (não existem).

- [ ] **Step 3: Implementar**

`perfilSchema` com `.strict()` e `.refine` de "pelo menos um campo", `nome` 1–25 e `bio` até 250 (os mesmos limites do cadastro). Os controllers usam `select: { id: true, nome: true, bio: true, email: true }` — o `select` é o que garante que `senha` nunca sai. Rotas:

```ts
router.get("/users/me", auth, getMe);
router.patch("/users/me", auth, updateMe);
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd backend && npx tsc --noEmit && npm test`
Expected: PASS nos 5 novos e nos anteriores.

- [ ] **Step 5: Commit**

```bash
git add backend/src/schemas/user.schema.ts backend/src/controllers/userController.ts backend/src/routes/userRoutes.ts backend/tests/api.test.mjs
git commit -m "feat(backend): perfil do usuário logado (GET e PATCH /users/me)"
```

---

### Task 5: home paginada por URL

**Files:**
- Modify: `frontend/src/lib/api.ts` (`getPosts`, `apiFetch`)
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/pagination.tsx`

**Interfaces:**
- Consumes: `GET /posts?limit&offset` + `X-Total-Count` (já existem).
- Produces: `export const POSTS_POR_PAGINA = 10;` e `getPosts(pagina: number): Promise<{ posts: Post[]; total: number }>`. `apiFetch` passa a devolver também `total: number | null` lido de `x-total-count`. Componente `Pagination({ pagina, totalPaginas })` que renderiza "Página N de M" e os links anterior/próxima.

- [ ] **Step 1: Implementar a leitura**

`apiFetch` devolve `{ status, data, total }`, com `total: Number(res.headers.get("x-total-count"))` ou `null` quando o header falta. `getPosts(pagina)`:

```ts
export async function getPosts(pagina = 1): Promise<{ posts: Post[]; total: number }>
```

chamando `/posts?limit=${POSTS_POR_PAGINA}&offset=${(pagina - 1) * POSTS_POR_PAGINA}` e lançando erro quando o status não é 200 (mesmo padrão de hoje).

- [ ] **Step 2: Implementar a home**

`page.tsx` recebe `searchParams: Promise<{ pagina?: string }>` e **repassa a Promise** para `PostList`, que a resolve dentro do `<Suspense>` já existente — com `cacheComponents`, a leitura dinâmica precisa acontecer dentro da fronteira de Suspense. Regra de normalização, escrita como função local no arquivo:

```ts
function paginaValida(bruto: string | undefined): number {
  const n = Number(bruto);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
```

`PostList` recebe `pagina`, calcula `totalPaginas = Math.max(1, Math.ceil(total / POSTS_POR_PAGINA))` e chama `notFound()` quando `pagina > totalPaginas` — exceto quando `total === 0`, que cai no estado vazio atual. `generateMetadata` ganha `alternates: { canonical: pagina === 1 ? "/" : \`/?pagina=${pagina}\` }`.

`Pagination` fica abaixo da lista, no mesmo tom do "← Todos os posts": `text-sm text-muted`, hover `text-accent`, `<Link href={...}>` com `/` na página 1 e `/?pagina=N` nas demais. Sem botão desabilitado: quando não há anterior/próxima, o link simplesmente não aparece.

- [ ] **Step 3: Verificar com o build**

Run: `cd frontend && npx tsc --noEmit && npx eslint src && npm run build`
Expected: sem erro; a home aparece como `◐ /` no resumo do build.

- [ ] **Step 4: Verificar no navegador**

Com backend em 3000 e `npm start` em 3001, rodar o roteiro CDP do projeto (`/tmp/opencode/shot.mjs`) e conferir, por texto na página:

- `/` mostra no máximo 10 posts e o rodapé "Página 1 de 2".
- `/?pagina=2` mostra **exatamente 5** posts (15 no total, 10 por página), sem repetir nenhum da página 1 (comparar os títulos das duas listas).
- `/?pagina=abc`, `/?pagina=0` e `/?pagina=-1` mostram exatamente a mesma coisa que `/`.
- `/?pagina=999` cai na página de "não encontrado".
- O link "Próxima" de `/?pagina=1` aponta para `/?pagina=2`.

Expected: as cinco conferências verdadeiras.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/app/page.tsx frontend/src/components/pagination.tsx
git commit -m "feat(front): home paginada por URL"
```

---

### Task 6: rascunho do dono na página do post e na edição

**Files:**
- Modify: `frontend/src/lib/api.ts` (`getPost` aceita token)
- Modify: `frontend/src/app/posts/[id]/page.tsx`
- Modify: `frontend/src/app/posts/[id]/editar/page.tsx`

**Interfaces:**
- Consumes: `GET /posts/:id` com `authOpcional` (Task 3); `getSessionUser` (existe).
- Produces: `getPost(id: string, token?: string): Promise<Post | null>`, que manda `Authorization` quando recebe token.

- [ ] **Step 1: Implementar**

`getPost` ganha o parâmetro opcional e repassa em `headers`. Nas duas páginas, ler o cookie (`cookies()`), pegar `token` e passar adiante — em `page.tsx` também dentro de `generateMetadata`, senão o título do rascunho sai como "Post não encontrado".

Na página do post, quando `!post.publicado`, mostrar ao lado da categoria um selo com o mesmo formato da etiqueta de categoria, mas em tom neutro (`border border-line text-muted`), com o texto `Rascunho`. Quem não é o autor nunca chega aqui: a API responde 404.

- [ ] **Step 2: Verificar com o build**

Run: `cd frontend && npx tsc --noEmit && npx eslint src && npm run build`
Expected: sem erro.

- [ ] **Step 3: Verificar no navegador**

Criar um rascunho pela API com o token da autora, então:

- `/posts/<id>` com o cookie dela: 200, selo "Rascunho" visível, título correto na aba.
- `/posts/<id>` sem cookie: página de não encontrado.
- `/posts/<id>/editar` com o cookie dela: formulário abre preenchido (antes ficava em 404).

Expected: as três conferências verdadeiras.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api.ts "frontend/src/app/posts/[id]/page.tsx" "frontend/src/app/posts/[id]/editar/page.tsx"
git commit -m "feat(front): autor abre o próprio rascunho e o edita"
```

---

### Task 7: novo post com "Publicar" e "Salvar rascunho"

**Files:**
- Modify: `frontend/src/app/posts/novo/post-form.tsx`
- Modify: `frontend/src/app/posts/novo/actions.ts`

**Interfaces:**
- Consumes: `POST /posts` com `publicado` (Task 1).
- Produces: `createPostAction` lê `formData.get("acao")`; `"rascunho"` grava `publicado=false` e redireciona para `/rascunhos`; qualquer outro valor publica e redireciona para `/`.

- [ ] **Step 1: Implementar**

No form, os dois botões ficam no lugar do botão único, dentro do mesmo `<form>`:

```tsx
<button type="submit" name="acao" value="publicar" disabled={pending} className={buttonClass}>
  {pending ? "Publicando..." : "Publicar"}
</button>
<button type="submit" name="acao" value="rascunho" disabled={pending} className="...">
  Salvar rascunho
</button>
```

O segundo usa `ghostLink`-style (borda `border-line`, texto `text-ink`), para não competir com o primário. Na action: `const publicado = formData.get("acao") !== "rascunho"; body.set("publicado", String(publicado));` e o redirect final escolhe `/rascunhos` ou `/`.

- [ ] **Step 2: Verificar com o build**

Run: `cd frontend && npx tsc --noEmit && npx eslint src && npm run build`
Expected: sem erro.

- [ ] **Step 3: Verificar no navegador**

Logada, em `/posts/novo`, preencher e clicar em **Salvar rascunho**: deve cair em `/rascunhos` e o post não pode aparecer em `/`. Depois, em `/posts/novo`, clicar em **Publicar**: deve cair em `/` e o post aparece no topo.

Expected: as duas conferências verdadeiras.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/posts/novo/post-form.tsx frontend/src/app/posts/novo/actions.ts
git commit -m "feat(front): criar post como rascunho ou publicado"
```

---

### Task 8: aba Rascunhos

**Files:**
- Create: `frontend/src/app/rascunhos/page.tsx`
- Create: `frontend/src/app/rascunhos/actions.ts`
- Modify: `frontend/src/lib/api.ts` (`getDrafts`, `publicarPost`)
- Modify: `frontend/src/components/auth-menu.tsx`

**Interfaces:**
- Consumes: `GET /rascunhos` (Task 2), `PATCH /posts/:id` com `publicado` (Task 1), `getSessionUser`.
- Produces: `getDrafts(token: string): Promise<{ ok: true; posts: Post[] } | { ok: false; status: number }>` e `publicarPost(token: string, id: string): Promise<{ ok: true } | { ok: false; status: number; erro: string }>`; `publicarPostAction(formData)` para o `<form action>`. O `status` existe para a página distinguir 401 (sessão) de falha genérica.

- [ ] **Step 1: Implementar a página**

`export const instant = false;` (lê cookie, como `/posts/novo`). Sem cookie → `redirect("/login")`. Lista os rascunhos com título, categoria, data e duas ações por linha: "Continuar escrevendo" (`/posts/<id>/editar`) e um `<form action={publicarPostAction}>` com `<input type="hidden" name="id">` e o botão "Publicar". A action faz o PATCH, `revalidatePath("/rascunhos")` e `revalidatePath("/")`. Estado vazio no mesmo formato do "Nada publicado ainda." da home, com link para `/posts/novo`.

Se `getDrafts` responder 401 (token expirado ou inválido), a página apaga o cookie e faz `redirect("/login")` — nunca renderiza erro nem entra em loop.

- [ ] **Step 2: Implementar o item de menu**

Em `auth-menu.tsx`, entre "Novo post" e "Sair": `<Link href="/rascunhos" className={ghostLink}>Rascunhos</Link>`.

- [ ] **Step 3: Verificar com o build**

Run: `cd frontend && npx tsc --noEmit && npx eslint src && npm run build`
Expected: sem erro.

- [ ] **Step 4: Verificar no navegador**

- `/rascunhos` sem cookie → vai para `/login`.
- `/rascunhos` com cookie podre (`token=abc`) → vai para `/login`, sem loop e sem erro 500.
- Com o cookie da autora e um rascunho criado por ela → a linha aparece, e o rascunho de outro autor **não** aparece.
- Clicar em "Publicar" → a linha some da aba e o post aparece em `/`.
- Sem rascunhos → estado vazio.

Expected: as cinco conferências verdadeiras.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/rascunhos frontend/src/lib/api.ts frontend/src/components/auth-menu.tsx
git commit -m "feat(front): aba de rascunhos do autor"
```

---

### Task 9: bio no post e página de perfil

**Files:**
- Modify: `frontend/src/lib/api.ts` (`getMe`, `updateProfile`)
- Modify: `frontend/src/app/posts/[id]/page.tsx`
- Create: `frontend/src/app/perfil/page.tsx`
- Create: `frontend/src/app/perfil/perfil-form.tsx`
- Create: `frontend/src/app/perfil/actions.ts`
- Modify: `frontend/src/app/rascunhos/page.tsx` (adiciona o link "Editar perfil")

**Interfaces:**
- Consumes: `GET/PATCH /users/me` (Task 4).
- Produces: `getMe(token): Promise<{ id: number; nome: string; bio: string; email: string } | null>`, `updateProfile(token, dados: { nome?: string; bio?: string })`; `atualizarPerfilAction(prev, formData)`.

- [ ] **Step 1: Implementar a bio no post**

No bloco do autor, depois do `<time>`, quando `post.usuario.bio` não for vazia:

```tsx
<p className="mt-1 line-clamp-2 text-muted">{post.usuario.bio}</p>
```

- [ ] **Step 2: Implementar `/perfil`**

`export const instant = false;`; sem cookie → `redirect("/login")`; `getMe` com o token; `null` (401/erro) → apagar o cookie e `redirect("/login")`. Formulário com `nome` (`maxLength={25}`), `bio` (`textarea`, `maxLength={250}`) e o e-mail em um campo desabilitado, só leitura. A action valida os mesmos limites, chama `updateProfile`, trata 401 como sessão expirada e, no sucesso, `revalidatePath("/perfil")` e `revalidatePath("/posts/[id]", "page")` — ou simplesmente volta com `{ ok: true }` e a mensagem "Perfil atualizado."

Por último, em `/rascunhos`, o link "Editar perfil" → `/perfil` no topo da página, com o mesmo estilo do "← Todos os posts".

- [ ] **Step 3: Verificar com o build**

Run: `cd frontend && npx tsc --noEmit && npx eslint src && npm run build`
Expected: sem erro.

- [ ] **Step 4: Verificar no navegador**

- `/perfil` sem cookie → `/login`.
- Com o cookie da autora: nome e bio vêm preenchidos; salvar uma bio nova mostra "Perfil atualizado." e, ao abrir um post dela, a bio aparece sob o nome.
- Bio vazia → nenhum espaço reservado no bloco do autor.
- Bio com 250 caracteres → o bloco não estoura (`line-clamp-2` corta em duas linhas).
- Bio com quebras de linha → continua ocupando no máximo duas linhas.

Expected: as cinco conferências verdadeiras.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/perfil frontend/src/lib/api.ts "frontend/src/app/posts/[id]/page.tsx"
git commit -m "feat(front): bio do autor visível e editável"
```

---

## Verificação final

- [ ] `cd backend && npx tsc --noEmit && npm test` — tudo verde.
- [ ] `cd frontend && npx tsc --noEmit && npx eslint src && npm run build` — limpo.
- [ ] `npx prisma migrate status` — nenhuma migration pendente (este plano não muda o schema).
- [ ] Rebuild do frontend e reinício do `npm start` na 3001: `npm start` serve o último build, e build velho já custou uma sessão de depuração neste projeto.
- [ ] Roteiro de navegador completo: home páginas 1 e 2, `/rascunhos` com e sem rascunho, publicar pela aba, rascunho alheio em 404, `/perfil` salvando.
