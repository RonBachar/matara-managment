export type PackageType =
  | "Hosting + Elementor Pro"
  | "Hosting Only"
  | "Elementor Pro Only"
  | "None";

/** Hebrew labels for legacy package types (UI only). Internal values stay in English for compatibility. */
export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  None: "ללא חבילה",
  "Hosting + Elementor Pro": "אחסון + רישיון אלמנטור",
  "Hosting Only": "אחסון בלבד",
  "Elementor Pro Only": "אלמנטור בלבד",
};

export function getPackageTypeLabel(packageType: PackageType | undefined): string {
  if (packageType == null) return "—";
  return PACKAGE_TYPE_LABELS[packageType] ?? packageType;
}

export type ClientType = "Website Client" | "Service Client";

export type ClientService = {
  id: string;
  clientId?: string;
  serviceName: string;
  billingCycle?: string;
  renewalPrice?: number;
  renewalDate?: string;
  reminderDaysBefore?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Client = {
  id: string;
  clientType: ClientType;
  createdAt?: string;
  businessName: string;
  clientName: string;
  phone: string;
  email: string;
  website?: string;
  notes?: string;
  services?: ClientService[];
  packageType?: PackageType;
  renewalPrice?: number;
  renewalDate?: string;
  workContractFileName?: string;
  contractFileId?: string;
  contractFileName?: string;
  contractFileType?: string;
  agreementFileId?: string;
  agreementFileName?: string;
  agreementFileType?: string;
};
