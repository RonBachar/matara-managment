import { Router } from "express";
import { prisma } from "../db/prisma";

export const projectsRouter = Router();

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

projectsRouter.post("/", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const projectName = readNonEmptyString(body.projectName);
    const clientName = readNonEmptyString(body.clientName);
    const projectType = readNonEmptyString(body.projectType);
    const status = readNonEmptyString(body.status);

    if (!projectName || !clientName || !projectType || !status) {
      return res.status(400).json({
        error:
          "Invalid body. Required string fields: projectName, clientName, projectType, status",
      });
    }

    // We don't have a Client table yet. Use a stable-ish placeholder for now.
    const clientId = clientName;

    const created = await prisma.project.create({
      data: {
        projectName,
        clientName,
        clientId,
        projectType,
        status,
      },
    });

    return res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectsRouter.get("/", async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(projects);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectsRouter.patch("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing project id" });

    const body = (req.body ?? {}) as Record<string, unknown>;

    const data: Record<string, unknown> = {};

    const projectName = readOptionalString(body.projectName);
    if (projectName !== undefined && projectName.length > 0) data.projectName = projectName;

    const clientName = readOptionalString(body.clientName);
    if (clientName !== undefined && clientName.length > 0) data.clientName = clientName;

    const clientId = readOptionalString(body.clientId);
    if (clientId !== undefined && clientId.length > 0) data.clientId = clientId;

    const projectType = readOptionalString(body.projectType);
    if (projectType !== undefined && projectType.length > 0) data.projectType = projectType;

    const status = readOptionalString(body.status);
    if (status !== undefined && status.length > 0) data.status = status;

    const totalAmount = readOptionalNumber(body.totalAmount);
    if (totalAmount !== undefined) data.totalAmount = totalAmount;

    const paidAmount = readOptionalNumber(body.paidAmount);
    if (paidAmount !== undefined) data.paidAmount = paidAmount;

    const remainingAmount = readOptionalNumber(body.remainingAmount);
    if (remainingAmount !== undefined) data.remainingAmount = remainingAmount;

    const hourlyRate = readOptionalNumber(body.hourlyRate);
    if (hourlyRate !== undefined) data.hourlyRate = hourlyRate;

    const workedHours = readOptionalNumber(body.workedHours);
    if (workedHours !== undefined) data.workedHours = workedHours;

    const billableTotal = readOptionalNumber(body.billableTotal);
    if (billableTotal !== undefined) data.billableTotal = billableTotal;

    if (body.notes === null) data.notes = null;
    const notes = readOptionalString(body.notes);
    if (notes !== undefined) data.notes = notes.length > 0 ? notes : null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Prisma "record not found" ends up here; keep it beginner-friendly.
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Project not found" });
    }
    return res.status(500).json({ error: message });
  }
});

projectsRouter.delete("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing project id" });

    await prisma.project.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Project not found" });
    }
    return res.status(500).json({ error: message });
  }
});

