import joi from "joi";
import { Request, Response } from "express";
import { prisma } from "../prisma";

const postSchema = joi.object({
    // definição de tipo de cada dado, minimo, maximo e todos obrigatorios
    usuarioId: joi.number().integer().min(1).required(),
    titulo: joi.string().min(1).max(100).required(),
    conteudo: joi.string().min(1).max(5000).required(),
    categoria: joi.string().min(1).max(50).required()
});

export async function createPost (req: Request, res: Response) { 
    const { usuarioId, titulo, conteudo, categoria } = req.body; // 1. 

    const { error } = postSchema.validate(req.body); // 2. 

    if (error) {
        res.status(400).json({ erro: error.details[0].message });
        return;
    } 

    
const post = await prisma.post.create({
  data: {
    categoria: categoria,
    titulo: titulo,
    conteudo: conteudo,
    usuario: { connect: {id: usuarioId}} 
    },  
})
    res.status(201).json(post);

}
export async function listPosts(req: Request, res: Response) {
  const posts = await prisma.post.findMany({
    include: { usuario: true },
  });


  res.status(200).json(posts);
}

