import { useEffect, useState, type FormEvent } from "react";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
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

const STATUS_OPTIONS: TaskStatus[] = ["לביצוע", "בתהליך", "ממתין", "הושלם"];
const PRIORITY_OPTIONS: TaskPriority[] = ["נמוכה", "בינונית", "גבוהה"];

type TaskInput = Omit<Task, "id">;

type TaskFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialTask?: Task;
  onClose: () => void;
  onSubmit: (task: TaskInput) => void;
};

type FormState = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  status: "לביצוע",
  priority: "בינונית",
};

export function TaskFormModal({
  open,
  mode,
  initialTask,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (initialTask) {
      setForm({
        title: initialTask.title,
        description: initialTask.description ?? "",
        status: initialTask.status,
        priority: initialTask.priority,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, initialTask]);

  function handleChange<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: TaskInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
    };
    onSubmit(next);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-xl border border-border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {mode === "create" ? "משימה חדשה" : "עריכת משימה"}
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
          <Field label="כותרת" required>
            <Input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </Field>

          <Field label="תיאור">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="תיאור המשימה (אופציונלי)"
            />
          </Field>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="סטטוס">
              <Select
                value={form.status}
                onValueChange={(v) => handleChange("status", v as TaskStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר סטטוס" />
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

            <Field label="עדיפות">
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  handleChange("priority", v as TaskPriority)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר עדיפות" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

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
      <Label className={cn("text-xs")}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
