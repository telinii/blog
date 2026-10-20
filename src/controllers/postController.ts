import joi from "joi";
import { Request, Response } from "express";
import { prisma } from "../prisma";

// Validation rules for POST /posts.
// data and publicado are NOT here because the server defines them
// (see the @default() in schema.prisma).
const postSchema = joi.object({
  titulo: joi.string().min(1).max(100).required(), // title: required, 1 to 100 chars
  conteudo: joi.string().min(1).max(5000).required(), // body: required, up to 5000 chars
  categoria: joi.string().min(1).max(50).required() // category: required, 1 to 50 chars
});

export async function createPost(req: Request, res: Response) {
  // Runs the validation BEFORE touching the database.
  // Joi returns an "error" only if something is invalid.
  const { error, value } = postSchema.validate(req.body);

  // If validation failed, respond with 400 (bad request) and the error message.
  // Without this check the schema was pure decoration: invalid posts reached the DB.
  if (error) {
    res.status(400).json({ erro: error.details[0].message });
    return; // stops the function so the code below never runs
  }

  // Uses the validated value (not req.body), so unknown keys are discarded
  const { titulo, conteudo, categoria } = value;

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
