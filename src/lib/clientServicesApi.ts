import type {
  ClientService,
  ClientServiceInput,
  ClientServiceWithClient,
} from "@/types/clientService";
import { api } from "@/lib/api";

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
  client?: { id: string; clientName: string; businessName: string };
};

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function serviceFromApi(row: ApiClientService): ClientServiceWithClient {
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
    client: row.client,
  };
}

const clientServicesPath = (clientId: string) =>
  `/api/clients/${encodeURIComponent(clientId)}/services`;
const servicePath = (id: string) => `/api/client-services/${encodeURIComponent(id)}`;

export async function listServicesForClient(clientId: string): Promise<ClientService[]> {
  const rows = await api.get<ApiClientService[]>(clientServicesPath(clientId));
  return rows.map(serviceFromApi);
}

/** All services across clients, each with its client — used by the dashboard renewals list. */
export async function listAllServices(): Promise<ClientServiceWithClient[]> {
  const rows = await api.get<ApiClientService[]>("/api/client-services");
  return rows.map(serviceFromApi);
}

export async function createService(clientId: string, input: ClientServiceInput): Promise<ClientService> {
  return serviceFromApi(await api.post<ApiClientService>(clientServicesPath(clientId), input));
}

export async function updateService(id: string, patch: Partial<ClientServiceInput>): Promise<ClientService> {
  return serviceFromApi(await api.patch<ApiClientService>(servicePath(id), patch));
}

export function deleteService(id: string): Promise<void> {
  return api.delete(servicePath(id));
}
