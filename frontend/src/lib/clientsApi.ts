import type { ClientRecord } from "@/types/clientRecord";
import type { ClientServiceRecord } from "@/types/clientService";
import { apiUrl } from "@/lib/api";

type ApiClient = {
  id: string;
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
  services?: ApiClientService[];
};

type ApiClientService = {
  id: string;
  clientId: string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  billingCycle?: string | null;
  renewalPrice?: unknown;
  renewalDate?: string | null;
  reminderDaysBefore?: unknown;
  notes?: string | null;
};

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function clientFromApi(row: ApiClient): ClientRecord {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    clientName: row.clientName ?? "",
    businessName: row.businessName ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? null,
    notes: row.notes ?? null,
    agreementFileId: row.agreementFileId ?? null,
    agreementFileName: row.agreementFileName ?? null,
    agreementFileType: row.agreementFileType ?? null,
    services: Array.isArray(row.services) ? row.services.map(clientServiceFromApi) : [],
  };
}

function clientServiceFromApi(row: ApiClientService): ClientServiceRecord {
  return {
    id: row.id,
    clientId: row.clientId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    serviceName: row.name ?? "",
    billingCycle: row.billingCycle ?? null,
    renewalPrice: toNumberOrNull(row.renewalPrice),
    renewalDate: row.renewalDate ?? null,
    reminderDaysBefore: toNumberOrNull(row.reminderDaysBefore),
    notes: row.notes ?? null,
  };
}

async function parseErrorMessage(res: Response): Promise<string> {
  const maybeJson = await res.json().catch(() => null as unknown);
  if (maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson) {
    return String((maybeJson as { error?: unknown }).error ?? "");
  }
  return "";
}

export async function apiGetClients(): Promise<ClientRecord[]> {
  const res = await fetch(apiUrl("/api/clients"));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiClient[]).map(clientFromApi);
}

export async function apiCreateClient(
  input: Omit<ClientRecord, "id" | "createdAt" | "updatedAt" | "services">,
) {
  const res = await fetch(apiUrl("/api/clients"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const created = (await res.json()) as ApiClient;
  return clientFromApi(created);
}

export async function apiUpdateClient(
  id: string,
  patch: Partial<Omit<ClientRecord, "id" | "createdAt" | "updatedAt" | "services">>,
) {
  const res = await fetch(apiUrl(`/api/clients/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(apiUrl(`/api/clients/${encodeURIComponent(id)}`), { method: "DELETE" });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}
