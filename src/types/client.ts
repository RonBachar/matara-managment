/** The recurring package a client pays for. One per client. */
export const PACKAGE_TYPE_OPTIONS = ["אחסון", "רישיון אלמנטור", "גם וגם"] as const;

export type PackageType = (typeof PACKAGE_TYPE_OPTIONS)[number];

export const REMINDER_OPTIONS = [
  { value: 7, label: "שבוע לפני" },
  { value: 14, label: "שבועיים לפני" },
  { value: 30, label: "חודש לפני" },
] as const;

export type Client = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  /** The client's own name, shown in the list. */
  clientName: string;
  /** Shown on the client's page, not in the list. */
  businessName: string;
  phone: string;
  email: string;
  /** Carried over from the lead they were converted from. */
  serviceType: string;
  leadSource: string;
  website?: string;
  notes?: string;
  /** Signed work agreement — a link today, from the quote system later. */
  contractUrl?: string;
  packageType?: string;
  renewalPrice?: number | null;
  renewalDate?: string | null;
  reminderDaysBefore?: number | null;
};

export type ClientPayload = Omit<Client, "id" | "createdAt" | "updatedAt">;
