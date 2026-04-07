import OpenAI from "openai";
import type { NormalizedProjectBrief } from "../buildNormalizedProjectBrief";

export type Gpt1PageType =
  | "landing-page"
  | "homepage"
  | "service-page"
  | "about-page"
  | "contact-page"
  | "pricing-page"
  | "faq-page"
  | "article-page"
  | "article-list"
  | "custom";

export type Gpt1SitemapWireframeResult = {
  provider: "openai";
  model: string;
  generatedAt: string;
  summary: string;
  sitemap: Array<{
    pageName: string;
    pageType: Gpt1PageType;
    purpose: string;
    isPrimary: boolean;
  }>;
  wireframe: Array<{
    pageName: string;
    pageGoal: string;
    sections: Array<{
      sectionName: string;
      sectionPurpose: string;
      sectionGoal: string;
      keyPoints: string[];
    }>;
  }>;
  notes: string;
};

type RawGpt1SitemapWireframeResult = {
  summary?: unknown;
  sitemap?: unknown;
  wireframe?: unknown;
  notes?: unknown;
};

const MODEL = "gpt-4.1-mini";
const PAGE_TYPES: Gpt1PageType[] = [
  "landing-page",
  "homepage",
  "service-page",
  "about-page",
  "contact-page",
  "pricing-page",
  "faq-page",
  "article-page",
  "article-list",
  "custom",
];

let cachedClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing in backend/.env");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

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

function readPageType(value: unknown): Gpt1PageType | null {
  return typeof value === "string" && PAGE_TYPES.includes(value as Gpt1PageType)
    ? (value as Gpt1PageType)
    : null;
}

function parseSitemapEntries(
  value: unknown,
): Array<{
  pageName: string;
  pageType: Gpt1PageType;
  purpose: string;
  isPrimary: boolean;
}> {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      const row = asRecord(entry);
      return {
        pageName: readString(row.pageName),
        pageType: readPageType(row.pageType),
        purpose: readString(row.purpose),
        isPrimary: readBoolean(row.isPrimary),
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        pageName: string;
        pageType: Gpt1PageType;
        purpose: string;
        isPrimary: boolean;
      } => Boolean(entry.pageName && entry.pageType && entry.purpose),
    );
}

function parseWireframeEntries(
  value: unknown,
): Array<{
  pageName: string;
  pageGoal: string;
  sections: Array<{
    sectionName: string;
    sectionPurpose: string;
    sectionGoal: string;
    keyPoints: string[];
  }>;
}> {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      const row = asRecord(entry);
      const sectionsRaw = Array.isArray(row.sections) ? row.sections : [];

      const sections = sectionsRaw
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
        );

      return {
        pageName: readString(row.pageName),
        pageGoal: readString(row.pageGoal),
        sections,
      };
    })
    .filter((entry) => entry.pageName && entry.pageGoal && entry.sections.length > 0);
}

function parseResponsePayload(value: unknown): Gpt1SitemapWireframeResult {
  const payload = asRecord(value) as RawGpt1SitemapWireframeResult;
  const sitemap = parseSitemapEntries(payload.sitemap);
  const wireframe = parseWireframeEntries(payload.wireframe);
  const summary = readString(payload.summary);
  const notes = readString(payload.notes);

  if (!summary || sitemap.length === 0 || wireframe.length === 0) {
    throw new Error("OpenAI returned an incomplete GPT 1 result");
  }

  return {
    provider: "openai",
    model: MODEL,
    generatedAt: new Date().toISOString(),
    summary,
    sitemap,
    wireframe,
    notes,
  };
}

function buildInstructions(brief: NormalizedProjectBrief): string {
  return [
    "You are GPT 1 for Matara Managment.",
    "Your task is to create a practical sitemap and wireframe plan from a saved project brief.",
    "Return only structured JSON that matches the required schema.",
    "Be concise, practical, and conversion-aware.",
    "Do not write copywriting, HTML, design styling, implementation notes, or GPT 2 planning.",
    "",
    "Product rules:",
    "1. Respect the brief strictly.",
    "2. If the brief says one landing page, do not invent extra pages.",
    "3. Footer is a section, not a page, unless the brief explicitly requires it as a page.",
    "4. Keep the sitemap practical and minimal.",
    "5. Do not add fake or decorative pages.",
    "6. Each page in sitemap must include pageName, pageType, purpose, isPrimary.",
    "7. Each wireframe item must include pageName, pageGoal, sections.",
    "8. Each section must include sectionName, sectionPurpose, sectionGoal, keyPoints.",
    "9. sectionPurpose means why the section exists in the business/marketing logic.",
    "10. sectionGoal means what the user should understand, feel, or do after this section.",
    "11. keyPoints are content directions only, not full copy.",
    "12. Use notes only for brief assumptions or important constraints, and keep notes short.",
    "",
    "Normalized brief JSON:",
    JSON.stringify(brief, null, 2),
  ].join("\n");
}

export async function generateSitemapWireframe(
  brief: NormalizedProjectBrief,
): Promise<Gpt1SitemapWireframeResult> {
  try {
    const client = getOpenAIClient();

    const response = await client.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You generate structured sitemap and wireframe planning output for internal project briefs.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildInstructions(brief),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "gpt1_sitemap_wireframe_result",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["summary", "sitemap", "wireframe", "notes"],
            properties: {
              summary: {
                type: "string",
              },
              sitemap: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["pageName", "pageType", "purpose", "isPrimary"],
                  properties: {
                    pageName: { type: "string" },
                    pageType: {
                      type: "string",
                      enum: PAGE_TYPES,
                    },
                    purpose: { type: "string" },
                    isPrimary: { type: "boolean" },
                  },
                },
              },
              wireframe: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["pageName", "pageGoal", "sections"],
                  properties: {
                    pageName: { type: "string" },
                    pageGoal: { type: "string" },
                    sections: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        required: [
                          "sectionName",
                          "sectionPurpose",
                          "sectionGoal",
                          "keyPoints",
                        ],
                        properties: {
                          sectionName: { type: "string" },
                          sectionPurpose: { type: "string" },
                          sectionGoal: { type: "string" },
                          keyPoints: {
                            type: "array",
                            items: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
              notes: {
                type: "string",
              },
            },
          },
        },
      },
    });

    const payload = response.output_text ? JSON.parse(response.output_text) : null;

    return parseResponsePayload(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`OpenAI GPT 1 generation failed: ${message}`);
  }
}
