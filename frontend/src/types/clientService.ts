export type ClientServiceRecord = {
  id: string;
  clientId: string;
  createdAt?: string;
  updatedAt?: string;
  serviceName: string;
  billingCycle?: string | null;
  renewalPrice?: number | null;
  renewalDate?: string | null;
  notes?: string | null;
};

export const CLIENT_BILLING_CYCLE_OPTIONS = [
  "Monthly",
  "Quarterly",
  "Yearly",
  "One-time",
] as const;
