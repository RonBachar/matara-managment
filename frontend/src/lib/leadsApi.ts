import { apiUrl, getAuthHeaders } from "@/lib/api";
import { normalizeLead } from "@/lib/leads";
import type { Lead } from "@/types/lead";

type ApiLead = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  clientName: string;
  phone?: string | null;
  email?: string | null;
  leadSource?: string | null;
  status?: string | null;
  notes?: string | null;
};

async function parseErrorMessage(res: Response): Promise<string> {
  const maybeJson = await res.json().catch(() => null as unknown);
  if (maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson) {
    return String((maybeJson as { error?: unknown }).error ?? "");
  }
  return "";
}

function leadFromApi(row: ApiLead): Lead {
  const lead = normalizeLead(row);
  if (!lead) throw new Error("Unexpected lead response");
  return lead;
}

export async function fetchLeads(): Promise<Lead[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/leads"), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiLead[]).map(leadFromApi);
}

export async function createLead(data: Omit<Lead, "id">): Promise<Lead> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/leads"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  return leadFromApi((await res.json()) as ApiLead);
}

export async function updateLead(
  id: string,
  data: Partial<Omit<Lead, "id">>,
): Promise<Lead> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/leads/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  return leadFromApi((await res.json()) as ApiLead);
}

export async function deleteLead(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/leads/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers,
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}
