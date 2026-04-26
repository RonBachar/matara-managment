import { Router } from "express";
import { prisma } from "../db/prisma";
import { readNonEmptyString, readOptionalString, readOptionalNumber } from "../utils/validation";

export const clientsRouter = Router();

clientsRouter.get("/", async (_req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(clients);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

clientsRouter.post("/", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const clientName = readNonEmptyString(body.clientName);
    if (!clientName) return res.status(400).json({ error: "clientName is required" });

    const businessName = readOptionalString(body.businessName) ?? "";
    const phone = readOptionalString(body.phone) ?? "";
    const email = readOptionalString(body.email) ?? "";
    const website = readOptionalString(body.website);
    const notes = readOptionalString(body.notes);

    const packageType = readOptionalString(body.packageType) ?? "none";
    const packagePrice = readOptionalNumber(body.packagePrice);
    const renewalDate = readOptionalString(body.renewalDate);
    const reminderDaysBefore = readOptionalNumber(body.reminderDaysBefore);

    const created = await prisma.client.create({
      data: {
        clientName,
        businessName,
        phone,
        email,
        website: website && website.length > 0 ? website : null,
        notes: notes && notes.length > 0 ? notes : null,
        packageType: packageType.length > 0 ? packageType : "none",
        packagePrice: packagePrice ?? null,
        renewalDate: renewalDate && renewalDate.length > 0 ? renewalDate : null,
        reminderDaysBefore: reminderDaysBefore ?? null,
        agreementFileId: readOptionalString(body.agreementFileId) ?? null,
        agreementFileName: readOptionalString(body.agreementFileName) ?? null,
        agreementFileType: readOptionalString(body.agreementFileType) ?? null,
      },
    });

    return res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

clientsRouter.patch("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing client id" });

    const body = (req.body ?? {}) as Record<string, unknown>;

    const data: Record<string, unknown> = {};

    const clientName = readOptionalString(body.clientName);
    if (clientName !== undefined && clientName.length > 0) data.clientName = clientName;

    const businessName = readOptionalString(body.businessName);
    if (businessName !== undefined) data.businessName = businessName;

    const phone = readOptionalString(body.phone);
    if (phone !== undefined) data.phone = phone;

    const email = readOptionalString(body.email);
    if (email !== undefined) data.email = email;

    const website = readOptionalString(body.website);
    if (website !== undefined) data.website = website.length > 0 ? website : null;

    const notes = readOptionalString(body.notes);
    if (notes !== undefined) data.notes = notes.length > 0 ? notes : null;
    if (body.notes === null) data.notes = null;

    const packageType = readOptionalString(body.packageType);
    if (packageType !== undefined) data.packageType = packageType.length > 0 ? packageType : "none";

    const packagePrice = readOptionalNumber(body.packagePrice);
    if (packagePrice !== undefined) data.packagePrice = packagePrice;
    if (body.packagePrice === null) data.packagePrice = null;

    const renewalDate = readOptionalString(body.renewalDate);
    if (renewalDate !== undefined) data.renewalDate = renewalDate.length > 0 ? renewalDate : null;
    if (body.renewalDate === null) data.renewalDate = null;

    const reminderDaysBefore = readOptionalNumber(body.reminderDaysBefore);
    if (reminderDaysBefore !== undefined) data.reminderDaysBefore = reminderDaysBefore;
    if (body.reminderDaysBefore === null) data.reminderDaysBefore = null;

    const agreementFileId = readOptionalString(body.agreementFileId);
    if (agreementFileId !== undefined) data.agreementFileId = agreementFileId.length > 0 ? agreementFileId : null;
    if (body.agreementFileId === null) data.agreementFileId = null;

    const agreementFileName = readOptionalString(body.agreementFileName);
    if (agreementFileName !== undefined) data.agreementFileName = agreementFileName.length > 0 ? agreementFileName : null;
    if (body.agreementFileName === null) data.agreementFileName = null;

    const agreementFileType = readOptionalString(body.agreementFileType);
    if (agreementFileType !== undefined) data.agreementFileType = agreementFileType.length > 0 ? agreementFileType : null;
    if (body.agreementFileType === null) data.agreementFileType = null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updated = await prisma.client.update({ where: { id }, data });
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Client not found" });
    }
    return res.status(500).json({ error: message });
  }
});

clientsRouter.delete("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing client id" });

    await prisma.client.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Client not found" });
    }
    return res.status(500).json({ error: message });
  }
});
