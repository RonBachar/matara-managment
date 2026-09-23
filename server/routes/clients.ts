import { Router } from "express";
import { prisma } from "../db/prisma";
import type { AuthRequest } from "../middleware/auth";
import {
  readNonEmptyString,
  readOptionalString,
  readOptionalNumber,
  readOptionalDate,
} from "../utils/validation";

export const clientsRouter = Router();

clientsRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(clients);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

clientsRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const body = (req.body ?? {}) as Record<string, unknown>;

    const clientName = readNonEmptyString(body.clientName);
    if (!clientName) return res.status(400).json({ error: "clientName is required" });

    const website = readOptionalString(body.website);
    const notes = readOptionalString(body.notes);

    const created = await prisma.client.create({
      data: {
        userId,
        clientName,
        businessName: readOptionalString(body.businessName) ?? "",
        phone: readOptionalString(body.phone) ?? "",
        email: readOptionalString(body.email) ?? "",
        serviceType: readOptionalString(body.serviceType) ?? "",
        leadSource: readOptionalString(body.leadSource) ?? "",
        website: website || null,
        notes: notes || null,
        contractUrl: readOptionalString(body.contractUrl) || null,
        packageType: readOptionalString(body.packageType) || null,
        renewalPrice: readOptionalNumber(body.renewalPrice) ?? null,
        renewalDate: readOptionalDate(body.renewalDate) ?? null,
        reminderDaysBefore: readOptionalNumber(body.reminderDaysBefore) ?? null,
      },
    });

    return res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

clientsRouter.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing client id" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    const clientName = readOptionalString(body.clientName);
    if (clientName !== undefined && clientName.length > 0) data.clientName = clientName;

    // Plain text fields: an empty string is a real value, so "" clears them.
    for (const field of ["businessName", "phone", "email", "serviceType", "leadSource"] as const) {
      const value = readOptionalString(body[field]);
      if (value !== undefined) data[field] = value;
    }

    // Nullable fields: an empty string means "remove it".
    for (const field of ["website", "notes", "contractUrl", "packageType"] as const) {
      const value = readOptionalString(body[field]);
      if (value !== undefined) data[field] = value.length > 0 ? value : null;
      if (body[field] === null) data[field] = null;
    }

    for (const field of ["renewalPrice", "reminderDaysBefore"] as const) {
      const value = readOptionalNumber(body[field]);
      if (value !== undefined) data[field] = value;
      if (body[field] === null) data[field] = null;
    }

    if (body.renewalDate !== undefined) {
      const parsed = readOptionalDate(body.renewalDate);
      if (body.renewalDate !== null && parsed === undefined) {
        return res.status(400).json({ error: "renewalDate must be a valid date" });
      }
      data.renewalDate = parsed ?? null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const existing = await prisma.client.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Client not found" });

    const updated = await prisma.client.update({ where: { id }, data });
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

clientsRouter.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing client id" });

    const existing = await prisma.client.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Client not found" });

    const projects = await prisma.project.count({ where: { clientId: id } });
    if (projects > 0) {
      return res.status(409).json({
        error: `ללקוח יש ${projects} פרויקטים. מחק אותם קודם.`,
      });
    }

    await prisma.client.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});
