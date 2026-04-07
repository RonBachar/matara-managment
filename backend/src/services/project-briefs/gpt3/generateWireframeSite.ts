import OpenAI from "openai";
import type { Gpt3Input } from "./buildGpt3Input";

export type Gpt3PageArtifact = {
  pageName: string;
  fileName: string;
  html: string;
};

export type Gpt3WireframeArtifact = {
  type: "static-wireframe-site";
  framework: "html-css-js";
  globalCss: string;
  globalJs: string;
  pages: Gpt3PageArtifact[];
};

export type Gpt3WireframeSiteResult = {
  provider: "openai";
  model: string;
  generatedAt: string;
  summary: string;
  artifact: Gpt3WireframeArtifact;
  notes: string;
};

type RawGpt3WireframeSiteResult = {
  summary?: unknown;
  artifact?: unknown;
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

function parseResponsePayload(value: unknown): Gpt3WireframeSiteResult {
  const payload = asRecord(value) as RawGpt3WireframeSiteResult;
  const artifactRow = asRecord(payload.artifact);
  const pagesRaw = Array.isArray(artifactRow.pages) ? artifactRow.pages : [];

  const pages = pagesRaw
    .map((page) => {
      const row = asRecord(page);
      return {
        pageName: readString(row.pageName),
        fileName: readString(row.fileName),
        html: readString(row.html),
      };
    })
    .filter((page) => page.pageName && page.fileName && page.html);

  const result: Gpt3WireframeSiteResult = {
    provider: "openai",
    model: MODEL,
    generatedAt: new Date().toISOString(),
    summary: readString(payload.summary),
    artifact: {
      type: "static-wireframe-site",
      framework: "html-css-js",
      globalCss: readString(artifactRow.globalCss),
      globalJs: readString(artifactRow.globalJs),
      pages,
    },
    notes: readString(payload.notes),
  };

  if (
    !result.summary ||
    !result.artifact.globalCss ||
    result.artifact.pages.length === 0
  ) {
    throw new Error("OpenAI returned an incomplete GPT 3 result");
  }

  return result;
}

function buildPrompt(input: Gpt3Input): string {
  return [
    "You are GPT 3 for Matara Managment.",
    "You are a renderer inside the Matara Wireframe System.",
    "Your job is to generate a coded wireframe/prototype site artifact from approved structure and content.",
    "Use GPT 1 as the structure source of truth.",
    "Use GPT 2 as the content source of truth.",
    "Do not invent new pages.",
    "Do not invent new sections.",
    "Do not output a final branded marketing site.",
    "Return structured JSON only.",
    "",
    "Matara Wireframe System rules:",
    "1. Always grayscale only.",
    "2. No brand colors.",
    "3. No rounded corners.",
    "4. No soft shadows.",
    "5. No decorative UI.",
    "6. No polished final design.",
    "7. Hebrew-first.",
    "8. Full RTL.",
    "9. Responsive by default.",
    "10. One fixed header/nav pattern.",
    "11. One fixed button pattern.",
    "12. One fixed section shell pattern.",
    "13. Gray rectangular image placeholders only.",
    "14. GPT 3 is a renderer inside a fixed system, not a creative designer.",
    "15. Keep JS minimal and structural only.",
    "16. Use shared globalCss and shared globalJs for the whole artifact.",
    "",
    "Implementation contract:",
    "- artifact.type must be static-wireframe-site",
    "- artifact.framework must be html-css-js",
    "- pages[].html must contain full page body markup ready to be wrapped in a basic HTML document later",
    "- Use semantic HTML",
    "- Use consistent class naming and repeated structural patterns",
    "- Image areas must be gray labeled placeholders only",
    "",
    "Normalized brief JSON:",
    JSON.stringify(input.normalizedBrief, null, 2),
    "",
    "GPT 1 structure JSON:",
    JSON.stringify(input.gpt1, null, 2),
    "",
    "GPT 2 content JSON:",
    JSON.stringify(input.gpt2, null, 2),
  ].join("\n");
}

export async function generateWireframeSite(
  input: Gpt3Input,
): Promise<Gpt3WireframeSiteResult> {
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
              text: "You generate deterministic grayscale RTL wireframe site artifacts from structured brief, structure, and copy inputs.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildPrompt(input),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "gpt3_wireframe_site_result",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["summary", "artifact", "notes"],
            properties: {
              summary: { type: "string" },
              artifact: {
                type: "object",
                additionalProperties: false,
                required: ["type", "framework", "globalCss", "globalJs", "pages"],
                properties: {
                  type: { type: "string", enum: ["static-wireframe-site"] },
                  framework: { type: "string", enum: ["html-css-js"] },
                  globalCss: { type: "string" },
                  globalJs: { type: "string" },
                  pages: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["pageName", "fileName", "html"],
                      properties: {
                        pageName: { type: "string" },
                        fileName: { type: "string" },
                        html: { type: "string" },
                      },
                    },
                  },
                },
              },
              notes: { type: "string" },
            },
          },
        },
      },
    });

    const payload = response.output_text ? JSON.parse(response.output_text) : null;
    return parseResponsePayload(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`OpenAI GPT 3 generation failed: ${message}`);
  }
}
