import type { ProjectBrief, ProjectBriefInput } from "@/types/projectBrief";
import { apiUrl, getAuthHeaders } from "@/lib/api";

type ApiBrief = Record<string, unknown>;
type ApiObject = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asObject(value: unknown): ApiObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as ApiObject;
}

function briefFromApi(row: ApiBrief): ProjectBrief {
  return {
    id: asString(row.id),
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

export type BriefGpt1RunResult = {
  briefId: string;
  runId: string;
  stepId: string;
  status: string;
  normalizedBrief: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type BriefGpt2RunResult = {
  briefId: string;
  runId: string;
  status: string;
  output: Record<string, unknown>;
};

export type BriefGpt3ArtifactPage = {
  pageName: string;
  fileName: string;
  html: string;
};

export type BriefGpt3Artifact = {
  type: string;
  framework: string;
  globalCss: string;
  globalJs: string;
  pages: BriefGpt3ArtifactPage[];
};

export type BriefGpt3RunResult = {
  briefId: string;
  runId: string;
  stepId: string;
  status: string;
  input: Record<string, unknown>;
  output: {
    provider: string;
    model: string;
    generatedAt: string;
    summary: string;
    artifact: BriefGpt3Artifact;
    notes: string;
  };
};

export async function apiListBriefs(): Promise<ProjectBrief[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/project-briefs"), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiBrief[]).map(briefFromApi);
}

export async function apiGetBriefById(id: string): Promise<ProjectBrief> {
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

export async function apiCreateBrief(input: ProjectBriefInput): Promise<ProjectBrief> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/project-briefs"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
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

export async function apiUpdateBrief(id: string, input: ProjectBriefInput): Promise<ProjectBrief> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
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

export async function apiRunBriefGpt1SitemapWireframe(id: string): Promise<BriefGpt1RunResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}/gpt1/sitemap-wireframe`), {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }

  const data = asObject(await res.json());
  return {
    briefId: asString(data.briefId),
    runId: asString(data.runId),
    stepId: asString(data.stepId),
    status: asString(data.status),
    normalizedBrief: asObject(data.normalizedBrief),
    output: asObject(data.output),
  };
}

export async function apiRunBriefGpt2Content(
  id: string
): Promise<BriefGpt2RunResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    apiUrl(`/api/project-briefs/${encodeURIComponent(id)}/gpt2/content`),
    { method: "POST", headers }
  );
  if (!res.ok) throw new Error(`GPT2 failed: HTTP ${res.status}`);
  return res.json() as Promise<BriefGpt2RunResult>;
}

export async function apiRunBriefGpt3WireframeSite(id: string): Promise<BriefGpt3RunResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}/gpt3/wireframe-site`), {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }

  const data = asObject(await res.json());
  const output = asObject(data.output);
  const artifact = asObject(output.artifact);
  const pagesRaw = Array.isArray(artifact.pages) ? artifact.pages : [];

  return {
    briefId: asString(data.briefId),
    runId: asString(data.runId),
    stepId: asString(data.stepId),
    status: asString(data.status),
    input: asObject(data.input),
    output: {
      provider: asString(output.provider),
      model: asString(output.model),
      generatedAt: asString(output.generatedAt),
      summary: asString(output.summary),
      artifact: {
        type: asString(artifact.type),
        framework: asString(artifact.framework),
        globalCss: asString(artifact.globalCss),
        globalJs: asString(artifact.globalJs),
        pages: pagesRaw.map((item) => {
          const row = asObject(item);
          return {
            pageName: asString(row.pageName),
            fileName: asString(row.fileName),
            html: asString(row.html),
          } satisfies BriefGpt3ArtifactPage;
        }),
      },
      notes: asString(output.notes),
    },
  };
}
