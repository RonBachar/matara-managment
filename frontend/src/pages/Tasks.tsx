import { useEffect, useState } from "react";
import type { Task, TaskStatus } from "@/types/task";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { DeleteTaskDialog } from "@/components/tasks/DeleteTaskDialog";
import { Button } from "@/components/ui/button";

const TASKS_STORAGE_KEY = "matara_tasks";

function normalizeTask(raw: Record<string, unknown>): Task {
  const status = raw.status as Task["status"];
  const priority = raw.priority as Task["priority"];
  const validStatuses: Task["status"][] = [
    "לביצוע",
    "בתהליך",
    "ממתין",
    "הושלם",
  ];
  const validPriorities: Task["priority"][] = ["נמוכה", "בינונית", "גבוהה"];
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    status: validStatuses.includes(status) ? status : "לביצוע",
    priority: validPriorities.includes(priority) ? priority : "בינונית",
  };
}

function loadInitialTasks(): Task[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t) => normalizeTask(t as Record<string, unknown>));
  } catch {
    return [];
  }
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadInitialTasks());
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeTask, setActiveTask] = useState<Task | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  function handleAdd() {
    setFormMode("create");
    setActiveTask(undefined);
    setFormOpen(true);
  }

  function handleEdit(task: Task) {
    setFormMode("edit");
    setActiveTask(task);
    setFormOpen(true);
  }

  function handleFormSubmit(data: Omit<Task, "id">) {
    setTasks((prev) => {
      if (formMode === "edit" && activeTask) {
        return prev.map((t) =>
          t.id === activeTask.id ? { ...data, id: activeTask.id } : t,
        );
      }
      const newId = String(Date.now());
      return [...prev, { ...data, id: newId }];
    });
    setFormOpen(false);
  }

  function handleDeleteRequest(task: Task) {
    setActiveTask(task);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!activeTask) return;
    setTasks((prev) => prev.filter((t) => t.id !== activeTask.id));
    setDeleteOpen(false);
  }

  function handleStatusChange(task: Task, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status } : t)),
    );
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">לוח משימות</h2>
            <p className="text-sm text-muted-foreground">
              ניהול משימות יומי – מקומי בלבד.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            className="bg-[#10B981] text-white hover:bg-[#059669]"
          >
            משימה חדשה
          </Button>
        </div>

        <TaskBoard
          tasks={tasks}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onStatusChange={handleStatusChange}
        />
      </section>

      <TaskFormModal
        open={formOpen}
        mode={formMode}
        initialTask={formMode === "edit" ? activeTask : undefined}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteTaskDialog
        open={deleteOpen}
        task={activeTask}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
