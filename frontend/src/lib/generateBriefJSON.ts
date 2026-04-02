import type { ProjectBriefInput } from "@/types/projectBrief";

/**
 * GPT-oriented brief: mirrors the five questionnaire sections
 * (פרטי העסק · קהל ומטרה · מבנה האתר · שפה וניסוח · הנחיות נוספות)
 * without rewriting user content.
 */
export type NormalizedBriefJSON = {
  business: {
    businessName: string;
    whatTheyDo: string;
    servicesOrProductsOnSite: string;
    differentiation: string;
  };
  audience: {
    targetAudience: string;
    idealCustomer: string;
    mainPainOrNeed: string;
  };
  goals: {
    siteGoal: string;
    mainCallToAction: string;
  };
  structure: {
    websiteType: string;
    /** Heuristic from the first line of the מבנה field (may be null). */
    pageCount: number | null;
    /** Parsed page names/lines (empty if none extracted). */
    pages: string[];
    /**
     * When true, no discrete page list was parsed — AI may propose pages,
     * still respecting pageCount, structureFieldAsProvided, and notes.
     */
    allowAiStructure: boolean;
    /** Verbatim trimmed text from "עמודים ומבנה" (user wording preserved). */
    structureFieldAsProvided: string;
    whatToEmphasizeOnTheSite: string;
  };
  toneAndLanguage: {
    tone: string[];
    languageStyle: string[];
    linguisticAddressing: string;
  };
  constraints: {
    whatToAvoid: string;
  };
  /** הערות / דוגמאות / השראות (deduped from the מבנה field when identical). */
  notes: string;
};

function trimStr(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: string[] | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

/** Splits `pageList` on newlines and on middle-dot (·) segments; trims; drops empties. */
export function parsePageListString(raw: string | undefined): string[] {
  const trimmed = trimStr(raw);
  if (!trimmed) return [];
  return trimmed
    .split(/\r?\n/)
    .flatMap((line) => line.split("·"))
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

/** `pagesCount` as number, or `null` if empty / not a finite number. */
export function parsePagesCount(raw: string | undefined): number | null {
  const t = trimStr(raw);
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** First line that looks like a standalone page count (legacy + combined field). */
function parsePagesCountFromStructure(raw: string | undefined): number | null {
  const t = trimStr(raw);
  if (!t) return null;
  const firstLine = t.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const line = firstLine.trim();
  const onlyNum = Number(line);
  if (Number.isFinite(onlyNum)) return onlyNum;
  const m = line.match(/^(\d{1,3})\s*[-–]?\s*(?:עמודים|דפים|עמ׳)?/i);
  if (m) return Number(m[1]);
  return null;
}

function pageSegmentsForDedup(raw: string | undefined): string[] {
  return parsePageListString(raw).map((s) =>
    s.replace(/^\s*-\s*/, "").trim(),
  );
}

/**
 * Root `notes` ← `additionalNotes`, unless it duplicates the page list text.
 */
function normalizedFreeNotes(input: ProjectBriefInput): string {
  const pagesText = trimStr(input.sitePagesAndStructure);
  const freeText = trimStr(input.additionalNotes);
  if (freeText.length === 0) return "";

  if (freeText === pagesText) return "";

  const fromPages = pageSegmentsForDedup(input.sitePagesAndStructure);
  const fromNotes = pageSegmentsForDedup(input.additionalNotes);
  if (
    fromPages.length > 0 &&
    fromNotes.length > 0 &&
    fromPages.length === fromNotes.length &&
    fromPages.every((p, i) => p === fromNotes[i])
  ) {
    return "";
  }

  return freeText;
}

export function generateBriefJSON(input: ProjectBriefInput): NormalizedBriefJSON {
  const structureFieldAsProvided = trimStr(input.sitePagesAndStructure);
  const pages = parsePageListString(input.sitePagesAndStructure);
  const allowAiStructure = pages.length === 0;
  const notes = normalizedFreeNotes(input);

  return {
    business: {
      businessName: trimStr(input.businessNameSnapshot),
      whatTheyDo: trimStr(input.businessWhatTheyDo),
      servicesOrProductsOnSite: trimStr(input.servicesProductsOnSite),
      differentiation: trimStr(input.differentiators),
    },
    audience: {
      targetAudience: trimStr(input.targetAudience),
      idealCustomer: trimStr(input.idealClient),
      mainPainOrNeed: trimStr(input.audiencePainPoints),
    },
    goals: {
      siteGoal: trimStr(input.sitePrimaryBusinessGoal),
      mainCallToAction: trimStr(input.mainUserAction),
    },
    structure: {
      websiteType: trimStr(input.websiteType),
      pageCount: parsePagesCountFromStructure(input.sitePagesAndStructure),
      pages,
      allowAiStructure,
      structureFieldAsProvided,
      whatToEmphasizeOnTheSite: trimStr(input.siteEmphasis),
    },
    toneAndLanguage: {
      tone: cleanStringArray(input.toneSelections),
      languageStyle: cleanStringArray(input.languageStyleSelections),
      linguisticAddressing: trimStr(input.linguisticAddressing),
    },
    constraints: {
      whatToAvoid: trimStr(input.contentAvoid),
    },
    notes,
  };
}
