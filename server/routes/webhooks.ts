import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { convertLeadToClient } from "../services/leadConversion";
import { readOptionalDate, readOptionalNumber, readOptionalString } from "../utils/validation";
import { QUOTE_SLUG_PATTERN, quoteSlugFromUrl } from "../utils/quoteSlug";
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

/**
 * The website says which form the lead came from — "contact", "landing" or
 * "calculator" — and the leads table shows that word as-is, so translate it
 * to the Hebrew the rest of the UI uses. An unknown value is kept verbatim
 * rather than flattened to "אתר": a new form should show up as itself, not
 * disappear into the same label as everything else.
 */
const SOURCE_LABELS: Record<string, string> = {
  contact: "טופס יצירת קשר",
  landing: "דף נחיתה",
  calculator: "מחשבון מחירים",
  quote: "הצעת מחיר",
};

function sourceLabel(raw: string | undefined): string {
  if (!raw) return "אתר";
  return SOURCE_LABELS[raw] ?? raw;
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
    const leadSource = sourceLabel(pick(body, ["leadSource", "source", "utm_source"]));
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

const SIGNED_QUOTE_STATUS = "נחתמה";

/**
 * A client signed a quote on the price-offers site.
 *
 * The quote is found by its slug (the last segment of its URL) and marked
 * signed. When nobody registered the quote beforehand it is created unlinked,
 * so it still shows up on the quotes page. An unlinked quote is linked to the
 * one client whose email matches the signer's, or failing that to the one lead
 * whose email or phone matches. A quote that ends up with a lead and no client
 * converts that lead into a client (the same conversion as the leads page),
 * and the client's contract link is filled with the signed copy if it was empty.
 *
 * Idempotent: the price-offers site may retry, and a repeat of the same payload
 * writes nothing.
 */
webhooksRouter.post("/quotes", async (req, res) => {
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

    if (body.event !== "quote.signed") {
      return res.status(400).json({ error: "Unsupported event" });
    }

    const quoteUrl = readOptionalString(body.quoteUrl) || undefined;
    const slug =
      readOptionalString(body.quoteSlug)?.toLowerCase() ||
      (quoteUrl ? quoteSlugFromUrl(quoteUrl) : null) ||
      "";
    if (!QUOTE_SLUG_PATTERN.test(slug)) {
      return res.status(400).json({ error: "Invalid quoteSlug" });
    }

    const signedAtRaw = readOptionalDate(body.signedAt);
    if (body.signedAt !== undefined && signedAtRaw === undefined) {
      return res.status(400).json({ error: "signedAt must be a valid date" });
    }

    const title = readOptionalString(body.quoteTitle) || undefined;
    // The price-offers page sends its own total, but only when the document
    // names exactly one — a multi-package quote sends nothing, because the
    // signature does not say which package was chosen.
    const amount = readOptionalNumber(body.quoteAmount);
    const signerName = readOptionalString(body.signerName) || null;
    const signerEmail = readOptionalString(body.signerEmail) || null;
    const signerPhone = readOptionalString(body.signerPhone) || null;
    const signatureUrl = readOptionalString(body.signatureUrl) || null;
    const signedCopyUrl = readOptionalString(body.signedCopyUrl) || null;

    let quote = await prisma.quote.findUnique({ where: { slug } });
    if (quote && quote.userId !== ownerUserId) {
      return res.status(409).json({ error: "Quote slug belongs to another user" });
    }

    const signed = {
      status: SIGNED_QUOTE_STATUS,
      // A retry without a timestamp must not move the signing date.
      signedAt: signedAtRaw ?? quote?.signedAt ?? new Date(),
      signerName,
      signerEmail,
      signatureUrl,
      signedCopyUrl,
    };

    if (!quote) {
      quote = await prisma.quote.create({
        data: {
          userId: ownerUserId,
          slug,
          url: quoteUrl ?? "",
          title: title ?? "",
          ...(amount !== undefined ? { amount } : {}),
          ...signed,
        },
      });
    } else {
      const data: Record<string, unknown> = {};
      const next: Record<string, unknown> = {
        ...signed,
        ...(title ? { title } : {}),
        ...(quoteUrl ? { url: quoteUrl } : {}),
        // Fills a blank amount, never replaces one that was typed in when the
        // quote was registered: a hand-entered figure may carry a discount, or
        // name the package the client actually picked.
        ...(amount !== undefined && quote.amount === null ? { amount } : {}),
      };
      const current = quote as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(next)) {
        const before = current[key];
        const same =
          before instanceof Date && value instanceof Date
            ? before.getTime() === value.getTime()
            : before === value;
        if (!same) data[key] = value;
      }
      if (Object.keys(data).length > 0) {
        quote = await prisma.quote.update({ where: { id: quote.id }, data });
      }
    }

    if (!quote.clientId && !quote.leadId && signerEmail) {
      const matches = await prisma.client.findMany({
        where: {
          userId: ownerUserId,
          email: { equals: signerEmail.trim(), mode: "insensitive" },
        },
        select: { id: true },
        take: 2,
      });
      if (matches.length === 1) {
        quote = await prisma.quote.update({
          where: { id: quote.id },
          data: { clientId: matches[0].id },
        });
      }
    }

    // Nobody registered the quote against a lead or client: look for the one
    // lead that sent the enquiry, by email or phone.
    if (!quote.clientId && !quote.leadId) {
      const emailKey = emailKeyOf(signerEmail);
      const phoneKey = phoneKeyOf(signerPhone);
      const or: Prisma.LeadWhereInput[] = [];
      if (emailKey) {
        or.push({ emailKey }, { email: { equals: emailKey, mode: "insensitive" } });
      }
      if (phoneKey) or.push({ phoneKey });
      if (or.length > 0) {
        const leads = await prisma.lead.findMany({
          where: { userId: ownerUserId, OR: or },
          select: { id: true },
          take: 2,
        });
        if (leads.length === 1) {
          quote = await prisma.quote.update({
            where: { id: quote.id },
            data: { leadId: leads[0].id },
          });
        }
      }
    }

    // A signed quote turns its lead into a client. Converting reuses the
    // lead's existing client when it was converted before, so a retry of the
    // same payload never creates a second client.
    if (!quote.clientId && quote.leadId) {
      const conversion = await convertLeadToClient(ownerUserId, quote.leadId);
      if (conversion.status !== "not_found") {
        quote = await prisma.quote.update({
          where: { id: quote.id },
          data: { clientId: conversion.client.id },
        });
      }
    }

    if (quote.clientId && signedCopyUrl) {
      // Only fills an empty contract link; one set by hand is never replaced.
      await prisma.client.updateMany({
        where: {
          id: quote.clientId,
          userId: ownerUserId,
          OR: [{ contractUrl: null }, { contractUrl: "" }],
        },
        data: { contractUrl: signedCopyUrl },
      });
    }

    return res.status(200).json({ ok: true, quoteId: quote.id, clientId: quote.clientId });
  } catch (err: unknown) {
    console.error("webhook /quotes failed", err);
    return res.status(500).json({ error: "Failed to record signed quote" });
  }
});
