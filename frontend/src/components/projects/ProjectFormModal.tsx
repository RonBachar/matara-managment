import { useEffect, useState, type FormEvent } from "react";
import type { Client } from "@/types/client";
import type { Project, ProjectType, ProjectStatus } from "@/types/project";
import {
  getBillableTotal,
  getRemainingAmount,
} from "@/lib/project-calculations";
import { formatClientDisplayLabel } from "@/lib/clientStorage";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
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

const PROJECT_TYPES: ProjectType[] = [
  "בניית אתר",
  "פרילנסר שעתי",
  "ריטיינר חודשי",
];

const WEBSITE_STATUS_OPTIONS: ProjectStatus[] = [
  "שיחת אפיון",
  "איסוף חומרים",
  "שלב סקיצות",
  "שלב פיתוח",
  "שלב בדיקות והשקה",
  "פרויקט הושלם",
];

const FREELANCE_STATUS_OPTIONS: ProjectStatus[] = [
  "בביצוע",
  "ממתין לתשובה",
  "הסתיים",
];

const RETAINER_STATUS_OPTIONS: ProjectStatus[] = ["פעיל", "בהמתנה"];

function getDefaultStatusForType(projectType: ProjectType): ProjectStatus {
  switch (projectType) {
    case "פרילנסר שעתי":
      return "בביצוע";
    case "ריטיינר חודשי":
      return "פעיל";
    case "בניית אתר":
    default:
      return "שיחת אפיון";
  }
}

function getBaseStatusOptionsForType(
  projectType: ProjectType,
): ProjectStatus[] {
  switch (projectType) {
    case "פרילנסר שעתי":
      return FREELANCE_STATUS_OPTIONS;
    case "ריטיינר חודשי":
      return RETAINER_STATUS_OPTIONS;
    case "בניית אתר":
    default:
      return WEBSITE_STATUS_OPTIONS;
  }
}

function getStatusOptionsForType(
  projectType: ProjectType,
  current?: ProjectStatus,
): ProjectStatus[] {
  const base = getBaseStatusOptionsForType(projectType);
  if (current && !base.includes(current)) {
    return [...base, current];
  }
  return base;
}

function normalizeStatusForType(
  status: ProjectStatus,
  projectType: ProjectType,
): ProjectStatus {
  const base = getBaseStatusOptionsForType(projectType);
  return base.includes(status) ? status : getDefaultStatusForType(projectType);
}

type ProjectFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  clients: Client[];
  initialProject?: Project;
  onClose: () => void;
  onSubmit: (project: Project) => void;
  onClientAdded?: (client: Client) => void;
};

type FormState = {
  projectName: string;
  clientId: string;
  projectType: ProjectType;
  status: ProjectStatus;
  totalAmount: string;
  paidAmount: string;
  hourlyRate: string;
  workedHours: string;
  notes: string;
};

const emptyForm: FormState = {
  projectName: "",
  clientId: "",
  projectType: "בניית אתר",
  status: getDefaultStatusForType("בניית אתר"),
  totalAmount: "",
  paidAmount: "",
  hourlyRate: "",
  workedHours: "",
  notes: "",
};

export function ProjectFormModal({
  open,
  mode,
  clients,
  initialProject,
  onClose,
  onSubmit,
  onClientAdded,
}: ProjectFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [addClientOpen, setAddClientOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialProject) {
      setForm({
        projectName: initialProject.projectName,
        clientId: initialProject.clientId,
        projectType: initialProject.projectType,
        status: initialProject.status,
        totalAmount: String(initialProject.totalAmount),
        paidAmount: String(initialProject.paidAmount),
        hourlyRate: String(initialProject.hourlyRate),
        workedHours: String(initialProject.workedHours),
        notes: initialProject.notes ?? "",
      });
    } else {
      // In create mode we intentionally don't reset again when `clients` changes
      // (e.g. after nested "Add New Client"), to avoid wiping form state.
      setForm(emptyForm);
    }
  }, [open, initialProject]);

  useEffect(() => {
    if (!open) return;
    if (initialProject) return;
    setForm((prev) => {
      if (!prev.clientId) return prev;
      if (clients.some((c) => c.id === prev.clientId)) return prev;
      const fallbackId = clients[0]?.id ?? "";
      return { ...prev, clientId: fallbackId };
    });
  }, [open, initialProject, clients]);

  function handleChange<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const paid = Number(form.paidAmount) || 0;
    const client = clients.find((c) => c.id === form.clientId);
    const clientName = client ? formatClientDisplayLabel(client) : "";

    if (form.projectType === "בניית אתר" || form.projectType === "ריטיינר חודשי") {
      const totalAmount = Number(form.totalAmount) || 0;
      const remainingAmount = getRemainingAmount(totalAmount, paid);
      onSubmit({
        id: initialProject?.id ?? String(Date.now()),
        projectName: form.projectName.trim(),
        clientId: form.clientId,
        clientName,
        projectType: form.projectType,
        status: form.status,
        totalAmount,
        paidAmount: paid,
        remainingAmount,
        hourlyRate: 0,
        workedHours: 0,
        billableTotal: 0,
        notes: form.notes.trim() || undefined,
      });
    } else {
      const hourlyRate = Number(form.hourlyRate) || 0;
      const workedHours = Number(form.workedHours) || 0;
      const billableTotal = getBillableTotal(hourlyRate, workedHours);
      const remainingAmount = getRemainingAmount(billableTotal, paid);
      onSubmit({
        id: initialProject?.id ?? String(Date.now()),
        projectName: form.projectName.trim(),
        clientId: form.clientId,
        clientName,
        projectType: form.projectType,
        status: form.status,
        totalAmount: 0,
        paidAmount: paid,
        remainingAmount,
        hourlyRate,
        workedHours,
        billableTotal,
        notes: form.notes.trim() || undefined,
      });
    }
    onClose();
  }

  if (!open) return null;

  const isHourly = form.projectType === "פרילנסר שעתי";
  const billablePreview =
    isHourly &&
    (Number(form.hourlyRate) || 0) * (Number(form.workedHours) || 0);

  const selectedClient = clients.find((c) => c.id === form.clientId);
  const selectedClientName = selectedClient
    ? formatClientDisplayLabel(selectedClient)
    : "";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="w-full max-w-xl rounded-xl border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              {mode === "create" ? "פרויקט חדש" : "עריכת פרויקט"}
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
            {onClientAdded && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#10B981] text-white hover:bg-[#059669]"
                  onClick={() => setAddClientOpen(true)}
                >
                  הוסף לקוח חדש
                </Button>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="שם הפרויקט" required>
                <Input
                  value={form.projectName}
                  onChange={(e) => handleChange("projectName", e.target.value)}
                  required
                />
              </Field>
              <Field label="לקוח" required>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => handleChange("clientId", v ?? "")}
                  required
                >
                  <SelectTrigger className="w-full">
                    {form.clientId ? (
                      <SelectValue>
                        {selectedClientName || "לקוח לא זמין"}
                      </SelectValue>
                    ) : (
                      <SelectValue placeholder="בחר לקוח" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {formatClientDisplayLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="סוג עבודה">
                <Select
                  value={form.projectType}
                  onValueChange={(v) => {
                    const nextType = v as ProjectType;
                    setForm((prev) => ({
                      ...prev,
                      projectType: nextType,
                      status: normalizeStatusForType(prev.status, nextType),
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="סטטוס">
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    handleChange("status", v as ProjectStatus)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptionsForType(
                      form.projectType,
                      form.status,
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {(form.projectType === "בניית אתר" ||
                form.projectType === "ריטיינר חודשי") && (
                <>
                  <Field label="סכום כולל (₪)">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={form.totalAmount}
                      onChange={(e) =>
                        handleChange("totalAmount", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="שולם (₪)">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={form.paidAmount}
                      onChange={(e) =>
                        handleChange("paidAmount", e.target.value)
                      }
                    />
                  </Field>
                </>
              )}

              {form.projectType === "פרילנסר שעתי" && (
                <>
                  <Field label="שער שעתי (₪)">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={form.hourlyRate}
                      onChange={(e) =>
                        handleChange("hourlyRate", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="שעות עבודה">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.25}
                      value={form.workedHours}
                      onChange={(e) =>
                        handleChange("workedHours", e.target.value)
                      }
                    />
                  </Field>
                  {billablePreview !== false && (
                    <div className="text-xs text-muted-foreground md:col-span-2">
                      סה״כ לחיוב: ₪{billablePreview.toLocaleString("he-IL")}
                    </div>
                  )}
                  <Field label="שולם (₪)">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={form.paidAmount}
                      onChange={(e) =>
                        handleChange("paidAmount", e.target.value)
                      }
                    />
                  </Field>
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

            <div className="flex justify-between gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                ביטול
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="px-4"
              >
                שמירה
              </Button>
            </div>
          </form>
        </div>
      </div>

      {addClientOpen && onClientAdded && (
        <ClientFormModal
          open={addClientOpen}
          mode="create"
          onClose={() => setAddClientOpen(false)}
          onSubmit={(data) => {
            const newClient: Client = {
              ...data,
              id: String(Date.now()),
              createdAt: new Date().toISOString(),
            };
            onClientAdded(newClient);
            setForm((prev) => ({ ...prev, clientId: newClient.id }));
            setAddClientOpen(false);
          }}
        />
      )}
    </>
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
