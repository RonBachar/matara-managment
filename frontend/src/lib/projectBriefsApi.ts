import type { ProjectBrief, ProjectBriefInput } from "@/types/projectBrief";

type ApiBrief = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function briefFromApi(row: ApiBrief): ProjectBrief {
  return {
    id: asString(row.id),
    projectId: asString(row.projectId),
    clientId: asString(row.clientId),
    briefTitle: asString(row.briefTitle),
    businessNameSnapshot: asString(row.businessNameSnapshot),
    clientNameSnapshot: asString(row.clientNameSnapshot),
    projectNameSnapshot:
      typeof row.projectNameSnapshot === "string" && row.projectNameSnapshot.trim()
        ? row.projectNameSnapshot.trim()
        : undefined,
    createdAt: asString(row.createdAt),
    updatedAt: asString(row.updatedAt),

    businessWhatTheyDo: asString(row.businessWhatTheyDo),
    servicesProductsOnSite: asString(row.servicesProductsOnSite),
    differentiators: asString(row.differentiators),

    targetAudience: asString(row.targetAudience),
    idealClient: asString(row.idealClient),
    audiencePainPoints: asString(row.audiencePainPoints),
    sitePrimaryBusinessGoal: asString(row.sitePrimaryBusinessGoal),
    mainUserAction: asString(row.mainUserAction),

    websiteType: asString(row.websiteType),
    sitePagesAndStructure: asString(row.sitePagesAndStructure),
    siteEmphasis: asString(row.siteEmphasis),

    toneSelections: asStringArray(row.toneSelections),
    languageStyleSelections: asStringArray(row.languageStyleSelections),
    linguisticAddressing: asString(row.linguisticAddressing),

    contentAvoid: asString(row.contentAvoid),
    additionalNotes: asString(row.additionalNotes),

    gpt1Output: typeof row.gpt1Output === "string" ? row.gpt1Output : undefined,
    gpt2Output: typeof row.gpt2Output === "string" ? row.gpt2Output : undefined,
    gpt3Output: typeof row.gpt3Output === "string" ? row.gpt3Output : undefined,
  };
}

async function parseErrorMessage(res: Response): Promise<string> {
  const maybeJson = await res.json().catch(() => null as unknown);
  if (maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson) {
    return String((maybeJson as { error?: unknown }).error ?? "");
  }
  return "";
}

export async function apiListBriefs(): Promise<ProjectBrief[]> {
  const res = await fetch("/api/project-briefs");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiBrief[]).map(briefFromApi);
}

export async function apiGetBriefByProjectId(projectId: string): Promise<ProjectBrief> {
  const res = await fetch(`/api/project-briefs/by-project/${encodeURIComponent(projectId)}`);
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiBrief;
  return briefFromApi(data);
}

export async function apiGetBriefById(id: string): Promise<ProjectBrief> {
  const res = await fetch(`/api/project-briefs/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiBrief;
  return briefFromApi(data);
}

export async function apiCreateBrief(projectId: string, input: ProjectBriefInput): Promise<ProjectBrief> {
  const res = await fetch("/api/project-briefs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      data: input,
    }),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiBrief;
  return briefFromApi(data);
}

export async function apiUpdateBrief(id: string, input: ProjectBriefInput): Promise<ProjectBrief> {
  const res = await fetch(`/api/project-briefs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: input,
    }),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiBrief;
  return briefFromApi(data);
}

export async function apiDeleteBrief(id: string): Promise<void> {
  const res = await fetch(`/api/project-briefs/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}

