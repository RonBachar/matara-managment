import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLE_OPTIONS,
  REMINDER_OPTIONS,
  type BillingCycle,
  type ClientService,
  type ClientServiceInput,
} from "@/types/clientService";

type ClientServiceFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialService?: ClientService;
  onClose: () => void;
  onSubmit: (input: ClientServiceInput) => Promise<void> | void;
};

type FormState = {
  serviceName: string;
  billingCycle: BillingCycle;
  renewalPrice: string;
  renewalDate: string;
  reminderDaysBefore: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    serviceName: "",
    billingCycle: "monthly",
    renewalPrice: "",
    renewalDate: "",
    reminderDaysBefore: "",
    notes: "",
  };
}

function serviceToForm(service: ClientService): FormState {
  return {
    serviceName: service.serviceName,
    billingCycle: (BILLING_CYCLE_OPTIONS.includes(service.billingCycle as BillingCycle)
      ? service.billingCycle
      : "monthly") as BillingCycle,
    renewalPrice: service.renewalPrice == null ? "" : String(service.renewalPrice),
    renewalDate: service.renewalDate ? service.renewalDate.slice(0, 10) : "",
    reminderDaysBefore:
      service.reminderDaysBefore == null ? "" : String(service.reminderDaysBefore),
    notes: service.notes ?? "",
  };
}

export function ClientServiceFormModal({
  open,
  mode,
  initialService,
  onClose,
  onSubmit,
}: ClientServiceFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsSaving(false);
    if (initialService) {
      setForm(serviceToForm(initialService));
    } else {
      setForm(emptyForm());
    }
  }, [open, initialService]);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const renewalPrice =
        form.renewalPrice.trim() === "" ? null : Number(form.renewalPrice.trim());
      const reminderDays =
        form.reminderDaysBefore.trim() === "" ? null : Number(form.reminderDaysBefore.trim());

      await Promise.resolve(
        onSubmit({
          serviceName: form.serviceName.trim(),
          billingCycle: form.billingCycle,
          renewalPrice: Number.isFinite(renewalPrice) ? renewalPrice : null,
          renewalDate: form.renewalDate || null,
          reminderDaysBefore:
            form.renewalDate && Number.isFinite(reminderDays) ? reminderDays : null,
          notes: form.notes.trim() || null,
        }),
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) return null;

  const showReminder = form.renewalDate.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {mode === "create" ? "שירות חדש" : "עריכת שירות"}
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
          <Field label="שם השירות" required>
            <Input
              value={form.serviceName}
              onChange={(e) => handleChange("serviceName", e.target.value)}
              required
            />
          </Field>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="מחזור חיוב">
              <Select
                value={form.billingCycle}
                onValueChange={(value) => handleChange("billingCycle", value as BillingCycle)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLE_OPTIONS.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {BILLING_CYCLE_LABELS[cycle]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="מחיר חידוש (₪)">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.renewalPrice}
                onChange={(e) => handleChange("renewalPrice", e.target.value)}
              />
            </Field>

            <Field label="תאריך חידוש">
              <Input
                type="date"
                value={form.renewalDate}
                onChange={(e) => {
                  const renewalDate = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    renewalDate,
                    reminderDaysBefore: renewalDate ? prev.reminderDaysBefore : "",
                  }));
                }}
              />
            </Field>

            {showReminder && (
              <Field label="תזכורת">
                <Select
                  value={form.reminderDaysBefore || "__empty__"}
                  onValueChange={(value) =>
                    handleChange(
                      "reminderDaysBefore",
                      value == null || value === "__empty__" ? "" : value,
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="בחר מועד תזכורת" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">ללא תזכורת</SelectItem>
                    {REMINDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <Field label="הערות">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </Field>

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
