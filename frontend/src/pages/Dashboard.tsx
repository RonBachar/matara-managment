import { useEffect, useMemo, useState } from "react";
import type { Client } from "@/types/client";
import type { Lead } from "@/types/lead";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import {
  LEADS_STORAGE_KEY,
  PROJECTS_STORAGE_KEY,
  TASKS_STORAGE_KEY,
  getActiveProjectsCount,
  getNewLeadsCount,
  getOpenTasksCount,
  getTodayTasks,
  getTotalRemainingAmount,
  getUpcomingRenewals,
  readStoredArray,
} from "@/lib/dashboard";
import { readStoredLeads } from "@/lib/leads";
import { apiGetClients } from "@/lib/clientsApi";
import { apiGetProjects } from "@/lib/projectsApi";

type DashboardData = {
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
};

function readDashboardData(): DashboardData {
  return {
    leads: readStoredLeads(),
    clients: [],
    projects: [],
    tasks: readStoredArray<Task>(TASKS_STORAGE_KEY),
  };
}

function formatCurrency(value: number): string {
  return `₪${value.toLocaleString("he-IL")}`;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData>(() => readDashboardData());

  useEffect(() => {
    let cancelled = false;

    const refreshStatic = () => {
      setData((prev) => ({
        ...prev,
        leads: readStoredLeads(),
        tasks: readStoredArray<Task>(TASKS_STORAGE_KEY),
      }));
    };

    const refreshApi = async () => {
      try {
        const [clients, projects] = await Promise.all([apiGetClients(), apiGetProjects()]);
        if (cancelled) return;
        setData((prev) => ({
          ...prev,
          clients: clients.map((client) => ({
            id: client.id,
            clientType: "Website Client",
            createdAt: client.createdAt,
            businessName: client.businessName,
            clientName: client.clientName,
            phone: client.phone,
            email: client.email,
            website: client.website ?? undefined,
            notes: client.notes ?? undefined,
            services: (client.services ?? []).map((service) => ({
              id: service.id,
              clientId: service.clientId,
              serviceName: service.serviceName,
              billingCycle: service.billingCycle ?? undefined,
              renewalPrice: service.renewalPrice ?? undefined,
              renewalDate: service.renewalDate ?? undefined,
              reminderDaysBefore: service.reminderDaysBefore ?? undefined,
              notes: service.notes ?? undefined,
              createdAt: service.createdAt,
              updatedAt: service.updatedAt,
            })),
            agreementFileId: client.agreementFileId ?? undefined,
            agreementFileName: client.agreementFileName ?? undefined,
            agreementFileType: client.agreementFileType ?? undefined,
          })),
          projects,
        }));
      } catch {
        if (cancelled) return;
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (
        event.key == null ||
        event.key === LEADS_STORAGE_KEY ||
        event.key === PROJECTS_STORAGE_KEY ||
        event.key === TASKS_STORAGE_KEY
      ) {
        refreshStatic();
        void refreshApi();
      }
    };

    refreshStatic();
    void refreshApi();

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshApi);
    document.addEventListener("visibilitychange", refreshApi);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshApi);
      document.removeEventListener("visibilitychange", refreshApi);
    };
  }, []);

  const summary = useMemo(() => {
    const totalLeads = data.leads.length;
    const totalClients = data.clients.length;
    const activeProjects = getActiveProjectsCount(data.projects);
    const openTasks = getOpenTasksCount(data.tasks);
    const remainingToPay = getTotalRemainingAmount(data.projects);
    const newLeads = getNewLeadsCount(data.leads);
    const todayTasks = getTodayTasks(data.tasks);
    const upcomingRenewals = getUpcomingRenewals(data.clients, 30);

    return {
      totalLeads,
      totalClients,
      activeProjects,
      openTasks,
      remainingToPay,
      newLeads,
      todayTasks,
      upcomingRenewals,
    };
  }, [data]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">דשבורד</h2>
        <p className="text-sm text-muted-foreground">תמונת מצב יומית מהירה של המערכת.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="סך כל הלידים" value={String(summary.totalLeads)} />
        <SummaryCard title="סך כל הלקוחות" value={String(summary.totalClients)} />
        <SummaryCard title="סך כל הפרויקטים הפעילים" value={String(summary.activeProjects)} />
        <SummaryCard title="סך כל המשימות הפתוחות" value={String(summary.openTasks)} />
        <SummaryCard title="סך הכל נותר לתשלום" value={formatCurrency(summary.remainingToPay)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">לידים פתוחים</div>
          <div className="mt-2 text-2xl font-bold text-foreground">{summary.newLeads}</div>
          <p className="mt-1 text-xs text-muted-foreground">לידים שטרם הומרו ללקוחות.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">משימות של היום</div>
          {summary.todayTasks.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">אין משימות לביצוע כרגע.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {summary.todayTasks.slice(0, 6).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2"
                >
                  <span className="truncate text-sm text-foreground">{task.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{task.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-sm font-semibold">Upcoming Renewals</div>

        {summary.upcomingRenewals.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No client service renewals are coming up in the next 30 days.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {summary.upcomingRenewals.map(({ client, service, daysLeft }) => (
              <div
                key={`${client.id}-${service.id}`}
                className="grid gap-1 rounded-md border border-border/70 px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-3"
              >
                <div className="font-medium text-foreground">{client.businessName || client.clientName}</div>
                <div className="text-muted-foreground">{service.serviceName}</div>
                <div className="text-muted-foreground">
                  {service.renewalDate
                    ? new Date(service.renewalDate).toLocaleDateString("he-IL")
                    : "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {daysLeft === 0 ? "Today" : `${daysLeft} days left`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
};

function SummaryCard({ title, value }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
