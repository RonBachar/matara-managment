import { useEffect, useMemo, useState } from "react";
import { useBlocker, useSearchParams } from "react-router-dom";
import type { Project } from "@/types/project";
import type { ProjectBrief, ProjectBriefInput } from "@/types/projectBrief";
import { ProjectBriefTable } from "@/components/project-briefs/ProjectBriefTable";
import { ProjectBriefForm } from "@/components/project-briefs/ProjectBriefForm";
import { DeleteProjectBriefDialog } from "@/components/project-briefs/DeleteProjectBriefDialog";
import { ProjectBriefProjectPicker } from "@/components/project-briefs/ProjectBriefProjectPicker";
import { Button } from "@/components/ui/button";
import { PROJECT_BRIEFS_SHOW_LIST_EVENT } from "@/lib/nav";
import {
  BRIEFS_STORAGE_KEY,
  loadProjectBriefs,
  notifyBriefsChanged,
  projectForBriefEditor,
} from "@/lib/projectBriefStorage";
import { loadProjectsFromStorage } from "@/lib/projectsStorage";

export function ProjectBriefs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [briefs, setBriefs] = useState<ProjectBrief[]>(() =>
    loadProjectBriefs(),
  );
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [activeBrief, setActiveBrief] = useState<ProjectBrief | undefined>();
  const [formProject, setFormProject] = useState<Project | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerProjectId, setPickerProjectId] = useState("");
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
    notifyBriefsChanged();
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
        clearFormView();
      }
    };
    window.addEventListener(PROJECT_BRIEFS_SHOW_LIST_EVENT, onShowList);
    return () =>
      window.removeEventListener(PROJECT_BRIEFS_SHOW_LIST_EVENT, onShowList);
  }, [mode, dirty]);

  /** Deep-link: /project-briefs?project=<id> */
  useEffect(() => {
    const pid = searchParams.get("project");
    if (!pid) return;

    setSearchParams({}, { replace: true });

    const projects = loadProjectsFromStorage();
    const project = projects.find((p) => p.id === pid);
    if (!project) return;

    const brief = loadProjectBriefs().find((b) => b.projectId === pid);
    if (brief) {
      setMode("edit");
      setActiveBrief(brief);
      setFormProject(project);
    } else {
      setMode("create");
      setActiveBrief(undefined);
      setFormProject(project);
    }
  }, [searchParams, setSearchParams]);

  const briefsSorted = useMemo(
    () =>
      [...briefs].sort((a, b) =>
        getBriefDisplaySortKey(a).localeCompare(
          getBriefDisplaySortKey(b),
          "he",
        ),
      ),
    [briefs],
  );

  const projectsForPicker = useMemo(
    () => loadProjectsFromStorage(),
    [pickerOpen],
  );

  function clearFormView() {
    setMode(null);
    setActiveBrief(undefined);
    setFormProject(undefined);
    setDirty(false);
  }

  function openPicker() {
    setPickerProjectId("");
    setPickerOpen(true);
  }

  function handlePickerConfirm() {
    if (!pickerProjectId) return;
    const project = projectsForPicker.find((p) => p.id === pickerProjectId);
    if (!project) return;
    const existing = briefs.find((b) => b.projectId === project.id);
    setPickerOpen(false);
    if (existing) {
      setMode("edit");
      setActiveBrief(existing);
      setFormProject(project);
    } else {
      setMode("create");
      setActiveBrief(undefined);
      setFormProject(project);
    }
  }

  function handleOpenBrief(brief: ProjectBrief) {
    const projectsList = loadProjectsFromStorage();
    const project = projectForBriefEditor(brief, projectsList);
    setMode("edit");
    setActiveBrief(brief);
    setFormProject(project);
  }

  function handleDeleteRequest() {
    if (!activeBrief) return;
    setBriefToDelete(activeBrief);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!briefToDelete) return;
    setBriefs((prev) => prev.filter((brief) => brief.id !== briefToDelete.id));
    if (activeBrief?.id === briefToDelete.id) {
      clearFormView();
    }
    setDeleteOpen(false);
    setBriefToDelete(undefined);
  }

  function handleFormSubmit(input: ProjectBriefInput) {
    if (!formProject) return;
    const now = new Date().toISOString();
    const merged: ProjectBriefInput = {
      ...input,
      projectId: formProject.id,
      clientId: formProject.clientId,
      briefTitle: formProject.projectName,
      projectNameSnapshot: formProject.projectName,
      clientNameSnapshot: formProject.clientName,
    };

    if (mode === "edit" && activeBrief) {
      setBriefs((prev) =>
        prev.map((brief) =>
          brief.id === activeBrief.id
            ? {
                ...brief,
                ...merged,
                updatedAt: now,
              }
            : brief,
        ),
      );
      clearFormView();
      return;
    }

    const duplicate = briefs.some((b) => b.projectId === formProject.id);
    if (duplicate) {
      const existing = briefs.find((b) => b.projectId === formProject.id)!;
      setMode("edit");
      setActiveBrief(existing);
      return;
    }

    const newBrief: ProjectBrief = {
      id: String(Date.now()),
      createdAt: now,
      updatedAt: now,
      ...merged,
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

  const editorProject = useMemo(() => {
    if (formProject) return formProject;
    if (!activeBrief) return undefined;
    return projectForBriefEditor(activeBrief, loadProjectsFromStorage());
  }, [formProject, activeBrief]);

  return (
    <section className="space-y-4">
      {!inForm ? (
        <>
          <ProjectBriefTable
            briefs={briefsSorted}
            onCreate={openPicker}
            onOpenBrief={handleOpenBrief}
          />
          <ProjectBriefProjectPicker
            open={pickerOpen}
            projects={projectsForPicker}
            selectedId={pickerProjectId}
            onSelectedIdChange={setPickerProjectId}
            onConfirm={handlePickerConfirm}
            onCancel={() => setPickerOpen(false)}
          />
        </>
      ) : (
        editorProject && (
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <ProjectBriefForm
              mode={mode!}
              initialBrief={mode === "edit" ? activeBrief : undefined}
              linkedProject={editorProject}
              onCancel={requestLeaveForm}
              onSubmit={handleFormSubmit}
              onDirtyChange={setDirty}
              onRequestDelete={mode === "edit" ? handleDeleteRequest : undefined}
            />
          </div>
        )
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={dismissLeave}
              >
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

function getBriefDisplaySortKey(b: ProjectBrief): string {
  return (
    b.projectNameSnapshot?.trim() ||
    b.briefTitle?.trim() ||
    b.clientNameSnapshot?.trim() ||
    ""
  );
}
