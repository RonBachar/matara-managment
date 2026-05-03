import { PipelineRunStatus, PipelineStepStatus } from "@prisma/client";
import { prisma } from "../../../db/prisma";
import { buildGpt2Input } from "./buildGpt2Input";
import {
  generateSectionCopy,
  type Gpt2WebsiteCopyResult,
} from "./generateSectionCopy";

export type ProjectBriefGpt2FlowResponse = {
  briefId: string;
  runId: string;
  stepId: string;
  status: PipelineRunStatus;
  input: Awaited<ReturnType<typeof buildGpt2Input>>;
  output: Gpt2WebsiteCopyResult;
};

export async function runProjectBriefGpt2Flow(
  briefId: string,
  userId: string,
): Promise<ProjectBriefGpt2FlowResponse> {
  const input = await buildGpt2Input(briefId, userId);

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
      stepKey: "gpt2-section-content",
      status: PipelineStepStatus.RUNNING,
      inputJson: input,
    },
  });

  try {
    const output = await generateSectionCopy(input);
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
