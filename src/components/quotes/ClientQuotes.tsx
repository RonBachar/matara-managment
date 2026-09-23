import { useEffect, useState } from "react";
import type { Quote } from "@/types/quote";
import { Button } from "@/components/ui/button";
import { apiDeleteQuote, apiGetQuotes } from "@/lib/quotesApi";
import { QuoteLinks, QuoteStatusBadge } from "@/components/quotes/QuoteBits";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { DeleteQuoteDialog } from "@/components/quotes/DeleteQuoteDialog";
import { formatQuoteAmount, quoteDatesLine, quoteDisplayTitle } from "@/lib/quoteFormat";

/** The "הצעות מחיר" card on a client's page. */
export function ClientQuotes({ clientId }: { clientId: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Quote | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetQuotes(clientId)
      .then((rows) => {
        if (!cancelled) setQuotes(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "טעינת ההצעות נכשלה.");
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  function handleSaved(saved: Quote) {
    // Re-adding a known URL updates it, so replace rather than duplicate.
    setQuotes((prev) => [saved, ...prev.filter((q) => q.id !== saved.id)]);
    setAdding(false);
  }

  async function handleDelete(quote: Quote) {
    try {
      await apiDeleteQuote(quote.id);
      setQuotes((prev) => prev.filter((q) => q.id !== quote.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "מחיקת ההצעה נכשלה.");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">הצעות מחיר</div>
        {!adding && (
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
            הוספת הצעה
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {adding && (
        <QuoteForm
          clientId={clientId}
          onSaved={handleSaved}
          onCancel={() => setAdding(false)}
          onError={setError}
        />
      )}

      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין הצעות מחיר ללקוח הזה.</p>
      ) : (
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
                  <div className="text-xs text-muted-foreground">{quoteDatesLine(quote)}</div>
                  <QuoteLinks quote={quote} />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setPendingDelete(quote)}
                >
                  מחיקה
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <DeleteQuoteDialog
        quote={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={(quote) => void handleDelete(quote)}
      />
    </div>
  );
}
