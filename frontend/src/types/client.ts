export type Client = {
  id: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  clientName: string;
  businessName: string;
  phone: string;
  email: string;
  website?: string;
  notes?: string;
  agreementFileId?: string;
  agreementFileName?: string;
  agreementFileType?: string;
};
