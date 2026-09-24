import { useState } from "react";
import type { Quote } from "@/types/quote";
import type { Lead } from "@/types/lead";
import type { Client } from "@/types/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiCreateQuote } from "@/lib/quotesApi";
import { cn } from "@/lib/utils";

const EMPTY_FORM = { url: "", title: "", amount: "", recipientName: "" };

/** "lead:<id>" | "client:<id>" | "" for the "למי" chooser. */
type Recipient = string;

function recipientIds(recipient: Recipient): { leadId?: string; clientId?: string } {
  const [kind, id] = recipient.split(":");
  if (!id) return {};
  if (kind === "lead") return { leadId: id };
  if (kind === "client") return { clientId: id };
  return {};
}

/** A lead that already became a client is offered as that client. */
function initialRecipient(leadId: string | undefined, leads: Lead[], clients: Client[]): Recipient {
  if (!leadId) return "";
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return "";
  if (lead.convertedClientId && clients.some((c) => c.id === lead.convertedClientId)) {
    return `client:${lead.convertedClientId}`;
  }
  return `lead:${lead.id}`;
}

type QuoteFormProps = {
  onSaved: (quote: Quote) => void;
  onCancel: () => void;
  onError: (message: string | null) => void;
  /** Fixed owner, as on a client's page. Hides the "למי" chooser. */
  clientId?: string;
  /** Leads and clients for the "למי" chooser. */
  recipients?: { leads: Lead[]; clients: Client[] };
  /** Lead to choose up front, e.g. when opened from the leads table. */
  initialLeadId?: string;
};

/** Registers a quote URL, from a client's page or from the quotes page. */
export function QuoteForm({
  onSaved,
  onCancel,
  onError,
  clientId,
  recipients,
  initialLeadId,
}: QuoteFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [recipient, setRecipient] = useState<Recipient>(() =>
    recipients ? initialRecipient(initialLeadId, recipients.leads, recipients.clients) : "",
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = form.url.trim();
    if (!url) return;
    const amount = form.amount.trim() === "" ? undefined : Number(form.amount);
    if (amount !== undefined && !Number.isFinite(amount)) {
      onError("הסכום אינו מספר תקין.");
      return;
    }
    const owner = recipients ? recipientIds(recipient) : { clientId };
    setSaving(true);
    onError(null);
    try {
      const saved = await apiCreateQuote({
        ...owner,
        url,
        title: form.title.trim() || undefined,
        recipientName: form.recipientName.trim() || undefined,
        amount,
      });
      setForm(EMPTY_FORM);
      onSaved(saved);
    } catch (err) {
      onError(err instanceof Error ? err.message : "שמירת ההצעה נכשלה.");
    } finally {
      setSaving(false);
    }
  }

  // Converted leads are offered as their client instead.
  const openLeads = recipients?.leads.filter((l) => !l.convertedClientId) ?? [];

  // With nobody chosen the list would have no name to show, so ask for one.
  const needsName = Boolean(recipients) && !recipient;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "grid gap-3 rounded-lg border border-border/70 p-3 md:items-end",
        recipients
          ? needsName
            ? "md:grid-cols-[1.5fr_1.5fr_2fr_1.5fr_1fr_auto]"
            : "md:grid-cols-[1.5fr_2fr_1.5fr_1fr_auto]"
          : "md:grid-cols-[2fr_1.5fr_1fr_auto]",
      )}
    >
      {recipients && (
        <div className="space-y-1">
          <Label htmlFor="quote-recipient">למי</Label>
          <select
            id="quote-recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">ללא שיוך</option>
            {openLeads.length > 0 && (
              <optgroup label="לידים">
                {openLeads.map((l) => (
                  <option key={l.id} value={`lead:${l.id}`}>
                    {l.phone ? `${l.clientName} (${l.phone})` : l.clientName}
                  </option>
                ))}
              </optgroup>
            )}
            {recipients.clients.length > 0 && (
              <optgroup label="לקוחות">
                {recipients.clients.map((c) => (
                  <option key={c.id} value={`client:${c.id}`}>
                    {c.businessName ? `${c.clientName} (${c.businessName})` : c.clientName}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      )}
      {needsName && (
        <div className="space-y-1">
          <Label htmlFor="quote-recipient-name">שם הלקוח</Label>
          <Input
            id="quote-recipient-name"
            placeholder="למי ההצעה"
            value={form.recipientName}
            onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
          />
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="quote-url">כתובת ההצעה</Label>
        <Input
          id="quote-url"
          dir="ltr"
          required
          placeholder="https://offers.matara.studio/quotes/..."
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
            setForm(EMPTY_FORM);
            onCancel();
          }}
        >
          ביטול
        </Button>
      </div>
    </form>
  );
}
