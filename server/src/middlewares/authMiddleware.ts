//! AUTH MIDDLEWARE

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@services/authService";
import { UnauthorizedError } from "@utils";

/**
 * Middleware per autenticare richieste con JWT Bearer token
 * Aggiunge req.user con i dati del token decodificato
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Missing or invalid Authorization header");
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        (req as any).user = decoded;
        
        next();
    } catch (error) {
        next(new UnauthorizedError("Invalid or expired token"));
    }
}

/**
 * Middleware per verificare che l'utente abbia un ruolo specifico
 * da usare DOPO authenticateToken
 */
export function requireUserType(allowedTypes: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
        const user = (req as any).user;
        
        if (!user) {
            throw new UnauthorizedError("Authentication required");
        }

        if (!allowedTypes.includes(user.type)) {
            throw new UnauthorizedError(
            `Insufficient permissions. Required: ${allowedTypes.join(" or ")}`
            );
        }

        next();
        } catch (error) {
        next(error);
        }
    };
}
