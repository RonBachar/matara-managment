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
import { notifyBriefsChanged } from "@/lib/projectBriefStorage";
import { apiGetProjects } from "@/lib/projectsApi";
import {
  apiCreateBrief,
  apiDeleteBrief,
  apiGetBriefByProjectId,
  apiListBriefs,
  apiUpdateBrief,
} from "@/lib/projectBriefsApi";

export function ProjectBriefs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [briefs, setBriefs] = useState<ProjectBrief[]>([]);
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
    let cancelled = false;
    apiGetProjects()
      .then((rows) => {
        if (cancelled) return;
        setProjects(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiListBriefs()
      .then((rows) => {
        if (cancelled) return;
        setBriefs(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setBriefs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

    const project = projects.find((p) => p.id === pid);
    if (!project) return;

    setSearchParams({}, { replace: true });

    let cancelled = false;
    apiGetBriefByProjectId(pid)
      .then((brief) => {
        if (cancelled) return;
        setMode("edit");
        setActiveBrief(brief);
        setFormProject(project);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("HTTP 404")) {
          setMode("create");
          setActiveBrief(undefined);
          setFormProject(project);
          return;
        }
        // On other errors, stay in list mode (beginner-friendly).
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, projects]);

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
    () => projects,
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
    const project =
      projects.find((p) => p.id === brief.projectId) ??
      ({
        id: brief.projectId,
        projectName: brief.projectNameSnapshot || brief.briefTitle || "פרויקט",
        clientId: brief.clientId,
        clientName: brief.clientNameSnapshot,
        projectType: "בניית אתר",
        status: "New",
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        hourlyRate: 0,
        workedHours: 0,
        billableTotal: 0,
      } satisfies Project);
    setMode("edit");
    setActiveBrief(brief);
    setFormProject(project);
  }

  function handleDeleteRequest() {
    if (!activeBrief) return;
    setBriefToDelete(activeBrief);
    setDeleteOpen(true);
  }

  function displayClientNameSnapshot(raw: string): string {
    const s = raw.trim();
    if (!s) return s;
    if (s.includes("·")) {
      const parts = s
        .split("·")
        .map((p) => p.trim())
        .filter(Boolean);
      return parts[parts.length - 1] || s;
    }
    return s;
  }

  async function handleDeleteConfirm() {
    if (!briefToDelete) return;
    await apiDeleteBrief(briefToDelete.id);
    setBriefs((prev) => prev.filter((brief) => brief.id !== briefToDelete.id));
    if (activeBrief?.id === briefToDelete.id) {
      clearFormView();
    }
    setDeleteOpen(false);
    setBriefToDelete(undefined);
    notifyBriefsChanged();
  }

  async function handleFormSubmit(input: ProjectBriefInput) {
    if (!formProject) return;
    const merged: ProjectBriefInput = {
      ...input,
      projectId: formProject.id,
      clientId: formProject.clientId,
      briefTitle: formProject.projectName,
      projectNameSnapshot: formProject.projectName,
      clientNameSnapshot: displayClientNameSnapshot(formProject.clientName),
    };

    if (mode === "edit" && activeBrief) {
      const updated = await apiUpdateBrief(activeBrief.id, merged);
      setBriefs((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      clearFormView();
      notifyBriefsChanged();
      return;
    }

    const created = await apiCreateBrief(formProject.id, merged);
    setBriefs((prev) => [created, ...prev.filter((b) => b.id !== created.id)]);
    clearFormView();
    notifyBriefsChanged();
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
    return (
      projects.find((p) => p.id === activeBrief.projectId) ??
      ({
        id: activeBrief.projectId,
        projectName:
          activeBrief.projectNameSnapshot || activeBrief.briefTitle || "פרויקט",
        clientId: activeBrief.clientId,
        clientName: activeBrief.clientNameSnapshot,
        projectType: "בניית אתר",
        status: "New",
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        hourlyRate: 0,
        workedHours: 0,
        billableTotal: 0,
      } satisfies Project)
    );
  }, [formProject, activeBrief, projects]);

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
