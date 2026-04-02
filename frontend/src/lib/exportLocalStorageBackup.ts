import { CLIENTS_STORAGE_KEY } from "@/lib/clientStorage";
import { LEADS_STORAGE_KEY } from "@/lib/leads";
import { BRIEFS_STORAGE_KEY } from "@/lib/projectBriefStorage";
import { PROJECTS_STORAGE_KEY } from "@/lib/projectsStorage";
import { TASKS_STORAGE_KEY } from "@/lib/dashboard";

/** Keys backed up — kept in sync with app usage (read-only snapshot). */
export const MATARA_BACKUP_STORAGE_KEYS = [
  CLIENTS_STORAGE_KEY,
  PROJECTS_STORAGE_KEY,
  TASKS_STORAGE_KEY,
  LEADS_STORAGE_KEY,
  BRIEFS_STORAGE_KEY,
] as const;

export type MataraLocalStorageBackup = {
  /** ISO timestamp when the export was built */
  exportedAt: string;
  /** Format marker for future import tools */
  format: "matara-localStorage-backup";
  formatVersion: 1;
  matara_clients: unknown;
  matara_projects: unknown;
  matara_tasks: unknown;
  matara_leads: unknown;
  matara_project_briefs: unknown;
};

function readParsedOrFallback(key: string): unknown {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { __exportParseError: true as const, raw };
  }
}

/** Snapshot of all Matara `localStorage` collections (does not modify storage). */
export function buildMataraLocalStorageBackup(): MataraLocalStorageBackup {
  return {
    exportedAt: new Date().toISOString(),
    format: "matara-localStorage-backup",
    formatVersion: 1,
    matara_clients: readParsedOrFallback(CLIENTS_STORAGE_KEY),
    matara_projects: readParsedOrFallback(PROJECTS_STORAGE_KEY),
    matara_tasks: readParsedOrFallback(TASKS_STORAGE_KEY),
    matara_leads: readParsedOrFallback(LEADS_STORAGE_KEY),
    matara_project_briefs: readParsedOrFallback(BRIEFS_STORAGE_KEY),
  };
}

/** Downloads a single JSON file with every collection (safe backup before DB migration). */
export function downloadMataraLocalStorageBackup(): void {
  const data = buildMataraLocalStorageBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `matara-localStorage-backup-${date}.json`;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
