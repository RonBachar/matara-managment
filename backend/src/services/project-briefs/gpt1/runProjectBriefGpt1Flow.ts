import { PipelineRunStatus, PipelineStepStatus } from "@prisma/client";
import { prisma } from "../../../db/prisma";
import {
  buildNormalizedProjectBrief,
  type NormalizedProjectBrief,
} from "../buildNormalizedProjectBrief";
import {
  generateSitemapWireframe,
  type Gpt1SitemapWireframeResult,
} from "./generateSitemapWireframe";

export type ProjectBriefGpt1FlowResponse = {
  briefId: string;
  runId: string;
  stepId: string;
  status: PipelineRunStatus;
  normalizedBrief: NormalizedProjectBrief;
  output: Gpt1SitemapWireframeResult;
};

export async function runProjectBriefGpt1Flow(
  briefId: string,
): Promise<ProjectBriefGpt1FlowResponse> {
  const brief = await prisma.projectBrief.findUnique({
    where: { id: briefId },
  });

  if (!brief) {
    throw new Error("Brief not found");
  }

  const normalizedBrief = buildNormalizedProjectBrief({
    briefId: brief.id,
    data: brief.data,
  });

  const run = await prisma.pipelineRun.create({
    data: {
      briefId: brief.id,
      status: PipelineRunStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  const step = await prisma.pipelineStep.create({
    data: {
      runId: run.id,
      stepOrder: 0,
      stepKey: "gpt1-sitemap-wireframe",
      status: PipelineStepStatus.RUNNING,
      inputJson: normalizedBrief,
    },
  });

  try {
    const output = await generateSitemapWireframe(normalizedBrief);
    const finishedAt = new Date();

    await prisma.pipelineStep.update({
      where: { id: step.id },
      data: {
        status: PipelineStepStatus.COMPLETED,
        outputJson: output,
      },
    });

    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: PipelineRunStatus.COMPLETED,
        finishedAt,
      },
    });

    return {
      briefId: brief.id,
      runId: run.id,
      stepId: step.id,
      status: PipelineRunStatus.COMPLETED,
      normalizedBrief,
      output,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const finishedAt = new Date();

    await prisma.pipelineStep.update({
      where: { id: step.id },
      data: {
        status: PipelineStepStatus.FAILED,
        error: message,
      },
    });

    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: PipelineRunStatus.FAILED,
        finishedAt,
        error: message,
      },
    });

    throw err;
  }
}
