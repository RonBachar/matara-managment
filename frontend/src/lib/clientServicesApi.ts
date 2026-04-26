import type { ClientServiceRecord } from "@/types/clientService";
import { apiUrl } from "@/lib/api";

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

function fromApi(row: ApiClientService): ClientServiceRecord {
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

export async function apiGetClientServices(clientId: string): Promise<ClientServiceRecord[]> {
  const res = await fetch(apiUrl(`/api/clients/${encodeURIComponent(clientId)}/services`));
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return data.map((row) => fromApi(row as ApiClientService));
}

export async function apiCreateClientService(
  clientId: string,
  input: Omit<ClientServiceRecord, "id" | "clientId" | "createdAt" | "updatedAt">,
) {
  const res = await fetch(apiUrl(`/api/clients/${encodeURIComponent(clientId)}/services`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "Custom service",
      name: input.serviceName,
      billingCycle: input.billingCycle,
      renewalPrice: input.renewalPrice,
      renewalDate: input.renewalDate,
      reminderDaysBefore: input.reminderDaysBefore,
      notes: input.notes,
    }),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  return fromApi((await res.json()) as ApiClientService);
}

export async function apiUpdateClientService(
  id: string,
  patch: Partial<Omit<ClientServiceRecord, "id" | "clientId" | "createdAt" | "updatedAt">>,
) {
  const res = await fetch(apiUrl(`/api/client-services/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: patch.serviceName,
      billingCycle: patch.billingCycle,
      renewalPrice: patch.renewalPrice,
      renewalDate: patch.renewalDate,
      reminderDaysBefore: patch.reminderDaysBefore,
      notes: patch.notes,
    }),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  return fromApi((await res.json()) as ApiClientService);
}

export async function apiDeleteClientService(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/client-services/${encodeURIComponent(id)}`), {
    method: "DELETE",
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}
