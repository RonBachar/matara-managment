import type { Project } from "@/types/project";

type ApiProject = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  clientId: string;
  clientName: string;
  projectName: string;
  projectType: string;
  status: string;
  totalAmount?: unknown;
  paidAmount?: unknown;
  remainingAmount?: unknown;
  hourlyRate?: unknown;
  workedHours?: unknown;
  billableTotal?: unknown;
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
    projectName: row.projectName ?? "",
    clientId: row.clientId ?? "",
    clientName: row.clientName ?? "",
    projectType: row.projectType as Project["projectType"],
    status: row.status as Project["status"],
    totalAmount: toNumber(row.totalAmount),
    paidAmount: toNumber(row.paidAmount),
    remainingAmount: toNumber(row.remainingAmount),
    hourlyRate: toNumber(row.hourlyRate),
    workedHours: toNumber(row.workedHours),
    billableTotal: toNumber(row.billableTotal),
    notes: row.notes ?? undefined,
  };
}

export async function apiGetProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiProject[]).map(projectFromApi);
}

export async function apiCreateProject(input: {
  projectName: string;
  clientName: string;
  projectType: string;
  status: string;
}): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    clientId: string;
    clientName: string;
    projectType: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    hourlyRate: number;
    workedHours: number;
    billableTotal: number;
    notes: string | null;
  }>,
): Promise<Project> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
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

