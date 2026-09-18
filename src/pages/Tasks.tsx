import { useEffect, useState } from "react";
import type { Task, TaskStatus } from "@/types/task";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { DeleteTaskDialog } from "@/components/tasks/DeleteTaskDialog";
import { Button } from "@/components/ui/button";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "@/lib/tasksApi";

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeTask, setActiveTask] = useState<Task | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      try {
        const data = await fetchTasks();
        if (!cancelled) setTasks(data);
      } catch (error) {
        console.error("Failed to load tasks", error);
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

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

  async function handleFormSubmit(data: Omit<Task, "id">) {
    try {
      if (formMode === "edit" && activeTask) {
        const updated = await updateTask(activeTask.id, data);
        setTasks((prev) => prev.map((task) => (task.id === updated.id ? updated : task)));
      } else {
        const created = await createTask(data);
        setTasks((prev) => [...prev, created]);
      }
      setFormOpen(false);
    } catch (error) {
      console.error("Failed to save task", error);
    }
  }

  function handleDeleteRequest(task: Task) {
    setActiveTask(task);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!activeTask) return;
    try {
      await deleteTask(activeTask.id);
      setTasks((prev) => prev.filter((t) => t.id !== activeTask.id));
      setDeleteOpen(false);
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    try {
      const updated = await updateTask(task.id, { status });
      setTasks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      console.error("Failed to update task status", error);
    }
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">לוח משימות</h2>
            <p className="text-sm text-muted-foreground">
              ניהול משימות יומי.
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
