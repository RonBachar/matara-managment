import { Router } from "express";
import { prisma } from "../db/prisma";
import { readOptionalString } from "../utils/validation";

export const webhooksRouter = Router();

const DEFAULT_CLIENT_NAME = "ליד חדש";
const MAX_CLIENT_NAME_LENGTH = 200;

function normalizeClientName(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_CLIENT_NAME;
  const trimmed = value.trim();
  if (trimmed.length === 0) return DEFAULT_CLIENT_NAME;
  if (trimmed.length <= MAX_CLIENT_NAME_LENGTH) return trimmed;
  return trimmed.slice(0, MAX_CLIENT_NAME_LENGTH);
}

function readWebhookSecret(req: { headers: Record<string, unknown> }): string | undefined {
  const header = req.headers["x-matara-webhook-secret"];
  if (typeof header === "string") return header;
  if (Array.isArray(header) && typeof header[0] === "string") return header[0];
  return undefined;
}

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

    const clientName = normalizeClientName(body.clientName);
    const phone = readOptionalString(body.phone) ?? "";
    const email = readOptionalString(body.email);
    const leadSource = readOptionalString(body.leadSource) ?? "";
    const status = readOptionalString(body.status) ?? "חדש";
    const notes = readOptionalString(body.notes);

    const created = await prisma.lead.create({
      data: {
        userId: ownerUserId,
        clientName,
        phone,
        email: email && email.length > 0 ? email : null,
        leadSource,
        status: status.length > 0 ? status : "חדש",
        notes: notes && notes.length > 0 ? notes : null,
      },
    });

    return res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});
