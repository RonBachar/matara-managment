import type {
  ClientService,
  ClientServiceInput,
  ClientServiceWithClient,
} from "@/types/clientService";
import { apiUrl, getAuthHeaders } from "@/lib/api";

type ApiClientService = {
  id: string;
  clientId: string;
  serviceName: string;
  billingCycle: string;
  renewalPrice?: unknown;
  renewalDate?: string | null;
  reminderDaysBefore?: unknown;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    clientName: string;
    businessName: string;
  };
};

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function serviceFromApi(row: ApiClientService): ClientService {
  return {
    id: row.id,
    clientId: row.clientId,
    serviceName: row.serviceName,
    billingCycle: row.billingCycle,
    renewalPrice: toNumberOrNull(row.renewalPrice),
    renewalDate: row.renewalDate ?? null,
    reminderDaysBefore: toNumberOrNull(row.reminderDaysBefore),
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function serviceWithClientFromApi(row: ApiClientService): ClientServiceWithClient {
  const service = serviceFromApi(row);
  if (!row.client) return service;
  return {
    ...service,
    client: {
      id: row.client.id,
      clientName: row.client.clientName,
      businessName: row.client.businessName,
    },
  };
}

async function parseErrorMessage(res: Response): Promise<string> {
  const maybeJson = await res.json().catch(() => null as unknown);
  if (maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson) {
    return String((maybeJson as { error?: unknown }).error ?? "");
  }
  return "";
}

export async function listServicesForClient(clientId: string): Promise<ClientService[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/clients/${encodeURIComponent(clientId)}/services`), {
    headers,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiClientService[]).map(serviceFromApi);
}

export async function listAllServices(): Promise<ClientServiceWithClient[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/client-services"), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiClientService[]).map(serviceWithClientFromApi);
}

export async function createService(
  clientId: string,
  input: ClientServiceInput,
): Promise<ClientService> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/clients/${encodeURIComponent(clientId)}/services`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const created = (await res.json()) as ApiClientService;
  return serviceFromApi(created);
}

export async function updateService(
  id: string,
  patch: Partial<ClientServiceInput>,
): Promise<ClientService> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/client-services/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const updated = (await res.json()) as ApiClientService;
  return serviceFromApi(updated);
}

export async function deleteService(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/client-services/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers,
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}
