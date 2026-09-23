import type { Client } from "@/types/client";
import type { Lead } from "@/types/lead";
import type { Project, ProjectStatus } from "@/types/project";
import type { Task } from "@/types/task";

const FINAL_PROJECT_STATUSES = new Set<ProjectStatus>(["הושלם"]);

export function getOpenTasksCount(tasks: Task[]): number {
  return tasks.filter((task) => task.status !== "הושלם").length;
}

/** Tasks worth surfacing on the dashboard: not done and not parked. */
export function getActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status === "לביצוע" || task.status === "בתהליך");
}

export type UpcomingRenewal = {
  clientId: string;
  clientName: string;
  packageType: string;
  renewalPrice: number | null;
  renewalDate: string;
  daysLeft: number;
};

export function getActiveProjectsCount(projects: Project[]): number {
  return projects.filter((project) => !FINAL_PROJECT_STATUSES.has(project.status)).length;
}

export function getTotalRemainingAmount(projects: Project[]): number {
  return projects.reduce((sum, project) => {
    const remaining = Number(project.totalAmount ?? 0) - Number(project.paidAmount ?? 0);
    return sum + (Number.isFinite(remaining) ? remaining : 0);
  }, 0);
}

export function getOpenLeadsCount(leads: Lead[]): number {
  return leads.filter((lead) => lead.status !== "לא מעוניין").length;
}

export function getUpcomingRenewals(clients: Client[], windowDays = 30): UpcomingRenewal[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayInMs = 24 * 60 * 60 * 1000;

  return clients
    .map((client) => {
      if (!client.renewalDate) return null;

      const renewalDate = new Date(client.renewalDate);
      if (Number.isNaN(renewalDate.getTime())) return null;

      const renewalDay = new Date(
        renewalDate.getFullYear(),
        renewalDate.getMonth(),
        renewalDate.getDate(),
      );
      const daysLeft = Math.ceil((renewalDay.getTime() - today.getTime()) / dayInMs);

      return {
        clientId: client.id,
        clientName: client.businessName || client.clientName,
        packageType: client.packageType ?? "—",
        renewalPrice: client.renewalPrice ?? null,
        renewalDate: client.renewalDate,
        daysLeft,
      };
    })
    .filter((entry): entry is UpcomingRenewal => entry != null && entry.daysLeft >= 0 && entry.daysLeft <= windowDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function getUpcomingRenewalsTotal(clients: Client[], windowDays = 30): number {
  return getUpcomingRenewals(clients, windowDays).reduce(
    (sum, entry) => sum + (entry.renewalPrice ?? 0),
    0,
  );
}
