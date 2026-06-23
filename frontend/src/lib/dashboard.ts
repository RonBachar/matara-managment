import type { ClientServiceWithClient } from "@/types/clientService";
import type { Lead } from "@/types/lead";
import type { Project, ProjectStatus } from "@/types/project";
import type { Task } from "@/types/task";

export const PROJECTS_STORAGE_KEY = "matara_projects";
export const TASKS_STORAGE_KEY = "matara_tasks";

const FINAL_PROJECT_STATUSES = new Set<ProjectStatus>(["הושלם"]);

export type UpcomingRenewal = {
  clientName: string;
  serviceName: string;
  renewalPrice: number | null;
  renewalDate: string;
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
    const remaining = Number(project.totalAmount ?? 0) - Number(project.paidAmount ?? 0);
    return sum + (Number.isFinite(remaining) ? remaining : 0);
  }, 0);
}

export function getNewLeadsCount(leads: Lead[]): number {
  return leads.filter((lead) => lead.status !== "לא מעוניין").length;
}

export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status === "לביצוע" || task.status === "בתהליך");
}

export function getUpcomingRenewals(
  services: ClientServiceWithClient[],
  windowDays = 30,
): UpcomingRenewal[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayInMs = 24 * 60 * 60 * 1000;

  return services
    .map((service) => {
      if (!service.renewalDate) return null;

      const renewalDate = new Date(service.renewalDate);
      if (Number.isNaN(renewalDate.getTime())) return null;

      const renewalDay = new Date(
        renewalDate.getFullYear(),
        renewalDate.getMonth(),
        renewalDate.getDate(),
      );
      const daysLeft = Math.ceil((renewalDay.getTime() - today.getTime()) / dayInMs);

      const clientName =
        service.client?.businessName ||
        service.client?.clientName ||
        "—";

      return {
        clientName,
        serviceName: service.serviceName,
        renewalPrice: service.renewalPrice,
        renewalDate: service.renewalDate,
        daysLeft,
      };
    })
    .filter((entry): entry is UpcomingRenewal => {
      if (entry == null) return false;
      return entry.daysLeft >= 0 && entry.daysLeft <= windowDays;
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function getUpcomingRenewalsTotal(services: ClientServiceWithClient[], windowDays = 30): number {
  return getUpcomingRenewals(services, windowDays).reduce(
    (sum, entry) => sum + (entry.renewalPrice ?? 0),
    0,
  );
}
