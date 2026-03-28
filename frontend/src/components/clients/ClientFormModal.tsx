import { useEffect, useState, type FormEvent } from "react";
import type { Client, ClientType, PackageType } from "@/types/client";
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
import { cn } from "@/lib/utils";
import { getClientTypeLabel } from "@/lib/client-type";
import {
  deleteContractFile,
  saveContractFile,
} from "@/lib/agreementFiles";

const CONTRACT_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ClientInput = Omit<Client, "id">;

type ClientFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialClient?: Client;
  onClose: () => void;
  onSubmit: (client: ClientInput) => void;
};

type ClientFormState = Omit<
  Client,
  "id" | "renewalPrice" | "clientType" | "workContractFileName"
> & {
  clientType: ClientType | "";
  renewalPrice: string;
};

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
          clientType: "",
          businessName: "",
          clientName: "",
          phone: "",
          email: "",
          website: "",
          notes: "",
          packageType: "Hosting + Elementor Pro",
          renewalPrice: "",
          renewalDate: "",
        },
  );
  const [serviceTypeError, setServiceTypeError] = useState(false);
  const [pendingContractFile, setPendingContractFile] = useState<File | null>(
    null,
  );
  const [contractClearRequested, setContractClearRequested] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setServiceTypeError(false);
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
        clientType: "",
        businessName: "",
        clientName: "",
        phone: "",
        email: "",
        website: "",
        notes: "",
        packageType: "Hosting + Elementor Pro",
        renewalPrice: "",
        renewalDate: "",
      });
    }
  }, [open, initialClient]);

  useEffect(() => {
    if (form.clientType === "Service Client") {
      setForm((prev) => ({
        ...prev,
        packageType: "None",
        renewalPrice: "",
        renewalDate: "",
      }));
    }
  }, [form.clientType]);

  function handleClientTypeChange(value: string | null) {
    setServiceTypeError(false);
    handleChange("clientType", (value ?? "") as ClientType | "");
  }

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
    const chosenType: ClientType | "" = form.clientType;
    if (chosenType !== "Website Client" && chosenType !== "Service Client") {
      setServiceTypeError(true);
      return;
    }
    const priceNumber = Number(form.renewalPrice || 0);
    setIsSaving(true);
    try {
      let contractFileId = form.contractFileId;
      let contractFileName = form.contractFileName;
      let contractFileType = form.contractFileType;

      if (contractClearRequested) {
        if (initialClient?.contractFileId) {
          await deleteContractFile(initialClient.contractFileId);
        }
        contractFileId = undefined;
        contractFileName = undefined;
        contractFileType = undefined;
      } else if (pendingContractFile) {
        if (initialClient?.contractFileId) {
          await deleteContractFile(initialClient.contractFileId);
        }
        const ref = await saveContractFile(pendingContractFile);
        contractFileId = ref.contractFileId;
        contractFileName = ref.contractFileName;
        contractFileType = ref.contractFileType;
      }

      const base: ClientInput = {
        clientType: chosenType,
        businessName: form.businessName.trim(),
        clientName: form.clientName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        packageType:
          form.clientType === "Website Client" ? form.packageType : undefined,
        renewalPrice:
          form.clientType === "Website Client" && form.packageType !== "None"
            ? Number.isNaN(priceNumber)
              ? 0
              : priceNumber
            : undefined,
        renewalDate:
          form.clientType === "Website Client" && form.packageType !== "None"
            ? form.renewalDate
            : undefined,
        workContractFileName: undefined,
        contractFileId,
        contractFileName,
        contractFileType,
        agreementFileId: form.agreementFileId || undefined,
        agreementFileName: form.agreementFileName || undefined,
        agreementFileType: form.agreementFileType || undefined,
      };

      onSubmit(base);
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) return null;

  const title = mode === "create" ? "לקוח חדש" : "עריכת לקוח";
  const contractDisplayName =
    pendingContractFile?.name ??
    (!contractClearRequested ? form.contractFileName : undefined);

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
            <Field label="סוג שירות" required>
              <Select
                value={form.clientType || undefined}
                onValueChange={handleClientTypeChange}
              >
                <SelectTrigger
                  className={cn(serviceTypeError && "border-destructive")}
                >
                  <SelectValue placeholder="בחר סוג שירות">
                    {form.clientType
                      ? getClientTypeLabel(form.clientType as ClientType)
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website Client">
                    {getClientTypeLabel("Website Client")}
                  </SelectItem>
                  <SelectItem value="Service Client">
                    {getClientTypeLabel("Service Client")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {serviceTypeError && (
                <p className="mt-1 text-xs text-destructive">
                  נא לבחור סוג שירות
                </p>
              )}
            </Field>
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
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://"
              />
            </Field>
            {form.clientType === "Website Client" && (
              <>
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
                        {getPackageTypeLabel(
                          (form.packageType ?? "None") as PackageType,
                        )}
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
              </>
            )}
          </div>

          <Field label="הערות">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </Field>

          <Field label="חוזה עבודה (אופציונלי)">
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept={CONTRACT_ACCEPT}
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
              {contractDisplayName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {pendingContractFile
                      ? `קובץ חדש: ${contractDisplayName}`
                      : `קובץ שמור: ${contractDisplayName}`}
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
                        contractFileId: undefined,
                        contractFileName: undefined,
                        contractFileType: undefined,
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
      <Label className={cn("text-xs")}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
