import type { Project, ProjectStatus, ProjectType } from "@/types/project";

export const PROJECTS_STORAGE_KEY = "matara_projects";

export function loadProjectsFromStorage(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];

    const mapType = (t: unknown): ProjectType => {
      switch (t) {
        case "Full Project":
        case "בניית אתרים":
          return "בניית אתר";
        case "Hourly Project":
        case "עבודת פרילנסר לפי שעה":
          return "פרילנסר שעתי";
        case "ריטיינר חודשי":
          return "ריטיינר חודשי";
        case "בניית אתר":
        case "פרילנסר שעתי":
          return t;
        default:
          return "בניית אתר";
      }
    };

    return parsed.map((p) => {
      const row = p as Record<string, unknown>;
      return {
        id: String(row.id ?? Date.now()),
        projectName: String(row.projectName ?? ""),
        clientId: String(row.clientId ?? ""),
        clientName: String(row.clientName ?? ""),
        projectType: mapType(row.projectType),
        status: (row.status as ProjectStatus) ?? "New",
        totalAmount: Number(row.totalAmount ?? 0),
        paidAmount: Number(row.paidAmount ?? 0),
        remainingAmount: Number(row.remainingAmount ?? 0),
        hourlyRate: Number(row.hourlyRate ?? 0),
        workedHours: Number(row.workedHours ?? 0),
        billableTotal: Number(row.billableTotal ?? 0),
        notes: typeof row.notes === "string" ? row.notes : undefined,
      } satisfies Project;
    });
  } catch {
    return [];
  }
}
