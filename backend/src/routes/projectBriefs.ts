import { Router } from "express";
import { prisma } from "../db/prisma";
import { readOptionalString, asRecord } from "../utils/validation";

export const projectBriefsRouter = Router();

function briefFromDb(row: {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  data: unknown;
}) {
  const data = asRecord(row.data) ?? {};
  return {
    ...data,
    id: row.id,
    title: row.title,
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
    const data = asRecord(body.data) ?? asRecord(body.brief) ?? asRecord(body);
    if (!data) {
      return res.status(400).json({ error: "Invalid body. Expected brief object payload" });
    }

    const title = readOptionalString(body.title) ?? readOptionalString(data.title) ?? "";
    const payload = { ...data, title };

    const created = await prisma.projectBrief.create({
      data: {
        title,
        data: payload,
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

    const title =
      readOptionalString(body.title) ??
      readOptionalString(data.title) ??
      existing.title;

    const updated = await prisma.projectBrief.update({
      where: { id },
      data: {
        title,
        data: {
          ...(asRecord(existing.data) ?? {}),
          ...data,
          title,
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

