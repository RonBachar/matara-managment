/** Pipeline status; `הפך ללקוח` is set automatically on successful conversion. */
export const LEAD_STATUS_OPTIONS = [
  "חדש",
  "במעקב",
  "לא מעוניין",
  "הפך ללקוח",
] as const;

export type LeadStatus = (typeof LEAD_STATUS_OPTIONS)[number];

/** Statuses editable before conversion (cannot mark "הפך ללקוח" without converting). */
export const LEAD_EDITABLE_STATUS_OPTIONS = [
  "חדש",
  "במעקב",
  "לא מעוניין",
] as const;

export type LeadEditableStatus = (typeof LEAD_EDITABLE_STATUS_OPTIONS)[number];

/**
 * Initial contact record (local-only). Conversion is tracked via `convertedClientId` and mirrored in `status`.
 */
export type Lead = {
  id: string;
  /** שם הלקוח (contact name — may be first name only or full name). */
  clientName: string;
  phone: string;
  /** Optional — may be empty when unknown. */
  email?: string;
  leadSource: string;
  /** Default for new leads: `חדש`. Becomes `הפך ללקוח` when converted. */
  status: LeadStatus;
  notes?: string;
  createdAt?: string;
  /** When set, this lead has already been turned into a client (duplicate conversion blocked). */
  convertedClientId?: string;
  agreementFileId?: string;
  agreementFileName?: string;
  agreementFileType?: string;
};
