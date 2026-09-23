import type { Client, ClientPayload } from "@/types/client";
import { api } from "@/lib/api";

type ApiClient = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Prisma Decimal arrives as a string; anything unusable becomes null. */
function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function clientFromApi(row: ApiClient): Client {
  return {
    id: str(row.id),
    createdAt: str(row.createdAt) || undefined,
    updatedAt: str(row.updatedAt) || undefined,
    clientName: str(row.clientName),
    businessName: str(row.businessName),
    phone: str(row.phone),
    email: str(row.email),
    serviceType: str(row.serviceType),
    leadSource: str(row.leadSource),
    website: str(row.website) || undefined,
    notes: str(row.notes) || undefined,
    contractUrl: str(row.contractUrl) || undefined,
    packageType: str(row.packageType) || undefined,
    renewalPrice: numOrNull(row.renewalPrice),
    renewalDate: str(row.renewalDate) || null,
    reminderDaysBefore: numOrNull(row.reminderDaysBefore),
  };
}

const BASE = "/api/clients";

export async function apiGetClients(): Promise<Client[]> {
  const rows = await api.get<ApiClient[]>(BASE);
  return rows.map(clientFromApi);
}

export async function apiCreateClient(input: Partial<ClientPayload>): Promise<Client> {
  return clientFromApi(await api.post<ApiClient>(BASE, input));
}

export async function apiUpdateClient(id: string, patch: Partial<ClientPayload>): Promise<Client> {
  return clientFromApi(await api.patch<ApiClient>(`${BASE}/${encodeURIComponent(id)}`, patch));
}

export function apiDeleteClient(id: string): Promise<void> {
  return api.delete(`${BASE}/${encodeURIComponent(id)}`);
}

/** Turns a lead into a client and returns the new client. */
export async function apiConvertLead(leadId: string): Promise<Client> {
  const row = await api.post<ApiClient>(`/api/leads/${encodeURIComponent(leadId)}/convert`, {});
  return clientFromApi(row);
}
