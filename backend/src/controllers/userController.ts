import { Request, Response } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema, userSchema } from "../schemas/user.schema";

// The rules (and their types) live in src/schemas/user.schema.ts.
// This file only decides what to do with the result.

// Resposta única para cadastro novo e e-mail já existente. Assim a API não
// confirma se uma conta existe. Quem já tem conta precisa usar a senha dela.
const RESPOSTA_CADASTRO = {
  mensagem:
    "Cadastro recebido. Se o e-mail já existir, use a senha da conta existente.",
};

export async function createUser(req: Request, res: Response) {
  // safeParse never throws: it returns { success: true, data }
  // or { success: false, error }.
  const result = userSchema.safeParse(req.body);

  // If validation failed, respond with 400 (bad request) and the error message
  if (!result.success) {
    res.status(400).json({ erro: result.error.issues[0].message });
    return; // stops the function so the code below never runs
  }

  // Validated and typed (UserInput). Unknown keys were rejected by .strict().
  const { nome, email, bio, senha } = result.data;

  // Everything that can throw is inside the try: even bcrypt can fail
  // (e.g. missing native binding), and an unhandled rejection would leak
  // a stack trace through Express's default error handler.
  try {
    const hash = await bcrypt.hash(senha, 10);

    // Cria o usuário. O hash roda antes mesmo quando o e-mail já existe,
    // para que o tempo de resposta não entregue a existência da conta.
    await prisma.user.create({
      data: {
        nome: nome,
        email: email,
        bio: bio,
        senha: hash,
      },
    });

    // 202 = pedido aceito. Não devolve id nem dados do usuário.
    res.status(202).json(RESPOSTA_CADASTRO);
  } catch (error: any) {
    if (error.code === "P2002") {
      // E-mail já existe: resposta idêntica à do cadastro novo.
      res.status(202).json(RESPOSTA_CADASTRO);
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
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ erro: result.error.issues[0].message });
    return; // stops the function so the code below never runs
  }

  const { email, senha } = result.data;

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