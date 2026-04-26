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
import { deleteAgreementFile, saveAgreementFile } from "@/lib/agreementFiles";
import { PACKAGE_TYPE_LABELS, REMINDER_OPTIONS, type Client, type PackageType } from "@/types/client";
import type { ClientPayload } from "@/lib/clientsApi";

const AGREEMENT_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ClientInput = ClientPayload;

type ClientFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialClient?: Client;
  onClose: () => void;
  onSubmit: (client: ClientInput) => Promise<void> | void;
};

type ClientFormState = {
  businessName: string;
  clientName: string;
  phone: string;
  email: string;
  website: string;
  notes: string;
  packageType: PackageType;
  packagePrice: string;
  renewalDate: string;
  reminderDaysBefore: string;
  agreementFileId: string | null;
  agreementFileName: string | null;
  agreementFileType: string | null;
};

function createEmptyForm(): ClientFormState {
  return {
    businessName: "",
    clientName: "",
    phone: "",
    email: "",
    website: "",
    notes: "",
    packageType: "none",
    packagePrice: "",
    renewalDate: "",
    reminderDaysBefore: "",
    agreementFileId: null,
    agreementFileName: null,
    agreementFileType: null,
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
    initialClient
      ? {
          businessName: initialClient.businessName,
          clientName: initialClient.clientName,
          phone: initialClient.phone,
          email: initialClient.email,
          website: initialClient.website ?? "",
          notes: initialClient.notes ?? "",
          packageType: initialClient.packageType ?? "none",
          packagePrice:
            initialClient.packagePrice == null ? "" : String(initialClient.packagePrice),
          renewalDate: initialClient.renewalDate ?? "",
          reminderDaysBefore:
            initialClient.reminderDaysBefore == null ? "" : String(initialClient.reminderDaysBefore),
          agreementFileId: initialClient.agreementFileId ?? null,
          agreementFileName: initialClient.agreementFileName ?? null,
          agreementFileType: initialClient.agreementFileType ?? null,
        }
      : createEmptyForm(),
  );
  const [pendingContractFile, setPendingContractFile] = useState<File | null>(null);
  const [contractClearRequested, setContractClearRequested] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPendingContractFile(null);
    setContractClearRequested(false);
    setIsSaving(false);

    if (initialClient) {
      setForm({
        businessName: initialClient.businessName,
        clientName: initialClient.clientName,
        phone: initialClient.phone,
        email: initialClient.email,
        website: initialClient.website ?? "",
        notes: initialClient.notes ?? "",
        packageType: initialClient.packageType ?? "none",
        packagePrice: initialClient.packagePrice == null ? "" : String(initialClient.packagePrice),
        renewalDate: initialClient.renewalDate ?? "",
        reminderDaysBefore:
          initialClient.reminderDaysBefore == null ? "" : String(initialClient.reminderDaysBefore),
        agreementFileId: initialClient.agreementFileId ?? null,
        agreementFileName: initialClient.agreementFileName ?? null,
        agreementFileType: initialClient.agreementFileType ?? null,
      });
      return;
    }

    setForm(createEmptyForm());
  }, [open, initialClient]);

  function handleChange<K extends keyof ClientFormState>(key: K, value: ClientFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);

    try {
      let agreementFileId = form.agreementFileId ?? undefined;
      let agreementFileName = form.agreementFileName ?? undefined;
      let agreementFileType = form.agreementFileType ?? undefined;

      if (contractClearRequested) {
        if (initialClient?.agreementFileId) {
          await deleteAgreementFile(initialClient.agreementFileId);
        }
        agreementFileId = undefined;
        agreementFileName = undefined;
        agreementFileType = undefined;
      } else if (pendingContractFile) {
        if (initialClient?.agreementFileId) {
          await deleteAgreementFile(initialClient.agreementFileId);
        }
        const ref = await saveAgreementFile(pendingContractFile);
        agreementFileId = ref.agreementFileId;
        agreementFileName = ref.agreementFileName;
        agreementFileType = ref.agreementFileType;
      }

      const packagePriceNumber =
        form.packagePrice.trim() === "" ? null : Number(form.packagePrice.trim());
      const reminderDays =
        form.reminderDaysBefore.trim() === "" ? null : Number(form.reminderDaysBefore.trim());

      await Promise.resolve(
        onSubmit({
          businessName: form.businessName.trim(),
          clientName: form.clientName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          website: form.website?.trim() || null,
          notes: form.notes?.trim() || null,
          packageType: form.packageType,
          packagePrice:
            form.packageType !== "none" && Number.isFinite(packagePriceNumber)
              ? packagePriceNumber
              : null,
          renewalDate: form.packageType !== "none" ? form.renewalDate || null : null,
          reminderDaysBefore:
            form.packageType !== "none" && form.renewalDate && Number.isFinite(reminderDays)
              ? reminderDays
              : null,
          agreementFileId: agreementFileId ?? null,
          agreementFileName: agreementFileName ?? null,
          agreementFileType: agreementFileType ?? null,
        }),
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) return null;

  const title = mode === "create" ? "לקוח חדש" : "עריכת לקוח";
  const agreementDisplayName =
    pendingContractFile?.name ?? (!contractClearRequested ? form.agreementFileName : undefined);
  const showPackageFields = form.packageType !== "none";
  const showReminderField = form.renewalDate.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-xl border border-border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
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
                value={form.website ?? ""}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://"
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

          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
            <div>
              <div className="text-sm font-medium">חבילה</div>
              <p className="text-xs text-muted-foreground">החבילה הפעילה של הלקוח ונתוני החידוש.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="סוג חבילה">
                <Select
                  value={form.packageType}
                  onValueChange={(value) => {
                    const packageType = value as PackageType;
                    setForm((prev) => ({
                      ...prev,
                      packageType,
                      packagePrice: packageType === "none" ? "" : prev.packagePrice,
                      renewalDate: packageType === "none" ? "" : prev.renewalDate,
                      reminderDaysBefore: packageType === "none" ? "" : prev.reminderDaysBefore,
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="בחר חבילה" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PACKAGE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {showPackageFields ? (
                <Field label="מחיר">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={form.packagePrice}
                    onChange={(e) => handleChange("packagePrice", e.target.value)}
                  />
                </Field>
              ) : (
                <div />
              )}

              {showPackageFields && (
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
              )}

              {showPackageFields && showReminderField && (
                <Field label="תזכורת">
                  <Select
                    value={form.reminderDaysBefore || "__empty__"}
                    onValueChange={(value) =>
                      handleChange("reminderDaysBefore", value === "__empty__" ? "" : value)
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
          </div>

          <Field label="הסכם חתום (אופציונלי)">
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept={AGREEMENT_ACCEPT}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPendingContractFile(file);
                    setContractClearRequested(false);
                  }
                  e.target.value = "";
                }}
                className="cursor-pointer"
              />
              {agreementDisplayName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {pendingContractFile
                      ? `קובץ חדש: ${agreementDisplayName}`
                      : `קובץ שמור: ${agreementDisplayName}`}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setPendingContractFile(null);
                      setContractClearRequested(true);
                      setForm((prev) => ({
                        ...prev,
                        agreementFileId: null,
                        agreementFileName: null,
                        agreementFileType: null,
                      }));
                    }}
                  >
                    הסר קובץ
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  PDF, Word וכו' - נשמר מקומית בדפדפן (IndexedDB)
                </span>
              )}
            </div>
          </Field>

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
