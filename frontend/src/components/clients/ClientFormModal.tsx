import { useEffect, useState, type FormEvent } from "react";
import type { PackageType } from "@/types/client";
import { getPackageTypeLabel } from "@/types/client";
import { PACKAGE_OPTIONS } from "@/data/mockClients";
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
  deleteAgreementFile,
  saveAgreementFile,
} from "@/lib/agreementFiles";
import type { ClientRecord } from "@/types/clientRecord";

const AGREEMENT_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ClientInput = Omit<ClientRecord, "id" | "createdAt" | "updatedAt">;

type ClientFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialClient?: ClientRecord;
  onClose: () => void;
  onSubmit: (client: ClientInput) => void;
};

type ClientFormState = Omit<ClientInput, "renewalPrice"> & { renewalPrice: string };

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
          ...initialClient,
          renewalPrice: String(initialClient.renewalPrice ?? ""),
        }
      : {
          businessName: "",
          clientName: "",
          phone: "",
          email: "",
          website: "",
          notes: "",
          packageType: "Hosting + Elementor Pro",
          renewalPrice: "",
          renewalDate: "",
          agreementFileId: null,
          agreementFileName: null,
          agreementFileType: null,
        },
  );
  const [pendingContractFile, setPendingContractFile] = useState<File | null>(
    null,
  );
  const [contractClearRequested, setContractClearRequested] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPendingContractFile(null);
    setContractClearRequested(false);
    setIsSaving(false);
    if (initialClient) {
      setForm({
        ...initialClient,
        renewalPrice: String(initialClient.renewalPrice ?? ""),
      });
    } else {
      setForm({
        businessName: "",
        clientName: "",
        phone: "",
        email: "",
        website: "",
        notes: "",
        packageType: "Hosting + Elementor Pro",
        renewalPrice: "",
        renewalDate: "",
        agreementFileId: null,
        agreementFileName: null,
        agreementFileType: null,
      });
    }
  }, [open, initialClient]);

  function handleChange<K extends keyof ClientFormState>(
    key: K,
    value: ClientFormState[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "packageType" && value === "None") {
        next.renewalPrice = "";
        next.renewalDate = "";
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const priceNumber = Number(form.renewalPrice || 0);
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

      const base: ClientInput = {
        businessName: form.businessName.trim(),
        clientName: form.clientName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website?.trim() || null,
        notes: form.notes?.trim() || null,
        packageType: form.packageType ?? null,
        renewalPrice:
          form.packageType !== "None"
            ? Number.isNaN(priceNumber)
              ? 0
              : priceNumber
            : null,
        renewalDate: form.packageType !== "None" ? (form.renewalDate || null) : null,
        agreementFileId: agreementFileId ?? null,
        agreementFileName: agreementFileName ?? null,
        agreementFileType: agreementFileType ?? null,
      };

      onSubmit(base);
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) return null;

  const title = mode === "create" ? "לקוח חדש" : "עריכת לקוח";
  const agreementDisplayName =
    pendingContractFile?.name ??
    (!contractClearRequested ? form.agreementFileName : undefined);

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
            <Field label="סוג חבילה">
              <Select
                value={form.packageType ?? "None"}
                onValueChange={(value) =>
                  handleChange(
                    "packageType",
                    value as ClientFormState["packageType"],
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר סוג חבילה">
                    {getPackageTypeLabel((form.packageType ?? "None") as PackageType)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {getPackageTypeLabel(option as PackageType)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {form.packageType !== "None" && (
              <>
                <Field label="מחיר חידוש (ש״ח)">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={form.renewalPrice}
                    onChange={(e) =>
                      handleChange("renewalPrice", e.target.value)
                    }
                    min={0}
                  />
                </Field>
                <Field label="תאריך חידוש">
                  <Input
                    type="date"
                    value={form.renewalDate ?? ""}
                    onChange={(e) =>
                      handleChange("renewalDate", e.target.value)
                    }
                  />
                </Field>
              </>
            )}
          </div>

          <Field label="הערות">
            <Textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </Field>

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
                  PDF, Word וכו׳ — נשמר מקומית בדפדפן (IndexedDB)
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
              {isSaving ? "שומר…" : "שמירה"}
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
