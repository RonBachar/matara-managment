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

type ProjectFinancials = {
  projectType: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  hourlyRate: number;
  workedHours: number;
  billableTotal: number;
};

function clampNonNegative(n: number): number {
  return n < 0 ? 0 : n;
}

function applyBusinessRules(input: ProjectFinancials): ProjectFinancials {
  const paid = clampNonNegative(input.paidAmount);

  // Hourly freelance work
  if (input.projectType === "פרילנסר שעתי") {
    const hourlyRate = clampNonNegative(input.hourlyRate);
    const workedHours = clampNonNegative(input.workedHours);
    const billableTotal = hourlyRate * workedHours;
    const remainingAmount = clampNonNegative(billableTotal - paid);
    return {
      projectType: input.projectType,
      totalAmount: 0,
      paidAmount: paid,
      remainingAmount,
      hourlyRate,
      workedHours,
      billableTotal,
    };
  }

  // Website project + Monthly retainer (same financial structure)
  const totalAmount = clampNonNegative(input.totalAmount);
  const remainingAmount = clampNonNegative(totalAmount - paid);
  return {
    projectType: input.projectType,
    totalAmount,
    paidAmount: paid,
    remainingAmount,
    hourlyRate: 0,
    workedHours: 0,
    billableTotal: 0,
  };
}

projectsRouter.post("/", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const projectName = readNonEmptyString(body.projectName);
    const clientName = readNonEmptyString(body.clientName);
    const clientIdFromBody = readNonEmptyString(body.clientId);
    const projectType = readNonEmptyString(body.projectType);
    const status = readNonEmptyString(body.status);

    if (!projectName || !clientName || !projectType || !status) {
      return res.status(400).json({
        error:
          "Invalid body. Required string fields: projectName, clientName, projectType, status",
      });
    }

    // Client table not migrated yet; accept the frontend id if provided, otherwise fall back.
    const clientId = clientIdFromBody ?? clientName;

    const notes = readOptionalString(body.notes);

    const financials = applyBusinessRules({
      projectType,
      totalAmount: readOptionalNumber(body.totalAmount) ?? 0,
      paidAmount: readOptionalNumber(body.paidAmount) ?? 0,
      remainingAmount: readOptionalNumber(body.remainingAmount) ?? 0,
      hourlyRate: readOptionalNumber(body.hourlyRate) ?? 0,
      workedHours: readOptionalNumber(body.workedHours) ?? 0,
      billableTotal: readOptionalNumber(body.billableTotal) ?? 0,
    });

    const created = await prisma.project.create({
      data: {
        projectName,
        clientName,
        clientId,
        projectType,
        status,
        totalAmount: financials.totalAmount,
        paidAmount: financials.paidAmount,
        remainingAmount: financials.remainingAmount,
        hourlyRate: financials.hourlyRate,
        workedHours: financials.workedHours,
        billableTotal: financials.billableTotal,
        notes: notes && notes.length > 0 ? notes : null,
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
    const requestedType = readOptionalString(body.projectType);
    const wantsProjectType = requestedType !== undefined && requestedType.length > 0;

    const projectName = readOptionalString(body.projectName);
    if (projectName !== undefined && projectName.length > 0) data.projectName = projectName;

    const clientName = readOptionalString(body.clientName);
    if (clientName !== undefined && clientName.length > 0) data.clientName = clientName;

    const clientId = readOptionalString(body.clientId);
    if (clientId !== undefined && clientId.length > 0) data.clientId = clientId;

    if (wantsProjectType) data.projectType = requestedType;

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

    const touchesFinancials =
      wantsProjectType ||
      totalAmount !== undefined ||
      paidAmount !== undefined ||
      remainingAmount !== undefined ||
      hourlyRate !== undefined ||
      workedHours !== undefined ||
      billableTotal !== undefined;

    const updateData = { ...data } as Record<string, unknown>;

    if (touchesFinancials) {
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Project not found" });

      const mergedType = wantsProjectType ? (requestedType as string) : existing.projectType;

      const merged = applyBusinessRules({
        projectType: mergedType,
        totalAmount: totalAmount ?? Number(existing.totalAmount),
        paidAmount: paidAmount ?? Number(existing.paidAmount),
        remainingAmount: remainingAmount ?? Number(existing.remainingAmount),
        hourlyRate: hourlyRate ?? Number(existing.hourlyRate),
        workedHours: workedHours ?? Number(existing.workedHours),
        billableTotal: billableTotal ?? Number(existing.billableTotal),
      });

      updateData.projectType = merged.projectType;
      updateData.totalAmount = merged.totalAmount;
      updateData.paidAmount = merged.paidAmount;
      updateData.remainingAmount = merged.remainingAmount;
      updateData.hourlyRate = merged.hourlyRate;
      updateData.workedHours = merged.workedHours;
      updateData.billableTotal = merged.billableTotal;
    }

    const updated = await prisma.project.update({ where: { id }, data: updateData });

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

