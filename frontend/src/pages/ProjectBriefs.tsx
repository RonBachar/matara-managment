import { useEffect, useMemo, useState } from "react";
import { useBlocker } from "react-router-dom";
import type { ProjectBrief, ProjectBriefInput } from "@/types/projectBrief";
import { ProjectBriefTable } from "@/components/project-briefs/ProjectBriefTable";
import { ProjectBriefForm } from "@/components/project-briefs/ProjectBriefForm";
import { DeleteProjectBriefDialog } from "@/components/project-briefs/DeleteProjectBriefDialog";
import { Button } from "@/components/ui/button";
import { PROJECT_BRIEFS_SHOW_LIST_EVENT } from "@/lib/nav";
import {
  apiCreateBrief,
  apiDeleteBrief,
  apiListBriefs,
  apiUpdateBrief,
} from "@/lib/projectBriefsApi";

export function ProjectBriefs() {
  const [briefs, setBriefs] = useState<ProjectBrief[]>([]);
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

  function clearFormView() {
    setMode(null);
    setActiveBrief(undefined);
    setDirty(false);
  }

  function openCreateBrief() {
    setMode("create");
    setActiveBrief(undefined);
  }

  function handleOpenBrief(brief: ProjectBrief) {
    setMode("edit");
    setActiveBrief(brief);
  }

  function handleDeleteRequest() {
    if (!activeBrief) return;
    setBriefToDelete(activeBrief);
    setDeleteOpen(true);
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
  }

  async function handleFormSubmit(input: ProjectBriefInput) {
    if (mode === "edit" && activeBrief) {
      const updated = await apiUpdateBrief(activeBrief.id, input);
      setBriefs((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      clearFormView();
      return;
    }

    const created = await apiCreateBrief(input);
    setBriefs((prev) => [created, ...prev.filter((b) => b.id !== created.id)]);
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
        <>
          <ProjectBriefTable
            briefs={briefsSorted}
            onCreate={openCreateBrief}
            onOpenBrief={handleOpenBrief}
          />
        </>
      ) : (
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <ProjectBriefForm
            mode={mode!}
            initialBrief={mode === "edit" ? activeBrief : undefined}
            onCancel={requestLeaveForm}
            onSubmit={handleFormSubmit}
            onDirtyChange={setDirty}
            onRequestDelete={mode === "edit" ? handleDeleteRequest : undefined}
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
  return b.title?.trim() || b.businessNameSnapshot?.trim() || "";
}
