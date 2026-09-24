import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Quote } from "@/types/quote";
import type { Lead } from "@/types/lead";
import type { Client } from "@/types/client";
import { QUOTE_STATUS_SENT, QUOTE_STATUS_SIGNED } from "@/types/quote";
import { Button } from "@/components/ui/button";
import { QuoteLinks, QuoteStatusBadge } from "@/components/quotes/QuoteBits";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { DeleteQuoteDialog } from "@/components/quotes/DeleteQuoteDialog";
import { apiDeleteQuote, apiGetQuotes } from "@/lib/quotesApi";
import { apiGetClients } from "@/lib/clientsApi";
import { fetchLeads } from "@/lib/leadsApi";
import { formatQuoteDate, quoteDisplayTitle } from "@/lib/quoteFormat";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | typeof QUOTE_STATUS_SENT | typeof QUOTE_STATUS_SIGNED;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: QUOTE_STATUS_SENT, label: "נשלחה" },
  { value: QUOTE_STATUS_SIGNED, label: "נחתמה" },
];

function sentTime(quote: Quote): number {
  const t = quote.sentAt ? new Date(quote.sentAt).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

/** Who the quote belongs to: the client once there is one, otherwise the lead. */
function QuoteOwner({ quote }: { quote: Quote }) {
  if (quote.client) {
    return (
      <Link to={`/clients/${quote.client.id}`} className="text-foreground underline-offset-2 hover:underline">
        {quote.client.clientName}
      </Link>
    );
  }
  if (quote.lead) {
    return (
      <Link to="/leads" className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline">
        {quote.lead.clientName}
        <span className="rounded-full border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">
          ליד
        </span>
      </Link>
    );
  }
  return <span className="text-muted-foreground">ללא שיוך</span>;
}

export function Quotes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLeadId = searchParams.get("lead") ?? undefined;

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [adding, setAdding] = useState(Boolean(initialLeadId));
  const [pendingDelete, setPendingDelete] = useState<Quote | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiGetQuotes(), fetchLeads(), apiGetClients()])
      .then(([quoteRows, leadRows, clientRows]) => {
        if (cancelled) return;
        setQuotes(quoteRows);
        setLeads(leadRows);
        setClients(clientRows);
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "טעינת ההצעות נכשלה.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () =>
      quotes
        .filter((q) => filter === "all" || q.status === filter)
        .sort((a, b) => sentTime(b) - sentTime(a)),
    [quotes, filter],
  );

  function closeForm() {
    setAdding(false);
    // Drop "?lead=" so a refresh does not reopen the form.
    if (initialLeadId) setSearchParams({}, { replace: true });
  }

  function handleSaved(saved: Quote) {
    // Re-adding a known URL updates it, so replace rather than duplicate.
    setQuotes((prev) => [saved, ...prev.filter((q) => q.id !== saved.id)]);
    closeForm();
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
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">הצעות מחיר</h2>
          <p className="text-sm text-muted-foreground">הצעות שנשלחו ללידים וללקוחות, עד החתימה.</p>
        </div>
        {!adding && (
          <Button
            size="sm"
            onClick={() => setAdding(true)}
            className="bg-[#10B981] text-white hover:bg-[#059669]"
          >
            הצעה חדשה
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {adding && loaded && (
        <QuoteForm
          recipients={{ leads, clients }}
          initialLeadId={initialLeadId}
          onSaved={handleSaved}
          onCancel={closeForm}
          onError={setError}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === f.value
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr className="text-right">
              <th className="px-3 py-2 font-medium">שם הלקוח</th>
              <th className="px-3 py-2 font-medium">תיאור</th>
              <th className="px-3 py-2 font-medium">סטטוס</th>
              <th className="px-3 py-2 font-medium">נשלחה</th>
              <th className="px-3 py-2 font-medium">נחתמה</th>
              <th className="px-3 py-2 font-medium">קישור</th>
              <th className="px-3 py-2 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  {loaded ? "אין הצעות מחיר." : "טוען..."}
                </td>
              </tr>
            ) : (
              visible.map((quote) => (
                <tr key={quote.id} className="border-t border-border/70 align-middle">
                  <td className="px-3 py-2 font-medium">
                    <QuoteOwner quote={quote} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{quoteDisplayTitle(quote)}</td>
                  <td className="px-3 py-2">
                    <QuoteStatusBadge status={quote.status} />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatQuoteDate(quote.sentAt)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatQuoteDate(quote.signedAt)}</td>
                  <td className="px-3 py-2">
                    <QuoteLinks quote={quote} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDelete(quote)}
                    >
                      מחיקה
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeleteQuoteDialog
        quote={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={(quote) => void handleDelete(quote)}
      />
    </section>
  );
}
