export type LeadStatus =
  | "חדש"
  | "במעקב"
  | "הצעת מחיר נשלחה"
  | "נסגר"
  | "לא רלוונטי"
  | "הפך ללקוח";

export type Lead = {
  id: string;
  convertedClientId?: string;
  createdAt?: string;
  contactPerson: string;
  phone: string;
  email: string;
  requestedService?: string;
  leadSource: string;
  notes?: string;
  status: LeadStatus;
  agreementFileId?: string;
  agreementFileName?: string;
  agreementFileType?: string;
};
