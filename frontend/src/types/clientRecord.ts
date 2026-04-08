import type { ClientServiceRecord } from "@/types/clientService";

export type ClientRecord = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  clientName: string;
  businessName: string;
  phone: string;
  email: string;
  website?: string | null;
  notes?: string | null;
  agreementFileId?: string | null;
  agreementFileName?: string | null;
  agreementFileType?: string | null;
  services?: ClientServiceRecord[];
};
