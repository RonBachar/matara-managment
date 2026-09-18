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
  /** Which service they asked about, when the form captured it. */
  serviceType?: string;
  status: LeadStatus;
  notes?: string;
  createdAt?: string;
  /** How many times this person has submitted a form. 1 unless they came back. */
  submissionCount?: number;
};
