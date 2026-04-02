export type ClientRecord = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  clientName: string;
  businessName: string;
  phone: string;
  email: string;
  website?: string | null;
  packageType?: string | null;
  renewalPrice?: number | null;
  renewalDate?: string | null;
  notes?: string | null;
  agreementFileId?: string | null;
  agreementFileName?: string | null;
  agreementFileType?: string | null;
};

