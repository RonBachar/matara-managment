import type { Client, ClientService } from "@/types/client";

export const CLIENTS_STORAGE_KEY = "matara_clients";

function buildLegacyService(c: Record<string, unknown>, clientId: string): ClientService[] {
  const packageType = typeof c.packageType === "string" ? c.packageType : "";
  if (!packageType || packageType === "None") return [];

  return [
    {
      id: `${clientId}-legacy-service`,
      clientId,
      type:
        packageType === "Hosting Only"
          ? "Hosting"
          : packageType === "Elementor Pro Only"
            ? "License"
            : "Custom service",
      name:
        packageType === "Hosting Only"
          ? "Hosting"
          : packageType === "Elementor Pro Only"
            ? "Elementor Pro"
            : packageType,
      renewalPrice: typeof c.renewalPrice === "number" ? c.renewalPrice : 0,
      renewalDate: typeof c.renewalDate === "string" ? c.renewalDate : undefined,
      status: "Active",
      notes: "Migrated from legacy package fields.",
    },
  ];
}

/**
 * Maps legacy stored clients (`contactPerson`, etc.) into the current `Client` shape.
 */
export function normalizeClientFromStorage(raw: unknown): Client | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;

  const clientName =
    typeof c.clientName === "string" && c.clientName.trim() !== ""
      ? c.clientName
      : typeof c.contactPerson === "string"
        ? c.contactPerson
        : "";

  const id = c.id != null ? String(c.id) : String(Date.now());

  return {
    id,
    clientType: (c.clientType as Client["clientType"]) ?? "Website Client",
    createdAt: typeof c.createdAt === "string" ? c.createdAt : undefined,
    businessName: typeof c.businessName === "string" ? c.businessName : "",
    clientName,
    phone: typeof c.phone === "string" ? c.phone : "",
    email: typeof c.email === "string" ? c.email : "",
    website: typeof c.website === "string" ? c.website : undefined,
    status: typeof c.status === "string" && c.status.trim() ? c.status : "Active",
    notes: typeof c.notes === "string" ? c.notes : undefined,
    services: buildLegacyService(c, id),
    packageType: typeof c.packageType === "string" ? (c.packageType as Client["packageType"]) : undefined,
    renewalPrice: typeof c.renewalPrice === "number" ? c.renewalPrice : 0,
    renewalDate: typeof c.renewalDate === "string" ? c.renewalDate : "",
    workContractFileName: undefined,
    contractFileId: typeof c.contractFileId === "string" ? c.contractFileId : undefined,
    contractFileName: typeof c.contractFileName === "string" ? c.contractFileName : undefined,
    contractFileType: typeof c.contractFileType === "string" ? c.contractFileType : undefined,
    agreementFileId: typeof c.agreementFileId === "string" ? c.agreementFileId : undefined,
    agreementFileName: typeof c.agreementFileName === "string" ? c.agreementFileName : undefined,
    agreementFileType: typeof c.agreementFileType === "string" ? c.agreementFileType : undefined,
  };
}

export function formatClientDisplayLabel(c: Pick<Client, "businessName" | "clientName">): string {
  const parts = [c.businessName?.trim(), c.clientName?.trim()].filter(
    (s): s is string => Boolean(s && s.length > 0),
  );
  if (parts.length === 0) return "—";
  return parts.join(" · ");
}

export function readStoredClients(): Client[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeClientFromStorage(item))
      .filter((x): x is Client => x != null);
  } catch {
    return [];
  }
}
