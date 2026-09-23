import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Client, ClientPayload } from "@/types/client";
import { PACKAGE_TYPE_OPTIONS, REMINDER_OPTIONS } from "@/types/client";

type ClientFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialClient?: Client;
  onClose: () => void;
  onSubmit: (client: Partial<ClientPayload>) => Promise<void> | void;
};

type FormState = {
  clientName: string;
  businessName: string;
  phone: string;
  email: string;
  serviceType: string;
  leadSource: string;
  website: string;
  contractUrl: string;
  packageType: string;
  renewalPrice: string;
  renewalDate: string;
  reminderDaysBefore: string;
  notes: string;
};

const EMPTY: FormState = {
  clientName: "",
  businessName: "",
  phone: "",
  email: "",
  serviceType: "",
  leadSource: "",
  website: "",
  contractUrl: "",
  packageType: "",
  renewalPrice: "",
  renewalDate: "",
  reminderDaysBefore: "",
  notes: "",
};

/** The date input wants YYYY-MM-DD; the API returns a full ISO timestamp. */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function formFromClient(c: Client): FormState {
  return {
    clientName: c.clientName,
    businessName: c.businessName,
    phone: c.phone,
    email: c.email,
    serviceType: c.serviceType,
    leadSource: c.leadSource,
    website: c.website ?? "",
    contractUrl: c.contractUrl ?? "",
    packageType: c.packageType ?? "",
    renewalPrice: c.renewalPrice == null ? "" : String(c.renewalPrice),
    renewalDate: toDateInput(c.renewalDate),
    reminderDaysBefore: c.reminderDaysBefore == null ? "" : String(c.reminderDaysBefore),
    notes: c.notes ?? "",
  };
}

export function ClientFormModal({
  open,
  mode,
  initialClient,
  onClose,
  onSubmit,
}: ClientFormModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    initialClient ? formFromClient(initialClient) : EMPTY,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setIsSaving(false);
    setError(null);
    setForm(initialClient ? formFromClient(initialClient) : EMPTY);
  }, [open, initialClient]);

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        clientName: form.clientName.trim(),
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        serviceType: form.serviceType.trim(),
        leadSource: form.leadSource.trim(),
        website: form.website.trim() || undefined,
        contractUrl: form.contractUrl.trim() || undefined,
        packageType: form.packageType || undefined,
        renewalPrice: form.renewalPrice ? Number(form.renewalPrice) : null,
        renewalDate: form.renewalDate || null,
        reminderDaysBefore: form.reminderDaysBefore ? Number(form.reminderDaysBefore) : null,
        notes: form.notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "השמירה נכשלה.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {mode === "create" ? "לקוח חדש" : "עריכת לקוח"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            סגירה
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="שם הלקוח" required>
              <Input
                value={form.clientName}
                onChange={(e) => change("clientName", e.target.value)}
                required
              />
            </Field>
            <Field label="שם העסק">
              <Input
                value={form.businessName}
                onChange={(e) => change("businessName", e.target.value)}
              />
            </Field>
            <Field label="טלפון">
              <Input value={form.phone} onChange={(e) => change("phone", e.target.value)} />
            </Field>
            <Field label="אימייל">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => change("email", e.target.value)}
              />
            </Field>
            <Field label="שירות מבוקש">
              <Input
                value={form.serviceType}
                onChange={(e) => change("serviceType", e.target.value)}
                placeholder="אתר תדמית, חנות..."
              />
            </Field>
            <Field label="מקור">
              <Input
                value={form.leadSource}
                onChange={(e) => change("leadSource", e.target.value)}
              />
            </Field>
            <Field label="אתר">
              <Input
                value={form.website}
                onChange={(e) => change("website", e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="קישור לחוזה חתום">
              <Input
                type="url"
                value={form.contractUrl}
                onChange={(e) => change("contractUrl", e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-lg border border-border/70 p-3">
            <div className="text-xs font-semibold text-foreground">חבילה מתחדשת</div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="סוג חבילה">
                <select
                  value={form.packageType}
                  onChange={(e) => change("packageType", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">ללא חבילה</option>
                  {PACKAGE_TYPE_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="מחיר חידוש (₪)">
                <Input
                  type="number"
                  min={0}
                  value={form.renewalPrice}
                  onChange={(e) => change("renewalPrice", e.target.value)}
                />
              </Field>
              <Field label="תאריך חידוש">
                <Input
                  type="date"
                  value={form.renewalDate}
                  onChange={(e) => change("renewalDate", e.target.value)}
                />
              </Field>
              <Field label="תזכורת">
                <select
                  value={form.reminderDaysBefore}
                  onChange={(e) => change("reminderDaysBefore", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">ללא תזכורת</option>
                  {REMINDER_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <Field label="הערות">
            <Textarea rows={3} value={form.notes} onChange={(e) => change("notes", e.target.value)} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
              ביטול
            </Button>
            <Button type="submit" size="sm" className="px-4" disabled={isSaving}>
              {isSaving ? "שומר..." : "שמירה"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
