import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/types/project";
import type { ProjectBrief, ProjectBriefInput } from "@/types/projectBrief";
import { ProjectBriefTable } from "@/components/project-briefs/ProjectBriefTable";
import { ProjectBriefForm } from "@/components/project-briefs/ProjectBriefForm";
import { DeleteProjectBriefDialog } from "@/components/project-briefs/DeleteProjectBriefDialog";

const PROJECTS_STORAGE_KEY = "matara_projects";
const BRIEFS_STORAGE_KEY = "matara_project_briefs";

function loadStoredProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Project[]) : [];
  } catch {
    return [];
  }
}

function normalizeBrief(raw: Record<string, unknown>): ProjectBrief {
  const ensureString = (value: unknown): string =>
    typeof value === "string" ? value : "";
  const ensureStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
  const status = raw.status === "הושלם" ? "הושלם" : "טיוטה";
  const nowIso = new Date().toISOString();

  return {
    id: ensureString(raw.id) || String(Date.now()),
    projectId: ensureString(raw.projectId),
    clientId: ensureString(raw.clientId),
    projectNameSnapshot: ensureString(raw.projectNameSnapshot),
    clientNameSnapshot: ensureString(raw.clientNameSnapshot),
    status,
    createdAt: ensureString(raw.createdAt) || nowIso,
    updatedAt: ensureString(raw.updatedAt) || ensureString(raw.createdAt) || nowIso,
    websiteType: ensureString((raw as any).websiteType),
    requiredPages: ensureString((raw as any).requiredPages),
    strategicDecisions: ensureString((raw as any).strategicDecisions),
    lockedFixedInput: ensureString((raw as any).lockedFixedInput),
    sourceMaterials: ensureString((raw as any).sourceMaterials),
    mainService: ensureString(raw.mainService),
    projectGoal: ensureString(raw.projectGoal),
    targetAudience: ensureString(raw.targetAudience),
    audiencePainPoints: ensureString(raw.audiencePainPoints),
    mainUserAction: ensureString(raw.mainUserAction),
    mustHaveSections: ensureString(raw.mustHaveSections),
    keyInfoAboveTheFold: ensureString(raw.keyInfoAboveTheFold),
    repeatedCustomerQuestions: ensureString(raw.repeatedCustomerQuestions),
    uxNotes: ensureString(raw.uxNotes),
    businessDescription: ensureString(raw.businessDescription),
    differentiators: ensureString(raw.differentiators),
    keyMessages: ensureString(raw.keyMessages),
    forbiddenPhrases: ensureString(raw.forbiddenPhrases),
    existingContentNotes: ensureString(raw.existingContentNotes),
    toneSelections: ensureStringArray(raw.toneSelections),
    languageStyleSelections: ensureStringArray(raw.languageStyleSelections),
    contentNotes: ensureString(raw.contentNotes),
    visualFeeling: ensureString(raw.visualFeeling),
    likedReferences: ensureString(raw.likedReferences),
    dislikedReferences: ensureString(raw.dislikedReferences),
    preferredColors: ensureString(raw.preferredColors),
    unwantedColors: ensureString(raw.unwantedColors),
    designStyleNotes: ensureString(raw.designStyleNotes),
    designNotes: ensureString(raw.designNotes),
  };
}

function loadStoredBriefs(): ProjectBrief[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(BRIEFS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((brief) => normalizeBrief(brief as Record<string, unknown>))
      .filter((brief) => brief.projectId);
  } catch {
    return [];
  }
}

export function ProjectBriefs() {
  const [projects, setProjects] = useState<Project[]>(() => loadStoredProjects());
  const [briefs, setBriefs] = useState<ProjectBrief[]>(() => loadStoredBriefs());
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [activeBrief, setActiveBrief] = useState<ProjectBrief | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [briefToDelete, setBriefToDelete] = useState<ProjectBrief | undefined>();
  const [pageMessage, setPageMessage] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BRIEFS_STORAGE_KEY, JSON.stringify(briefs));
  }, [briefs]);

  useEffect(() => {
    const refreshProjects = () => setProjects(loadStoredProjects());
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === PROJECTS_STORAGE_KEY) {
        refreshProjects();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshProjects);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshProjects);
    };
  }, []);

  const briefsSorted = useMemo(
    () =>
      [...briefs].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [briefs],
  );

  const canCreate = projects.length > 0;
  const createDisabledMessage =
    projects.length === 0 ? "יש ליצור פרויקט לפני פתיחת בריף." : undefined;

  function handleCreate() {
    if (!canCreate) {
      setPageMessage("לא ניתן ליצור בריף לפני יצירת פרויקט.");
      return;
    }
    setMode("create");
    setActiveBrief(undefined);
    setPageMessage("");
  }

  function handleEdit(brief: ProjectBrief) {
    setMode("edit");
    setActiveBrief(brief);
    setPageMessage("");
  }

  function handleDeleteRequest(brief: ProjectBrief) {
    setBriefToDelete(brief);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!briefToDelete) return;
    setBriefs((prev) => prev.filter((brief) => brief.id !== briefToDelete.id));
    if (activeBrief?.id === briefToDelete.id) {
      setMode(null);
      setActiveBrief(undefined);
    }
    setDeleteOpen(false);
    setPageMessage("");
  }

  function handleFormSubmit(data: {
    projectId: string;
    projectNameSnapshot: string;
    clientId: string;
    clientNameSnapshot: string;
    input: ProjectBriefInput;
  }) {
    const now = new Date().toISOString();
    if (mode === "edit" && activeBrief) {
      setBriefs((prev) =>
        prev.map((brief) =>
          brief.id === activeBrief.id
            ? {
                ...brief,
                ...data.input,
                updatedAt: now,
              }
            : brief,
        ),
      );
      setMode(null);
      setActiveBrief(undefined);
      return;
    }

    const duplicate = briefs.find((brief) => brief.projectId === data.projectId);
    if (duplicate) {
      setPageMessage("לפרויקט זה כבר קיים בריף. ניתן לערוך אותו מתוך הטבלה.");
      return;
    }

    const newBrief: ProjectBrief = {
      id: String(Date.now()),
      projectId: data.projectId,
      clientId: data.clientId,
      projectNameSnapshot: data.projectNameSnapshot,
      clientNameSnapshot: data.clientNameSnapshot,
      createdAt: now,
      updatedAt: now,
      ...data.input,
    };
    setBriefs((prev) => [...prev, newBrief]);
    setMode(null);
    setActiveBrief(undefined);
    setPageMessage("");
  }

  return (
    <section className="space-y-4">
      <ProjectBriefTable
        briefs={briefsSorted}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        canCreate={canCreate}
        createDisabledMessage={createDisabledMessage}
      />

      <div className="mx-auto w-full max-w-4xl space-y-4">
        {pageMessage && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {pageMessage}
          </div>
        )}

        {mode && (
          <ProjectBriefForm
            mode={mode}
            projects={projects}
            existingBriefs={briefs}
            initialBrief={mode === "edit" ? activeBrief : undefined}
            onCancel={() => {
              setMode(null);
              setActiveBrief(undefined);
            }}
            onSubmit={handleFormSubmit}
          />
        )}
      </div>

      <DeleteProjectBriefDialog
        open={deleteOpen}
        brief={briefToDelete}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}

