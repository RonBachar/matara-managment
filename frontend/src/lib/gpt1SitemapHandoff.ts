import type { NormalizedBriefJSON } from "@/lib/generateBriefJSON";
import { GPT1_SITEMAP_PROMPT } from "@/lib/gpt1SitemapPrompt";

/** מחרוזת ייצוא אחת: פרומפט קבוע + JSON מנורמל (מוכן להדבקה ב-GPT). */
export function buildGpt1SitemapFullHandoff(
  normalized: NormalizedBriefJSON,
  prompt: string = GPT1_SITEMAP_PROMPT,
): string {
  const jsonBlock = JSON.stringify(normalized, null, 2);
  return [
    "=== Matara — GPT 1 Sitemap handoff ===",
    "",
    "--- Prompt ---",
    prompt,
    "",
    "--- Normalized brief (JSON) ---",
    jsonBlock,
    "",
  ].join("\n");
}
