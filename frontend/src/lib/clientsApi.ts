import type { Client, PackageType } from "@/types/client";
import { apiUrl } from "@/lib/api";

export type ClientPayload = {
  clientName: string;
  businessName: string;
  phone: string;
  email: string;
  website?: string | null;
  notes?: string | null;
  packageType: PackageType;
  packagePrice?: number | null;
  renewalDate?: string | null;
  reminderDaysBefore?: number | null;
  agreementFileId?: string | null;
  agreementFileName?: string | null;
  agreementFileType?: string | null;
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
  packageType?: string | null;
  packagePrice?: unknown;
  renewalDate?: string | null;
  reminderDaysBefore?: unknown;
  agreementFileId?: string | null;
  agreementFileName?: string | null;
  agreementFileType?: string | null;
};

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function normalizePackageType(value: string | null | undefined): PackageType {
  return value === "Hosting + Elementor Pro" ||
    value === "Hosting Only" ||
    value === "Elementor Pro Only"
    ? value
    : "none";
}

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
    packageType: normalizePackageType(row.packageType),
    packagePrice: toNumberOrNull(row.packagePrice) ?? undefined,
    renewalDate: row.renewalDate ?? undefined,
    reminderDaysBefore: toNumberOrNull(row.reminderDaysBefore) ?? undefined,
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
  const res = await fetch(apiUrl("/api/clients"));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiClient[]).map(clientFromApi);
}

export async function apiCreateClient(
  input: ClientPayload,
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
  patch: Partial<ClientPayload>,
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
