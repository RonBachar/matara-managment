import type { Client, ClientService } from "@/types/client";
import type { Lead } from "@/types/lead";
import type { Project, ProjectStatus } from "@/types/project";
import type { Task } from "@/types/task";

export { LEADS_STORAGE_KEY } from "@/lib/leads";
export { CLIENTS_STORAGE_KEY } from "@/lib/clientStorage";
export const PROJECTS_STORAGE_KEY = "matara_projects";
export const TASKS_STORAGE_KEY = "matara_tasks";

const FINAL_PROJECT_STATUSES = new Set<ProjectStatus>([
  "Completed",
  "פרויקט הושלם",
  "הסתיים",
]);

export type UpcomingRenewal = {
  client: Client;
  service: ClientService;
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
  return leads.filter((lead) => !lead.convertedClientId).length;
}

export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status === "לביצוע" || task.status === "בתהליך");
}

function getRenewalServices(client: Client): ClientService[] {
  if (Array.isArray(client.services) && client.services.length > 0) {
    return client.services.filter(
      (service) => typeof service.renewalDate === "string" && service.renewalDate.trim().length > 0,
    );
  }

  if (client.packageType && client.packageType !== "None" && client.renewalDate) {
    return [
      {
        id: `${client.id}-legacy-service`,
        clientId: client.id,
        type: "Custom service",
        name: client.packageType,
        renewalPrice: client.renewalPrice,
        renewalDate: client.renewalDate,
        status: client.status ?? "Active",
      },
    ];
  }

  return [];
}

export function getUpcomingRenewals(clients: Client[], windowDays = 14): UpcomingRenewal[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayInMs = 24 * 60 * 60 * 1000;

  return clients
    .flatMap((client) =>
      getRenewalServices(client).map((service) => {
        const renewalDate = new Date(service.renewalDate as string);
        if (Number.isNaN(renewalDate.getTime())) return null;

        const renewalDay = new Date(
          renewalDate.getFullYear(),
          renewalDate.getMonth(),
          renewalDate.getDate(),
        );
        const daysLeft = Math.ceil((renewalDay.getTime() - today.getTime()) / dayInMs);

        return { client, service, daysLeft };
      }),
    )
    .filter((entry): entry is UpcomingRenewal => {
      if (entry == null) return false;
      return entry.daysLeft >= 0 && entry.daysLeft <= windowDays;
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}
