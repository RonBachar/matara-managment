import { Router } from "express";
import { prisma } from "../db/prisma";
import type { AuthRequest } from "../middleware/auth";
import { readNonEmptyString, readOptionalString, readOptionalNumber } from "../utils/validation";
import { quoteSlugFromUrl } from "../utils/quoteSlug";

export const quotesRouter = Router();

/** A client id from the body must belong to this user; "" or null unlinks. */
async function resolveClientId(
  userId: string,
  value: unknown,
): Promise<{ ok: true; clientId: string | null | undefined } | { ok: false }> {
  if (value === undefined) return { ok: true, clientId: undefined };
  if (value === null) return { ok: true, clientId: null };
  const id = readOptionalString(value);
  if (id === undefined) return { ok: false };
  if (id.length === 0) return { ok: true, clientId: null };
  const client = await prisma.client.findFirst({ where: { id, userId }, select: { id: true } });
  return client ? { ok: true, clientId: client.id } : { ok: false };
}

quotesRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const clientId = readNonEmptyString(req.query.clientId);
    const quotes = await prisma.quote.findMany({
      where: clientId ? { userId, clientId } : { userId },
      orderBy: { sentAt: "desc" },
    });
    return res.json(quotes);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

/**
 * Registers a quote page. The slug is the identity: posting a URL that is
 * already known updates that quote instead of failing, so re-adding a quote
 * that the webhook created first simply links it.
 */
quotesRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const body = (req.body ?? {}) as Record<string, unknown>;

    const url = readNonEmptyString(body.url);
    if (!url) return res.status(400).json({ error: "url is required" });
    const slug = quoteSlugFromUrl(url);
    if (!slug) return res.status(400).json({ error: "לא ניתן לזהות את שם ההצעה מהכתובת" });

    const client = await resolveClientId(userId, body.clientId);
    if (!client.ok) return res.status(400).json({ error: "Client not found" });

    const title = readOptionalString(body.title);
    const amount = body.amount === null ? null : readOptionalNumber(body.amount);

    const existing = await prisma.quote.findUnique({ where: { slug } });
    if (existing && existing.userId !== userId) {
      return res.status(409).json({ error: "Quote slug already in use" });
    }

    if (existing) {
      const updated = await prisma.quote.update({
        where: { id: existing.id },
        data: {
          url,
          ...(client.clientId !== undefined ? { clientId: client.clientId } : {}),
          ...(title !== undefined && title.length > 0 ? { title } : {}),
          ...(amount !== undefined ? { amount } : {}),
        },
      });
      return res.status(200).json(updated);
    }

    const created = await prisma.quote.create({
      data: {
        userId,
        slug,
        url,
        clientId: client.clientId ?? null,
        title: title ?? "",
        amount: amount ?? null,
      },
    });
    return res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

quotesRouter.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing quote id" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    const client = await resolveClientId(userId, body.clientId);
    if (!client.ok) return res.status(400).json({ error: "Client not found" });
    if (client.clientId !== undefined) data.clientId = client.clientId;

    const title = readOptionalString(body.title);
    if (title !== undefined) data.title = title;

    if (body.amount === null) data.amount = null;
    else {
      const amount = readOptionalNumber(body.amount);
      if (amount !== undefined) data.amount = amount;
    }

    const url = readOptionalString(body.url);
    if (url !== undefined && url.length > 0) {
      const slug = quoteSlugFromUrl(url);
      if (!slug) return res.status(400).json({ error: "לא ניתן לזהות את שם ההצעה מהכתובת" });
      const clash = await prisma.quote.findUnique({ where: { slug } });
      if (clash && clash.id !== id) {
        return res.status(409).json({ error: "הצעה עם הכתובת הזו כבר קיימת" });
      }
      data.url = url;
      data.slug = slug;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const existing = await prisma.quote.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Quote not found" });

    const updated = await prisma.quote.update({ where: { id }, data });
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

quotesRouter.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing quote id" });

    const existing = await prisma.quote.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Quote not found" });

    await prisma.quote.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});
