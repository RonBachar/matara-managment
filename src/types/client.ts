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
  /** Link to the signed contract (Drive, Dropbox, …). */
  contractUrl?: string;
};
