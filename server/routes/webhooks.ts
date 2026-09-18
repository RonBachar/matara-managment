import { Router } from "express";
import { prisma } from "../db/prisma";
import { readOptionalString } from "../utils/validation";
import {
  CLOSED_LEAD_STATUS,
  appendRepeatNote,
  emailKeyOf,
  phoneKeyOf,
} from "../utils/leadMatching";

export const webhooksRouter = Router();

const DEFAULT_CLIENT_NAME = "ליד חדש";
const MAX_CLIENT_NAME_LENGTH = 200;

/** First non-empty string among several candidate keys — the site, Make and the
 *  older Elementor forms each name the same field differently. */
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

/** Phone wins over email: it is the identifier people reuse most reliably, and
 *  a shared family inbox should not merge two different people. */
async function findOpenLead(
  userId: string,
  phoneKey: string | null,
  emailKey: string | null,
) {
  const open = { userId, status: { not: CLOSED_LEAD_STATUS } } as const;

  if (phoneKey) {
    const byPhone = await prisma.lead.findFirst({
      where: { ...open, phoneKey },
      orderBy: { updatedAt: "desc" },
    });
    if (byPhone) return byPhone;
  }

  if (emailKey) {
    return prisma.lead.findFirst({
      where: { ...open, emailKey },
      orderBy: { updatedAt: "desc" },
    });
  }

  return null;
}

/**
 * Inbound lead from any of the website forms (via Make, or posted directly).
 *
 * A person who fills in a second form is the same lead, not a new one, so an
 * open lead matching the phone — or the email, when no phone was given — is
 * updated in place: the new message is appended, blanks are filled in, and the
 * submission count goes up. That keeps the count honest while still showing
 * that they came back.
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
    const serviceType = pick(body, ["serviceType", "service_type", "service"]) ?? "";
    const notes = pick(body, ["notes", "message", "msg", "text", "comments"]);

    const phoneKey = phoneKeyOf(phone);
    const emailKey = emailKeyOf(email);

    const existing = await findOpenLead(ownerUserId, phoneKey, emailKey);

    if (existing) {
      const updated = await prisma.lead.update({
        where: { id: existing.id },
        data: {
          // Only fill gaps — never overwrite something already known with a blank.
          clientName:
            existing.clientName === DEFAULT_CLIENT_NAME && clientName !== DEFAULT_CLIENT_NAME
              ? clientName
              : existing.clientName,
          phone: existing.phone || phone,
          email: existing.email ?? email ?? null,
          serviceType: serviceType || existing.serviceType,
          phoneKey: existing.phoneKey ?? phoneKey,
          emailKey: existing.emailKey ?? emailKey,
          notes: appendRepeatNote(existing.notes, notes ?? null),
          submissionCount: { increment: 1 },
        },
      });

      return res.status(200).json({
        id: updated.id,
        clientName: updated.clientName,
        merged: true,
        submissionCount: updated.submissionCount,
      });
    }

    const created = await prisma.lead.create({
      data: {
        userId: ownerUserId,
        clientName,
        phone,
        email: email ?? null,
        leadSource,
        serviceType,
        status: "חדש",
        notes: notes ?? null,
        phoneKey,
        emailKey,
      },
    });

    return res.status(201).json({ id: created.id, clientName: created.clientName, merged: false });
  } catch (err: unknown) {
    console.error("webhook /leads failed", err);
    return res.status(500).json({ error: "Failed to create lead" });
  }
});
