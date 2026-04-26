import type { ProjectBrief, ProjectBriefInput } from "@/types/projectBrief";
import { apiUrl } from "@/lib/api";

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

export type BriefGpt1RunResult = {
  briefId: string;
  runId: string;
  stepId: string;
  status: string;
  normalizedBrief: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type BriefGpt1HistoryRun = {
  runId: string;
  stepId: string;
  status: string;
  createdAt: string;
  finishedAt: string | null;
  model: string | null;
  error: string | null;
  normalizedBrief: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
};

export type BriefGpt1HistoryResponse = {
  briefId: string;
  runs: BriefGpt1HistoryRun[];
  latestSuccessfulRun: BriefGpt1HistoryRun | null;
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
  const res = await fetch(apiUrl("/api/project-briefs"));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiBrief[]).map(briefFromApi);
}

export async function apiGetBriefById(id: string): Promise<ProjectBrief> {
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}`));
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApiBrief;
  return briefFromApi(data);
}

export async function apiCreateBrief(input: ProjectBriefInput): Promise<ProjectBrief> {
  const res = await fetch(apiUrl("/api/project-briefs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
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
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}`), {
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
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}`), { method: "DELETE" });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}

export async function apiRunBriefGpt1SitemapWireframe(id: string): Promise<BriefGpt1RunResult> {
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}/gpt1/sitemap-wireframe`), {
    method: "POST",
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

export async function apiGetBriefGpt1History(id: string): Promise<BriefGpt1HistoryResponse> {
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}/gpt1/sitemap-wireframe/runs`));
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }

  const data = asObject(await res.json());
  const runsRaw = Array.isArray(data.runs) ? data.runs : [];

  const runs = runsRaw.map((item) => {
    const row = asObject(item);
    return {
      runId: asString(row.runId),
      stepId: asString(row.stepId),
      status: asString(row.status),
      createdAt: asString(row.createdAt),
      finishedAt: typeof row.finishedAt === "string" ? row.finishedAt : null,
      model: typeof row.model === "string" ? row.model : null,
      error: typeof row.error === "string" ? row.error : null,
      normalizedBrief:
        typeof row.normalizedBrief === "object" &&
        row.normalizedBrief !== null &&
        !Array.isArray(row.normalizedBrief)
          ? (row.normalizedBrief as Record<string, unknown>)
          : null,
      output:
        typeof row.output === "object" &&
        row.output !== null &&
        !Array.isArray(row.output)
          ? (row.output as Record<string, unknown>)
          : null,
    } satisfies BriefGpt1HistoryRun;
  });

  const latestSuccessfulRunRaw = asObject(data.latestSuccessfulRun);
  const latestSuccessfulRun =
    latestSuccessfulRunRaw.runId
      ? ({
          runId: asString(latestSuccessfulRunRaw.runId),
          stepId: asString(latestSuccessfulRunRaw.stepId),
          status: asString(latestSuccessfulRunRaw.status),
          createdAt: asString(latestSuccessfulRunRaw.createdAt),
          finishedAt:
            typeof latestSuccessfulRunRaw.finishedAt === "string"
              ? latestSuccessfulRunRaw.finishedAt
              : null,
          model:
            typeof latestSuccessfulRunRaw.model === "string"
              ? latestSuccessfulRunRaw.model
              : null,
          error:
            typeof latestSuccessfulRunRaw.error === "string"
              ? latestSuccessfulRunRaw.error
              : null,
          normalizedBrief:
            typeof latestSuccessfulRunRaw.normalizedBrief === "object" &&
            latestSuccessfulRunRaw.normalizedBrief !== null &&
            !Array.isArray(latestSuccessfulRunRaw.normalizedBrief)
              ? (latestSuccessfulRunRaw.normalizedBrief as Record<string, unknown>)
              : null,
          output:
            typeof latestSuccessfulRunRaw.output === "object" &&
            latestSuccessfulRunRaw.output !== null &&
            !Array.isArray(latestSuccessfulRunRaw.output)
              ? (latestSuccessfulRunRaw.output as Record<string, unknown>)
              : null,
        } satisfies BriefGpt1HistoryRun)
      : null;

  return {
    briefId: asString(data.briefId),
    runs,
    latestSuccessfulRun,
  };
}

export async function apiRunBriefGpt3WireframeSite(id: string): Promise<BriefGpt3RunResult> {
  const res = await fetch(apiUrl(`/api/project-briefs/${encodeURIComponent(id)}/gpt3/wireframe-site`), {
    method: "POST",
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
