//! AUTH SERVICE (JWT and Password Hashing)

import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { JWT_SECRET, TOKEN_LIFESPAN } from "@config";

const SALT_ROUNDS = 10;

// hashPassword = hashes a plain password using bcrypt
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// verifyPassword = verifies a plain password against a hashed password (sempre usando bcrypt)
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// creates a JWT token
export function generateToken(payload: {
  id: number;
  username: string;
  type: "user" | "officer"| "admin";
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_LIFESPAN });
}

// verifies a JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
