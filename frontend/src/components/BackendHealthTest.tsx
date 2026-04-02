import { useEffect, useState } from "react";

/** Same origin in dev: Vite proxies /api → http://localhost:3000 (see vite.config.ts). */
const HEALTH_URL = "/api/health";

export function BackendHealthTest() {
  const [line, setLine] = useState<string>("Loading...");

  useEffect(() => {
    let cancelled = false;

    fetch(HEALTH_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        if (cancelled) return;
        if (
          data &&
          typeof data === "object" &&
          "status" in data &&
          (data as { status: unknown }).status === "ok"
        ) {
          setLine("Connected: ok");
        } else {
          setLine("Error: unexpected response");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setLine(`Error: ${message}`);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <p className="mb-3 text-xs text-muted-foreground">
      {line}
    </p>
  );
}
