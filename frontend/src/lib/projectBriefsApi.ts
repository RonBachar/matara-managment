import type { ProjectBrief, ProjectBriefInput } from "@/types/projectBrief";
import { apiUrl, getAuthHeaders } from "@/lib/api";

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
    title: asString(row.title),
    businessNameSnapshot: asString(row.businessNameSnapshot),
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
    requestedPages: asString(row.requestedPages),
    siteEmphasis: asString(row.siteEmphasis),

    toneSelections: asStringArray(row.toneSelections),
    languageStyleSelections: asStringArray(row.languageStyleSelections),
    linguisticAddressing: asString(row.linguisticAddressing),

    contentAvoid: asString(row.contentAvoid),
    additionalNotes: asString(row.additionalNotes),
  };
}

async function parseErrorMessage(res: Response): Promise<string> {
  const maybeJson = await res.json().catch(() => null as unknown);
  if (maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson) {
    return String((maybeJson as { error?: unknown }).error ?? "");
  }
  return "";
}

export async function listBriefs(): Promise<ProjectBrief[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/project-briefs"), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiBrief[]).map(briefFromApi);
}

export async function getBrief(id: string): Promise<ProjectBrief> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}`), {
    headers,
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiBrief;
  return briefFromApi(data);
}

export async function getBriefByProject(projectId: string): Promise<ProjectBrief | null> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    apiUrl(`/api/project-briefs/by-project/${encodeURIComponent(projectId)}`),
    { headers },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiBrief;
  return briefFromApi(data);
}

export async function createBrief(input: {
  projectId: string;
  data: ProjectBriefInput;
}): Promise<ProjectBrief> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/project-briefs"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      projectId: input.projectId,
      data: input.data,
    }),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiBrief;
  return briefFromApi(data);
}

export async function updateBrief(
  id: string,
  input: { data: ProjectBriefInput },
): Promise<ProjectBrief> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      data: input.data,
    }),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiBrief;
  return briefFromApi(data);
}

export async function deleteBrief(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers,
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}
