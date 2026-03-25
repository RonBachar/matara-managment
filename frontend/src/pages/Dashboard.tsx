import { useEffect, useMemo, useState } from "react";
import type { Client } from "@/types/client";
import type { Lead } from "@/types/lead";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import {
  CLIENTS_STORAGE_KEY,
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

type DashboardData = {
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
};

function readDashboardData(): DashboardData {
  return {
    leads: readStoredArray<Lead>(LEADS_STORAGE_KEY),
    clients: readStoredArray<Client>(CLIENTS_STORAGE_KEY),
    projects: readStoredArray<Project>(PROJECTS_STORAGE_KEY),
    tasks: readStoredArray<Task>(TASKS_STORAGE_KEY),
  };
}

function formatCurrency(value: number): string {
  return `₪${value.toLocaleString("he-IL")}`;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData>(() => readDashboardData());

  useEffect(() => {
    const refresh = () => setData(readDashboardData());
    const onStorage = (event: StorageEvent) => {
      if (
        event.key == null ||
        event.key === LEADS_STORAGE_KEY ||
        event.key === CLIENTS_STORAGE_KEY ||
        event.key === PROJECTS_STORAGE_KEY ||
        event.key === TASKS_STORAGE_KEY
      ) {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
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
    const upcomingRenewals = getUpcomingRenewals(data.clients, 14);

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
        <p className="text-sm text-muted-foreground">
          תמונת מצב יומית מהירה של המערכת.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="סך כל הלידים" value={String(summary.totalLeads)} />
        <SummaryCard title="סך כל הלקוחות" value={String(summary.totalClients)} />
        <SummaryCard
          title="סך כל הפרויקטים הפעילים"
          value={String(summary.activeProjects)}
        />
        <SummaryCard
          title="סך כל המשימות הפתוחות"
          value={String(summary.openTasks)}
        />
        <SummaryCard
          title="סך הכל נותר לתשלום"
          value={formatCurrency(summary.remainingToPay)}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">לידים חדשים</div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {summary.newLeads}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            לידים עם סטטוס חדש שממתינים לטיפול.
          </p>
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
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {task.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-sm font-semibold">חידושים קרובים (14 ימים)</div>

        {summary.upcomingRenewals.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            אין חידושים קרובים בשבועיים הקרובים.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {summary.upcomingRenewals.map(({ client, daysLeft }) => (
              <div
                key={client.id}
                className="grid gap-1 rounded-md border border-border/70 px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-3"
              >
                <div className="font-medium text-foreground">
                  {client.businessName || client.contactPerson}
                  {client.businessName && client.contactPerson
                    ? ` / ${client.contactPerson}`
                    : ""}
                </div>
                <div className="text-muted-foreground">
                  {client.renewalDate
                    ? new Date(client.renewalDate).toLocaleDateString("he-IL")
                    : "—"}
                </div>
                <div className="text-muted-foreground">
                  {formatCurrency(Number(client.renewalPrice ?? 0))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {daysLeft === 0 ? "היום" : `בעוד ${daysLeft} ימים`}
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

