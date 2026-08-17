import joi from "joi";
import { Request, Response } from "express";
import { prisma } from "../prisma";

// Validation rules for POST /posts.
// data and publicado are NOT here because the server defines them
// (see the @default() in schema.prisma).
const postSchema = joi.object({
  usuarioId: joi.number().integer().min(1).required(), // which user owns the post
  titulo: joi.string().min(1).max(100).required(), // title: required, 1 to 100 chars
  conteudo: joi.string().min(1).max(5000).required(), // body: required, up to 5000 chars
  categoria: joi.string().min(1).max(50).required() // category: required, 1 to 50 chars
});

export async function createPost(req: Request, res: Response) {
  // Extracts the fields sent by the client from the request body
  const { usuarioId, titulo, conteudo, categoria } = req.body;

  // Runs the validation. Joi returns an "error" only if something is invalid
  const { error } = postSchema.validate(req.body);

  // If validation failed, respond with 400 and stop
  if (error) {
    res.status(400).json({ erro: error.details[0].message });
    return;
  }

  // Creates the post and CONNECTS it to an existing user.
  // "usuario: { connect: { id: usuarioId } }" means:
  // "link this post to the user whose id is usuarioId".
  // This is how Prisma writes the usuarioId column using the relation
  // defined in schema.prisma. The DB rejects it if the user does not exist.
  const post = await prisma.post.create({
    data: {
      categoria: categoria,
      titulo: titulo,
      conteudo: conteudo,
      usuario: { connect: { id: usuarioId } }
    },
  });

  // 201 = created. Returns the created post.
  // Note: publicado (false) and data (now) were filled by the server defaults.
  res.status(201).json(post);
}

export async function listPosts(req: Request, res: Response) {
  // findMany without "where" returns ALL posts.
  // "include: { usuario: true }" brings the author nested inside each post,
  // using the 1:N relation (a post belongs to one user).
  const posts = await prisma.post.findMany({
    include: { usuario: true },
  });

  // 200 = OK. Returns the list of posts, each with its author
  res.status(200).json(posts);
}