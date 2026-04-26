export type PackageType =
  | "Hosting + Elementor Pro"
  | "Hosting Only"
  | "Elementor Pro Only"
  | "none";

export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  none: "ללא חבילה",
  "Hosting + Elementor Pro": "אחסון + אלמנטור פרו",
  "Hosting Only": "אחסון בלבד",
  "Elementor Pro Only": "אלמנטור פרו בלבד",
};

export const REMINDER_OPTIONS = [
  { value: 3, label: "3 ימים לפני" },
  { value: 7, label: "שבוע לפני" },
  { value: 14, label: "שבועיים לפני" },
] as const;

export type Client = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  clientName: string;
  businessName: string;
  phone: string;
  email: string;
  website?: string;
  notes?: string;
  packageType: PackageType;
  packagePrice?: number;
  renewalDate?: string;
  reminderDaysBefore?: number;
  agreementFileId?: string;
  agreementFileName?: string;
  agreementFileType?: string;
};
