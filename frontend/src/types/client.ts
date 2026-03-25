export type PackageType =
  | "Hosting + Elementor Pro"
  | "Hosting Only"
  | "Elementor Pro Only"
  | "None";

/** Hebrew labels for package types (UI only). Internal values stay in English for storage. */
export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  None: "ללא חבילה",
  "Hosting + Elementor Pro": "אחסון + רישיון אלמנטור",
  "Hosting Only": "אחסון בלבד",
  "Elementor Pro Only": "אלמנטור בלבד",
};

export function getPackageTypeLabel(
  packageType: PackageType | undefined,
): string {
  if (packageType == null) return "—";
  return PACKAGE_TYPE_LABELS[packageType] ?? packageType;
}

/**
 * Service type (סוג שירות) — internal values kept for localStorage compatibility.
 * UI labels: "בניית אתרים" | "עבודת פרילנסר" via getClientTypeLabel().
 */
export type ClientType = "Website Client" | "Service Client";

export type Client = {
  id: string;
  /** Service type (סוג שירות). "Website Client" = בניית אתרים, "Service Client" = עבודת פרילנסר. */
  clientType: ClientType;
  createdAt?: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  website?: string;
  notes?: string;
  packageType?: PackageType;
  renewalPrice?: number;
  renewalDate?: string;
  /** @deprecated Legacy name-only; prefer contractFile* when present. */
  workContractFileName?: string;
  /** Work contract blob stored in IndexedDB (same store as agreement files). */
  contractFileId?: string;
  contractFileName?: string;
  contractFileType?: string;
  agreementFileId?: string;
  agreementFileName?: string;
  agreementFileType?: string;
};
