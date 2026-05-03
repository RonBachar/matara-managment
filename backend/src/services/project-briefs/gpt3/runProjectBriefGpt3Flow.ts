import { PipelineRunStatus, PipelineStepStatus } from "@prisma/client";
import { prisma } from "../../../db/prisma";
import { buildGpt3Input } from "./buildGpt3Input";
import {
  generateWireframeSite,
  type Gpt3WireframeSiteResult,
} from "./generateWireframeSite";

export type ProjectBriefGpt3FlowResponse = {
  briefId: string;
  runId: string;
  stepId: string;
  status: PipelineRunStatus;
  input: Awaited<ReturnType<typeof buildGpt3Input>>;
  output: Gpt3WireframeSiteResult;
};

export async function runProjectBriefGpt3Flow(
  briefId: string,
  userId: string,
): Promise<ProjectBriefGpt3FlowResponse> {
  const input = await buildGpt3Input(briefId, userId);

  const run = await prisma.pipelineRun.create({
    data: {
      briefId: input.briefId,
      status: PipelineRunStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  const step = await prisma.pipelineStep.create({
    data: {
      runId: run.id,
      stepOrder: 0,
      stepKey: "gpt3-wireframe-site",
      status: PipelineStepStatus.RUNNING,
      inputJson: input,
    },
  });

  try {
    const output = await generateWireframeSite(input);
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
      briefId: input.briefId,
      runId: run.id,
      stepId: step.id,
      status: PipelineRunStatus.COMPLETED,
      input,
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
