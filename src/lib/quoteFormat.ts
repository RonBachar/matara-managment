import type { Quote } from "@/types/quote";
import { QUOTE_STATUS_SIGNED } from "@/types/quote";

export function quoteDisplayTitle(quote: Quote): string {
  return quote.title || quote.slug;
}

export function formatQuoteAmount(amount: number | null): string | null {
  return amount == null ? null : `₪${amount.toLocaleString("he-IL")}`;
}

export function formatQuoteDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("he-IL");
}

/** One line under the title: when it was sent, and when and by whom it was signed. */
export function quoteDatesLine(quote: Quote, withEmail = false): string {
  const parts = [`נשלחה ${formatQuoteDate(quote.sentAt)}`];
  if (quote.status === QUOTE_STATUS_SIGNED) {
    let signed = `נחתמה ${formatQuoteDate(quote.signedAt)}`;
    if (quote.signerName) signed += ` על ידי ${quote.signerName}`;
    if (withEmail && quote.signerEmail) signed += ` (${quote.signerEmail})`;
    parts.push(signed);
  }
  return parts.join(" · ");
}
