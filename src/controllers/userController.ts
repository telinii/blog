import joi from "joi";
import { Request, Response } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
// Defines the validation rules for the request body of POST /users.
// This is a "gatekeeper": if the data does not match these rules,
// the request is rejected BEFORE reaching the database.
// 191 is the size of Prisma's default VARCHAR on MySQL: a longer email
// would pass Joi and fail in the database (P2000) with a generic 500.
const userSchema = joi.object({
  nome: joi.string().min(1).max(25).required(), // name: required, 1 to 25 chars
  email: joi.string().email().min(5).max(191).required(), // email: valid format, 5 to 191 chars
  bio: joi.string().max(250).required(), // bio: required, max 250 chars
  senha: joi.string().min(10).max(20).required() // password: required, 10 to 20 chars
});
const loginSchema = joi.object({
  email: joi.string().email().min(5).max(191).required(),
  senha: joi.string().min(10).max(20).required()
});

export async function createUser(req: Request, res: Response) {
  // Runs the validation. Joi returns an "error" only if something is invalid
  const { error, value } = userSchema.validate(req.body);

  // If validation failed, respond with 400 (bad request) and the error message
  if (error) {
    res.status(400).json({ erro: error.details[0].message });
    return; // stops the function so the code below never runs
  }

  // Uses the validated value (not req.body), so unknown keys are discarded
  const { nome, email, bio, senha } = value;

  // Everything that can throw is inside the try: even bcrypt can fail
  // (e.g. missing native binding), and an unhandled rejection would leak
  // a stack trace through Express's default error handler.
  try {
    const hash = await bcrypt.hash(senha, 10);

    // Creates the user in the database with the validated data
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
// Handles POST /login — authenticates a user
export async function login(req: Request, res: Response) {
  // 1. validate with loginSchema (same pattern as createUser)
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    res.status(400).json({ erro: error.details[0].message });
    return; // stops the function so the code below never runs
  }

  const { email, senha } = value;

  try {
    // 2. find user by email (prisma.user.findUnique)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ "erro": "Erro no login" })
      return
    }

    const ok = await bcrypt.compare(senha, user.senha)
    if (!ok) {
      res.status(401).json({ "erro": "Erro no login" })
      return
    }

    const token = jwt.sign(
      { id: user.id, email: user.email }, // payload: o que o token carrega
      process.env.JWT_SECRET!,             // segredo do .env
      { expiresIn: "1h" }                  // expira em 1 hora
    );

    res.status(200).json({ token });
  } catch (error) {
    // Same generic response as the other failures: the client never learns
    // whether the email exists, the password is wrong or the server broke.
    console.error("Erro no login:", error);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}
