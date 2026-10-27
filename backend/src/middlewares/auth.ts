import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "../types/auth";

// Lê "Authorization: Bearer <token>" e devolve o payload, ou null quando não há
// token válido — header ausente, formato errado, assinatura inválida, expirado
// ou sem "id" numérico. Quem decide o que fazer com o null é o middleware.
function lerToken(header: string | undefined): AuthPayload | null {
    if(!header) return null;

    // Expected format: "Bearer <token>"
    // split(" ") cuts "Bearer abc123" into ["Bearer", "abc123"]
    const [scheme, token, ...extra] = header.split(" ");

    // The scheme is case-insensitive (RFC 6750), so "bearer" is also valid.
    // extra.length !== 0 catches missing space or extra words -> invalid format
    if(scheme.toLowerCase() !== "bearer" || !token || extra.length > 0) return null;

    try {
        // algorithms is pinned: without it, a token signed with a different
        // algorithm could be accepted depending on the secret.
        const payload = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] });

        // verify() returns a string when the token payload is not an object,
        // and a token without "id" would break prisma's connect later.
        if(typeof payload === "string" || typeof payload.id !== "number") return null;

        return payload as AuthPayload;
    } catch {
        return null;
    }
}

// Middleware: checks Authorization: Bearer <token>
// If valid, attaches the payload to req.user and calls next()
// If missing/invalid, returns 401
export function auth(req: Request, res: Response, next: NextFunction) {
    // Header ausente e header inválido têm mensagens diferentes: manter isso
    // é o que distingue "esqueci de mandar" de "meu token expirou".
    if(!req.headers.authorization) {
        res.status(401).json({erro: "Token não encontrado"});
        return;
    }

    const payload = lerToken(req.headers.authorization);

    if(!payload) {
        res.status(401).json({erro: "Token invalido"});
        return;
    }

    req.user = payload;
    next();
}

// Mesma leitura, sem exigir token: alimenta req.user quando ele existe e segue
// em frente em qualquer caso. Usado em rota pública que mostra mais para o
// dono (o autor vendo o próprio rascunho) sem fechar a porta para os outros.
export function authOpcional(req: Request, _res: Response, next: NextFunction) {
    const payload = lerToken(req.headers.authorization);

    if(payload) req.user = payload;

    next();
}
