import OpenAI from "openai";
import type { NormalizedProjectBrief } from "../buildNormalizedProjectBrief";

export type Gpt1SitemapWireframeResult = {
  provider: "openai";
  model: string;
  generatedAt: string;
  summary: string;
  sitemap: Array<{
    pageName: string;
    purpose: string;
  }>;
  wireframe: Array<{
    pageName: string;
    sections: string[];
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

function parseSitemapEntries(value: unknown): Array<{ pageName: string; purpose: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      const row = asRecord(entry);
      return {
        pageName: readString(row.pageName),
        purpose: readString(row.purpose),
      };
    })
    .filter((entry) => entry.pageName && entry.purpose);
}

function parseWireframeEntries(value: unknown): Array<{ pageName: string; sections: string[] }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      const row = asRecord(entry);
      return {
        pageName: readString(row.pageName),
        sections: readStringArray(row.sections),
      };
    })
    .filter((entry) => entry.pageName && entry.sections.length > 0);
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
    "Your task is to create a practical sitemap and simple wireframe plan from a saved project brief.",
    "Return only structured JSON that matches the required schema.",
    "Keep the result concise, practical, and aligned with the brief.",
    "Do not mention GPT 2, HTML generation, deployment, or implementation code.",
    "If the brief is incomplete, make reasonable minimal assumptions and note them briefly in notes.",
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
              text: "You generate sitemap and wireframe planning output for internal project briefs.",
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
                  required: ["pageName", "purpose"],
                  properties: {
                    pageName: { type: "string" },
                    purpose: { type: "string" },
                  },
                },
              },
              wireframe: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["pageName", "sections"],
                  properties: {
                    pageName: { type: "string" },
                    sections: {
                      type: "array",
                      items: { type: "string" },
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
