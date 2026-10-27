import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mariadb from "mariadb";

dotenv.config({ quiet: true });

// Se BASE_URL vier do ambiente, a suíte usa um servidor já no ar.
// Sem ela, sobe a própria API na 3100 apontando para o banco de teste —
// assim `npm test` não depende de você ter rodado `npm run dev`.
const EXTERNAL = Boolean(process.env.BASE_URL);
const PORT = 3100;
const BASE = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const TEST_DB_URL = process.env.DATABASE_URL_TEST;
const SECRET = process.env.JWT_SECRET;

if (!SECRET) throw new Error("JWT_SECRET não definida: rode os testes na raiz do projeto");
if (!EXTERNAL && !TEST_DB_URL) {
  throw new Error("DATABASE_URL_TEST não definida no .env: a suíte precisa de um banco isolado");
}

let server = null;
// Testes de upload gravam numa pasta temporária, não no uploads real.
const UPLOADS_TESTE = mkdtempSync(join(tmpdir(), "blog-uploads-"));

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`${BASE}/posts`);
      if (res.status === 200) return;
    } catch {
      // servidor ainda subindo
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("A API de teste não subiu em 10s");
}

// ---------- helpers ----------

const stamp = Date.now();
const fixtureEmail = `fixture.${stamp}@example.com`;
const senha = "senha12345";

let token = "";
let outroToken = "";
let fixtureId = 0;

const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const postAuth = (path, body, t) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(body),
  });

const patchAuth = (path, body, t) =>
  fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(body),
  });

const deleteAuth = (path, t) =>
  fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${t}` },
  });

const sign = (payload, algorithm = "HS256") =>
  jwt.sign(payload, SECRET, { expiresIn: "1h", algorithm });

// O cadastro não devolve mais o id (resposta genérica). O id vem do token.
const tokenPayload = (t) =>
  JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString("utf8"));

// email sintaticamente válido com exatamente `total` caracteres,
// para testar o limite da coluna VARCHAR(191)
function longEmail(total) {
  let target = total - 2; // "a@"
  const parts = [];
  while (target > 67) { parts.push("b".repeat(63)); target -= 64; }
  parts.push("c".repeat(target - 4));
  return "a@" + parts.join(".") + ".com";
}

// ---------- fixtures ----------

before(async () => {
  if (!EXTERNAL) {
    // Garante que o banco de teste tem o schema mais recente
    const migrate = spawnSync(
      join("node_modules", ".bin", "prisma"),
      ["migrate", "deploy"],
      {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: "utf8",
      },
    );

    if (migrate.status !== 0) {
      throw new Error(
        `prisma migrate deploy falhou no banco de teste:\n${migrate.stdout}\n${migrate.stderr}`,
      );
    }

    server = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], {
      // NODE_ENV=test desliga o rate limit: a suíte faz muitos logins seguidos
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
        PORT: String(PORT),
        NODE_ENV: "test",
        UPLOADS_DIR: UPLOADS_TESTE,
      },
      stdio: ["ignore", "ignore", "inherit"],
    });
  }

  await waitForServer();

  const created = await post("/users", {
    nome: "Fixture", email: fixtureEmail, bio: "usuario de teste", senha,
  });
  assert.equal(created.status, 202, "fixture: POST /users deveria aceitar o cadastro");

  const login = await post("/login", { email: fixtureEmail, senha });
  assert.equal(login.status, 200, "fixture: POST /login deveria autenticar");
  token = (await login.json()).token;
  fixtureId = tokenPayload(token).id;

  // Segundo usuário: serve para provar que ninguém edita post alheio.
  const outroEmail = `outro.${stamp}@example.com`;
  const outro = await post("/users", {
    nome: "Outro", email: outroEmail, bio: "nao e dono", senha,
  });
  assert.equal(outro.status, 202, "fixture: segundo usuário deveria ser aceito");

  const loginOutro = await post("/login", { email: outroEmail, senha });
  assert.equal(loginOutro.status, 200, "fixture: segundo login deveria autenticar");
  outroToken = (await loginOutro.json()).token;
});

after(() => {
  if (server) server.kill();
  rmSync(UPLOADS_TESTE, { recursive: true, force: true });
});

// ---------- infraestrutura ----------

test("GET / responde 200", async () => {
  const res = await fetch(BASE);
  assert.equal(res.status, 200);
});

test("rota inexistente responde 404 em JSON", async () => {
  const res = await fetch(`${BASE}/nao-existe`);
  assert.equal(res.status, 404);
  assert.equal(res.headers.get("content-type")?.includes("application/json"), true);
  assert.equal(typeof (await res.json()).erro, "string");
});

test("JSON malformado responde 400 em JSON", async () => {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"nome":',
  });
  assert.equal(res.status, 400);
  assert.equal(typeof (await res.json()).erro, "string");
});

// ---------- usuarios ----------

test("respostas não anunciam Express e têm nosniff", async () => {
  const res = await fetch(`${BASE}/`);
  assert.equal(res.headers.get("x-powered-by"), null);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
});

test("POST /users válido responde 202 sem dados do usuário", async () => {
  const res = await post("/users", {
    nome: "Maria", email: `maria.${stamp}@example.com`, bio: "Learning dev", senha,
  });
  assert.equal(res.status, 202);
  const body = await res.json();
  assert.equal(typeof body.mensagem, "string");
  assert.equal("id" in body, false);
  assert.equal("email" in body, false);
  assert.equal("senha" in body, false);
});

test("POST /users novo e duplicado têm resposta idêntica", async () => {
  const email = `igual.${stamp}@example.com`;
  const primeiro = await post("/users", {
    nome: "Igual", email, bio: "x", senha,
  });
  const segundo = await post("/users", {
    nome: "Igual", email, bio: "x", senha,
  });

  assert.equal(primeiro.status, 202);
  assert.equal(segundo.status, 202);
  assert.deepEqual(await primeiro.json(), await segundo.json());
});

test("POST /users com senha curta responde 400", async () => {
  const res = await post("/users", {
    nome: "Maria", email: `curta.${stamp}@example.com`, bio: "x", senha: "123",
  });
  assert.equal(res.status, 400);
  assert.equal(typeof (await res.json()).erro, "string");
});

test("POST /users com email acima de 191 chars responde 400", async () => {
  const res = await post("/users", {
    nome: "Maria", email: longEmail(200), bio: "x", senha,
  });
  assert.equal(res.status, 400);
  assert.equal(typeof (await res.json()).erro, "string");
});

test("POST /users sem bio responde 202 genérico", async () => {
  const res = await post("/users", {
    nome: "Sem Bio", email: `sembio.${stamp}@example.com`, senha,
  });
  assert.equal(res.status, 202);

  const body = await res.json();
  assert.equal(typeof body.mensagem, "string");
  assert.equal("senha" in body, false);
});

// ---------- login ----------

test("POST /login correto responde 200 com token", async () => {
  const res = await post("/login", { email: fixtureEmail, senha });
  assert.equal(res.status, 200);
  assert.equal(typeof (await res.json()).token, "string");
});

test("POST /login com senha errada e email inexistente dão a MESMA resposta", async () => {
  const errada = await post("/login", { email: fixtureEmail, senha: "senhaErrada1" });
  const inexistente = await post("/login", {
    email: `ninguem.${stamp}@example.com`, senha,
  });

  assert.equal(errada.status, 401);
  assert.equal(inexistente.status, 401);
  assert.deepEqual(await errada.json(), await inexistente.json());
});

// ---------- autenticação ----------

test("POST /posts sem token responde 401", async () => {
  const res = await post("/posts", { titulo: "x", conteudo: "y", categoria: "Dev" });
  assert.equal(res.status, 401);
  assert.equal(typeof (await res.json()).erro, "string");
});

test("POST /posts com token inválido responde 401", async () => {
  const res = await postAuth("/posts", { titulo: "x", conteudo: "y", categoria: "Dev" }, "lixo");
  assert.equal(res.status, 401);
});

test("POST /posts com token HS512 responde 401", async () => {
  const res = await postAuth(
    "/posts", { titulo: "x", conteudo: "y", categoria: "Dev" },
    sign({ id: fixtureId, email: fixtureEmail }, "HS512"),
  );
  assert.equal(res.status, 401);
});

test("POST /posts com token sem id responde 401", async () => {
  const res = await postAuth(
    "/posts", { titulo: "x", conteudo: "y", categoria: "Dev" },
    sign({ email: fixtureEmail }),
  );
  assert.equal(res.status, 401);
});

test("POST /posts aceita 'bearer' minúsculo (RFC 6750)", async () => {
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${token}`,
    },
    body: JSON.stringify({ titulo: "", conteudo: "y", categoria: "Dev" }),
  });
  // passou pela autenticação e parou na validação
  assert.equal(res.status, 400);
});

// ---------- posts ----------

test("POST /posts com titulo vazio responde 400", async () => {
  const res = await postAuth(
    "/posts", { titulo: "", conteudo: "y", categoria: "Dev" }, token,
  );
  assert.equal(res.status, 400);
});

test("POST /posts sem campos responde 400", async () => {
  const res = await postAuth("/posts", {}, token);
  assert.equal(res.status, 400);
});

test("POST /posts com campo desconhecido responde 400 (usuarioId no body)", async () => {
  const res = await postAuth(
    "/posts",
    { titulo: "x", conteudo: "y", categoria: "Dev", usuarioId: 999 },
    token,
  );
  assert.equal(res.status, 400);
});

test("POST /posts válido responde 201 com autor do token", async () => {
  const res = await postAuth(
    "/posts",
    { titulo: "Post de teste", conteudo: "Conteudo de teste", categoria: "Dev" },
    token,
  );
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.usuarioId, fixtureId);
  assert.equal(body.publicado, true);
  assert.equal(typeof body.data, "string");
});

test("POST /posts com token de usuário inexistente responde 400", async () => {
  const res = await postAuth(
    "/posts", { titulo: "x", conteudo: "y", categoria: "Dev" },
    sign({ id: 999999, email: "fantasma@example.com" }),
  );
  assert.equal(res.status, 400);
});

test("GET /posts responde 200, traz autor, só publicados e nunca senha", async () => {
  const res = await fetch(`${BASE}/posts`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(Array.isArray(body), true);
  assert.equal(body.length > 0, true);
  assert.equal(body.every((p) => p.publicado === true), true);

  const created = body.find((p) => p.titulo === "Post de teste" && p.usuarioId === fixtureId);
  assert.ok(created, "o post criado deveria aparecer na listagem");
  assert.equal("senha" in created.usuario, false);
  assert.equal(JSON.stringify(body).includes("senha"), false);
});

test("GET /posts pagina com limit/offset e devolve X-Total-Count", async () => {
  const res = await fetch(`${BASE}/posts?limit=1&offset=0`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.length, 1);

  const total = Number(res.headers.get("x-total-count"));
  assert.equal(Number.isInteger(total), true);
  assert.equal(total >= 1, true);

  // limit acima do máximo é cortado em 50, não derruba a API.
  const grande = await fetch(`${BASE}/posts?limit=999`);
  assert.equal(grande.status, 200);
  assert.equal((await grande.json()).length <= 50, true);
});

test("post não publicado não aparece na listagem nem no detalhe", async (t) => {
  if (EXTERNAL || !TEST_DB_URL) return t.skip("precisa do banco de teste local");

  const criado = await postAuth(
    "/posts",
    { titulo: "Rascunho de teste", conteudo: "nao deve vazar", categoria: "Dev" },
    token,
  );
  assert.equal(criado.status, 201);
  const { id } = await criado.json();

  const url = new URL(TEST_DB_URL);
  const conexao = await mariadb.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    allowPublicKeyRetrieval: true,
  });

  try {
    await conexao.query("UPDATE Post SET publicado = false WHERE id = ?", [id]);

    const lista = await (await fetch(`${BASE}/posts?limit=50`)).json();
    assert.equal(lista.some((p) => p.id === id), false);

    const detalhe = await fetch(`${BASE}/posts/${id}`);
    assert.equal(detalhe.status, 404);
  } finally {
    await conexao.query("DELETE FROM Post WHERE id = ?", [id]);
    await conexao.end();
  }
});

// ---------- capa ----------

const PNG_1X1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test("POST /posts com capa salva a imagem e devolve o caminho", async () => {
  const form = new FormData();
  form.set("titulo", "Post com capa");
  form.set("conteudo", "Conteudo com imagem");
  form.set("categoria", "Dev");
  form.set("capa", new Blob([Buffer.from(PNG_1X1, "base64")], { type: "image/png" }), "capa.png");

  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.match(body.capa, /^\/uploads\/[0-9a-f-]+\.png$/);

  const imagem = await fetch(`${BASE}${body.capa}`);
  assert.equal(imagem.status, 200);
  assert.equal(imagem.headers.get("content-type"), "image/png");
  assert.equal(imagem.headers.get("x-content-type-options"), "nosniff");
});

test("POST /posts recusa arquivo que não é imagem", async () => {
  const form = new FormData();
  form.set("titulo", "Post com txt");
  form.set("conteudo", "Conteudo");
  form.set("categoria", "Dev");
  form.set("capa", new Blob(["nao sou imagem"], { type: "text/plain" }), "capa.txt");

  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  assert.equal(res.status, 400);
  assert.equal(typeof (await res.json()).erro, "string");
});

// ---------- edição ----------

test("PATCH /posts/:id do autor atualiza os campos", async () => {
  const created = await postAuth(
    "/posts",
    { titulo: "Antes", conteudo: "Conteudo original", categoria: "Dev" },
    token,
  );
  assert.equal(created.status, 201);
  const post = await created.json();

  const res = await patchAuth(
    `/posts/${post.id}`,
    { titulo: "Depois", categoria: "Produto" },
    token,
  );

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.titulo, "Depois");
  assert.equal(body.categoria, "Produto");
  assert.equal(body.conteudo, "Conteudo original");
  assert.equal(body.usuarioId, fixtureId);
});

test("PATCH /posts/:id de outro usuário responde 403", async () => {
  const created = await postAuth(
    "/posts",
    { titulo: "Dono", conteudo: "Nao edite", categoria: "Dev" },
    token,
  );
  const post = await created.json();

  const res = await patchAuth(`/posts/${post.id}`, { titulo: "Invasao" }, outroToken);
  assert.equal(res.status, 403);
  assert.equal(typeof (await res.json()).erro, "string");
});

test("PATCH /posts/:id sem token responde 401", async () => {
  const res = await fetch(`${BASE}/posts/1`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo: "x" }),
  });
  assert.equal(res.status, 401);
});

test("PATCH /posts/:id inexistente responde 404", async () => {
  const res = await patchAuth("/posts/999999", { titulo: "x" }, token);
  assert.equal(res.status, 404);
});

test("PATCH /posts/:id sem campos responde 400", async () => {
  const res = await patchAuth("/posts/1", {}, token);
  assert.equal(res.status, 400);
});

test("PATCH /posts/:id troca e remove a capa", async () => {
  const form = new FormData();
  form.set("titulo", "Com capa original");
  form.set("conteudo", "Conteudo");
  form.set("categoria", "Dev");
  form.set("capa", new Blob([Buffer.from(PNG_1X1, "base64")], { type: "image/png" }), "original.png");

  const created = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  assert.equal(created.status, 201);
  const post = await created.json();
  const capaOriginal = post.capa;

  // Troca por outra imagem
  const troca = new FormData();
  troca.set("titulo", "Com capa nova");
  troca.set("capa", new Blob([Buffer.from(PNG_1X1, "base64")], { type: "image/png" }), "nova.png");

  const res = await fetch(`${BASE}/posts/${post.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: troca,
  });

  assert.equal(res.status, 200);
  const atualizado = await res.json();
  assert.match(atualizado.capa, /^\/uploads\/[0-9a-f-]+\.png$/);
  assert.notEqual(atualizado.capa, capaOriginal);

  // A capa antiga saiu do disco
  assert.equal((await fetch(`${BASE}${capaOriginal}`)).status, 404);
  assert.equal((await fetch(`${BASE}${atualizado.capa}`)).status, 200);

  // Remove a capa atual
  const remocao = await patchAuth(`/posts/${post.id}`, { removerCapa: true }, token);
  assert.equal(remocao.status, 200);
  assert.equal((await remocao.json()).capa, null);
  assert.equal((await fetch(`${BASE}${atualizado.capa}`)).status, 404);
});

test("GET /posts/:id devolve o post com autor e sem senha", async () => {
  const created = await postAuth(
    "/posts",
    { titulo: "Post detalhe", conteudo: "Conteudo", categoria: "Dev" },
    token,
  );
  assert.equal(created.status, 201);
  const { id } = await created.json();

  const res = await fetch(`${BASE}/posts/${id}`);
  assert.equal(res.status, 200);

  const post = await res.json();
  assert.equal(post.id, id);
  assert.equal(post.titulo, "Post detalhe");
  assert.equal(post.usuario.id, fixtureId);
  assert.equal("senha" in post.usuario, false);
});

test("GET /posts/:id com id inexistente responde 404", async () => {
  const res = await fetch(`${BASE}/posts/999999`);
  assert.equal(res.status, 404);
  assert.equal(typeof (await res.json()).erro, "string");
});

test("GET /posts/:id com id inválido responde 400", async () => {
  const res = await fetch(`${BASE}/posts/abc`);
  assert.equal(res.status, 400);
});

test("DELETE /posts/:id do autor responde 204 e some da listagem", async () => {
  const created = await postAuth(
    "/posts",
    { titulo: "Para excluir", conteudo: "Conteudo", categoria: "Dev" },
    token,
  );
  assert.equal(created.status, 201);
  const { id } = await created.json();

  const res = await deleteAuth(`/posts/${id}`, token);
  assert.equal(res.status, 204);

  // Sem corpo: 204 não pode carregar JSON.
  assert.equal((await res.text()).length, 0);

  assert.equal((await fetch(`${BASE}/posts/${id}`)).status, 404);
  assert.equal((await deleteAuth(`/posts/${id}`, token)).status, 404);
});

test("DELETE /posts/:id apaga a capa do disco", async () => {
  const form = new FormData();
  form.set("titulo", "Excluir com capa");
  form.set("conteudo", "Conteudo");
  form.set("categoria", "Dev");
  form.set("capa", new Blob([PNG_1X1], { type: "image/png" }), "capa.png");

  const created = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  assert.equal(created.status, 201);
  const { id, capa } = await created.json();
  assert.equal((await fetch(`${BASE}${capa}`)).status, 200);

  assert.equal((await deleteAuth(`/posts/${id}`, token)).status, 204);
  assert.equal((await fetch(`${BASE}${capa}`)).status, 404);
});

test("DELETE /posts/:id de outro usuário responde 403 e não apaga", async () => {
  const created = await postAuth(
    "/posts",
    { titulo: "Dono do post", conteudo: "Conteudo", categoria: "Dev" },
    token,
  );
  const { id } = await created.json();

  const res = await deleteAuth(`/posts/${id}`, outroToken);
  assert.equal(res.status, 403);
  assert.equal(typeof (await res.json()).erro, "string");

  // Continua existindo depois da tentativa.
  assert.equal((await fetch(`${BASE}/posts/${id}`)).status, 200);
});

test("DELETE /posts/:id sem token responde 401", async () => {
  const res = await fetch(`${BASE}/posts/1`, { method: "DELETE" });
  assert.equal(res.status, 401);
});

test("DELETE /posts/:id inexistente responde 404 e id inválido 400", async () => {
  assert.equal((await deleteAuth("/posts/999999", token)).status, 404);
  assert.equal((await deleteAuth("/posts/abc", token)).status, 400);
});

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
