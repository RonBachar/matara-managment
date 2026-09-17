import type { Client } from "@/types/client";
import { api } from "@/lib/api";

export type ClientPayload = {
  clientName: string;
  businessName: string;
  phone: string;
  email: string;
  website?: string | null;
  notes?: string | null;
  contractUrl?: string | null;
};

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
  contractUrl?: string | null;
};

function clientFromApi(row: ApiClient): Client {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    clientName: row.clientName ?? "",
    businessName: row.businessName ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? undefined,
    notes: row.notes ?? undefined,
    contractUrl: row.contractUrl ?? undefined,
  };
}

const BASE = "/api/clients";

export async function apiGetClients(): Promise<Client[]> {
  const rows = await api.get<ApiClient[]>(BASE);
  return rows.map(clientFromApi);
}

export async function apiCreateClient(input: ClientPayload): Promise<Client> {
  return clientFromApi(await api.post<ApiClient>(BASE, input));
}

export async function apiUpdateClient(id: string, patch: Partial<ClientPayload>): Promise<Client> {
  return clientFromApi(await api.patch<ApiClient>(`${BASE}/${encodeURIComponent(id)}`, patch));
}

export function apiDeleteClient(id: string): Promise<void> {
  return api.delete(`${BASE}/${encodeURIComponent(id)}`);
}
