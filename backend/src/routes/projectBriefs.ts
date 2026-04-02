import { Router } from "express";
import { prisma } from "../db/prisma";

export const projectBriefsRouter = Router();

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  if (Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function briefFromDb(row: { id: string; createdAt: Date; updatedAt: Date; data: unknown }) {
  const data = asRecord(row.data) ?? {};
  return {
    ...data,
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

projectBriefsRouter.get("/", async (_req, res) => {
  try {
    const rows = await prisma.projectBrief.findMany({ orderBy: { updatedAt: "desc" } });
    return res.json(rows.map(briefFromDb));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectBriefsRouter.get("/by-project/:projectId", async (req, res) => {
  try {
    const projectId = String(req.params.projectId ?? "").trim();
    if (!projectId) return res.status(400).json({ error: "Missing projectId" });

    const row = await prisma.projectBrief.findUnique({ where: { projectId } });
    if (!row) return res.status(404).json({ error: "Brief not found" });
    return res.json(briefFromDb(row));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectBriefsRouter.get("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing brief id" });

    const row = await prisma.projectBrief.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ error: "Brief not found" });
    return res.json(briefFromDb(row));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectBriefsRouter.post("/", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const projectId = readNonEmptyString(body.projectId);
    const data = asRecord(body.data) ?? asRecord(body.brief) ?? asRecord(body);

    if (!projectId) {
      return res.status(400).json({ error: "Invalid body. Required: projectId" });
    }
    if (!data) {
      return res.status(400).json({ error: "Invalid body. Expected brief object payload" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const existing = await prisma.projectBrief.findUnique({ where: { projectId } });
    if (existing) {
      return res.status(200).json(briefFromDb(existing));
    }

    const created = await prisma.projectBrief.create({
      data: {
        projectId,
        data: {
          ...data,
          projectId,
        },
      },
    });

    return res.status(201).json(briefFromDb(created));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectBriefsRouter.patch("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing brief id" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = asRecord(body.data) ?? asRecord(body.brief) ?? asRecord(body);
    if (!data) return res.status(400).json({ error: "Invalid body. Expected brief object" });

    const existing = await prisma.projectBrief.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Brief not found" });

    // Preserve the DB-linked projectId; brief payload can include it but DB is source of truth.
    const updated = await prisma.projectBrief.update({
      where: { id },
      data: {
        data: {
          ...(asRecord(existing.data) ?? {}),
          ...data,
          projectId: existing.projectId,
        },
      },
    });

    return res.json(briefFromDb(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Brief not found" });
    }
    return res.status(500).json({ error: message });
  }
});

projectBriefsRouter.delete("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing brief id" });

    await prisma.projectBrief.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Brief not found" });
    }
    return res.status(500).json({ error: message });
  }
});

