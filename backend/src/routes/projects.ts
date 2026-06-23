import { Router } from "express";
import { prisma } from "../db/prisma";
import type { AuthRequest } from "../middleware/auth";
import { readNonEmptyString, readOptionalString, readOptionalNumber } from "../utils/validation";

export const projectsRouter = Router();

async function findOwnedClient(clientId: string, userId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  });
}

projectsRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const body = (req.body ?? {}) as Record<string, unknown>;

    const projectName = readNonEmptyString(body.projectName);
    const clientId = readNonEmptyString(body.clientId);

    if (!projectName || !clientId) {
      return res.status(400).json({
        error: "Invalid body. Required string fields: projectName, clientId",
      });
    }

    const client = await findOwnedClient(clientId, userId);
    if (!client) return res.status(404).json({ error: "Client not found" });

    const status = readOptionalString(body.status) ?? "התחיל";
    const notes = readOptionalString(body.notes);
    const totalAmount = readOptionalNumber(body.totalAmount) ?? 0;
    const paidAmount = readOptionalNumber(body.paidAmount) ?? 0;

    const created = await prisma.project.create({
      data: {
        userId,
        clientId,
        projectName,
        status,
        totalAmount,
        paidAmount,
        notes: notes && notes.length > 0 ? notes : null,
      },
    });

    return res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectsRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(projects);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectsRouter.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing project id" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    const projectName = readOptionalString(body.projectName);
    if (projectName !== undefined && projectName.length > 0) data.projectName = projectName;

    const clientId = readOptionalString(body.clientId);
    if (clientId !== undefined && clientId.length > 0) {
      const client = await findOwnedClient(clientId, userId);
      if (!client) return res.status(404).json({ error: "Client not found" });
      data.clientId = clientId;
    }

    const status = readOptionalString(body.status);
    if (status !== undefined && status.length > 0) data.status = status;

    const totalAmount = readOptionalNumber(body.totalAmount);
    if (totalAmount !== undefined) data.totalAmount = totalAmount;

    const paidAmount = readOptionalNumber(body.paidAmount);
    if (paidAmount !== undefined) data.paidAmount = paidAmount;

    if (body.notes === null) data.notes = null;
    const notes = readOptionalString(body.notes);
    if (notes !== undefined) data.notes = notes.length > 0 ? notes : null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Project not found" });

    const updated = await prisma.project.update({ where: { id }, data });
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Project not found" });
    }
    return res.status(500).json({ error: message });
  }
});

projectsRouter.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing project id" });

    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Project not found" });

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
