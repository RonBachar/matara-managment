import type { Project } from "@/types/project";
import { apiGetClients } from "@/lib/clientsApi";
import { apiUrl, getAuthHeaders } from "@/lib/api";

type ApiProject = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  clientId: string;
  projectName: string;
  status: string;
  totalAmount?: unknown;
  paidAmount?: unknown;
  notes?: string | null;
};

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : 0;
}

export function projectFromApi(
  row: ApiProject,
  clientMap?: Map<string, { id: string; clientName: string }>,
): Project {
  const client = clientMap?.get(row.clientId);
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    projectName: row.projectName ?? "",
    clientId: row.clientId,
    client: client ? { id: client.id, clientName: client.clientName } : undefined,
    status: row.status as Project["status"],
    totalAmount: toNumber(row.totalAmount),
    paidAmount: toNumber(row.paidAmount),
    notes: row.notes ?? undefined,
  };
}

async function enrichProjects(rows: ApiProject[]): Promise<Project[]> {
  const clients = await apiGetClients();
  const clientMap = new Map(
    clients.map((c) => [c.id, { id: c.id, clientName: c.clientName }]),
  );
  return rows.map((row) => projectFromApi(row, clientMap));
}

async function parseErrorMessage(res: Response): Promise<string> {
  const maybeJson = await res.json().catch(() => null as unknown);
  if (maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson) {
    return String((maybeJson as { error?: unknown }).error ?? "");
  }
  return "";
}

export async function apiGetProjects(): Promise<Project[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/projects"), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return enrichProjects(data as ApiProject[]);
}

export async function apiGetProjectById(id: string): Promise<Project | null> {
  const projects = await apiGetProjects();
  return projects.find((p) => p.id === id) ?? null;
}

export async function apiCreateProject(input: {
  projectName: string;
  clientId: string;
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
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const created = (await res.json()) as ApiProject;
  const [enriched] = await enrichProjects([created]);
  return enriched;
}

export async function apiUpdateProject(
  id: string,
  patch: Partial<{
    projectName: string;
    clientId: string;
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
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const updated = (await res.json()) as ApiProject;
  const [enriched] = await enrichProjects([updated]);
  return enriched;
}

export async function apiDeleteProject(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/projects/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers,
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}
