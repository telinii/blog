import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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

const sign = (payload, algorithm = "HS256") =>
  jwt.sign(payload, SECRET, { expiresIn: "1h", algorithm });

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
  assert.equal(created.status, 201, "fixture: POST /users deveria criar o usuario");
  fixtureId = (await created.json()).id;

  const login = await post("/login", { email: fixtureEmail, senha });
  assert.equal(login.status, 200, "fixture: POST /login deveria autenticar");
  token = (await login.json()).token;

  // Segundo usuário: serve para provar que ninguém edita post alheio.
  const outroEmail = `outro.${stamp}@example.com`;
  const outro = await post("/users", {
    nome: "Outro", email: outroEmail, bio: "nao e dono", senha,
  });
  assert.equal(outro.status, 201, "fixture: segundo usuário deveria ser criado");

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

test("POST /users válido responde 201 sem senha", async () => {
  const res = await post("/users", {
    nome: "Maria", email: `maria.${stamp}@example.com`, bio: "Learning dev", senha,
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(typeof body.id, "number");
  assert.equal(body.email, `maria.${stamp}@example.com`);
  assert.equal("senha" in body, false);
});

test("POST /users com email duplicado responde 409", async () => {
  const res = await post("/users", {
    nome: "Maria", email: fixtureEmail, bio: "x", senha,
  });
  assert.equal(res.status, 409);
  assert.equal(typeof (await res.json()).erro, "string");
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

test("POST /users sem bio responde 201 e grava bio vazia", async () => {
  const res = await post("/users", {
    nome: "Sem Bio", email: `sembio.${stamp}@example.com`, senha,
  });
  assert.equal(res.status, 201);

  const body = await res.json();
  assert.equal(body.bio, "");
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
  assert.equal(body.publicado, false);
  assert.equal(typeof body.data, "string");
});

test("POST /posts com token de usuário inexistente responde 400", async () => {
  const res = await postAuth(
    "/posts", { titulo: "x", conteudo: "y", categoria: "Dev" },
    sign({ id: 999999, email: "fantasma@example.com" }),
  );
  assert.equal(res.status, 400);
});

test("GET /posts responde 200, traz autor e nunca senha", async () => {
  const res = await fetch(`${BASE}/posts`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(Array.isArray(body), true);
  assert.equal(body.length > 0, true);

  const created = body.find((p) => p.titulo === "Post de teste" && p.usuarioId === fixtureId);
  assert.ok(created, "o post criado deveria aparecer na listagem");
  assert.equal("senha" in created.usuario, false);
  assert.equal(JSON.stringify(body).includes("senha"), false);
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