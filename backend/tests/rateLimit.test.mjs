import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Sobe uma API só para este arquivo: limites baixos e rate limit ligado.
// A suíte principal roda com NODE_ENV=test, onde o limiter fica desligado.
const PORT = 3101;
const BASE = `http://localhost:${PORT}`;
const TEST_DB_URL = process.env.DATABASE_URL_TEST;

if (!TEST_DB_URL) throw new Error("DATABASE_URL_TEST não definida no .env");

const senha = "senha12345";
const stamp = Date.now();

let server = null;

const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

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
  throw new Error("A API de rate limit não subiu em 10s");
}

before(async () => {
  server = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      PORT: String(PORT),
      NODE_ENV: "development", // liga o rate limit
      LOGIN_RATE_LIMIT_MAX: "2",
      CADASTRO_RATE_LIMIT_MAX: "2",
    },
    stdio: ["ignore", "ignore", "inherit"],
  });

  await waitForServer();
});

after(() => {
  if (server) server.kill();
});

test("POST /login responde 429 depois do limite", async () => {
  const tentar = () => post("/login", { email: "ninguem@example.com", senha });

  // limite 2: as duas primeiras passam (401, credenciais erradas), a terceira barra
  assert.equal((await tentar()).status, 401);
  assert.equal((await tentar()).status, 401);

  const bloqueado = await tentar();
  assert.equal(bloqueado.status, 429);
  assert.equal(typeof (await bloqueado.json()).erro, "string");
  assert.ok(bloqueado.headers.get("retry-after"), "resposta 429 deve trazer Retry-After");
});

test("POST /users responde 429 depois do limite", async () => {
  const criar = (i) =>
    post("/users", {
      nome: "Rate", email: `rate.${stamp}.${i}@example.com`, senha,
    });

  assert.equal((await criar(1)).status, 201);
  assert.equal((await criar(2)).status, 201);

  const bloqueado = await criar(3);
  assert.equal(bloqueado.status, 429);
  assert.equal(typeof (await bloqueado.json()).erro, "string");
});
