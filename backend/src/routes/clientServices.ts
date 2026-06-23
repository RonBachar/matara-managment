import { Router } from "express";
import { prisma } from "../db/prisma";
import type { AuthRequest } from "../middleware/auth";
import {
  readNonEmptyString,
  readOptionalString,
  readOptionalNumber,
} from "../utils/validation";

export const clientServicesRouter = Router();

function readOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function findOwnedClient(clientId: string, userId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  });
}

async function findOwnedService(serviceId: string, userId: string) {
  return prisma.clientService.findFirst({
    where: {
      id: serviceId,
      client: { userId },
    },
    include: { client: { select: { userId: true } } },
  });
}

clientServicesRouter.get("/client-services", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const services = await prisma.clientService.findMany({
      where: { client: { userId } },
      include: {
        client: { select: { id: true, clientName: true, businessName: true } },
      },
      orderBy: [{ renewalDate: "asc" }, { createdAt: "asc" }],
    });
    return res.json(services);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

clientServicesRouter.get("/clients/:clientId/services", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const clientId = String(req.params.clientId ?? "").trim();
    if (!clientId) return res.status(400).json({ error: "Missing client id" });

    const client = await findOwnedClient(clientId, userId);
    if (!client) return res.status(404).json({ error: "Client not found" });

    const services = await prisma.clientService.findMany({
      where: { clientId },
      orderBy: [{ renewalDate: "asc" }, { createdAt: "asc" }],
    });

    return res.json(services);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

clientServicesRouter.post("/clients/:clientId/services", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const clientId = String(req.params.clientId ?? "").trim();
    if (!clientId) return res.status(400).json({ error: "Missing client id" });

    const client = await findOwnedClient(clientId, userId);
    if (!client) return res.status(404).json({ error: "Client not found" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const serviceName = readNonEmptyString(body.serviceName);
    const billingCycle = readNonEmptyString(body.billingCycle);
    if (!serviceName) return res.status(400).json({ error: "serviceName is required" });
    if (!billingCycle) return res.status(400).json({ error: "billingCycle is required" });

    const renewalDate = readOptionalDate(body.renewalDate);
    if (body.renewalDate !== undefined && body.renewalDate !== null && renewalDate === undefined) {
      return res.status(400).json({ error: "renewalDate must be a valid ISO date string" });
    }

    const service = await prisma.clientService.create({
      data: {
        clientId,
        serviceName,
        billingCycle,
        renewalPrice: readOptionalNumber(body.renewalPrice) ?? null,
        renewalDate: renewalDate ?? null,
        reminderDaysBefore: readOptionalNumber(body.reminderDaysBefore) ?? null,
        notes: readOptionalString(body.notes) || null,
      },
    });

    return res.status(201).json(service);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

clientServicesRouter.patch("/client-services/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing service id" });

    const existing = await findOwnedService(id, userId);
    if (!existing) return res.status(404).json({ error: "Client service not found" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    const serviceName = readOptionalString(body.serviceName);
    if (serviceName !== undefined && serviceName.length > 0) data.serviceName = serviceName;

    const billingCycle = readOptionalString(body.billingCycle);
    if (billingCycle !== undefined && billingCycle.length > 0) data.billingCycle = billingCycle;

    const renewalPrice = readOptionalNumber(body.renewalPrice);
    if (renewalPrice !== undefined) data.renewalPrice = renewalPrice;
    if (body.renewalPrice === null) data.renewalPrice = null;

    if (body.renewalDate !== undefined) {
      const renewalDate = readOptionalDate(body.renewalDate);
      if (body.renewalDate !== null && renewalDate === undefined) {
        return res.status(400).json({ error: "renewalDate must be a valid ISO date string" });
      }
      data.renewalDate = renewalDate ?? null;
    }

    const reminderDaysBefore = readOptionalNumber(body.reminderDaysBefore);
    if (reminderDaysBefore !== undefined) data.reminderDaysBefore = reminderDaysBefore;
    if (body.reminderDaysBefore === null) data.reminderDaysBefore = null;

    const notes = readOptionalString(body.notes);
    if (notes !== undefined) data.notes = notes.length > 0 ? notes : null;
    if (body.notes === null) data.notes = null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updated = await prisma.clientService.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Client service not found" });
    }
    return res.status(500).json({ error: message });
  }
});

clientServicesRouter.delete("/client-services/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing service id" });

    const existing = await findOwnedService(id, userId);
    if (!existing) return res.status(404).json({ error: "Client service not found" });

    await prisma.clientService.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Client service not found" });
    }
    return res.status(500).json({ error: message });
  }
});
