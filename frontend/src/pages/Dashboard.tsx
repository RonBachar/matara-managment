import { useEffect, useMemo, useState } from "react";
import type { Client } from "@/types/client";
import type { ClientServiceWithClient } from "@/types/clientService";
import type { Lead } from "@/types/lead";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import {
  getActiveProjectsCount,
  getNewLeadsCount,
  getOpenTasksCount,
  getTodayTasks,
  getTotalRemainingAmount,
  getUpcomingRenewals,
  getUpcomingRenewalsTotal,
} from "@/lib/dashboard";
import { apiGetClients } from "@/lib/clientsApi";
import { listAllServices } from "@/lib/clientServicesApi";
import { fetchLeads } from "@/lib/leadsApi";
import { apiGetProjects } from "@/lib/projectsApi";
import { fetchTasks } from "@/lib/tasksApi";

type DashboardData = {
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  services: ClientServiceWithClient[];
};

const EMPTY_DATA: DashboardData = {
  leads: [],
  clients: [],
  projects: [],
  tasks: [],
  services: [],
};

function formatCurrency(value: number): string {
  return `₪${value.toLocaleString("he-IL")}`;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const [leads, clients, projects, tasks, services] = await Promise.all([
          fetchLeads(),
          apiGetClients(),
          apiGetProjects(),
          fetchTasks(),
          listAllServices(),
        ]);
        if (cancelled) return;
        setData({ leads, clients, projects, tasks, services });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };

    void refresh();

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      cancelled = true;
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
    const upcomingRenewals = getUpcomingRenewals(data.services, 30);
    const renewalsTotal = getUpcomingRenewalsTotal(data.services, 30);

    return {
      totalLeads,
      totalClients,
      activeProjects,
      openTasks,
      remainingToPay,
      newLeads,
      todayTasks,
      upcomingRenewals,
      renewalsTotal,
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
          <p className="mt-1 text-xs text-muted-foreground">לידים פעילים שאינם מסומנים כלא מעוניין.</p>
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">חידושי שירותים קרובים</div>
          {summary.upcomingRenewals.length > 0 && (
            <div className="text-sm text-muted-foreground">
              סה״כ: {formatCurrency(summary.renewalsTotal)}
            </div>
          )}
        </div>

        {summary.upcomingRenewals.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            אין חידושי שירות ב-30 הימים הקרובים.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {summary.upcomingRenewals.map(({ clientName, serviceName, renewalPrice, renewalDate, daysLeft }) => (
              <div
                key={`${clientName}-${serviceName}-${renewalDate}`}
                className="grid gap-1 rounded-md border border-border/70 px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center md:gap-3"
              >
                <div className="font-medium text-foreground">{clientName}</div>
                <div className="text-muted-foreground">{serviceName}</div>
                <div className="text-muted-foreground">
                  {renewalPrice == null ? "—" : formatCurrency(renewalPrice)}
                </div>
                <div className="text-muted-foreground">
                  {renewalDate ? new Date(renewalDate).toLocaleDateString("he-IL") : "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {daysLeft === 0 ? "היום" : `${daysLeft} ימים`}
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
