// Ponto único de contato com a API Express.
// Tudo que é URL, tipo ou formato de erro vive aqui — as páginas e actions
// só chamam funções com nome de intenção.

const API_URL = process.env.API_URL ?? "http://localhost:3000";

// URL que o NAVEGADOR usa para buscar as capas. Em Docker a API vive em
// `http://backend:3000`, que só existe na rede interna dos containers: o
// `<img src>` renderizado no servidor precisa de um endereço público. Sem
// PUBLIC_API_URL, cai na API_URL (caso do `npm run dev`).
const PUBLIC_API_URL = process.env.PUBLIC_API_URL ?? API_URL;

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
  return `${PUBLIC_API_URL}${caminho}`;
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
): Promise<{ status: number; data: T; total: number | null }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method,
    body: init?.body,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  // 204 e respostas de erro sem corpo não têm JSON: evita quebrar no parse
  const data = await res.json().catch(() => null);

  // Listagens mandam o total no header (X-Total-Count) para a paginação
  // saber quantas páginas existem sem uma segunda chamada.
  const totalBruto = res.headers.get("x-total-count");
  const total = totalBruto === null ? null : Number(totalBruto);

  return { status: res.status, data: data as T, total };
}

// ---------- leituras (lançam erro: quem trata é o error.tsx) ----------

// Quantos posts por página na home. A API aceita até 50; 10 deixa a
// paginação visível sem alongar demais a rolagem.
export const POSTS_POR_PAGINA = 10;

export async function getPosts(
  pagina = 1,
): Promise<{ posts: Post[]; total: number }> {
  const offset = (pagina - 1) * POSTS_POR_PAGINA;
  const { status, data, total } = await apiFetch<Post[]>(
    `/posts?limit=${POSTS_POR_PAGINA}&offset=${offset}`,
  );

  if (status !== 200) {
    throw new Error(`A API respondeu ${status}`);
  }

  return { posts: data, total: total ?? data.length };
}

// O token é opcional: com ele a API devolve também o rascunho do próprio
// autor; sem ele, rascunho responde 404 como qualquer post inexistente.
export async function getPost(
  id: string,
  token?: string,
): Promise<Post | null> {
  const { status, data } = await apiFetch<Post>(
    `/posts/${id}`,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  );

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

// Edição: mesmos campos do create, agora com PATCH e o id na URL.
// A API responde 403 quando o post não pertence ao usuário do token.
export async function updatePost(
  token: string,
  id: string,
  body: FormData,
): Promise<CreatePostResult> {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  const data = (await res.json().catch(() => null)) as { erro?: string } | null;

  if (res.status === 200) return { ok: true };

  return {
    ok: false,
    status: res.status,
    erro: data?.erro ?? "Não foi possível salvar as alterações.",
  };
}

// Exclusão: a API responde 204 quando o post sai do ar. 403 significa que o
// post é de outra pessoa; 404, que já não existe.
export async function deletePost(
  token: string,
  id: string,
): Promise<CreatePostResult> {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204) return { ok: true };

  const data = (await res.json().catch(() => null)) as { erro?: string } | null;

  return {
    ok: false,
    status: res.status,
    erro: data?.erro ?? "Não foi possível excluir o post.",
  };
}

// Rascunhos do próprio autor. Diferente das listagens públicas, aqui um 401
// é informação útil: a página usa para mandar de volta ao login.
export type DraftsResult =
  | { ok: true; posts: Post[] }
  | { ok: false; status: number };

export async function getDrafts(token: string): Promise<DraftsResult> {
  const res = await fetch(`${API_URL}/rascunhos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status !== 200) return { ok: false, status: res.status };

  return { ok: true, posts: (await res.json()) as Post[] };
}

// Publicar é só virar a chave: o resto do post já está salvo.
export async function publicarPost(
  token: string,
  id: string,
): Promise<CreatePostResult> {
  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ publicado: true }),
  });

  if (res.status === 200) return { ok: true };

  const data = (await res.json().catch(() => null)) as { erro?: string } | null;

  return {
    ok: false,
    status: res.status,
    erro: data?.erro ?? "Não foi possível publicar o post.",
  };
}

export type Perfil = { id: number; nome: string; bio: string; email: string };

// Perfil do dono do token. null cobre 401 (sessão vencida) e 404 (conta
// apagada): para a tela dá no mesmo — precisa entrar de novo.
export async function getMe(token: string): Promise<Perfil | null> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status !== 200) return null;

  return (await res.json()) as Perfil;
}

export async function updateProfile(
  token: string,
  dados: { nome?: string; bio?: string },
): Promise<CreatePostResult> {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  if (res.status === 200) return { ok: true };

  const data = (await res.json().catch(() => null)) as { erro?: string } | null;

  return {
    ok: false,
    status: res.status,
    erro: data?.erro ?? "Não foi possível salvar o perfil.",
  };
}
