import type { NextFunction, Request, Response } from "express";
import { admin } from "../lib/firebaseAdmin";

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Single-user system: the token must be valid AND belong to the owner.
 * Any other Google account gets 403 even though Firebase would accept it.
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const ownerUserId = process.env.MATARA_OWNER_USER_ID?.trim();
  if (!ownerUserId) {
    return res.status(500).json({ error: "MATARA_OWNER_USER_ID is not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length);

  let uid: string;
  try {
    uid = (await admin.auth().verifyIdToken(token)).uid;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (uid !== ownerUserId) {
    return res.status(403).json({ error: "This account is not allowed here" });
  }

  req.userId = uid;
  return next();
}
