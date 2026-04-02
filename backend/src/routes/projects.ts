import { Router } from "express";
import { prisma } from "../db/prisma";

export const projectsRouter = Router();

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

projectsRouter.post("/", async (req, res) => {
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
});

projectsRouter.get("/", async (_req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return res.json(projects);
});

