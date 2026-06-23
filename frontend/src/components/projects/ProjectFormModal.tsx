import { useEffect, useState, type FormEvent } from "react";
import type { Project, ProjectStatus } from "@/types/project";
import type { Client } from "@/types/client";
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
import { apiGetClients } from "@/lib/clientsApi";

const STATUS_OPTIONS: ProjectStatus[] = ["התחיל", "בתהליך עבודה", "הושלם"];

type ProjectFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialProject?: Project;
  onClose: () => void;
  onSubmit: (project: Project) => void;
};

type FormState = {
  projectName: string;
  clientId: string;
  status: ProjectStatus;
  totalAmount: string;
  paidAmount: string;
  notes: string;
};

const emptyForm: FormState = {
  projectName: "",
  clientId: "",
  status: "התחיל",
  totalAmount: "",
  paidAmount: "",
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
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClientsLoading(true);
    apiGetClients()
      .then((rows) => setClients(rows))
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initialProject) {
      setForm({
        projectName: initialProject.projectName,
        clientId: initialProject.clientId,
        status: initialProject.status,
        totalAmount: String(initialProject.totalAmount),
        paidAmount: String(initialProject.paidAmount),
        notes: initialProject.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, initialProject]);

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const selectedClient = clients.find((c) => c.id === form.clientId);
    onSubmit({
      id: initialProject?.id ?? String(Date.now()),
      projectName: form.projectName.trim(),
      clientId: form.clientId,
      client: selectedClient
        ? { id: selectedClient.id, clientName: selectedClient.clientName }
        : initialProject?.client,
      status: form.status,
      totalAmount: Number(form.totalAmount) || 0,
      paidAmount: Number(form.paidAmount) || 0,
      notes: form.notes.trim() || undefined,
    });
    onClose();
  }

  if (!open) return null;

  const noClients = !clientsLoading && clients.length === 0;

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

        {noClients ? (
          <div className="space-y-4 px-4 py-6 text-sm text-muted-foreground">
            <p>יש ליצור לקוח לפני הוספת פרויקט.</p>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              סגירה
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
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
                  value={form.clientId || undefined}
                  onValueChange={(value) => handleChange("clientId", value ?? "")}
                  disabled={clientsLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={clientsLoading ? "טוען..." : "בחר לקוח"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.businessName || client.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="סטטוס">
                <Select
                  value={form.status}
                  onValueChange={(v) => handleChange("status", v as ProjectStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="סכום כולל (₪)">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={form.totalAmount}
                  onChange={(e) => handleChange("totalAmount", e.target.value)}
                />
              </Field>
              <Field label="שולם (₪)">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={form.paidAmount}
                  onChange={(e) => handleChange("paidAmount", e.target.value)}
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

            <div className="flex justify-between gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                ביטול
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="px-4"
                disabled={!form.clientId}
              >
                שמירה
              </Button>
            </div>
          </form>
        )}
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
