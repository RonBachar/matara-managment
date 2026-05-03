import type { NextFunction, Request, Response } from "express";
import { admin } from "../lib/firebaseAdmin";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.userId = decoded.uid;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
