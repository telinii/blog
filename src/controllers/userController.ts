import { Request, Response } from "express";
import { prisma } from "../prisma";

export async function createUser(req: Request, res: Response) {
  const { nome, email, bio, senha } = req.body;

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