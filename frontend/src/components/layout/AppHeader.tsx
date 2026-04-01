import { useLocation } from "react-router-dom";
import { getRoutePageTitle } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { pathname } = useLocation();
  const title = getRoutePageTitle(pathname);

  return (
    <header
      className={cn(
        "-mx-6 mb-4 border-b border-[#312E81] bg-[#111827] px-6 py-2.5",
        "text-start",
      )}
    >
      <h1 className="text-sm font-semibold tracking-tight text-slate-50">
        {title}
      </h1>
    </header>
  );
}
