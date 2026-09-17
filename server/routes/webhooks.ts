import { Router } from "express";
import { prisma } from "../db/prisma";
import { readOptionalString } from "../utils/validation";

export const webhooksRouter = Router();

const DEFAULT_CLIENT_NAME = "ליד חדש";
const MAX_CLIENT_NAME_LENGTH = 200;

/** First non-empty string among several candidate keys (Make/forms name fields differently). */
function pick(body: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readOptionalString(body[key]);
    if (value) return value;
  }
  return undefined;
}

function readWebhookSecret(req: { headers: Record<string, unknown> }): string | undefined {
  const header = req.headers["x-matara-webhook-secret"];
  if (typeof header === "string") return header;
  if (Array.isArray(header) && typeof header[0] === "string") return header[0];
  return undefined;
}

/**
 * Inbound lead from the website contact form (via Make).
 * Accepts the field names Make / common form builders use, so a renamed
 * form field does not silently drop data.
 */
webhooksRouter.post("/leads", async (req, res) => {
  try {
    const secret = process.env.MATARA_WEBHOOK_SECRET?.trim();
    if (!secret) {
      return res.status(500).json({ error: "MATARA_WEBHOOK_SECRET is not configured" });
    }

    const ownerUserId = process.env.MATARA_OWNER_USER_ID?.trim();
    if (!ownerUserId) {
      return res.status(500).json({ error: "MATARA_OWNER_USER_ID is not configured" });
    }

    const provided = readWebhookSecret(req);
    if (!provided || provided !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;

    const clientName = (
      pick(body, ["clientName", "name", "fullName", "full_name", "firstName"]) ?? DEFAULT_CLIENT_NAME
    ).slice(0, MAX_CLIENT_NAME_LENGTH);
    const phone = pick(body, ["phone", "tel", "telephone", "mobile"]) ?? "";
    const email = pick(body, ["email", "mail"]);
    const leadSource = pick(body, ["leadSource", "source", "utm_source"]) ?? "אתר";
    const notes = pick(body, ["notes", "message", "msg", "text", "comments"]);

    const created = await prisma.lead.create({
      data: {
        userId: ownerUserId,
        clientName,
        phone,
        email: email ?? null,
        leadSource,
        status: "חדש",
        notes: notes ?? null,
      },
    });

    return res.status(201).json({ id: created.id, clientName: created.clientName });
  } catch (err: unknown) {
    console.error("webhook /leads failed", err);
    return res.status(500).json({ error: "Failed to create lead" });
  }
});
