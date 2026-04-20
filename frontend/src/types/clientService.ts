export type ClientServiceRecord = {
  id: string;
  clientId: string;
  createdAt?: string;
  updatedAt?: string;
  serviceName: string;
  billingCycle?: string | null;
  renewalPrice?: number | null;
  renewalDate?: string | null;
  reminderDaysBefore?: number | null;
  notes?: string | null;
};

export const CLIENT_BILLING_CYCLE_OPTIONS = [
  "Monthly",
  "Quarterly",
  "Yearly",
  "One-time",
] as const;

export const CLIENT_SERVICE_REMINDER_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "3", label: "3 days before" },
  { value: "7", label: "7 days before" },
  { value: "14", label: "14 days before" },
  { value: "30", label: "30 days before" },
] as const;
