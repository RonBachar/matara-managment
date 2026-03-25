import { useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: TaskStatus[] = ["לביצוע", "בתהליך", "ממתין", "הושלם"];
const PRIORITY_STYLES: Record<TaskPriority, string> = {
  נמוכה: "bg-slate-100 text-slate-700 border-slate-200/70",
  בינונית: "bg-amber-50 text-amber-800 border-amber-200/70",
  גבוהה: "bg-rose-50 text-rose-800 border-rose-200/70",
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  draggable,
  onDragStart,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  draggable?: boolean;
  onDragStart?: (taskId: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background p-3 shadow-sm",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-60",
      )}
      draggable={draggable}
      onDragStart={(e) => {
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/taskId", task.id);

        const source = e.currentTarget;
        const rect = source.getBoundingClientRect();
        const clone = source.cloneNode(true) as HTMLElement;
        clone.style.position = "fixed";
        clone.style.top = "-1000px";
        clone.style.left = "-1000px";
        clone.style.width = `${Math.ceil(rect.width)}px`;
        clone.style.boxSizing = "border-box";
        clone.style.pointerEvents = "none";
        clone.style.opacity = "1";
        clone.style.transform = "none";
        clone.style.zIndex = "9999";
        document.body.appendChild(clone);
        e.dataTransfer.setDragImage(clone, 16, 16);
        requestAnimationFrame(() => clone.remove());

        onDragStart?.(task.id);
      }}
      onDragEnd={() => setIsDragging(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {task.title}
          </div>
          {task.description ? (
            <div className="mt-1 line-clamp-3 text-xs text-muted-foreground">
              {task.description}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={() => onEdit(task)}
            aria-label="עריכת משימה"
          >
            <Pencil className="h-4 w-4 text-[#FBBF24]" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            onClick={() => onDelete(task)}
            aria-label="מחיקת משימה"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            PRIORITY_STYLES[task.priority],
          )}
        >
          {task.priority}
        </span>
      </div>

      <div className="mt-2">
        <Select
          value={task.status}
          onValueChange={(value) => onStatusChange(task, value as TaskStatus)}
        >
          <SelectTrigger size="sm" className="h-7 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
