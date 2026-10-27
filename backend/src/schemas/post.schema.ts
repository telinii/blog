import { z } from "./z";

// Regras do POST /posts.
// data não entra: o servidor define (ver @default no schema.prisma).
// publicado é opcional: sem ele o post nasce publicado; "false" (ou false)
// salva como rascunho. Aceita string porque multipart/form-data só carrega
// texto — o formulário do front manda "true"/"false".
export const postSchema = z
  .object({
    titulo: z.string().min(1).max(100),
    conteudo: z.string().min(1).max(5000),
    categoria: z.string().min(1).max(50),
    // Normalmente preenchido pelo upload; aceitar string permite clientes
    // que já tenham a imagem hospedada em outro lugar.
    capa: z.string().max(500).optional(),
    publicado: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
  })
  .strict();

export type PostInput = z.infer<typeof postSchema>;

// Edição: todos os campos são opcionais, mas o body não pode vir vazio.
// O autor é sempre o dono do token; usuarioId não entra no contrato.
export const updatePostSchema = z
  .object({
    titulo: z.string().min(1).max(100).optional(),
    conteudo: z.string().min(1).max(5000).optional(),
    categoria: z.string().min(1).max(50).optional(),
    capa: z.string().max(500).optional(),
    // "true" publica, "false" volta para rascunho. String porque o
    // formulário de edição manda multipart.
    publicado: z.union([z.boolean(), z.enum(["true", "false"])]).optional(),
    removerCapa: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .optional(),
  })
  .strict()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: "Nenhum campo para atualizar",
  });