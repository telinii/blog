# Paginação, rascunhos e bio

Data: 2026-10-27
Status: aguardando aprovação

## Por quê

Três pontas soltas do que o blog já promete:

1. A API pagina (`limit`/`offset` + `X-Total-Count`), mas a home chama `/posts` sem
   parâmetro. Do 21º post em diante, o post existe e simplesmente não aparece.
2. `Post.publicado` está no schema, a listagem filtra por ele e `createPost` grava
   sempre `true`. O campo não tem como ser usado: não existe rascunho.
3. `User.bio` é pedida no cadastro, guardada, tipada no `Author` do front — e nunca
   exibida em lugar nenhum.

## Objetivos

- Home com uma URL por página (`?pagina=N`), sem cortar posts em silêncio.
- Rascunhos: criar, listar **só os do próprio autor**, continuar escrevendo, publicar.
- Bio visível na página do post e editável.

## Não-objetivos

Busca, categorias navegáveis, markdown, slug, RSS/Open Graph, "meus posts
publicados", comentários. Ficam para depois, sem bloquear este trabalho.

## Anti-objetivos

Falhas que contam como trabalho errado, mesmo com tudo "funcionando":

- Rascunho de um autor aparecer para outro em **qualquer** resposta — inclusive por
  diferença entre 403 e 404, que já revela que o post existe.
- Paginação com off-by-one: a última página não pode repetir item da anterior nem
  esconder o último post.
- Paginação que quebra o botão "voltar" do navegador.

Nota: com página numerada, publicar um post novo enquanto alguém lê a página 2
desloca a lista em um item e pode repetir um post naquela visita. Isso é inerente a
`?pagina=N` e não é tratado aqui — resolver exigiria cursor no lugar de número de
página, o que contraria a decisão tomada.

## Restrições

- Next 16 (App Router) com `cacheComponents` e `partialPrefetching`: toda leitura de
  `searchParams` ou `cookies` acontece dentro de `<Suspense>`, como a home já faz.
- Nada de componente de UI novo além do necessário. O desenho do site não muda.
- A API continua sendo a única que autoriza. O front só decide o que mostrar.

## Abordagens consideradas

**Paginação na URL** — `?pagina=N` (escolhida): a página 1 fica em `/`, zero rota
nova, voltar/compartilhar funcionam. Alternativa `/pagina/N`: mesma mecânica, URL
mais bonita, custa rota nova e um cuidado com `/pagina/1` duplicando a home.
`#N` foi descartada: fragmento não chega ao servidor, então a página 2 nunca
renderizaria nem seria indexada.

**Listagem de rascunhos** — `GET /rascunhos` (escolhida): rota própria, autenticada,
sem ambiguidade. Alternativa `GET /posts?publicado=false`: mistura autorização numa
rota pública. Alternativa `GET /meus-posts`: mais ampla que o pedido.

**Ver o próprio rascunho no detalhe** — `GET /posts/:id` com autenticação opcional
(escolhida): uma rota só, e a página de editar volta a funcionar sem caminho
paralelo. Alternativa `/rascunhos/:id`: duplicaria o `include` do autor e a tela de
edição.

## Como fica

### Backend

| Mudança | Detalhe |
| --- | --- |
| `authOpcional` | Lê o token se vier; não exige. Alimenta `req.user` quando válido. |
| `GET /rascunhos` | Autenticada. Só `publicado: false` **do dono do token**. Paginada, com `X-Total-Count`. |
| `GET /posts/:id` | Busca por id. Se `publicado: false` e quem pede não é o dono → **404** (não 403). |
| `POST /posts` | Aceita `publicado` (padrão `true`). |
| `PATCH /posts/:id` | Aceita `publicado` — é assim que um rascunho vira post. |
| `GET /users/me` | Autenticada. Devolve `{ id, nome, bio, email }` do dono do token — o `/perfil` precisa do nome e da bio atuais para preencher o formulário. Nunca `senha`. |
| `PATCH /users/me` | Autenticada. `{ nome?, bio? }`. Devolve o mesmo formato do `GET`. |
| Testes | Rascunho não vaza, dono lê o próprio, publicar, 404 para estranho, bio. |

### Frontend

| Tela | Mudança |
| --- | --- |
| Home | `?pagina=N`; inválido vira 1; fora do intervalo → `notFound()`. "Anterior / Próxima" + "Página N de M". Canonical `/` na página 1. |
| `getPosts` | Recebe a página e devolve `{ posts, total }`. |
| Header | "Rascunhos" entre "Novo post" e "Sair" (só logado). |
| `/rascunhos` | Lista dos próprios rascunhos: "Continuar escrevendo", "Publicar", estado vazio, link "Editar perfil". |
| Novo post | Dois botões no mesmo form: **Publicar** e **Salvar rascunho** (`name="acao"`). |
| Página do post | Selo "Rascunho" quando o autor abre o próprio; bio em até 2 linhas sob o nome. |
| Editar | Passa o token no `getPost`, para o rascunho abrir. |
| `/perfil` | Nome e bio editáveis; e-mail só leitura. |

## Minhas decisões (corrija se discordar)

- **10 por página.** Com os 15 posts de hoje a paginação já fica visível. O padrão da
  API continua 20 para outros clientes.
- **Página fora do intervalo → 404**, não redirect. Link velho não vira outro post.
- **Publicar mora na aba Rascunhos**, não na tela de editar — assim ninguém
  despublica um post sem querer ao corrigir um typo.
- **"Editar perfil" fica na aba Rascunhos**, não no header. O header ganha só
  "Rascunhos"; acrescentar um quarto item o deixaria apertado no celular.
- **Bio em até duas linhas**, e nada aparece quando ela está vazia.

## O que fica para quem constrói

- Texto dos botões e ordem dos campos em `/perfil`.
- Se o selo "Rascunho" é âmbar ou neutro.
- Se `/rascunhos` também pagina (a lista tende a ser curta; começa sem paginação).

## Riscos

- Mexer em `GET /posts/:id` toca o caminho público mais usado — a suíte atual cobre
  o comportamento de post publicado e post inexistente, e será estendida.
- `cacheComponents`: `/rascunhos` lê cookie, então precisa do mesmo tratamento de
  `instant = false` que `/posts/novo` já usa.
- Rascunho é o primeiro caso em que o front precisa mandar o token numa leitura. Se
  o token expirou, a página cai em 404 em vez de "sessão expirada" — aceitável agora,
  mas é a raiz do problema de sessão de 1h que ficou de fora deste item.
