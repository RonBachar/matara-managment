import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CLIENT_BILLING_CYCLE_OPTIONS,
  CLIENT_SERVICE_REMINDER_OPTIONS,
  type ClientServiceRecord,
} from "@/types/clientService";

type ClientServicesSectionProps = {
  services: ClientServiceRecord[];
  onCreate: (input: ServiceInput) => Promise<void>;
  onUpdate: (id: string, patch: Partial<ServiceInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type ServiceInput = Omit<ClientServiceRecord, "id" | "clientId" | "createdAt" | "updatedAt">;

type ServiceFormState = {
  serviceName: string;
  billingCycle: string;
  renewalPrice: string;
  renewalDate: string;
  reminderDaysBefore: string;
  notes: string;
};

const EMPTY_FORM: ServiceFormState = {
  serviceName: "",
  billingCycle: "",
  renewalPrice: "",
  renewalDate: "",
  reminderDaysBefore: "",
  notes: "",
};

function toFormState(service?: ClientServiceRecord): ServiceFormState {
  if (!service) return { ...EMPTY_FORM };
  return {
    serviceName: service.serviceName,
    billingCycle: service.billingCycle ?? "",
    renewalPrice: service.renewalPrice == null ? "" : String(service.renewalPrice),
    renewalDate: service.renewalDate ?? "",
    reminderDaysBefore:
      service.reminderDaysBefore == null ? "" : String(service.reminderDaysBefore),
    notes: service.notes ?? "",
  };
}

export function ClientServicesSection({ services, onCreate, onUpdate, onDelete }: ClientServicesSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ClientServiceRecord | null>(null);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const sortedServices = useMemo(
    () =>
      [...services].sort((a, b) => {
        const aDate = a.renewalDate ?? "";
        const bDate = b.renewalDate ?? "";
        if (aDate && bDate) return aDate.localeCompare(bDate);
        if (aDate) return -1;
        if (bDate) return 1;
        return a.serviceName.localeCompare(b.serviceName, "he");
      }),
    [services],
  );

  function openCreate() {
    setEditingService(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEdit(service: ClientServiceRecord) {
    setEditingService(service);
    setForm(toFormState(service));
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const renewalPriceNumber = form.renewalPrice.trim() === "" ? null : Number(form.renewalPrice);
      const payload: ServiceInput = {
        serviceName: form.serviceName.trim(),
        billingCycle: form.billingCycle.trim() || null,
        renewalPrice: Number.isFinite(renewalPriceNumber) ? renewalPriceNumber : null,
        renewalDate: form.renewalDate || null,
        reminderDaysBefore:
          form.reminderDaysBefore.trim() === "" ? null : Number(form.reminderDaysBefore),
        notes: form.notes.trim() || null,
      };

      if (editingService) {
        await onUpdate(editingService.id, payload);
      } else {
        await onCreate(payload);
      }

      setModalOpen(false);
      setEditingService(null);
      setForm({ ...EMPTY_FORM });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">שירותי לקוח</div>
          <p className="mt-1 text-sm text-muted-foreground">
            אחסון, דומיין, תחזוקה, רישיונות או כל שירות אחר שקשור ללקוח.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={openCreate}
          className="bg-[#10B981] text-white hover:bg-[#059669]"
        >
          <Plus className="me-1 h-4 w-4" />
          הוסף שירות
        </Button>
      </div>

      {sortedServices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          עדיין לא נוספו שירותים ללקוח הזה.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sortedServices.map((service) => (
            <div key={service.id} className="rounded-lg border border-border/70 bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{service.serviceName}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="secondary" size="icon-sm" onClick={() => openEdit(service)}>
                    <Pencil className="h-4 w-4 text-[#FBBF24]" />
                  </Button>
                  <Button type="button" variant="destructive" size="icon-sm" onClick={() => void onDelete(service.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="מחזור חיוב" value={service.billingCycle || "—"} />
                <Row
                  label="מחיר חידוש"
                  value={service.renewalPrice == null ? "—" : `₪${service.renewalPrice.toLocaleString("he-IL")}`}
                />
                <Row
                  label="תאריך חידוש"
                  value={service.renewalDate ? new Date(service.renewalDate).toLocaleDateString("he-IL") : "—"}
                />
                <Row
                  label="תזכורת"
                  value={
                    service.reminderDaysBefore == null
                      ? "No reminder"
                      : `${service.reminderDaysBefore} days before`
                  }
                />
                <Row label="הערות" value={service.notes || "—"} />
              </dl>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                {editingService ? "עריכת שירות" : "שירות חדש"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                סגירה
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Service Name" required>
                  <Input
                    value={form.serviceName}
                    onChange={(e) => setForm((prev) => ({ ...prev, serviceName: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="מחזור חיוב">
                  <Select
                    value={form.billingCycle || "__empty__"}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        billingCycle: !value || value === "__empty__" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחר מחזור חיוב" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">ללא</SelectItem>
                      {CLIENT_BILLING_CYCLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="מחיר חידוש">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={form.renewalPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, renewalPrice: e.target.value }))}
                  />
                </Field>
                <Field label="תאריך חידוש">
                  <Input
                    type="date"
                    value={form.renewalDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, renewalDate: e.target.value }))}
                  />
                </Field>
                <Field label="Reminder">
                  <Select
                    value={form.reminderDaysBefore || "__none__"}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        reminderDaysBefore: !value || value === "__none__" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select reminder" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_SERVICE_REMINDER_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value === "" ? "__none__" : option.value}
                          value={option.value === "" ? "__none__" : option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="הערות">
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </Field>

              <div className="flex justify-between gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                  ביטול
                </Button>
                <Button type="submit" size="sm" className="px-4" disabled={isSaving}>
                  {isSaving ? "שומר..." : "שמירה"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

type RowProps = {
  label: string;
  value: string;
};

function Row({ label, value }: RowProps) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({ label, required, children }: FieldProps) {
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
