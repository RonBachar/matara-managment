import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  BriefcaseBusiness,
  KanbanSquare,
  Users,
  UserPlus,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 h-dvh border-l border-[#312E81] bg-[#111827]",
        SIDEBAR_WIDTH_CLASS,
      )}
    >
      <div className="flex h-full flex-col p-5">
        <div className="mb-6">
          <div className="text-base font-semibold tracking-tight text-slate-50 text-center">
            Matara Studio
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

        <div className="space-y-3 pt-4">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-[0.95rem] font-medium transition-colors",
              "text-slate-300 hover:bg-[#1F2937] hover:text-slate-50",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <LogOut className="size-4 shrink-0" />
            <span>{signingOut ? "מתנתק..." : "התנתק"}</span>
          </button>
          <div className="text-center text-xs text-slate-500">v0 • RTL</div>
        </div>
      </div>
    </aside>
  );
}

export const sidebarWidthClass = SIDEBAR_WIDTH_CLASS;
