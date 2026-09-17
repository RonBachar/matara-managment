export type BillingCycle = "monthly" | "yearly" | "one-time";

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "חודשי",
  yearly: "שנתי",
  "one-time": "חד פעמי",
};

export const BILLING_CYCLE_OPTIONS: BillingCycle[] = ["monthly", "yearly", "one-time"];

export const REMINDER_OPTIONS = [
  { value: 3, label: "3 ימים לפני" },
  { value: 7, label: "שבוע לפני" },
  { value: 14, label: "שבועיים לפני" },
] as const;

export type ClientService = {
  id: string;
  clientId: string;
  serviceName: string;
  billingCycle: BillingCycle | string;
  renewalPrice: number | null;
  renewalDate: string | null;
  reminderDaysBefore: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientServiceWithClient = ClientService & {
  client?: {
    id: string;
    clientName: string;
    businessName: string;
  };
};

export type ClientServiceInput = {
  serviceName: string;
  billingCycle: string;
  renewalPrice?: number | null;
  renewalDate?: string | null;
  reminderDaysBefore?: number | null;
  notes?: string | null;
};
