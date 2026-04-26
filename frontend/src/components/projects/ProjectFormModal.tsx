import { useEffect, useState, type FormEvent } from "react";
import type { Project, ProjectType, ProjectStatus } from "@/types/project";
import {
  getBillableTotal,
  getRemainingAmount,
} from "@/lib/project-calculations";
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
  "הסתיים",
];

const RETAINER_STATUS_OPTIONS: ProjectStatus[] = ["ללא סטטוס"];

function getDefaultStatusForType(projectType: ProjectType): ProjectStatus {
  switch (projectType) {
    case "פרילנסר שעתי":
      return "בביצוע";
    case "ריטיינר חודשי":
      return "ללא סטטוס";
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
  initialProject?: Project;
  onClose: () => void;
  onSubmit: (project: Project) => void;
};

type FormState = {
  projectName: string;
  clientName: string;
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
  clientName: "",
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
  initialProject,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (initialProject) {
      setForm({
        projectName: initialProject.projectName,
        clientName: initialProject.clientName,
        projectType: initialProject.projectType,
        status: initialProject.status,
        totalAmount: String(initialProject.totalAmount),
        paidAmount: String(initialProject.paidAmount),
        hourlyRate: String(initialProject.hourlyRate),
        workedHours: String(initialProject.workedHours),
        notes: initialProject.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, initialProject]);

  function handleChange<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const paid = Number(form.paidAmount) || 0;
    const clientName = form.clientName.trim();

    if (form.projectType === "בניית אתר" || form.projectType === "ריטיינר חודשי") {
      const totalAmount = Number(form.totalAmount) || 0;
      const remainingAmount = getRemainingAmount(totalAmount, paid);
      onSubmit({
        id: initialProject?.id ?? String(Date.now()),
        projectName: form.projectName.trim(),
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

  return (
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
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="שם הפרויקט" required>
                <Input
                  value={form.projectName}
                  onChange={(e) => handleChange("projectName", e.target.value)}
                  required
                />
              </Field>
              <Field label="שם הלקוח" required>
                <Input
                  value={form.clientName}
                  onChange={(e) => handleChange("clientName", e.target.value)}
                  required
                />
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
