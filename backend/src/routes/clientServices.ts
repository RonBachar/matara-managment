import { Router } from "express";
import { prisma } from "../db/prisma";
import { materializeLegacyClientServices } from "../services/clientServices";

export const clientServicesRouter = Router();

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalString(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return value.trim();
}

function readOptionalNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const n =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

clientServicesRouter.get("/clients/:clientId/services", async (req, res) => {
  try {
    const clientId = String(req.params.clientId ?? "").trim();
    if (!clientId) return res.status(400).json({ error: "Missing client id" });

    await materializeLegacyClientServices([clientId]);

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

clientServicesRouter.post("/clients/:clientId/services", async (req, res) => {
  try {
    const clientId = String(req.params.clientId ?? "").trim();
    if (!clientId) return res.status(400).json({ error: "Missing client id" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const type = readNonEmptyString(body.type);
    const name = readNonEmptyString(body.name);
    if (!type) return res.status(400).json({ error: "type is required" });
    if (!name) return res.status(400).json({ error: "name is required" });

    const clientExists = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!clientExists) return res.status(404).json({ error: "Client not found" });

    const service = await prisma.clientService.create({
      data: {
        clientId,
        type,
        name,
        provider: readOptionalString(body.provider) || null,
        billingCycle: readOptionalString(body.billingCycle) || null,
        renewalPrice: readOptionalNumber(body.renewalPrice) ?? null,
        renewalDate: readOptionalString(body.renewalDate) || null,
        status: readOptionalString(body.status) || "Active",
        notes: readOptionalString(body.notes) || null,
      },
    });

    return res.status(201).json(service);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

clientServicesRouter.patch("/client-services/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing service id" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    const type = readOptionalString(body.type);
    if (type !== undefined && type.length > 0) data.type = type;

    const name = readOptionalString(body.name);
    if (name !== undefined && name.length > 0) data.name = name;

    const provider = readOptionalString(body.provider);
    if (provider !== undefined) data.provider = provider.length > 0 ? provider : null;

    const billingCycle = readOptionalString(body.billingCycle);
    if (billingCycle !== undefined) data.billingCycle = billingCycle.length > 0 ? billingCycle : null;

    const renewalPrice = readOptionalNumber(body.renewalPrice);
    if (renewalPrice !== undefined) data.renewalPrice = renewalPrice;
    if (body.renewalPrice === null) data.renewalPrice = null;

    const renewalDate = readOptionalString(body.renewalDate);
    if (renewalDate !== undefined) data.renewalDate = renewalDate.length > 0 ? renewalDate : null;

    const status = readOptionalString(body.status);
    if (status !== undefined) data.status = status.length > 0 ? status : "Active";

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

clientServicesRouter.delete("/client-services/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing service id" });

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
