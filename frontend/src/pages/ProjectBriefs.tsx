import { useEffect, useMemo, useState } from "react";
import { useBlocker } from "react-router-dom";
import type { ProjectBrief, ProjectBriefInput } from "@/types/projectBrief";
import { WEBSITE_GOAL_OPTIONS } from "@/types/projectBrief";
import { ProjectBriefTable } from "@/components/project-briefs/ProjectBriefTable";
import { ProjectBriefForm } from "@/components/project-briefs/ProjectBriefForm";
import { DeleteProjectBriefDialog } from "@/components/project-briefs/DeleteProjectBriefDialog";
import { Button } from "@/components/ui/button";
import { PROJECT_BRIEFS_SHOW_LIST_EVENT } from "@/lib/nav";

const BRIEFS_STORAGE_KEY = "matara_project_briefs";

function normalizeBrief(raw: Record<string, unknown>): ProjectBrief {
  const ensureString = (value: unknown): string =>
    typeof value === "string" ? value : "";
  const ensureStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((entry) => typeof entry === "string")
      : [];
  const nowIso = new Date().toISOString();

  const legacyProjectName = ensureString(raw.projectNameSnapshot);
  const briefTitle = ensureString(raw.briefTitle) || legacyProjectName || "";
  const legacyProjectGoal = ensureString(
    (raw as Record<string, unknown>).projectGoal,
  );
  let websiteGoal = ensureString((raw as Record<string, unknown>).websiteGoal);
  if (
    !websiteGoal &&
    (WEBSITE_GOAL_OPTIONS as readonly string[]).includes(legacyProjectGoal)
  ) {
    websiteGoal = legacyProjectGoal;
  }

  return {
    id: ensureString(raw.id) || String(Date.now()),
    projectId:
      typeof raw.projectId === "string" && raw.projectId
        ? raw.projectId
        : undefined,
    clientId:
      typeof raw.clientId === "string" && raw.clientId
        ? raw.clientId
        : undefined,
    briefTitle,
    businessNameSnapshot: ensureString(raw.businessNameSnapshot),
    clientNameSnapshot: ensureString(raw.clientNameSnapshot),
    projectNameSnapshot:
      typeof raw.projectNameSnapshot === "string" &&
      raw.projectNameSnapshot.trim()
        ? raw.projectNameSnapshot.trim()
        : undefined,
    createdAt: ensureString(raw.createdAt) || nowIso,
    updatedAt:
      ensureString(raw.updatedAt) || ensureString(raw.createdAt) || nowIso,
    websiteType: ensureString((raw as Record<string, unknown>).websiteType),
    websiteGoal,
    pageCount: ensureString((raw as Record<string, unknown>).pageCount),
    pageListAiSuggested: (() => {
      const v = (raw as Record<string, unknown>).pageListAiSuggested;
      return typeof v === "boolean" ? v : false;
    })(),
    requiredPages: ensureString((raw as Record<string, unknown>).requiredPages),
    strategicDecisions: ensureString(
      (raw as Record<string, unknown>).strategicDecisions,
    ),
    lockedFixedInput: ensureString(
      (raw as Record<string, unknown>).lockedFixedInput,
    ),
    sourceMaterials: ensureString(
      (raw as Record<string, unknown>).sourceMaterials,
    ),
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
    gpt1Output:
      typeof (raw as Record<string, unknown>).gpt1Output === "string"
        ? String((raw as Record<string, unknown>).gpt1Output)
        : undefined,
    gpt2Output:
      typeof (raw as Record<string, unknown>).gpt2Output === "string"
        ? String((raw as Record<string, unknown>).gpt2Output)
        : undefined,
    gpt3Output:
      typeof (raw as Record<string, unknown>).gpt3Output === "string"
        ? String((raw as Record<string, unknown>).gpt3Output)
        : undefined,
  };
}

function loadStoredBriefs(): ProjectBrief[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(BRIEFS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((brief) =>
      normalizeBrief(brief as Record<string, unknown>),
    );
  } catch {
    return [];
  }
}

export function ProjectBriefs() {
  const [briefs, setBriefs] = useState<ProjectBrief[]>(() =>
    loadStoredBriefs(),
  );
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [activeBrief, setActiveBrief] = useState<ProjectBrief | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [briefToDelete, setBriefToDelete] = useState<
    ProjectBrief | undefined
  >();
  const [dirty, setDirty] = useState(false);
  const [internalLeaveOpen, setInternalLeaveOpen] = useState(false);

  const inForm = mode !== null;
  const blocker = useBlocker(inForm && dirty);

  useEffect(() => {
    if (!mode) setDirty(false);
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BRIEFS_STORAGE_KEY, JSON.stringify(briefs));
  }, [briefs]);

  useEffect(() => {
    if (!inForm || !dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [inForm, dirty]);

  useEffect(() => {
    const onShowList = () => {
      if (!mode) return;
      if (dirty) {
        setInternalLeaveOpen(true);
      } else {
        setMode(null);
        setActiveBrief(undefined);
      }
    };
    window.addEventListener(PROJECT_BRIEFS_SHOW_LIST_EVENT, onShowList);
    return () =>
      window.removeEventListener(PROJECT_BRIEFS_SHOW_LIST_EVENT, onShowList);
  }, [mode, dirty]);

  const briefsSorted = useMemo(
    () =>
      [...briefs].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [briefs],
  );

  function clearFormView() {
    setMode(null);
    setActiveBrief(undefined);
    setDirty(false);
  }

  function handleCreate() {
    setMode("create");
    setActiveBrief(undefined);
  }

  function handleEdit(brief: ProjectBrief) {
    setMode("edit");
    setActiveBrief(brief);
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
  }

  function handleFormSubmit(input: ProjectBriefInput) {
    const now = new Date().toISOString();
    if (mode === "edit" && activeBrief) {
      setBriefs((prev) =>
        prev.map((brief) =>
          brief.id === activeBrief.id
            ? {
                ...brief,
                ...input,
                updatedAt: now,
              }
            : brief,
        ),
      );
      clearFormView();
      return;
    }

    const newBrief: ProjectBrief = {
      id: String(Date.now()),
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    setBriefs((prev) => [...prev, newBrief]);
    clearFormView();
  }

  function requestLeaveForm() {
    if (dirty) {
      setInternalLeaveOpen(true);
    } else {
      clearFormView();
    }
  }

  function confirmLeave() {
    if (blocker.state === "blocked") {
      blocker.proceed();
    } else {
      clearFormView();
    }
    setInternalLeaveOpen(false);
  }

  function dismissLeave() {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setInternalLeaveOpen(false);
  }

  const showLeaveModal = blocker.state === "blocked" || internalLeaveOpen;

  return (
    <section className="space-y-4">
      {!inForm ? (
        <ProjectBriefTable
          briefs={briefsSorted}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      ) : (
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <ProjectBriefForm
            mode={mode}
            initialBrief={mode === "edit" ? activeBrief : undefined}
            onCancel={requestLeaveForm}
            onSubmit={handleFormSubmit}
            onDirtyChange={setDirty}
          />
        </div>
      )}

      <DeleteProjectBriefDialog
        open={deleteOpen}
        brief={briefToDelete}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-lg">
            <p className="text-base leading-relaxed text-foreground">
              יש שינויים שלא נשמרו. האם לצאת בלי לשמור?
            </p>
            <div className="mt-5 flex justify-between gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={dismissLeave}>
                המשך לערוך
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="px-4"
                onClick={confirmLeave}
              >
                צא בלי לשמור
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
