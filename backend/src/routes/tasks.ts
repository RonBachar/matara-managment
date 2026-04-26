import { Router } from "express";
import { prisma } from "../db/prisma";
import { readNonEmptyString, readOptionalString } from "../utils/validation";

export const tasksRouter = Router();

tasksRouter.get("/", async (_req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: [{ createdAt: "asc" }],
    });
    return res.json(tasks);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

tasksRouter.post("/", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const title = readNonEmptyString(body.title);
    if (!title) return res.status(400).json({ error: "title is required" });

    const description = readOptionalString(body.description);
    const status = readOptionalString(body.status) ?? "לביצוע";
    const priority = readOptionalString(body.priority) ?? "בינונית";

    const created = await prisma.task.create({
      data: {
        title,
        description: description && description.length > 0 ? description : null,
        status: status.length > 0 ? status : "לביצוע",
        priority: priority.length > 0 ? priority : "בינונית",
      },
    });

    return res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

tasksRouter.patch("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing task id" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    const title = readOptionalString(body.title);
    if (title !== undefined && title.length > 0) data.title = title;

    const description = readOptionalString(body.description);
    if (description !== undefined) data.description = description.length > 0 ? description : null;
    if (body.description === null) data.description = null;

    const status = readOptionalString(body.status);
    if (status !== undefined) data.status = status.length > 0 ? status : "לביצוע";

    const priority = readOptionalString(body.priority);
    if (priority !== undefined) data.priority = priority.length > 0 ? priority : "בינונית";

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updated = await prisma.task.update({ where: { id }, data });
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Task not found" });
    }
    return res.status(500).json({ error: message });
  }
});

tasksRouter.delete("/:id", async (req, res) => {
  try {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ error: "Missing task id" });

    await prisma.task.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("record") && message.toLowerCase().includes("not")) {
      return res.status(404).json({ error: "Task not found" });
    }
    return res.status(500).json({ error: message });
  }
});
