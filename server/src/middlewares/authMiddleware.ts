//! AUTH MIDDLEWARE

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@services/authService";
import { UnauthorizedError } from "@utils";
import { OfficerRepository } from "@repositories/OfficerRepository";

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
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
        const user = (req as any).user;

        if (!user) {
            throw new UnauthorizedError("Authentication required");
        }

        // If allowedTypes contains simple types like 'user' or 'officer', allow direct comparison
        if (allowedTypes.includes(user.type)) {
            return next();
        }

        // If the user is an officer and allowedTypes are officer roles, resolve the officer from DB
        if (user.type === 'officer') {
            const officerRepo = new OfficerRepository();
            const officer = await officerRepo.getOfficerById(user.id);
            if (!officer) {
                throw new UnauthorizedError("Officer not found");
            }

            // officer.role should be comparable to allowedTypes values
            if (allowedTypes.includes((officer as any).role)) {
                return next();
            }
        }

        throw new UnauthorizedError(
            `Insufficient permissions. Required: ${allowedTypes.join(" or ")}`
        );
        } catch (error) {
        next(error);
        }
    };
}
