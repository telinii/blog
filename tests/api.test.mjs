import test, { before } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SECRET = process.env.JWT_SECRET;

if (!SECRET) throw new Error("JWT_SECRET não definida: rode os testes na raiz do projeto");

// ---------- helpers ----------

const stamp = Date.now();
const fixtureEmail = `fixture.${stamp}@example.com`;
const senha = "senha12345";

let token = "";
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
  const created = await post("/users", {
    nome: "Fixture", email: fixtureEmail, bio: "usuario de teste", senha,
  });
  assert.equal(created.status, 201, "fixture: POST /users deveria criar o usuario");
  fixtureId = (await created.json()).id;

  const login = await post("/login", { email: fixtureEmail, senha });
  assert.equal(login.status, 200, "fixture: POST /login deveria autenticar");
  token = (await login.json()).token;
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