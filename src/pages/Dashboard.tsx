import { useEffect, useMemo, useState } from "react";
import type { Client } from "@/types/client";
import type { Lead } from "@/types/lead";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import {
  getActiveProjectsCount,
  getActiveTasks,
  getOpenLeadsCount,
  getOpenTasksCount,
  getTotalRemainingAmount,
  getUpcomingRenewals,
  getUpcomingRenewalsTotal,
} from "@/lib/dashboard";
import { apiGetClients } from "@/lib/clientsApi";
import { fetchLeads } from "@/lib/leadsApi";
import { apiGetProjects } from "@/lib/projectsApi";
import { fetchTasks } from "@/lib/tasksApi";

type DashboardData = {
  leads: Lead[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
};

const EMPTY_DATA: DashboardData = { leads: [], clients: [], projects: [], tasks: [] };

function formatCurrency(value: number): string {
  return `₪${value.toLocaleString("he-IL")}`;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const [leads, clients, projects, tasks] = await Promise.all([
          fetchLeads(),
          apiGetClients(),
          apiGetProjects(),
          fetchTasks(),
        ]);
        if (cancelled) return;
        setData({ leads, clients, projects, tasks });
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "טעינת הנתונים נכשלה.");
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

  const summary = useMemo(
    () => ({
      totalClients: data.clients.length,
      activeProjects: getActiveProjectsCount(data.projects),
      remainingToPay: getTotalRemainingAmount(data.projects),
      openLeads: getOpenLeadsCount(data.leads),
      openTasks: getOpenTasksCount(data.tasks),
      activeTasks: getActiveTasks(data.tasks),
      upcomingRenewals: getUpcomingRenewals(data.clients, 30),
      renewalsTotal: getUpcomingRenewalsTotal(data.clients, 30),
    }),
    [data],
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">דשבורד</h2>
        <p className="text-sm text-muted-foreground">תמונת מצב מהירה של הסטודיו.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="לקוחות" value={String(summary.totalClients)} />
        <SummaryCard title="פרויקטים פעילים" value={String(summary.activeProjects)} />
        <SummaryCard title="לידים פתוחים" value={String(summary.openLeads)} />
        <SummaryCard title="משימות פתוחות" value={String(summary.openTasks)} />
        <SummaryCard title="נותר לגבייה" value={formatCurrency(summary.remainingToPay)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-sm font-semibold">משימות על השולחן</div>
        {summary.activeTasks.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">אין משימות לביצוע כרגע.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {summary.activeTasks.slice(0, 6).map((task) => (
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

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">חידושי חבילות ב־30 הימים הקרובים</div>
          {summary.upcomingRenewals.length > 0 && (
            <div className="text-sm text-muted-foreground">
              סה״כ: {formatCurrency(summary.renewalsTotal)}
            </div>
          )}
        </div>

        {summary.upcomingRenewals.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">אין חידושים קרובים.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {summary.upcomingRenewals.map(({ clientId, clientName, packageType, renewalPrice, renewalDate, daysLeft }) => (
              <div
                key={clientId}
                className="grid gap-1 rounded-md border border-border/70 px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center md:gap-3"
              >
                <div className="font-medium text-foreground">{clientName}</div>
                <div className="text-muted-foreground">{packageType}</div>
                <div className="text-muted-foreground">
                  {renewalPrice == null ? "—" : formatCurrency(renewalPrice)}
                </div>
                <div className="text-muted-foreground">
                  {new Date(renewalDate).toLocaleDateString("he-IL")}
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

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
