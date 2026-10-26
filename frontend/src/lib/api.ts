// Ponto único de contato com a API Express.
// Tudo que é URL, tipo ou formato de erro vive aqui — as páginas e actions
// só chamam funções com nome de intenção.

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export type Author = { id: number; nome: string; bio: string };
export type Post = {
  id: number;
  titulo: string;
  conteudo: string;
  categoria: string;
  capa: string | null;
  publicado: boolean;
  data: string;
  usuario: Author;
};

export type NewPost = {
  titulo: string;
  conteudo: string;
  categoria: string;
  capa?: File;
};

// URL pública de um arquivo do backend (capa). Caminhos relativos
// (/uploads/...) viram absolutos; URLs externas passam intactas.
export function assetUrl(caminho: string): string {
  if (/^https?:\/\//i.test(caminho)) return caminho;
  return `${API_URL}${caminho}`;
}

export type NewUser = {
  nome: string;
  email: string;
  bio: string;
  senha: string;
};

type ApiInit = {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
};

// Sempre devolve status + corpo já parseado. Quem chama decide o que cada
// status significa: 404 é "não existe", 409 é "e-mail repetido", etc.
async function apiFetch<T>(
  path: string,
  init?: ApiInit,
): Promise<{ status: number; data: T }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method,
    body: init?.body,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  // 204 e respostas de erro sem corpo não têm JSON: evita quebrar no parse
  const data = await res.json().catch(() => null);

  return { status: res.status, data: data as T };
}

// ---------- leituras (lançam erro: quem trata é o error.tsx) ----------

export async function getPosts(): Promise<Post[]> {
  const { status, data } = await apiFetch<Post[]>("/posts");

  if (status !== 200) {
    throw new Error(`A API respondeu ${status}`);
  }

  return data;
}

export async function getPost(id: string): Promise<Post | null> {
  const { status, data } = await apiFetch<Post>(`/posts/${id}`);

  // 404 = não existe, 400 = id malformado ("abc"): para o usuário dá no mesmo
  if (status === 404 || status === 400) return null;

  if (status !== 200) {
    throw new Error(`A API respondeu ${status}`);
  }

  return data;
}

// ---------- escritas (devolvem resultado: quem trata é o formulário) ----------

export type LoginResult =
  | { ok: true; token: string }
  | { ok: false; erro: string };

export async function login(email: string, senha: string): Promise<LoginResult> {
  const { status, data } = await apiFetch<{ token: string }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });

  if (status === 200) return { ok: true, token: data.token };
  if (status === 401) return { ok: false, erro: "E-mail ou senha inválidos." };

  return { ok: false, erro: "Não foi possível entrar. Tente de novo." };
}

export type CreateUserResult = { ok: true } | { ok: false; erro: string };

export async function createUser(input: NewUser): Promise<CreateUserResult> {
  const { status, data } = await apiFetch<{ erro?: string }>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (status === 201) return { ok: true };

  if (status === 409) {
    return { ok: false, erro: "Esse e-mail já está cadastrado." };
  }

  return { ok: false, erro: data?.erro ?? "Não foi possível criar a conta." };
}

export type CreatePostResult =
  | { ok: true }
  | { ok: false; status: number; erro: string };

// Multipart: manda os campos de texto e, se houver, o arquivo "capa".
// Não definimos Content-Type — o fetch gera o boundary sozinho.
export async function createPost(
  token: string,
  body: FormData,
): Promise<CreatePostResult> {
  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  const data = (await res.json().catch(() => null)) as { erro?: string } | null;

  if (res.status === 201) return { ok: true };

  return {
    ok: false,
    status: res.status,
    erro: data?.erro ?? "Não foi possível criar o post.",
  };
}
