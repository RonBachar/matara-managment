import type { Project } from "@/types/project";
import { api } from "@/lib/api";

type ApiProject = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  clientId: string;
  client?: { id: string; clientName: string; businessName?: string } | null;
  projectName: string;
  status: string;
  totalAmount?: unknown;
  paidAmount?: unknown;
  notes?: string | null;
};

export type ProjectPayload = {
  projectName: string;
  clientId: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  notes?: string | null;
};

/** Prisma Decimal arrives as a string; anything unparsable becomes 0. */
function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function projectFromApi(row: ApiProject): Project {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    projectName: row.projectName ?? "",
    clientId: row.clientId,
    client: row.client
      ? { id: row.client.id, clientName: row.client.clientName, businessName: row.client.businessName ?? "" }
      : undefined,
    status: row.status as Project["status"],
    totalAmount: toNumber(row.totalAmount),
    paidAmount: toNumber(row.paidAmount),
    notes: row.notes ?? undefined,
  };
}

const BASE = "/api/projects";

export async function apiGetProjects(): Promise<Project[]> {
  const rows = await api.get<ApiProject[]>(BASE);
  return rows.map(projectFromApi);
}

export async function apiCreateProject(input: ProjectPayload): Promise<Project> {
  return projectFromApi(await api.post<ApiProject>(BASE, input));
}

export async function apiUpdateProject(id: string, patch: Partial<ProjectPayload>): Promise<Project> {
  return projectFromApi(await api.patch<ApiProject>(`${BASE}/${encodeURIComponent(id)}`, patch));
}

export function apiDeleteProject(id: string): Promise<void> {
  return api.delete(`${BASE}/${encodeURIComponent(id)}`);
}
