import { useEffect, useState } from "react";
import type { Client } from "@/types/client";
import type { Quote } from "@/types/quote";
import { apiGetQuotes, apiUpdateQuote } from "@/lib/quotesApi";
import { QuoteLinks, QuoteStatusBadge } from "@/components/quotes/QuoteBits";
import { formatQuoteAmount, quoteDatesLine, quoteDisplayTitle } from "@/lib/quoteFormat";

/**
 * Quotes with no client: usually a signing webhook for a quote page that was
 * never registered on a client and whose signer email matched nobody.
 * Renders nothing when there are none.
 */
export function UnlinkedQuotes({ clients }: { clients: Client[] }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetQuotes()
      .then((rows) => {
        if (!cancelled) setQuotes(rows.filter((q) => !q.clientId));
      })
      .catch(() => {
        if (!cancelled) setQuotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function link(quote: Quote, clientId: string) {
    if (!clientId) return;
    try {
      await apiUpdateQuote(quote.id, { clientId });
      setQuotes((prev) => prev.filter((q) => q.id !== quote.id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שיוך ההצעה נכשל.");
    }
  }

  if (quotes.length === 0) return null;

  return (
    <section className="mt-6 space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="text-sm font-semibold">הצעות ללא לקוח</div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className="divide-y divide-border/70">
        {quotes.map((quote) => {
          const amount = formatQuoteAmount(quote.amount);
          return (
            <li key={quote.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{quoteDisplayTitle(quote)}</span>
                  <QuoteStatusBadge status={quote.status} />
                  {amount && <span className="text-sm text-muted-foreground">{amount}</span>}
                </div>
                <div className="text-xs text-muted-foreground">{quoteDatesLine(quote, true)}</div>
                <QuoteLinks quote={quote} />
              </div>
              <select
                aria-label="שיוך ללקוח"
                defaultValue=""
                onChange={(e) => void link(quote, e.target.value)}
                className="h-9 w-48 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">שיוך ללקוח...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName ? `${c.clientName} (${c.businessName})` : c.clientName}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
