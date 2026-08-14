import joi from "joi";
import { Request, Response } from "express";
import { prisma } from "../prisma";

const userSchema = joi.object({
  
  nome: joi.string().min(1).max(25).required(),
  email: joi.string().email().min(5).required(),
  bio: joi.string().max(250).required(),
  senha: joi.string().min(10).max(20).required()
});
export async function createUser(req: Request, res: Response) {
  const { nome, email, bio, senha } = req.body;

  const { error } = userSchema.validate(req.body);

  if (error) {
    res.status(400).json({ erro: error.details[0].message });
    return;
  }

  const user = await prisma.user.create({
    data: {
      nome: nome,
      email: email,
      bio: bio,
      senha: senha,

      
    },
  });

  res.status(201).json(user);

  
}


