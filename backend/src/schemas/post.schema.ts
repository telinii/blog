import { z } from "./z";

// Regras do POST /posts.
// data e publicado não entram: o servidor define (ver @default no schema.prisma).
export const postSchema = z
  .object({
    titulo: z.string().min(1).max(100),
    conteudo: z.string().min(1).max(5000),
    categoria: z.string().min(1).max(50),
    // Normalmente preenchido pelo upload; aceitar string permite clientes
    // que já tenham a imagem hospedada em outro lugar.
    capa: z.string().max(500).optional(),
  })
  .strict();

export type PostInput = z.infer<typeof postSchema>;