import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  BriefcaseBusiness,
  KanbanSquare,
  Users,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

const pathToIcon: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "/dashboard": LayoutGrid,
  "/projects": BriefcaseBusiness,
  "/clients": Users,
  "/leads": UserPlus,
  "/tasks": KanbanSquare,
};

const SIDEBAR_WIDTH_CLASS = "w-64";

export function Sidebar() {
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
        "fixed right-0 top-0 z-40 h-dvh border-l border-[#3B1F52] bg-[#241132]",
        SIDEBAR_WIDTH_CLASS,
      )}
    >
      <div className="flex h-full flex-col p-5">
        <div className="mb-6 flex items-center justify-center gap-3 px-1 py-1">
          <img
            src="/brand/matara-symbol-white.svg"
            alt=""
            aria-hidden="true"
            className="h-8 w-8 shrink-0"
          />
          <img
            src="/brand/matara-logo-negative.svg"
            alt="Matara Studio"
            className="h-5 w-auto"
          />
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = pathToIcon[item.path];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[0.95rem] font-medium transition-colors",
                    isActive
                      ? "bg-[#7C3AED] text-white"
                      : "text-violet-100/80 hover:bg-[#3B1F52] hover:text-white",
                  )
                }
                end={item.path !== "/projects" && item.path !== "/clients"}
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
              "text-violet-100/80 hover:bg-[#3B1F52] hover:text-white",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <LogOut className="size-4 shrink-0" />
            <span>{signingOut ? "מתנתק..." : "התנתק"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
