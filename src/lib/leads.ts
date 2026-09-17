import type { Lead, LeadStatus } from "@/types/lead";
import { LEAD_STATUS_OPTIONS } from "@/types/lead";

/** Soft pill styles for status chips / inline selects. */
export function leadStatusPillClass(status: LeadStatus): string {
  switch (status) {
    case "חדש":
      return "border border-sky-200/90 bg-sky-50 text-sky-900";
    case "במעקב":
      return "border border-amber-200/90 bg-amber-50 text-amber-900";
    case "לא מעוניין":
      return "border border-slate-200 bg-slate-100 text-slate-800";
    default:
      return "border border-border bg-muted text-foreground";
  }
}

const STATUS_SET = new Set<string>(LEAD_STATUS_OPTIONS);

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

function pickLegacyClientName(raw: Record<string, unknown>): string {
  const v =
    raw.clientName ?? raw.name ?? raw.contactPerson ?? raw.fullName;
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
 * Maps arbitrary API / legacy shapes into the current `Lead` model.
 */
export function normalizeLead(raw: unknown): Lead | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;

  const id = l.id != null ? String(l.id) : String(Date.now());

  const clientName = pickLegacyClientName(l).trim();
  const email = normalizeEmail(l.email);
  const statusRaw = typeof l.status === "string" ? l.status.trim() : "";
  const status = STATUS_SET.has(statusRaw) ? (statusRaw as LeadStatus) : "חדש";

  return {
    id,
    clientName,
    phone: String(l.phone ?? ""),
    email,
    leadSource: String(l.leadSource ?? ""),
    status,
    notes: typeof l.notes === "string" ? l.notes : undefined,
    createdAt: typeof l.createdAt === "string" ? l.createdAt : undefined,
  };
}
