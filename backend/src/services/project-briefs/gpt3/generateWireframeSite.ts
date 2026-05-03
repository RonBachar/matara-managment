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
const REQUIRED_CONTAINER_CLASS = "mws-container";
const REQUIRED_HEADER_CLASS = "mws-header";
const REQUIRED_NAV_CLASS = "mws-nav";
const REQUIRED_MOBILE_TOGGLE_CLASS = "mws-mobile-nav-toggle";
const REQUIRED_PRIMARY_BUTTON_CLASS = "mws-button-primary";
const REQUIRED_SECONDARY_BUTTON_CLASS = "mws-button-secondary";
const REQUIRED_SECTION_CLASS = "mws-section";
const REQUIRED_SECTION_LABEL_CLASS = "mws-section-label";
const REQUIRED_PLACEHOLDER_CLASS = "mws-image-placeholder";
const REQUIRED_FAQ_CLASS = "mws-faq-item";
const REQUIRED_TESTIMONIAL_CLASS = "mws-testimonial-card";
const REQUIRED_FOOTER_CLASS = "mws-footer";
const REQUIRED_PLACEHOLDER_LABEL = "\u05d0\u05d6\u05d5\u05e8 \u05ea\u05de\u05d5\u05e0\u05d4";
const REQUIRED_FOOTER_LINKS = [
  "\u05de\u05d3\u05d9\u05e0\u05d9\u05d5\u05ea \u05e4\u05e8\u05d8\u05d9\u05d5\u05ea",
  "\u05ea\u05e0\u05d0\u05d9\u05dd",
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
  for (const page of result.artifact.pages) {
    if (!page.html) {
      throw new Error("OpenAI returned a GPT 3 page without HTML");
    }
  }

  return result;
}

function buildPrompt(input: Gpt3Input): string {
  return [
    "You are GPT 3 for Matara Managment.",
    "You are a renderer inside the Matara Wireframe System.",
    "Your job is to generate a coded wireframe/prototype site artifact from approved structure and content.",
    "Generate one separate HTML file per page from the sitemap.",
    "Use GPT 1 as the main structure guidance.",
    "Use GPT 2 as the main content guidance.",
    "Do not invent new pages.",
    "Try not to invent new sections unless needed to reconcile small naming drift.",
    "Do not output a final branded marketing site.",
    "Return structured JSON only.",
    "If GPT 1 and GPT 2 page or section names differ slightly, continue with best judgment and map them softly instead of failing.",
    "",
    "Matara Wireframe System rules:",
    "1. Always grayscale only.",
    "2. No brand colors.",
    "3. Minimal border-radius only (4px max) for cards and buttons.",
    "4. No decorative shadows. Subtle border separations only (1px solid #e2e2e2).",
    "5. No decorative UI.",
    "6. No polished final design.",
    "7. Hebrew-first copy and labels by default.",
    "8. Full RTL on every page.",
    "9. Responsive by default.",
    "10. One fixed centered container width across all pages.",
    "11. One fixed header pattern across all pages.",
    `12. Every page must contain exactly one semantic header using <header class="${REQUIRED_HEADER_CLASS}"> as the system header wrapper.`,
    `13. Inside that header, include a site name/logo area, one <nav class="${REQUIRED_NAV_CLASS}"> block, and a primary CTA element whose class list contains "${REQUIRED_PRIMARY_BUTTON_CLASS}".`,
    "14. Mobile nav must always use the same hamburger toggle pattern.",
    "15. One fixed button system across all pages.",
    "16. Primary button must be solid black.",
    "17. Secondary button must be white with black border.",
    "18. One fixed section shell pattern across all pages.",
    "19. Section labels must be visually subtle — small, uppercase, letter-spaced, muted gray text above the section heading. They must NOT be the most prominent element in the section.",
    "20. Gray rectangular image placeholders only.",
    `21. Every placeholder must show the fixed inner Hebrew label '${REQUIRED_PLACEHOLDER_LABEL}'.`,
    "22. If a section structurally requires a visual/media area, the placeholder is mandatory, not optional.",
    "23. Hero may include the standard image placeholder only when logically needed.",
    "24. Testimonials must render as static blocks only. No carousel.",
    "25. FAQ must use one minimal accordion pattern only.",
    "26. Repeated CTA blocks are allowed, but must reuse the same section and button system.",
    "27. Footer must always use one fixed pattern with contact details, privacy policy link, and terms link.",
    "28. Typography must use Noto Sans Hebrew as the primary font stack.",
    "29. Spacing must be balanced and practical, not cramped and not editorial.",
    "30. No inline styles anywhere. All styling must come from globalCss and classes only.",
    "31. Keep JS minimal and structural only.",
    "32. Use shared globalCss and shared globalJs for the whole artifact.",
    "33. GPT 3 is a renderer inside a fixed system, not a creative designer.",
    "34. Follow the Matara Wireframe System strongly, but prioritize producing a usable preview artifact over strict perfection.",
    "",
    "LAYOUT SYSTEM — Required component patterns:",
    "",
    "Every section must use one of these layout patterns based on its content type.",
    "Do not default to plain paragraphs and bullet lists.",
    "",
    "HERO SECTION:",
    "Two columns — left: heading + subtext + CTA buttons.",
    "Right: large gray image placeholder (min-height 320px).",
    "On mobile: single column, image below.",
    "",
    "FEATURE / BENEFIT CARDS:",
    "Always use a 3-column card grid (or 2-column if only 2 items).",
    "Each card must have:",
    "  - A gray square icon placeholder (48x48px)",
    "  - A short bold heading",
    "  - 1-2 lines of supporting text",
    "  - Optional: a small CTA link at the bottom",
    "Cards have a border (1px solid #e2e2e2), padding (24px),",
    "and a very light background (#fafafa).",
    "",
    "PROCESS / STEPS SECTION:",
    "Numbered step boxes in a horizontal row.",
    "Each step has a large bold number, a step title, and 1 line of description.",
    "Connected by a thin horizontal line between them.",
    "",
    "TWO-COLUMN FEATURE ROW:",
    "Left: text content (heading, paragraph, bullet points or CTA).",
    "Right: gray image placeholder.",
    "Alternate direction for each row (text-left/image-right then image-left/text-right).",
    "",
    "STATS / NUMBERS:",
    "Horizontal row of 3-4 stat boxes.",
    "Each box: large bold number, small label below.",
    "Separated by vertical dividers.",
    "",
    "TESTIMONIALS:",
    "3-column card grid.",
    "Each card: quote text, divider, avatar circle placeholder + name + role.",
    "Use the mws-testimonial-card class.",
    "Cards have border and padding. No carousel.",
    "",
    "FAQ:",
    "Clean accordion. One question visible at a time.",
    "Question row has text + chevron icon (use ▾ character).",
    "Answer area slides open below. Use mws-faq-item class.",
    "",
    "CTA SECTION:",
    "Full-width dark background section (#1a1a1a).",
    "Centered: heading + subtext + primary button + optional secondary button.",
    "High contrast — white text on dark background.",
    "",
    "FOOTER:",
    "Two-column layout: left = logo + contact info. Right = link columns.",
    "Bottom bar: copyright + privacy + terms links.",
    "",
    "GENERAL RULES:",
    "- Use CSS Grid for all card grids: display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;",
    "- Use Flexbox for rows and header layouts",
    "- Section backgrounds should alternate: white (#ffffff) and light gray (#f7f7f7)",
    "- All sections must have padding: 80px 0",
    "- Max content width: 1100px, centered with margin: 0 auto",
    "- All component classes must be defined in globalCss",
    "- Never use bare <ul><li> lists for feature or benefit content — always use card grids",
    "",
    "35. index.html must be the main homepage.",
    "36. All other pages must be separate .html files such as about.html, services.html, contact.html, etc.",
    "37. Every HTML file must link shared assets in the head with <link rel=\"stylesheet\" href=\"main.css\">.",
    "38. Every HTML file must link shared JS before </body> with <script src=\"main.js\"></script>.",
    "39. Do not embed CSS or JS inside the HTML files.",
    "40. All CSS must go into artifact.globalCss and all JS must go into artifact.globalJs.",
    "41. The artifact.pages array must contain one entry per page from the sitemap.",
    "42. Generate a proper multi-page website project folder structure.",
    "",
    "Implementation contract:",
    "- artifact.type must be static-wireframe-site",
    "- artifact.framework must be html-css-js",
    "- Return concise structured JSON only",
    "- artifact.pages must contain one entry per sitemap page",
    "- index.html must represent the homepage",
    "- non-home pages must have their own descriptive .html file names",
    "- each pages[].html must be a complete standalone HTML document",
    "- each HTML document must include <link rel=\"stylesheet\" href=\"main.css\"> in the head",
    "- each HTML document must include <script src=\"main.js\"></script> before </body>",
    "- do not place CSS inside the HTML files",
    "- do not place JS inside the HTML files",
    "- Use semantic HTML",
    "- Use the same class names and structural shells across all pages",
    `- Do not invent alternative header class names. The header wrapper must use "${REQUIRED_HEADER_CLASS}" and the header nav must use "${REQUIRED_NAV_CLASS}"`,
    `- Do not invent alternative primary CTA class names in the header. The header CTA must use class "${REQUIRED_PRIMARY_BUTTON_CLASS}"`,
    `- Aim to use these system classes consistently when possible: ${REQUIRED_CONTAINER_CLASS}, ${REQUIRED_HEADER_CLASS}, ${REQUIRED_NAV_CLASS}, ${REQUIRED_MOBILE_TOGGLE_CLASS}, ${REQUIRED_PRIMARY_BUTTON_CLASS}, ${REQUIRED_SECONDARY_BUTTON_CLASS}, ${REQUIRED_SECTION_CLASS}, ${REQUIRED_SECTION_LABEL_CLASS}, ${REQUIRED_PLACEHOLDER_CLASS}, ${REQUIRED_FAQ_CLASS}, ${REQUIRED_TESTIMONIAL_CLASS}, ${REQUIRED_FOOTER_CLASS}`,
    `- Aim to keep the header CTA in the page header and use the placeholder label '${REQUIRED_PLACEHOLDER_LABEL}' when a visual area is genuinely needed`,
    `- Aim to include footer links for '${REQUIRED_FOOTER_LINKS[0]}' and '${REQUIRED_FOOTER_LINKS[1]}'`,
    "- Small naming drift between GPT 1 and GPT 2 should not block generation",
    "- Prefer best-effort mapping over rigid rejection",
    "- Prefer deterministic, reusable markup over project-specific visual variation",
    "- Return all CSS in artifact.globalCss only",
    "- Return all JS in artifact.globalJs only",
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
              text: "You generate structured Hebrew-first RTL wireframe prototypes using a fixed component-based layout system. Every section uses a defined layout pattern: hero, card grid, process steps, two-column row, stats, testimonials, FAQ accordion, or CTA block. You never output plain paragraphs and bullet lists as section content. You always output complete globalCss with all component classes defined. You are a wireframe renderer, not a creative designer.",
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
                    minItems: 1,
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
