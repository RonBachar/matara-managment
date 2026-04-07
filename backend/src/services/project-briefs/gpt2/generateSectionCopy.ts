import type { Gpt2Input } from "./buildGpt2Input";

export type Gpt2SectionContent = {
  headline: string;
  subheadline: string;
  body: string[];
  bullets: string[];
  ctaPrimary: string;
  ctaSecondary: string;
  microcopy: string[];
};

export type Gpt2PageSection = {
  sectionName: string;
  sectionPurpose: string;
  content: Gpt2SectionContent;
};

export type Gpt2PageContent = {
  pageName: string;
  pageTitle: string;
  pageGoal: string;
  sections: Gpt2PageSection[];
};

export type Gpt2WebsiteCopyResult = {
  provider: "gemini";
  model: string;
  generatedAt: string;
  summary: string;
  pages: Gpt2PageContent[];
  notes: string;
};

type RawGpt2WebsiteCopyResult = {
  summary?: unknown;
  pages?: unknown;
  notes?: unknown;
};

const MODEL = "gemini-2.5-flash";

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in backend/.env");
  }
  return apiKey;
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

function parseResponsePayload(value: unknown): Gpt2WebsiteCopyResult {
  const payload = asRecord(value) as RawGpt2WebsiteCopyResult;
  const pagesRaw = Array.isArray(payload.pages) ? payload.pages : [];

  const pages = pagesRaw
    .map((page) => {
      const pageRow = asRecord(page);
      const sectionsRaw = Array.isArray(pageRow.sections) ? pageRow.sections : [];

      return {
        pageName: readString(pageRow.pageName),
        pageTitle: readString(pageRow.pageTitle),
        pageGoal: readString(pageRow.pageGoal),
        sections: sectionsRaw
          .map((section) => {
            const sectionRow = asRecord(section);
            const contentRow = asRecord(sectionRow.content);

            return {
              sectionName: readString(sectionRow.sectionName),
              sectionPurpose: readString(sectionRow.sectionPurpose),
              content: {
                headline: readString(contentRow.headline),
                subheadline: readString(contentRow.subheadline),
                body: readStringArray(contentRow.body),
                bullets: readStringArray(contentRow.bullets),
                ctaPrimary: readString(contentRow.ctaPrimary),
                ctaSecondary: readString(contentRow.ctaSecondary),
                microcopy: readStringArray(contentRow.microcopy),
              },
            };
          })
          .filter((section) => section.sectionName && section.sectionPurpose),
      };
    })
    .filter((page) => page.pageName && page.pageTitle && page.pageGoal && page.sections.length > 0);

  const result: Gpt2WebsiteCopyResult = {
    provider: "gemini",
    model: MODEL,
    generatedAt: new Date().toISOString(),
    summary: readString(payload.summary),
    pages,
    notes: readString(payload.notes),
  };

  if (!result.summary || result.pages.length === 0) {
    throw new Error("Gemini returned an incomplete GPT 2 result");
  }

  return result;
}

function buildPrompt(input: Gpt2Input): string {
  return [
    "You are GPT 2 for Matara Managment.",
    "Your job is to write practical website copy for each page and section.",
    "Use the normalized brief as business context.",
    "Use GPT 1 output as the required structure and source of truth.",
    "Respect audience, tone, language style, business goal, and constraints.",
    "Do not create new pages unless strictly required by GPT 1 structure.",
    "Do not create random sections.",
    "Fill only content fields that make sense for each section.",
    "Keep the copy concise, conversion-aware, and practical.",
    "Return structured JSON matching the required schema only.",
    "Do not output HTML, CSS, JavaScript, implementation instructions, or visual design specs.",
    "",
    "Normalized brief JSON:",
    JSON.stringify(input.normalizedBrief, null, 2),
    "",
    "GPT 1 structure JSON:",
    JSON.stringify(input.gpt1, null, 2),
  ].join("\n");
}

export async function generateSectionCopy(
  input: Gpt2Input,
): Promise<Gpt2WebsiteCopyResult> {
  try {
    const apiKey = getGeminiApiKey();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildPrompt(input) }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              additionalProperties: false,
              required: ["summary", "pages", "notes"],
              properties: {
                summary: { type: "string" },
                pages: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["pageName", "pageTitle", "pageGoal", "sections"],
                    properties: {
                      pageName: { type: "string" },
                      pageTitle: { type: "string" },
                      pageGoal: { type: "string" },
                      sections: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          required: ["sectionName", "sectionPurpose", "content"],
                          properties: {
                            sectionName: { type: "string" },
                            sectionPurpose: { type: "string" },
                            content: {
                              type: "object",
                              additionalProperties: false,
                              required: [
                                "headline",
                                "subheadline",
                                "body",
                                "bullets",
                                "ctaPrimary",
                                "ctaSecondary",
                                "microcopy",
                              ],
                              properties: {
                                headline: { type: "string" },
                                subheadline: { type: "string" },
                                body: {
                                  type: "array",
                                  items: { type: "string" },
                                },
                                bullets: {
                                  type: "array",
                                  items: { type: "string" },
                                },
                                ctaPrimary: { type: "string" },
                                ctaSecondary: { type: "string" },
                                microcopy: {
                                  type: "array",
                                  items: { type: "string" },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                notes: { type: "string" },
              },
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(errorText || `Gemini HTTP ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const candidates = Array.isArray(data.candidates) ? data.candidates : [];
    const firstCandidate = asRecord(candidates[0]);
    const content = asRecord(firstCandidate.content);
    const parts = Array.isArray(content.parts) ? content.parts : [];
    const firstPart = asRecord(parts[0]);
    const text = readString(firstPart.text);

    if (!text) {
      throw new Error("Gemini returned empty content");
    }

    return parseResponsePayload(JSON.parse(text));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Gemini GPT 2 generation failed: ${message}`);
  }
}
