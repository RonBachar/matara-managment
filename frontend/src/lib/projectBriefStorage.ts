import type { Project } from "@/types/project";
import type { ProjectBrief } from "@/types/projectBrief";
import { WEBSITE_GOAL_OPTIONS } from "@/types/projectBrief";
import { loadProjectsFromStorage } from "@/lib/projectsStorage";

export const BRIEFS_STORAGE_KEY = "matara_project_briefs";

/** Same-tab listeners (e.g. Projects page) — localStorage does not fire storage in-tab. */
export const BRIEFS_CHANGED_EVENT = "matara-briefs-changed";

export function notifyBriefsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BRIEFS_CHANGED_EVENT));
}

function ensureString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function migrateSitePrimaryBusinessGoal(raw: Record<string, unknown>): string {
  const direct = ensureString(raw.sitePrimaryBusinessGoal);
  if (direct) return direct;
  const wg = ensureString(raw.websiteGoal);
  const pg = ensureString(raw.projectGoal);
  if (wg) return wg;
  if (pg && (WEBSITE_GOAL_OPTIONS as readonly string[]).includes(pg)) return pg;
  return pg;
}

function combineLegacySiteStructure(raw: Record<string, unknown>): string {
  const direct = ensureString(raw.sitePagesAndStructure);
  if (direct) return direct;
  const pageListAiSuggested = raw.pageListAiSuggested === true;
  const pageCount = ensureString(raw.pageCount);
  const requiredPages = ensureString(raw.requiredPages);
  if (pageListAiSuggested) {
    const parts: string[] = [];
    if (pageCount) parts.push(`מספר עמודים (הערכה): ${pageCount}`);
    parts.push("תן ל-AI להציע רשימת עמודים");
    return parts.join("\n");
  }
  const parts: string[] = [];
  if (pageCount) parts.push(`מספר עמודים: ${pageCount}`);
  if (requiredPages) parts.push(`רשימת עמודים:\n${requiredPages}`);
  return parts.join("\n\n");
}

function mergeLegacyAdditionalNotes(raw: Record<string, unknown>): string {
  const direct = ensureString(raw.additionalNotes);
  if (direct) return direct;
  const chunks = [
    ensureString(raw.contentNotes),
    ensureString(raw.existingContentNotes),
    ensureString(raw.visualFeeling),
    ensureString(raw.likedReferences),
    ensureString(raw.dislikedReferences),
    ensureString(raw.designStyleNotes),
    ensureString(raw.designNotes),
    ensureString(raw.strategicDecisions),
    ensureString(raw.uxNotes),
    ensureString(raw.repeatedCustomerQuestions),
    ensureString(raw.keyMessages),
    ensureString(raw.mustHaveSections),
    ensureString(raw.keyInfoAboveTheFold),
    ensureString(raw.lockedFixedInput),
    ensureString(raw.sourceMaterials),
    ensureString(raw.preferredColors),
    ensureString(raw.unwantedColors),
  ].filter((s) => s.trim().length > 0);
  return chunks.join("\n\n---\n\n");
}

/** Raw localStorage row → typed brief (migrates legacy field names). */
export function normalizeBriefRow(raw: Record<string, unknown>): ProjectBrief {
  const nowIso = new Date().toISOString();
  const legacyProjectName = ensureString(raw.projectNameSnapshot);
  const briefTitle = ensureString(raw.briefTitle) || legacyProjectName || "";

  const businessWhatTheyDo =
    ensureString(raw.businessWhatTheyDo) ||
    ensureString(raw.businessDescription);
  const servicesProductsOnSite =
    ensureString(raw.servicesProductsOnSite) || ensureString(raw.mainService);

  const idealClient =
    ensureString(raw.idealClient) || ensureString(raw.keyMessages);

  const siteEmphasis =
    ensureString(raw.siteEmphasis) ||
    ensureString(raw.keyInfoAboveTheFold) ||
    ensureString(raw.mustHaveSections);

  const contentAvoid =
    ensureString(raw.contentAvoid) || ensureString(raw.forbiddenPhrases);

  return {
    id: ensureString(raw.id) || String(Date.now()),
    projectId: ensureString(raw.projectId),
    clientId: ensureString(raw.clientId),
    briefTitle,
    businessNameSnapshot: ensureString(raw.businessNameSnapshot),
    clientNameSnapshot: ensureString(raw.clientNameSnapshot),
    projectNameSnapshot:
      typeof raw.projectNameSnapshot === "string" &&
      raw.projectNameSnapshot.trim()
        ? raw.projectNameSnapshot.trim()
        : undefined,
    createdAt: ensureString(raw.createdAt) || nowIso,
    updatedAt:
      ensureString(raw.updatedAt) || ensureString(raw.createdAt) || nowIso,

    businessWhatTheyDo,
    servicesProductsOnSite,
    differentiators: ensureString(raw.differentiators),

    targetAudience: ensureString(raw.targetAudience),
    idealClient,
    audiencePainPoints: ensureString(raw.audiencePainPoints),
    sitePrimaryBusinessGoal: migrateSitePrimaryBusinessGoal(raw),
    mainUserAction: ensureString(raw.mainUserAction),

    websiteType: ensureString(raw.websiteType),
    sitePagesAndStructure: combineLegacySiteStructure(raw),
    siteEmphasis,

    toneSelections: ensureStringArray(raw.toneSelections),
    languageStyleSelections: ensureStringArray(raw.languageStyleSelections),
    linguisticAddressing: ensureString(raw.linguisticAddressing),

    contentAvoid,
    additionalNotes: mergeLegacyAdditionalNotes(raw),

    gpt1Output:
      typeof raw.gpt1Output === "string" ? String(raw.gpt1Output) : undefined,
    gpt2Output:
      typeof raw.gpt2Output === "string" ? String(raw.gpt2Output) : undefined,
    gpt3Output:
      typeof raw.gpt3Output === "string" ? String(raw.gpt3Output) : undefined,
  };
}

function attachProjectIdsFromSnapshots(
  brief: ProjectBrief,
  projects: Project[],
): ProjectBrief {
  let projectId = brief.projectId.trim();
  let clientId = brief.clientId.trim();

  if (!projectId) {
    const pname = (
      brief.projectNameSnapshot ||
      brief.briefTitle ||
      ""
    ).trim();
    const cname = brief.clientNameSnapshot.trim();
    const match = projects.find(
      (p) =>
        p.projectName.trim() === pname &&
        (!cname || p.clientName.trim() === cname),
    );
    if (match) {
      projectId = match.id;
      clientId = match.clientId;
    } else {
      projectId = `legacy-${brief.id}`;
      if (!clientId && cname) clientId = "";
    }
  }

  return {
    ...brief,
    projectId,
    clientId,
    projectNameSnapshot:
      brief.projectNameSnapshot?.trim() || brief.briefTitle.trim() || undefined,
  };
}

function dedupeByProjectId(briefs: ProjectBrief[]): ProjectBrief[] {
  const map = new Map<string, ProjectBrief>();
  for (const b of briefs) {
    const cur = map.get(b.projectId);
    if (
      !cur ||
      new Date(b.updatedAt).getTime() > new Date(cur.updatedAt).getTime()
    ) {
      map.set(b.projectId, b);
    }
  }
  return [...map.values()];
}

export function migrateBriefsWithProjects(
  briefs: ProjectBrief[],
  projects: Project[],
): ProjectBrief[] {
  const attached = briefs.map((b) => attachProjectIdsFromSnapshots(b, projects));
  return dedupeByProjectId(attached);
}

export function loadProjectBriefs(): ProjectBrief[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(BRIEFS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const projects = loadProjectsFromStorage();
    const normalized = parsed.map((row) =>
      normalizeBriefRow(row as Record<string, unknown>),
    );
    return migrateBriefsWithProjects(normalized, projects);
  } catch {
    return [];
  }
}

export function getProjectIdsWithBriefs(): Set<string> {
  return new Set(loadProjectBriefs().map((b) => b.projectId));
}

/** Resolve a `Project` row for the editor when the project still exists, or a minimal stub if removed. */
export function projectForBriefEditor(
  brief: ProjectBrief,
  projects: Project[],
): Project {
  const found = projects.find((p) => p.id === brief.projectId);
  if (found) return found;
  return {
    id: brief.projectId,
    projectName: brief.projectNameSnapshot || brief.briefTitle || "פרויקט",
    clientId: brief.clientId,
    clientName: brief.clientNameSnapshot,
    projectType: "בניית אתר",
    status: "New",
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    hourlyRate: 0,
    workedHours: 0,
    billableTotal: 0,
  };
}
