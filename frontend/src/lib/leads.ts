import type { Lead } from "@/types/lead";

export const LEADS_STORAGE_KEY = "matara_leads";

/** Display createdAt as DD/MM/YYYY (local calendar). */
export function formatLeadCreatedAt(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function pickLegacyName(raw: Record<string, unknown>): string {
  const v =
    raw.name ?? raw.contactPerson ?? raw.fullName ?? raw.businessName;
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function normalizeEmail(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Maps arbitrary stored / legacy shapes into the current `Lead` model.
 * Ignores removed pipeline fields (status, requestedService, etc.).
 */
export function normalizeLead(raw: unknown): Lead | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;

  const id = l.id != null ? String(l.id) : String(Date.now());

  const convertedClientId: string | undefined =
    typeof l.convertedClientId === "string" && l.convertedClientId.trim()
      ? l.convertedClientId.trim()
      : undefined;

  const name = pickLegacyName(l).trim();
  const email = normalizeEmail(l.email);

  return {
    id,
    name,
    phone: String(l.phone ?? ""),
    email,
    leadSource: String(l.leadSource ?? ""),
    notes: typeof l.notes === "string" ? l.notes : undefined,
    createdAt: typeof l.createdAt === "string" ? l.createdAt : undefined,
    convertedClientId,
    agreementFileId:
      typeof l.agreementFileId === "string" ? l.agreementFileId : undefined,
    agreementFileName:
      typeof l.agreementFileName === "string" ? l.agreementFileName : undefined,
    agreementFileType:
      typeof l.agreementFileType === "string" ? l.agreementFileType : undefined,
  };
}

/** Persist only the current schema (no legacy keys). */
export function leadToStorage(lead: Lead): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    leadSource: lead.leadSource,
  };
  if (lead.email) out.email = lead.email;
  if (lead.notes) out.notes = lead.notes;
  if (lead.createdAt) out.createdAt = lead.createdAt;
  if (lead.convertedClientId) out.convertedClientId = lead.convertedClientId;
  if (lead.agreementFileId) out.agreementFileId = lead.agreementFileId;
  if (lead.agreementFileName) out.agreementFileName = lead.agreementFileName;
  if (lead.agreementFileType) out.agreementFileType = lead.agreementFileType;
  return out;
}

export function readStoredLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LEADS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeLead(item))
      .filter((x): x is Lead => x != null);
  } catch {
    return [];
  }
}

export function writeStoredLeads(leads: Lead[]): void {
  if (typeof window === "undefined") return;
  const payload = leads.map((l) => leadToStorage(l));
  window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(payload));
}
