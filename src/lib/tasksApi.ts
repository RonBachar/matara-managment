import { api } from "@/lib/api";
import type { Task } from "@/types/task";

type ApiTask = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
};

const VALID_STATUSES: Task["status"][] = ["לביצוע", "בתהליך", "ממתין", "הושלם"];
const VALID_PRIORITIES: Task["priority"][] = ["נמוכה", "בינונית", "גבוהה"];

function taskFromApi(row: ApiTask): Task {
  const status = row.status as Task["status"];
  const priority = row.priority as Task["priority"];
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? undefined,
    status: VALID_STATUSES.includes(status) ? status : "לביצוע",
    priority: VALID_PRIORITIES.includes(priority) ? priority : "בינונית",
  };
}

const BASE = "/api/tasks";

export async function fetchTasks(): Promise<Task[]> {
  const rows = await api.get<ApiTask[]>(BASE);
  return rows.map(taskFromApi);
}

export async function createTask(data: Omit<Task, "id">): Promise<Task> {
  return taskFromApi(await api.post<ApiTask>(BASE, data));
}

export async function updateTask(id: string, data: Partial<Omit<Task, "id">>): Promise<Task> {
  return taskFromApi(await api.patch<ApiTask>(`${BASE}/${encodeURIComponent(id)}`, data));
}

export function deleteTask(id: string): Promise<void> {
  return api.delete(`${BASE}/${encodeURIComponent(id)}`);
}
