import type { ProjectBriefInput } from "@/types/projectBrief";

/** Flat shape aligned with the core brief fields (export / GPT layer). */
export type BriefFormExportInput = {
  projectType: string;
  businessName: string;
  goal: string;
  mainAction: string;

  audienceType: string;
  audienceIdeal: string;
  audiencePain: string;
  differentiation: string;

  servicesDescription: string;
  mainService: string;

  pagesCount: string;
  pageList: string;
  siteEmphasis: string;

  tone: string[];
  languageStyle: string[];
  linguisticAddressing: string;
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
    idealClient: string;
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
    emphasis: string;
  };
  toneAndLanguage: {
    tone: string[];
    languageStyle: string[];
    addressing: string;
  };
  guidelines: {
    avoid: string;
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

export function projectBriefInputToBriefFormExport(
  input: ProjectBriefInput,
): BriefFormExportInput {
  return {
    projectType: input.websiteType,
    businessName: input.businessNameSnapshot,
    goal: input.sitePrimaryBusinessGoal,
    mainAction: input.mainUserAction,

    audienceType: input.targetAudience,
    audienceIdeal: input.idealClient,
    audiencePain: input.audiencePainPoints,
    differentiation: input.differentiators,

    servicesDescription: input.businessWhatTheyDo,
    mainService: input.servicesProductsOnSite,

    pagesCount: String(parsePagesCountFromStructure(input.sitePagesAndStructure) ?? ""),
    pageList: input.sitePagesAndStructure,
    siteEmphasis: input.siteEmphasis,

    tone: input.toneSelections,
    languageStyle: input.languageStyleSelections,
    linguisticAddressing: input.linguisticAddressing,
  };
}

export function generateBriefJSON(input: ProjectBriefInput): NormalizedBriefJSON {
  const pages = parsePageListString(input.sitePagesAndStructure);
  const allowAI = pages.length === 0;
  const notes = normalizedFreeNotes(input);

  return {
    project: {
      type: trimStr(input.websiteType),
      businessName: trimStr(input.businessNameSnapshot),
      goal: trimStr(input.sitePrimaryBusinessGoal),
      mainAction: trimStr(input.mainUserAction),
    },
    audience: {
      type: trimStr(input.targetAudience),
      idealClient: trimStr(input.idealClient),
      pain: trimStr(input.audiencePainPoints),
      differentiation: trimStr(input.differentiators),
    },
    services: {
      offerDescription: trimStr(input.businessWhatTheyDo),
      main: trimStr(input.servicesProductsOnSite),
    },
    structure: {
      pagesCount: parsePagesCountFromStructure(input.sitePagesAndStructure),
      pages,
      allowAI,
      emphasis: trimStr(input.siteEmphasis),
    },
    toneAndLanguage: {
      tone: cleanStringArray(input.toneSelections),
      languageStyle: cleanStringArray(input.languageStyleSelections),
      addressing: trimStr(input.linguisticAddressing),
    },
    guidelines: {
      avoid: trimStr(input.contentAvoid),
    },
    notes,
  };
}
