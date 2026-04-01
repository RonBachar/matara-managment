import { useEffect, useState, type FormEvent } from "react";
import type { Lead, LeadEditableStatus } from "@/types/lead";
import { LEAD_EDITABLE_STATUS_OPTIONS } from "@/types/lead";
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
import { cn } from "@/lib/utils";

const LEAD_SOURCE_OPTIONS = [
  "פנייה מהאתר",
  "גוגל Ads",
  "פייסבוק",
  "אינסטגרם",
  "וואטסאפ",
  "הפניה / מפה לאוזן",
  "אחר",
] as const;

type LeadInput = Omit<Lead, "id">;

type LeadFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialLead?: Lead;
  onClose: () => void;
  onSubmit: (lead: LeadInput) => void;
};

type FormState = {
  clientName: string;
  phone: string;
  email: string;
  leadSource: string;
  status: string;
  notes: string;
};

const emptyForm: FormState = {
  clientName: "",
  phone: "",
  email: "",
  leadSource: "",
  status: "חדש",
  notes: "",
};

export function LeadFormModal({
  open,
  mode,
  initialLead,
  onClose,
  onSubmit,
}: LeadFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const isConverted = Boolean(initialLead?.convertedClientId);

  useEffect(() => {
    if (!open) return;
    if (initialLead) {
      setForm({
        clientName: initialLead.clientName,
        phone: initialLead.phone,
        email: initialLead.email ?? "",
        leadSource: initialLead.leadSource,
        status: initialLead.status,
        notes: initialLead.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setIsSaving(false);
  }, [open, initialLead]);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const emailTrim = form.email.trim();
      const statusValue: Lead["status"] = isConverted
        ? "הפך ללקוח"
        : (form.status as LeadEditableStatus);

      const next: LeadInput = {
        clientName: form.clientName.trim(),
        phone: form.phone.trim(),
        email: emailTrim.length > 0 ? emailTrim : undefined,
        leadSource: form.leadSource.trim(),
        status: statusValue,
        notes: (form.notes ?? "").trim() || undefined,
        convertedClientId: initialLead?.convertedClientId,
        agreementFileId: initialLead?.agreementFileId,
        agreementFileName: initialLead?.agreementFileName,
        agreementFileType: initialLead?.agreementFileType,
      };
      onSubmit(next);
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
            {mode === "create" ? "ליד חדש" : "עריכת ליד"}
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
          {isConverted && (
            <div
              className={cn(
                "rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800",
              )}
            >
              ליד זה כבר הומר ללקוח. ניתן לעדכן פרטים בסיסיים בלבד; ההמרה נשמרת.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="שם הלקוח" required>
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
            <Field label="אימייל">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                inputMode="email"
                autoComplete="email"
              />
            </Field>
            <Field label="מקור ליד">
              <Select
                value={form.leadSource}
                onValueChange={(value) => handleChange("leadSource", value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר מקור" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="סטטוס">
              {isConverted ? (
                <Input
                  readOnly
                  value="הפך ללקוח"
                  className="bg-muted/50"
                />
              ) : (
                <Select
                  value={form.status}
                  onValueChange={(value) => handleChange("status", value ?? "חדש")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_EDITABLE_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>

          <Field label="הערות">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </Field>

          <div className="flex justify-between gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              ביטול
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="px-4"
              disabled={isSaving}
            >
              שמירה
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
