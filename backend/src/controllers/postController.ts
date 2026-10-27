import { Request, Response } from "express";
import { prisma } from "../prisma";
import { postSchema, updatePostSchema } from "../schemas/post.schema";
import { removerCapa, salvarCapa } from "../uploads";

const LIMITE_PADRAO = 20;
const LIMITE_MAX = 50;

// Lê ?limit e ?offset com valores seguros. Parâmetro ausente/inválido cai no
// padrão; nunca deixa o cliente pedir a tabela inteira.
function paginacao(query: Request["query"]) {
  const limiteBruto = typeof query.limit === "string" ? Number(query.limit) : NaN;
  const offsetBruto = typeof query.offset === "string" ? Number(query.offset) : NaN;

  return {
    limit:
      Number.isInteger(limiteBruto) && limiteBruto > 0
        ? Math.min(limiteBruto, LIMITE_MAX)
        : LIMITE_PADRAO,
    offset:
      Number.isInteger(offsetBruto) && offsetBruto >= 0 ? offsetBruto : 0,
  };
}

export async function createPost(req: Request, res: Response) {
  // Runs the validation BEFORE touching the database.
  // safeParse never throws: it returns success/data or success/error.
  const result = postSchema.safeParse(req.body);

  // If validation failed, respond with 400 (bad request) and the error message.
  if (!result.success) {
    res.status(400).json({ erro: result.error.issues[0].message });
    return; // stops the function so the code below never runs
  }

  // Uses the validated data (not req.body): unknown keys were rejected by .strict()
  const { titulo, conteudo, categoria, capa } = result.data;

  const usuarioId = req.user!.id; // comes from the token, not the body

  // Só grava a imagem no disco depois que os campos passaram na validação.
  let caminhoCapa: string | null = capa ?? null;
  let capaGravada = false;

  try {
    if (req.file) {
      caminhoCapa = await salvarCapa(req.file);
      capaGravada = true;
    }

    const post = await prisma.post.create({
      data: {
        categoria: categoria,
        titulo: titulo,
        conteudo: conteudo,
        capa: caminhoCapa,
        publicado: true,
        usuario: { connect: { id: usuarioId } }
      },
    });

    res.status(201).json(post);
  } catch (error: any) {
    // Se o banco falhou depois do upload, o arquivo ficaria órfão no disco.
    if (capaGravada && caminhoCapa) {
      await removerCapa(caminhoCapa);
    }

    if (error.code === "P2025") {
      res.status(400).json({ erro: "Usuário não encontrado" });
    } else {
      console.error("Erro ao criar post:", error);
      res.status(500).json({ erro: "Erro interno no servidor" });
    }
  }
}

export async function updatePost(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ erro: "ID inválido" });
    return;
  }

  const result = updatePostSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ erro: result.error.issues[0].message });
    return;
  }

  const dados = result.data;
  const remover = dados.removerCapa === true || dados.removerCapa === "true";

  // A capa nova só vai para o disco depois da checagem de dono.
  let capaNova: string | undefined;
  let capaGravada = false;

  try {
    const existente = await prisma.post.findUnique({
      where: { id },
      select: { id: true, usuarioId: true, capa: true },
    });

    if (!existente) {
      res.status(404).json({ erro: "Post não encontrado" });
      return;
    }

    // 403, não 404: o post existe, mas não é seu.
    if (existente.usuarioId !== req.user!.id) {
      res.status(403).json({ erro: "Você só pode editar seus próprios posts" });
      return;
    }

    if (req.file) {
      capaNova = await salvarCapa(req.file);
      capaGravada = true;
    }

    const data: {
      titulo?: string;
      conteudo?: string;
      categoria?: string;
      capa?: string | null;
    } = {};

    if (dados.titulo !== undefined) data.titulo = dados.titulo;
    if (dados.conteudo !== undefined) data.conteudo = dados.conteudo;
    if (dados.categoria !== undefined) data.categoria = dados.categoria;

    // Prioridade: arquivo novo > remover > caminho enviado no JSON.
    if (capaNova) data.capa = capaNova;
    else if (remover) data.capa = null;
    else if (dados.capa !== undefined) data.capa = dados.capa;

    const post = await prisma.post.update({ where: { id }, data });

    // A capa antiga não é mais referenciada: apaga do disco.
    if (existente.capa && (capaNova || remover)) {
      await removerCapa(existente.capa);
    }

    res.status(200).json(post);
  } catch (error) {
    // Se o banco falhou depois do upload, o arquivo novo ficaria órfão.
    if (capaGravada && capaNova) {
      await removerCapa(capaNova);
    }

    console.error("Erro ao editar post:", error);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}

export async function listPosts(req: Request, res: Response) {
  const { limit, offset } = paginacao(req.query);

  try {
    // Só posts publicados. Um rascunho (publicado = false) não aparece
    // na listagem pública nem no detalhe.
    const where = { publicado: true };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        // Mais recente primeiro. O id desempata posts com a mesma data.
        orderBy: [{ data: "desc" }, { id: "desc" }],
        skip: offset,
        take: limit,
        include: {
          usuario: {
            // Nunca devolva email aqui: é endpoint público.
            select: { id: true, nome: true, bio: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Total para o frontend montar a paginação sem uma segunda chamada.
    res.setHeader("X-Total-Count", String(total));
    res.status(200).json(posts);
  } catch (error) {
    // Without this try/catch the rejection would reach Express's default
    // handler and leak a stack trace to the client.
    console.error("Erro ao listar posts:", error);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}

export async function getPost(req: Request, res: Response) {
  // req.params.id chega sempre como string — é assim que vem da URL
  const id = Number(req.params.id);

  // "abc" -> NaN, "1.5" -> não é inteiro, "0" e "-3" -> ids impossíveis
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ erro: "ID inválido" });
    return;
  }

  try {
    const post = await prisma.post.findFirst({
      where: { id, publicado: true },
      include: {
        usuario: {
          // Mesmo select do listPosts: sem email, sem senha.
          select: { id: true, nome: true, bio: true },
        },
      },
    });

    // findUnique devolve null quando não existe — não lança erro.
    // Por isso 404 é uma decisão nossa, não um catch de P2025.
    if (!post) {
      res.status(404).json({ erro: "Post não encontrado" });
      return;
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Erro ao buscar post:", error);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}