import { Router } from "express";
import { prisma } from "../db/prisma";
import type { AuthRequest } from "../middleware/auth";
import { readNonEmptyString, readOptionalString, asRecord } from "../utils/validation";

export const projectBriefsRouter = Router();

function briefFromDb(row: {
  id: string;
  projectId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  data: unknown;
}) {
  const data = asRecord(row.data) ?? {};
  return {
    ...data,
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

projectBriefsRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const rows = await prisma.projectBrief.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(rows.map(briefFromDb));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectBriefsRouter.get("/by-project/:projectId", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const projectId = String(req.params.projectId ?? "").trim();
    if (!projectId) return res.status(400).json({ error: "Missing projectId" });

    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const row = await prisma.projectBrief.findUnique({ where: { projectId } });
    if (!row) return res.status(404).json({ error: "Brief not found" });
    return res.json(briefFromDb(row));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectBriefsRouter.get("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing brief id" });

    const row = await prisma.projectBrief.findFirst({ where: { id, userId } });
    if (!row) return res.status(404).json({ error: "Brief not found" });
    return res.json(briefFromDb(row));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectBriefsRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const projectId = readNonEmptyString(body.projectId);
    const data = asRecord(body.data) ?? asRecord(body.brief) ?? asRecord(body);

    if (!projectId) {
      return res.status(400).json({ error: "Invalid body. Required: projectId" });
    }
    if (!data) {
      return res.status(400).json({ error: "Invalid body. Expected brief object payload" });
    }

    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const existing = await prisma.projectBrief.findUnique({ where: { projectId } });
    if (existing) {
      return res.status(200).json(briefFromDb(existing));
    }

    const title = readOptionalString(data.businessNameSnapshot) ?? "";

    const created = await prisma.projectBrief.create({
      data: {
        userId,
        projectId,
        title,
        data: {
          ...data,
          projectId,
        } as object,
      },
    });

    return res.status(201).json(briefFromDb(created));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectBriefsRouter.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing brief id" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = asRecord(body.data) ?? asRecord(body.brief) ?? asRecord(body);
    if (!data) return res.status(400).json({ error: "Invalid body. Expected brief object" });

    const existing = await prisma.projectBrief.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Brief not found" });

    const title = readOptionalString(data.businessNameSnapshot) ?? existing.title;

    const updated = await prisma.projectBrief.update({
      where: { id },
      data: {
        title,
        data: {
          ...(asRecord(existing.data) ?? {}),
          ...data,
          projectId: existing.projectId,
        } as object,
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

projectBriefsRouter.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing brief id" });

    const existing = await prisma.projectBrief.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: "Brief not found" });

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
