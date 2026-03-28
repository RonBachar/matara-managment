import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  BriefcaseBusiness,
  KanbanSquare,
  Users,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import { navItems, PROJECT_BRIEFS_SHOW_LIST_EVENT } from "@/lib/nav";
import { cn } from "@/lib/utils";

const pathToIcon: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "/dashboard": LayoutGrid,
  "/projects": BriefcaseBusiness,
  "/tasks": KanbanSquare,
  "/clients": Users,
  "/leads": UserPlus,
  "/project-briefs": ClipboardList,
};

const SIDEBAR_WIDTH_CLASS = "w-64";

export function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 h-dvh border-l border-[#312E81] bg-[#111827]",
        SIDEBAR_WIDTH_CLASS,
      )}
    >
      <div className="flex h-full flex-col p-5">
        <div className="mb-6">
          <div className="text-base font-semibold tracking-tight text-slate-50">
            Matara Management
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            מערכת ניהול פנימית
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = pathToIcon[item.path];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (
                    item.path === "/project-briefs" &&
                    location.pathname === "/project-briefs"
                  ) {
                    window.dispatchEvent(new Event(PROJECT_BRIEFS_SHOW_LIST_EVENT));
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[0.95rem] font-medium transition-colors",
                    isActive
                      ? "bg-[#312E81] text-slate-50"
                      : "text-slate-300 hover:bg-[#1F2937] hover:text-slate-50",
                  )
                }
                end
              >
                {Icon && <Icon className="size-4 shrink-0" />}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="pt-4 text-xs text-slate-500">v0 • RTL</div>
      </div>
    </aside>
  );
}

export const sidebarWidthClass = SIDEBAR_WIDTH_CLASS;
