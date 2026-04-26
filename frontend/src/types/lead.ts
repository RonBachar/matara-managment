export const LEAD_STATUS_OPTIONS = [
  "חדש",
  "במעקב",
  "לא מעוניין",
] as const;

export type LeadStatus = (typeof LEAD_STATUS_OPTIONS)[number];

/**
 * Standalone lead record.
 */
export type Lead = {
  id: string;
  /** שם הלקוח (contact name — may be first name only or full name). */
  clientName: string;
  phone: string;
  /** Optional — may be empty when unknown. */
  email?: string;
  leadSource: string;
  status: LeadStatus;
  notes?: string;
  createdAt?: string;
};
