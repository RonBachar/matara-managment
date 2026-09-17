import { api } from "@/lib/api";
import { normalizeLead } from "@/lib/leads";
import type { Lead } from "@/types/lead";

function leadFromApi(row: unknown): Lead {
  const lead = normalizeLead(row);
  if (!lead) throw new Error("Unexpected lead response");
  return lead;
}

const BASE = "/api/leads";

export async function fetchLeads(): Promise<Lead[]> {
  const rows = await api.get<unknown[]>(BASE);
  return rows.map(leadFromApi);
}

export async function createLead(data: Omit<Lead, "id">): Promise<Lead> {
  return leadFromApi(await api.post(BASE, data));
}

export async function updateLead(id: string, data: Partial<Omit<Lead, "id">>): Promise<Lead> {
  return leadFromApi(await api.patch(`${BASE}/${encodeURIComponent(id)}`, data));
}

export function deleteLead(id: string): Promise<void> {
  return api.delete(`${BASE}/${encodeURIComponent(id)}`);
}
