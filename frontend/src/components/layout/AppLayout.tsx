import { Outlet } from "react-router-dom";
import { BackendHealthTest } from "@/components/BackendHealthTest";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Sidebar />

      <div className={cn("min-h-dvh", "pr-64")}>
        <main className="px-6 pb-6 pt-4">
          <AppHeader />
          <BackendHealthTest />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

