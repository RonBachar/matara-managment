import { apiUrl, getAuthHeaders } from "@/lib/api";
import type { Task } from "@/types/task";

type ApiTask = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
};

async function parseErrorMessage(res: Response): Promise<string> {
  const maybeJson = await res.json().catch(() => null as unknown);
  if (maybeJson && typeof maybeJson === "object" && maybeJson !== null && "error" in maybeJson) {
    return String((maybeJson as { error?: unknown }).error ?? "");
  }
  return "";
}

function taskFromApi(row: ApiTask): Task {
  const status = row.status as Task["status"];
  const priority = row.priority as Task["priority"];
  const validStatuses: Task["status"][] = [
    "לביצוע",
    "בתהליך",
    "ממתין",
    "הושלם",
  ];
  const validPriorities: Task["priority"][] = ["נמוכה", "בינונית", "גבוהה"];

  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? undefined,
    status: validStatuses.includes(status) ? status : "לביצוע",
    priority: validPriorities.includes(priority) ? priority : "בינונית",
  };
}

export async function fetchTasks(): Promise<Task[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/tasks"), { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("Unexpected response");
  return (data as ApiTask[]).map(taskFromApi);
}

export async function createTask(data: Omit<Task, "id">): Promise<Task> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/tasks"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  return taskFromApi((await res.json()) as ApiTask);
}

export async function updateTask(
  id: string,
  data: Partial<Omit<Task, "id">>,
): Promise<Task> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/tasks/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
  return taskFromApi((await res.json()) as ApiTask);
}

export async function deleteTask(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl(`/api/tasks/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers,
  });
  if (res.status === 204) return;
  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
  }
}
