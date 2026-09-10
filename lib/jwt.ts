import jwt from "jsonwebtoken";
import type { UserRole } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en .env.local");
}

const jwtSecret: string = JWT_SECRET;

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  nombre: string;
}

export function createToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, jwtSecret, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, jwtSecret) as unknown as AuthTokenPayload;
}
