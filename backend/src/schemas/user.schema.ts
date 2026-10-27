import { z } from "./z";

// Regras do POST /users — o mesmo contrato que o Joi tinha.
// .strict() preserva o comportamento antigo: campo desconhecido no body -> 400.
// Sem .strict(), o Zod simplesmente descarta a chave extra e a requisição passa.
export const userSchema = z
  .object({
    nome: z.string().min(1).max(25),
    email: z.email().min(5).max(191), // 191 = VARCHAR(191) do MySQL
    bio: z.string().max(250).default(""), // opcional: sem ela, grava string vazia
    senha: z.string().min(10).max(20),
  })
  .strict();

// Regras do POST /login
export const loginSchema = z
  .object({
    email: z.email().min(5).max(191),
    senha: z.string().min(10).max(20),
  })
  .strict();

// Tipos derivados do schema: uma fonte de verdade só.
// Mudou a regra, o tipo acompanha.
export type UserInput = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
// Edição do próprio perfil (PATCH /users/me).
// Email e senha ficam de fora de propósito: trocar email mexe em identidade e
// trocar senha exige a senha atual. Nenhum dos dois entra neste contrato.
export const perfilSchema = z
  .object({
    nome: z.string().min(1).max(25).optional(),
    bio: z.string().max(250).optional(),
  })
  .strict()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export type PerfilInput = z.infer<typeof perfilSchema>;
