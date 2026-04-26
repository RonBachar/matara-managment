import { prisma } from "../../../db/prisma";
import {
  buildNormalizedProjectBrief,
  type NormalizedProjectBrief,
} from "../buildNormalizedProjectBrief";
import type { Gpt1SitemapWireframeResult } from "../gpt1/generateSitemapWireframe";

export type Gpt2Input = {
  briefId: string;
  normalizedBrief: NormalizedProjectBrief;
  gpt1: Gpt1SitemapWireframeResult;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function parseGpt1Output(value: unknown): Gpt1SitemapWireframeResult {
  const payload = asRecord(value);
  const sitemapRaw = Array.isArray(payload.sitemap) ? payload.sitemap : [];
  const wireframeRaw = Array.isArray(payload.wireframe) ? payload.wireframe : [];

  const sitemap = sitemapRaw
    .map((entry) => {
      const row = asRecord(entry);
      return {
        pageName: readString(row.pageName),
        pageType: readString(row.pageType) as Gpt1SitemapWireframeResult["sitemap"][number]["pageType"],
        purpose: readString(row.purpose),
        isPrimary: readBoolean(row.isPrimary),
      };
    })
    .filter((entry) => entry.pageName && entry.pageType && entry.purpose);

  const wireframe = wireframeRaw
    .map((entry) => {
      const row = asRecord(entry);
      const sectionsRaw = Array.isArray(row.sections) ? row.sections : [];

      return {
        pageName: readString(row.pageName),
        pageGoal: readString(row.pageGoal),
        sections: sectionsRaw
          .map((section) => {
            const item = asRecord(section);
            return {
              sectionName: readString(item.sectionName),
              sectionPurpose: readString(item.sectionPurpose),
              sectionGoal: readString(item.sectionGoal),
              keyPoints: readStringArray(item.keyPoints),
            };
          })
          .filter(
            (section) =>
              section.sectionName &&
              section.sectionPurpose &&
              section.sectionGoal &&
              section.keyPoints.length > 0,
          ),
      };
    })
    .filter((entry) => entry.pageName && entry.pageGoal && entry.sections.length > 0);

  const parsed: Gpt1SitemapWireframeResult = {
    provider: "openai",
    model: readString(payload.model),
    generatedAt: readString(payload.generatedAt),
    summary: readString(payload.summary),
    sitemap,
    wireframe,
    notes: readString(payload.notes),
  };

  if (!parsed.summary || parsed.sitemap.length === 0 || parsed.wireframe.length === 0) {
    throw new Error("GPT 1 outputJson is missing or invalid");
  }

  return parsed;
}

export async function buildGpt2Input(briefId: string): Promise<Gpt2Input> {
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

  const latestSuccessfulGpt1Run = await prisma.pipelineRun.findFirst({
    where: {
      briefId: brief.id,
      status: "COMPLETED",
      steps: {
        some: {
          stepKey: "gpt1-sitemap-wireframe",
          status: "COMPLETED",
        },
      },
    },
    include: {
      steps: {
        where: {
          stepKey: "gpt1-sitemap-wireframe",
          status: "COMPLETED",
        },
        orderBy: { stepOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestSuccessfulGpt1Run) {
    throw new Error("GPT 1 must be run first before GPT 2");
  }

  const gpt1Step = latestSuccessfulGpt1Run.steps[0];
  if (!gpt1Step?.outputJson) {
    throw new Error("GPT 1 outputJson is missing or invalid");
  }

  const gpt1 = parseGpt1Output(gpt1Step.outputJson);

  return {
    briefId: brief.id,
    normalizedBrief,
    gpt1,
  };
}
