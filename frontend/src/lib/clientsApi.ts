import type { Client } from "@/types/client";
import { apiUrl, getAuthHeaders } from "@/lib/api";

export type ClientPayload = {
  clientName: string;
  businessName: string;
  phone: string;
  email: string;
  website?: string | null;
  notes?: string | null;
  agreementFileId?: string | null;
  agreementFileName?: string | null;
  agreementFileType?: string | null;
};

type ApiClient = {
  id: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  clientName: string;
  businessName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  notes?: string | null;
  agreementFileId?: string | null;
  agreementFileName?: string | null;
  agreementFileType?: string | null;
};

function clientFromApi(row: ApiClient): Client {
  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    clientName: row.clientName ?? "",
    businessName: row.businessName ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? undefined,
    notes: row.notes ?? undefined,
    agreementFileId: row.agreementFileId ?? undefined,
    agreementFileName: row.agreementFileName ?? undefined,
    agreementFileType: row.agreementFileType ?? undefined,
  };
}

async function parseErrorMessage(res: Response): Promise<string> {
  const maybeJson = await res.json().catch(() => null as unknown);
  if (maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson) {
    return String((maybeJson as { error?: unknown }).error ?? "");
  }
  return "";
}

export async function apiGetClients(): Promise<Client[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/clients"), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiClient[]).map(clientFromApi);
}

export async function apiCreateClient(input: ClientPayload) {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/clients"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const created = (await res.json()) as ApiClient;
  return clientFromApi(created);
}

export async function apiUpdateClient(id: string, patch: Partial<ClientPayload>) {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/clients/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const updated = (await res.json()) as ApiClient;
  return clientFromApi(updated);
}

export async function apiDeleteClient(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/clients/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers,
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}
