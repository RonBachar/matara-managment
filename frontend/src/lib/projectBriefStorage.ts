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

/** Raw localStorage row → typed brief (ids may be empty until migration). */
export function normalizeBriefRow(raw: Record<string, unknown>): ProjectBrief {
  const nowIso = new Date().toISOString();
  const legacyProjectName = ensureString(raw.projectNameSnapshot);
  const briefTitle = ensureString(raw.briefTitle) || legacyProjectName || "";
  const legacyProjectGoal = ensureString(raw.projectGoal);
  let websiteGoal = ensureString(raw.websiteGoal);
  if (
    !websiteGoal &&
    (WEBSITE_GOAL_OPTIONS as readonly string[]).includes(legacyProjectGoal)
  ) {
    websiteGoal = legacyProjectGoal;
  }

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
    websiteType: ensureString(raw.websiteType),
    websiteGoal,
    pageCount: ensureString(raw.pageCount),
    pageListAiSuggested: (() => {
      const v = raw.pageListAiSuggested;
      return typeof v === "boolean" ? v : false;
    })(),
    requiredPages: ensureString(raw.requiredPages),
    strategicDecisions: ensureString(raw.strategicDecisions),
    lockedFixedInput: ensureString(raw.lockedFixedInput),
    sourceMaterials: ensureString(raw.sourceMaterials),
    mainService: ensureString(raw.mainService),
    projectGoal: ensureString(raw.projectGoal),
    targetAudience: ensureString(raw.targetAudience),
    audiencePainPoints: ensureString(raw.audiencePainPoints),
    mainUserAction: ensureString(raw.mainUserAction),
    mustHaveSections: ensureString(raw.mustHaveSections),
    keyInfoAboveTheFold: ensureString(raw.keyInfoAboveTheFold),
    repeatedCustomerQuestions: ensureString(raw.repeatedCustomerQuestions),
    uxNotes: ensureString(raw.uxNotes),
    businessDescription: ensureString(raw.businessDescription),
    differentiators: ensureString(raw.differentiators),
    keyMessages: ensureString(raw.keyMessages),
    forbiddenPhrases: ensureString(raw.forbiddenPhrases),
    existingContentNotes: ensureString(raw.existingContentNotes),
    toneSelections: ensureStringArray(raw.toneSelections),
    languageStyleSelections: ensureStringArray(raw.languageStyleSelections),
    contentNotes: ensureString(raw.contentNotes),
    visualFeeling: ensureString(raw.visualFeeling),
    likedReferences: ensureString(raw.likedReferences),
    dislikedReferences: ensureString(raw.dislikedReferences),
    preferredColors: ensureString(raw.preferredColors),
    unwantedColors: ensureString(raw.unwantedColors),
    designStyleNotes: ensureString(raw.designStyleNotes),
    designNotes: ensureString(raw.designNotes),
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
