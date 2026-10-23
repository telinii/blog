import { Request, Response } from "express";
import { prisma } from "../prisma";
import { postSchema } from "../schemas/post.schema";

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
  const { titulo, conteudo, categoria } = result.data;

  const usuarioId = req.user!.id; // comes from the token, not the body

  try {
    const post = await prisma.post.create({
      data: {
        categoria: categoria,
        titulo: titulo,
        conteudo: conteudo,
        usuario: { connect: { id: usuarioId } }
      },
    });

    res.status(201).json(post);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(400).json({ erro: "Usuário não encontrado" });
    } else {
      console.error("Erro ao criar post:", error);
      res.status(500).json({ erro: "Erro interno no servidor" });
    }
  }
}

export async function listPosts(req: Request, res: Response) {
  try {
    // findMany without "where" returns ALL posts.
    // "include: { usuario: true }" brings the author nested inside each post,
    // using the 1:N relation (a post belongs to one user).
    const posts = await prisma.post.findMany({
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, bio: true },  // No pswd
        },
      },
    });

    // 200 = OK. Returns the list of posts, each with its author
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
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, bio: true },  // No pswd
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