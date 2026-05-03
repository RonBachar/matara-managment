import type { Project } from "@/types/project";
import { apiUrl, getAuthHeaders } from "@/lib/api";

type ApiProject = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  clientName: string;
  projectName: string;
  status: string;
  totalAmount?: unknown;
  paidAmount?: unknown;
  notes?: string | null;
};

function toNumber(value: unknown): number {
  // Prisma Decimal often serializes as string in JSON responses.
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : 0;
}

export function projectFromApi(row: ApiProject): Project {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    projectName: row.projectName ?? "",
    clientName: row.clientName ?? "",
    status: row.status as Project["status"],
    totalAmount: toNumber(row.totalAmount),
    paidAmount: toNumber(row.paidAmount),
    notes: row.notes ?? undefined,
  };
}

export async function apiGetProjects(): Promise<Project[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/projects"), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiProject[]).map(projectFromApi);
}

export async function apiCreateProject(input: {
  projectName: string;
  clientName: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  notes?: string | null;
}): Promise<Project> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/projects"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const maybeJson = await res.json().catch(() => null as unknown);
    const msg =
      maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson
        ? String((maybeJson as { error?: unknown }).error ?? "")
        : "";
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const created = (await res.json()) as ApiProject;
  return projectFromApi(created);
}

export async function apiUpdateProject(
  id: string,
  patch: Partial<{
    projectName: string;
    clientName: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    notes: string | null;
  }>,
): Promise<Project> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/projects/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const maybeJson = await res.json().catch(() => null as unknown);
    const msg =
      maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson
        ? String((maybeJson as { error?: unknown }).error ?? "")
        : "";
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const updated = (await res.json()) as ApiProject;
  return projectFromApi(updated);
}

export async function apiDeleteProject(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/projects/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers,
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const maybeJson = await res.json().catch(() => null as unknown);
    const msg =
      maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson
        ? String((maybeJson as { error?: unknown }).error ?? "")
        : "";
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}
