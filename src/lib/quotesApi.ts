import type { Quote, QuotePayload } from "@/types/quote";
import { api } from "@/lib/api";

type ApiQuote = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Prisma Decimal arrives as a string; anything unusable becomes null. */
function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function leadFromApi(value: unknown): Quote["lead"] {
  if (!value || typeof value !== "object") return null;
  const row = value as ApiQuote;
  return {
    id: str(row.id),
    clientName: str(row.clientName),
    phone: str(row.phone),
    email: str(row.email) || null,
  };
}

function clientFromApi(value: unknown): Quote["client"] {
  if (!value || typeof value !== "object") return null;
  const row = value as ApiQuote;
  return { id: str(row.id), clientName: str(row.clientName) };
}

function quoteFromApi(row: ApiQuote): Quote {
  return {
    id: str(row.id),
    createdAt: str(row.createdAt) || undefined,
    updatedAt: str(row.updatedAt) || undefined,
    clientId: str(row.clientId) || null,
    leadId: str(row.leadId) || null,
    lead: leadFromApi(row.lead),
    client: clientFromApi(row.client),
    slug: str(row.slug),
    title: str(row.title),
    recipientName: str(row.recipientName),
    url: str(row.url),
    amount: numOrNull(row.amount),
    status: str(row.status),
    sentAt: str(row.sentAt) || null,
    signedAt: str(row.signedAt) || null,
    signerName: str(row.signerName) || undefined,
    signerEmail: str(row.signerEmail) || undefined,
    signatureUrl: str(row.signatureUrl) || undefined,
    signedCopyUrl: str(row.signedCopyUrl) || undefined,
  };
}

const BASE = "/api/quotes";

/** All of the user's quotes, or only one client's when `clientId` is given. */
export async function apiGetQuotes(clientId?: string): Promise<Quote[]> {
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  const rows = await api.get<ApiQuote[]>(`${BASE}${query}`);
  return rows.map(quoteFromApi);
}

/** Registers a quote URL; an already known URL is updated instead. */
export async function apiCreateQuote(input: QuotePayload & { url: string }): Promise<Quote> {
  return quoteFromApi(await api.post<ApiQuote>(BASE, input));
}

export async function apiUpdateQuote(id: string, patch: QuotePayload): Promise<Quote> {
  return quoteFromApi(await api.patch<ApiQuote>(`${BASE}/${encodeURIComponent(id)}`, patch));
}

export function apiDeleteQuote(id: string): Promise<void> {
  return api.delete(`${BASE}/${encodeURIComponent(id)}`);
}
