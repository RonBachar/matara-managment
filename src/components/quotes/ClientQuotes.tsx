import { useEffect, useState } from "react";
import type { Quote } from "@/types/quote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiCreateQuote, apiDeleteQuote, apiGetQuotes } from "@/lib/quotesApi";
import { QuoteLinks, QuoteStatusBadge } from "@/components/quotes/QuoteBits";
import { formatQuoteAmount, quoteDatesLine, quoteDisplayTitle } from "@/lib/quoteFormat";

const EMPTY_FORM = { url: "", title: "", amount: "" };

/** The "הצעות מחיר" card on a client's page. */
export function ClientQuotes({ clientId }: { clientId: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const url = form.url.trim();
    if (!url) return;
    const amount = form.amount.trim() === "" ? undefined : Number(form.amount);
    if (amount !== undefined && !Number.isFinite(amount)) {
      setError("הסכום אינו מספר תקין.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await apiCreateQuote({
        clientId,
        url,
        title: form.title.trim() || undefined,
        amount,
      });
      // Re-adding a known URL updates it, so replace rather than duplicate.
      setQuotes((prev) => [saved, ...prev.filter((q) => q.id !== saved.id)]);
      setForm(EMPTY_FORM);
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שמירת ההצעה נכשלה.");
    } finally {
      setSaving(false);
    }
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
        <form
          onSubmit={handleAdd}
          className="grid gap-3 rounded-lg border border-border/70 p-3 md:grid-cols-[2fr_1.5fr_1fr_auto] md:items-end"
        >
          <div className="space-y-1">
            <Label htmlFor="quote-url">כתובת ההצעה</Label>
            <Input
              id="quote-url"
              dir="ltr"
              required
              placeholder="https://matara-price-offers.netlify.app/quotes/..."
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quote-title">כותרת</Label>
            <Input
              id="quote-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quote-amount">סכום (₪)</Label>
            <Input
              id="quote-amount"
              type="number"
              min="0"
              step="any"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving || !form.url.trim()}>
              שמירה
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setForm(EMPTY_FORM);
              }}
            >
              ביטול
            </Button>
          </div>
        </form>
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

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת הצעת מחיר</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `למחוק את "${quoteDisplayTitle(pendingDelete)}"? ` : ""}
              ההצעה עצמה באתר ההצעות לא תימחק, רק הרישום כאן.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" size="sm">
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              size="sm"
              onClick={() => {
                if (pendingDelete) void handleDelete(pendingDelete);
              }}
            >
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
