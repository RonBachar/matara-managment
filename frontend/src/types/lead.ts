/**
 * Initial contact record (local-only). Not a pipeline stage — conversion is tracked via `convertedClientId` only.
 */
export type Lead = {
  id: string;
  /** שם הלקוח (contact name — may be first name only or full name). */
  clientName: string;
  phone: string;
  /** Optional — may be empty when unknown. */
  email?: string;
  leadSource: string;
  notes?: string;
  createdAt?: string;
  /** When set, this lead has already been turned into a client (duplicate conversion blocked). */
  convertedClientId?: string;
  agreementFileId?: string;
  agreementFileName?: string;
  agreementFileType?: string;
};
