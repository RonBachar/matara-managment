import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Client } from "@/types/client";
import type { ClientPayload } from "@/lib/clientsApi";

type ClientFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialClient?: Client;
  onClose: () => void;
  onSubmit: (client: ClientPayload) => Promise<void> | void;
};

type ClientFormState = {
  businessName: string;
  clientName: string;
  phone: string;
  email: string;
  website: string;
  notes: string;
  contractUrl: string;
};

const EMPTY_FORM: ClientFormState = {
  businessName: "",
  clientName: "",
  phone: "",
  email: "",
  website: "",
  notes: "",
  contractUrl: "",
};

function formFromClient(client: Client): ClientFormState {
  return {
    businessName: client.businessName,
    clientName: client.clientName,
    phone: client.phone,
    email: client.email,
    website: client.website ?? "",
    notes: client.notes ?? "",
    contractUrl: client.contractUrl ?? "",
  };
}

export function ClientFormModal({
  open,
  mode,
  initialClient,
  onClose,
  onSubmit,
}: ClientFormModalProps) {
  const [form, setForm] = useState<ClientFormState>(() =>
    initialClient ? formFromClient(initialClient) : EMPTY_FORM,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setIsSaving(false);
    setError(null);
    setForm(initialClient ? formFromClient(initialClient) : EMPTY_FORM);
  }, [open, initialClient]);

  function handleChange<K extends keyof ClientFormState>(key: K, value: ClientFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        businessName: form.businessName.trim(),
        clientName: form.clientName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim() || null,
        notes: form.notes.trim() || null,
        contractUrl: form.contractUrl.trim() || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-xl border border-border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
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
            <Field label="שם העסק">
              <Input
                value={form.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
              />
            </Field>
            <Field label="איש קשר" required>
              <Input
                value={form.clientName}
                onChange={(e) => handleChange("clientName", e.target.value)}
                required
              />
            </Field>
            <Field label="טלפון" required>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </Field>
            <Field label="אימייל" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </Field>
            <Field label="אתר">
              <Input
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="קישור להסכם חתום">
              <Input
                type="url"
                value={form.contractUrl}
                onChange={(e) => handleChange("contractUrl", e.target.value)}
                placeholder="https://drive.google.com/…"
              />
            </Field>
          </div>

          <Field label="הערות">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
              disabled={isSaving}
            >
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
