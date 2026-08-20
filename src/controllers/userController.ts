import joi from "joi";
import { Request, Response } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcrypt"
// Defines the validation rules for the request body of POST /users.
// This is a "gatekeeper": if the data does not match these rules,
// the request is rejected BEFORE reaching the database.
const userSchema = joi.object({
  nome: joi.string().min(1).max(25).required(), // name: required, 1 to 25 chars
  email: joi.string().email().min(5).required(), // email: valid email format, min 5 chars
  bio: joi.string().max(250).required(), // bio: required, max 250 chars
  senha: joi.string().min(10).max(20).required() // password: required, 10 to 20 chars
});

export async function createUser(req: Request, res: Response) {
  // Extracts the fields sent by the client from the request body
  const { nome, email, bio, senha } = req.body;

  // Runs the validation. Joi returns an "error" only if something is invalid
  const { error } = userSchema.validate(req.body);
  
  // If validation failed, respond with 400 (bad request) and the error message
  if (error) {
    res.status(400).json({ erro: error.details[0].message });
    return; // stops the function so the code below never runs
  }

  const hash = await bcrypt.hash(senha, 10);

  // Creates the user in the database with the validated data
  try {
  const user = await prisma.user.create({
    data: {
      nome: nome,
      email: email,
      bio: bio,
      senha: hash,
    },
    // select what the create can return
    select: { id: true, nome: true, email: true, bio: true }
  });

  // 201 = created. Returns the created user (with the auto-generated id)
  res.status(201).json(user);
  } catch (error: any) {
  if (error.code === "P2002") {
    // email já existe -> avisa o cliente de forma amigável
    res.status(409).json({ erro: "Email já cadastrado" });
  } 
  else {
    // qualquer outro erro -> resposta genérica, sem stack trace
    console.error("Erro ao criar usuário:", error);  // log só pra você, dev
    res.status(500).json({ erro: "Erro interno no servidor" });
       }
    }
}