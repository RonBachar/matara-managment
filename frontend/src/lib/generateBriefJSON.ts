import type { ProjectBriefInput } from "@/types/projectBrief";

/** Flat shape aligned with the core brief fields (export / GPT layer). */
export type BriefFormExportInput = {
  projectType: string;
  businessName: string;
  goal: string;
  mainAction: string;

  audienceType: string;
  audiencePain: string;
  differentiation: string;

  servicesDescription: string;
  mainService: string;

  pagesCount: string;
  pageList: string;

  tone: string[];
  languageStyle: string[];
};

export type NormalizedBriefJSON = {
  project: {
    type: string;
    businessName: string;
    goal: string;
    mainAction: string;
  };
  audience: {
    type: string;
    pain: string;
    differentiation: string;
  };
  services: {
    offerDescription: string;
    main: string;
  };
  structure: {
    pagesCount: number | null;
    pages: string[];
    allowAI: boolean;
  };
  toneAndLanguage: {
    tone: string[];
    languageStyle: string[];
  };
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

/** Page names for comparison (strips leading "- " from each segment). */
function pageSegmentsForDedup(raw: string | undefined): string[] {
  return parsePageListString(raw).map((s) =>
    s.replace(/^\s*-\s*/, "").trim(),
  );
}

/**
 * Free notes for normalized JSON: only `contentNotes` (הערות חשובות).
 * If that field duplicates the page list (same text or same pages as `requiredPages`), return "" so `notes` is never a second copy of `structure.pages`.
 */
function normalizedFreeNotes(input: ProjectBriefInput): string {
  const pagesText = trimStr(input.requiredPages);
  const freeText = trimStr(input.contentNotes);
  if (freeText.length === 0) return "";

  if (freeText === pagesText) return "";

  const fromPages = pageSegmentsForDedup(input.requiredPages);
  const fromNotes = pageSegmentsForDedup(input.contentNotes);
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

/**
 * Maps persisted `ProjectBriefInput` to the flat export shape (without normalization).
 */
export function projectBriefInputToBriefFormExport(
  input: ProjectBriefInput,
): BriefFormExportInput {
  const pageListRaw = input.requiredPages;
  const servicesOfferDescription = input.businessDescription;

  return {
    projectType: input.websiteType,
    businessName: input.businessNameSnapshot,
    goal: input.websiteGoal,
    mainAction: input.mainUserAction,

    audienceType: input.targetAudience,
    audiencePain: input.audiencePainPoints,
    differentiation: input.differentiators,

    servicesDescription: servicesOfferDescription,
    mainService: input.mainService,

    pagesCount: input.pageCount,
    pageList: pageListRaw,

    tone: input.toneSelections,
    languageStyle: input.languageStyleSelections,
  };
}

/**
 * Normalizes brief form data into a stable GPT-ready JSON structure.
 * `structure.pages` ← `requiredPages` only. Root `notes` ← `contentNotes` only, unless that field duplicates the page list (then "").
 */
export function generateBriefJSON(input: ProjectBriefInput): NormalizedBriefJSON {
  const pages = parsePageListString(input.requiredPages);
  const allowAI = pages.length === 0;
  const notes = normalizedFreeNotes(input);

  return {
    project: {
      type: trimStr(input.websiteType),
      businessName: trimStr(input.businessNameSnapshot),
      goal: trimStr(input.websiteGoal),
      mainAction: trimStr(input.mainUserAction),
    },
    audience: {
      type: trimStr(input.targetAudience),
      pain: trimStr(input.audiencePainPoints),
      differentiation: trimStr(input.differentiators),
    },
    services: {
      offerDescription: trimStr(input.businessDescription),
      main: trimStr(input.mainService),
    },
    structure: {
      pagesCount: parsePagesCount(input.pageCount),
      pages,
      allowAI,
    },
    toneAndLanguage: {
      tone: cleanStringArray(input.toneSelections),
      languageStyle: cleanStringArray(input.languageStyleSelections),
    },
    notes,
  };
}
