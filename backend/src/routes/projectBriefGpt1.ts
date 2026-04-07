import { Router } from "express";
import { prisma } from "../db/prisma";
import { runProjectBriefGpt1Flow } from "../services/project-briefs/gpt1/runProjectBriefGpt1Flow";

export const projectBriefGpt1Router = Router();

projectBriefGpt1Router.get("/:id/gpt1/sitemap-wireframe/runs", async (req, res) => {
  try {
    const briefId = String(req.params.id ?? "").trim();
    if (!briefId) {
      return res.status(400).json({ error: "Missing brief id" });
    }

    const brief = await prisma.projectBrief.findUnique({
      where: { id: briefId },
      select: { id: true },
    });

    if (!brief) {
      return res.status(404).json({ error: "Brief not found" });
    }

    const runs = await prisma.pipelineRun.findMany({
      where: {
        briefId,
        steps: {
          some: { stepKey: "gpt1-sitemap-wireframe" },
        },
      },
      include: {
        steps: {
          where: { stepKey: "gpt1-sitemap-wireframe" },
          orderBy: { stepOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedRuns = runs.map((run) => {
      const step = run.steps[0] ?? null;
      const output =
        step && step.outputJson && typeof step.outputJson === "object" && !Array.isArray(step.outputJson)
          ? (step.outputJson as Record<string, unknown>)
          : null;
      const input =
        step && step.inputJson && typeof step.inputJson === "object" && !Array.isArray(step.inputJson)
          ? (step.inputJson as Record<string, unknown>)
          : null;

      return {
        runId: run.id,
        stepId: step?.id ?? "",
        status: run.status,
        createdAt: run.createdAt.toISOString(),
        finishedAt: run.finishedAt?.toISOString() ?? null,
        model: typeof output?.model === "string" ? output.model : null,
        error: run.error ?? step?.error ?? null,
        normalizedBrief: input,
        output,
      };
    });

    const latestSuccessfulRun =
      mappedRuns.find((run) => run.status === "COMPLETED" && run.output) ?? null;

    return res.json({
      briefId,
      runs: mappedRuns,
      latestSuccessfulRun,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

projectBriefGpt1Router.post("/:id/gpt1/sitemap-wireframe", async (req, res) => {
  try {
    const briefId = String(req.params.id ?? "").trim();
    if (!briefId) {
      return res.status(400).json({ error: "Missing brief id" });
    }

    const result = await runProjectBriefGpt1Flow(briefId);
    return res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("brief not found")) {
      return res.status(404).json({ error: "Brief not found" });
    }
    return res.status(500).json({ error: message });
  }
});
