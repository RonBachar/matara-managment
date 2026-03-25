import type { Client } from "@/types/client";
import type { Lead } from "@/types/lead";
import type { Project, ProjectStatus } from "@/types/project";
import type { Task } from "@/types/task";

export const LEADS_STORAGE_KEY = "matara_leads";
export const CLIENTS_STORAGE_KEY = "matara_clients";
export const PROJECTS_STORAGE_KEY = "matara_projects";
export const TASKS_STORAGE_KEY = "matara_tasks";

const FINAL_PROJECT_STATUSES = new Set<ProjectStatus>([
  "Completed",
  "פרויקט הושלם",
  "הסתיים",
]);

export type UpcomingRenewal = {
  client: Client;
  daysLeft: number;
};

export function readStoredArray<T>(storageKey: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function isProjectFinalStatus(status: Project["status"]): boolean {
  return FINAL_PROJECT_STATUSES.has(status);
}

export function getActiveProjectsCount(projects: Project[]): number {
  return projects.filter((project) => !isProjectFinalStatus(project.status)).length;
}

export function getOpenTasksCount(tasks: Task[]): number {
  return tasks.filter((task) => task.status !== "הושלם").length;
}

export function getTotalRemainingAmount(projects: Project[]): number {
  return projects.reduce((sum, project) => {
    const remaining = Number(project.remainingAmount ?? 0);
    return sum + (Number.isFinite(remaining) ? remaining : 0);
  }, 0);
}

export function getNewLeadsCount(leads: Lead[]): number {
  return leads.filter((lead) => lead.status === "חדש").length;
}

export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (task) => task.status === "לביצוע" || task.status === "בתהליך",
  );
}

export function getUpcomingRenewals(
  clients: Client[],
  windowDays = 14,
): UpcomingRenewal[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayInMs = 24 * 60 * 60 * 1000;

  return clients
    .filter(
      (client) =>
        client.clientType === "Website Client" &&
        client.packageType !== "None" &&
        typeof client.renewalDate === "string" &&
        client.renewalDate.trim().length > 0,
    )
    .map((client) => {
      const renewalDate = new Date(client.renewalDate as string);
      if (Number.isNaN(renewalDate.getTime())) return null;

      const renewalDay = new Date(
        renewalDate.getFullYear(),
        renewalDate.getMonth(),
        renewalDate.getDate(),
      );
      const daysLeft = Math.ceil((renewalDay.getTime() - today.getTime()) / dayInMs);

      return { client, daysLeft };
    })
    .filter((entry): entry is UpcomingRenewal => {
      if (entry == null) return false;
      return entry.daysLeft >= 0 && entry.daysLeft <= windowDays;
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
