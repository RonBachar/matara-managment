export const QUOTE_STATUS_SENT = "נשלחה";
export const QUOTE_STATUS_SIGNED = "נחתמה";

/** A quote page on the price-offers site, tracked from sending to signing. */
export type Quote = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  clientId: string | null;
  /** The lead the quote was sent to; kept after the lead becomes a client. */
  leadId: string | null;
  /** Who the quote belongs to, as returned by the quotes list. */
  lead?: QuoteLead | null;
  client?: QuoteClient | null;
  /** Last path segment of the quote URL; how the signing webhook finds it. */
  slug: string;
  title: string;
  url: string;
  amount: number | null;
  /** "נשלחה" | "נחתמה" */
  status: string;
  sentAt: string | null;
  signedAt: string | null;
  signerName?: string;
  signerEmail?: string;
  signatureUrl?: string;
  signedCopyUrl?: string;
};

export type QuoteLead = { id: string; clientName: string; phone: string; email: string | null };
export type QuoteClient = { id: string; clientName: string };

export type QuotePayload = {
  clientId?: string | null;
  leadId?: string | null;
  url?: string;
  title?: string;
  amount?: number | null;
};
