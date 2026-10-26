import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { extensaoDaImagem } from "../uploads";

export const TAMANHO_MAXIMO_CAPA = 5 * 1024 * 1024; // 5 MB

// memoryStorage: o arquivo fica na memória até a validação dos campos passar.
// Se o body for inválido, nada é gravado no disco.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANHO_MAXIMO_CAPA, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!extensaoDaImagem(file.mimetype)) {
      cb(new Error("FORMATO_INVALIDO"));
      return;
    }
    cb(null, true);
  },
});

// Middleware com resposta JSON: os erros do multer não podem cair no handler
// genérico, senão o cliente recebe 500 em vez de 400.
export function uploadCapa(req: Request, res: Response, next: NextFunction) {
  upload.single("capa")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ erro: "A imagem deve ter no máximo 5 MB." });
        return;
      }
      res.status(400).json({ erro: "Não foi possível enviar a imagem." });
      return;
    }

    if (err.message === "FORMATO_INVALIDO") {
      res.status(400).json({
        erro: "Formato não suportado. Envie JPG, PNG, WEBP, GIF ou AVIF.",
      });
      return;
    }

    console.error("Erro no upload da capa:", err);
    res.status(400).json({ erro: "Não foi possível enviar a imagem." });
  });
}
