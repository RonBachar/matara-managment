import { prisma } from "../../../db/prisma";
import {
  buildNormalizedProjectBrief,
  type NormalizedProjectBrief,
} from "../buildNormalizedProjectBrief";
import type { Gpt1PageType, Gpt1SitemapWireframeResult } from "../gpt1/generateSitemapWireframe";
import type { Gpt2WebsiteCopyResult } from "../gpt2/generateSectionCopy";

export type Gpt3Input = {
  briefId: string;
  normalizedBrief: NormalizedProjectBrief;
  gpt1: Gpt1SitemapWireframeResult;
  gpt2: Gpt2WebsiteCopyResult;
  renderingSystem: "matara-wireframe-system";
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
        pageType: readString(row.pageType) as Gpt1PageType,
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

function parseGpt2Output(value: unknown): Gpt2WebsiteCopyResult {
  const payload = asRecord(value);
  const pagesRaw = Array.isArray(payload.pages) ? payload.pages : [];

  const pages = pagesRaw
    .map((page) => {
      const row = asRecord(page);
      const sectionsRaw = Array.isArray(row.sections) ? row.sections : [];

      return {
        pageName: readString(row.pageName),
        pageTitle: readString(row.pageTitle),
        pageGoal: readString(row.pageGoal),
        sections: sectionsRaw
          .map((section) => {
            const item = asRecord(section);
            const content = asRecord(item.content);
            return {
              sectionName: readString(item.sectionName),
              sectionPurpose: readString(item.sectionPurpose),
              content: {
                headline: readString(content.headline),
                subheadline: readString(content.subheadline),
                body: readStringArray(content.body),
                bullets: readStringArray(content.bullets),
                ctaPrimary: readString(content.ctaPrimary),
                ctaSecondary: readString(content.ctaSecondary),
                microcopy: readStringArray(content.microcopy),
              },
            };
          })
          .filter((section) => section.sectionName && section.sectionPurpose),
      };
    })
    .filter((page) => page.pageName && page.pageTitle && page.pageGoal && page.sections.length > 0);

  const parsed: Gpt2WebsiteCopyResult = {
    provider: "gemini",
    model: readString(payload.model),
    generatedAt: readString(payload.generatedAt),
    summary: readString(payload.summary),
    pages,
    notes: readString(payload.notes),
  };

  if (!parsed.summary || parsed.pages.length === 0) {
    throw new Error("GPT 2 outputJson is missing or invalid");
  }

  return parsed;
}

function validateLightweightStructure(
  gpt1: Gpt1SitemapWireframeResult,
  gpt2: Gpt2WebsiteCopyResult,
): void {
  if (gpt1.wireframe.length === 0) {
    throw new Error("GPT 1 outputJson is missing or invalid");
  }

  if (gpt2.pages.length === 0) {
    throw new Error("GPT 2 outputJson is missing or invalid");
  }

  const gpt1HasSections = gpt1.wireframe.some((page) => page.sections.length > 0);
  const gpt2HasSections = gpt2.pages.some((page) => page.sections.length > 0);

  if (!gpt1HasSections || !gpt2HasSections) {
    throw new Error("GPT 3 requires GPT 1 and GPT 2 to contain page sections");
  }
}

export async function buildGpt3Input(
  briefId: string,
  userId: string,
): Promise<Gpt3Input> {
  const brief = await prisma.projectBrief.findFirst({
    where: { id: briefId, userId },
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
      brief: { userId },
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
    throw new Error("GPT 1 must be run first before GPT 3");
  }

  const latestSuccessfulGpt2Run = await prisma.pipelineRun.findFirst({
    where: {
      briefId: brief.id,
      brief: { userId },
      status: "COMPLETED",
      steps: {
        some: {
          stepKey: "gpt2-section-content",
          status: "COMPLETED",
        },
      },
    },
    include: {
      steps: {
        where: {
          stepKey: "gpt2-section-content",
          status: "COMPLETED",
        },
        orderBy: { stepOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestSuccessfulGpt2Run) {
    throw new Error("GPT 2 must be run first before GPT 3");
  }

  const gpt1Step = latestSuccessfulGpt1Run.steps[0];
  const gpt2Step = latestSuccessfulGpt2Run.steps[0];

  if (!gpt1Step?.outputJson) {
    throw new Error("GPT 1 outputJson is missing or invalid");
  }

  if (!gpt2Step?.outputJson) {
    throw new Error("GPT 2 outputJson is missing or invalid");
  }

  const gpt1 = parseGpt1Output(gpt1Step.outputJson);
  const gpt2 = parseGpt2Output(gpt2Step.outputJson);

  validateLightweightStructure(gpt1, gpt2);

  return {
    briefId: brief.id,
    normalizedBrief,
    gpt1,
    gpt2,
    renderingSystem: "matara-wireframe-system",
  };
}
