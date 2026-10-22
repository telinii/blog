import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "../types/auth";

// Middleware: checks Authorization: Bearer <token>
// If valid, attaches the payload to req.user and calls next()
// If missing/invalid, returns 401
export function auth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if(!header) {
        res.status(401).json({erro: "Token não encontrado"});
        return;
    }

    // Expected format: "Bearer <token>"
    // split(" ") cuts "Bearer abc123" into ["Bearer", "abc123"]
    const [scheme, token, ...extra] = header.split(" ");

    // The scheme is case-insensitive (RFC 6750), so "bearer" is also valid.
    // extra.length !== 0 catches missing space or extra words -> invalid format
    if(scheme.toLowerCase() !== "bearer" || !token || extra.length > 0){
        res.status(401).json({erro: "Token invalido"});
        return;
    }

    try {
        // algorithms is pinned: without it, a token signed with a different
        // algorithm could be accepted depending on the secret.
        const payload = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] });

        // verify() returns a string when the token payload is not an object,
        // and a token without "id" would break prisma's connect later.
        if(typeof payload === "string" || typeof payload.id !== "number"){
            res.status(401).json({erro: "Token invalido"});
            return;
        }

        // Attach payload to request so next handlers know who is logged in
        req.user = payload as AuthPayload;
        next();
    } catch {
        res.status(401).json({erro: "Token invalido"})
    }
}
