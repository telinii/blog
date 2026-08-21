import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
    const parts = header.split(" ");
    // parts[0] should be "Bearer", parts[1] the token
    // length !== 2 means missing space or extra words -> invalid format
    if(parts.length !== 2 || parts[0] !== "Bearer"){
        res.status(401).json({erro: "Token invalido"});
        return;
    }

    const token = parts[1]; // the actual JWT

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!);
        // Attach payload to request so next handlers know who is logged in
        (req as any).user = payload;
        next();
    } catch {
        res.status(401).json({erro: "Token invalido"})
    }
}