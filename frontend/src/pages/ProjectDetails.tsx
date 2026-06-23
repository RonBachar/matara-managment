import { useCallback, useEffect, useState } from "react";
import { Link, useBlocker, useParams } from "react-router-dom";
import type { Project } from "@/types/project";
import type { ProjectBrief, ProjectBriefInput } from "@/types/projectBrief";
import { Button } from "@/components/ui/button";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ProjectBriefForm } from "@/components/project-briefs/ProjectBriefForm";
import { DeleteProjectBriefDialog } from "@/components/project-briefs/DeleteProjectBriefDialog";
import { apiGetProjectById, apiUpdateProject } from "@/lib/projectsApi";
import {
  createBrief,
  deleteBrief,
  getBriefByProject,
  updateBrief,
} from "@/lib/projectBriefsApi";

export function ProjectDetails() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [briefMode, setBriefMode] = useState<"create" | "edit" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const inBriefForm = briefMode !== null;
  const blocker = useBlocker(inBriefForm && dirty);

  const clearBriefForm = useCallback(() => {
    setBriefMode(null);
    setDirty(false);
  }, []);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([apiGetProjectById(params.id), getBriefByProject(params.id)])
      .then(([proj, br]) => {
        if (cancelled) return;
        setProject(proj);
        setBrief(br);
      })
      .catch(() => {
        if (cancelled) return;
        setProject(null);
        setBrief(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!inBriefForm || !dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [inBriefForm, dirty]);

  async function handleBriefSubmit(input: ProjectBriefInput) {
    if (!project) return;

    if (briefMode === "edit" && brief) {
      const updated = await updateBrief(brief.id, { data: input });
      setBrief(updated);
      clearBriefForm();
      return;
    }

    const created = await createBrief({ projectId: project.id, data: input });
    setBrief(created);
    clearBriefForm();
  }

  function requestLeaveBriefForm() {
    if (dirty) {
      setLeaveOpen(true);
    } else {
      clearBriefForm();
    }
  }

  function confirmLeave() {
    if (blocker.state === "blocked") {
      blocker.proceed();
    } else {
      clearBriefForm();
    }
    setLeaveOpen(false);
  }

  function dismissLeave() {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setLeaveOpen(false);
  }

  const showLeaveModal = blocker.state === "blocked" || leaveOpen;

  if (loading) {
    return <p className="text-sm text-muted-foreground">טוען...</p>;
  }

  if (!project) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">פרויקט לא נמצא</h2>
        <p className="text-sm text-muted-foreground">לא הצלחנו למצוא את פרטי הפרויקט.</p>
        <Link to="/projects">
          <Button type="button" size="sm" variant="outline">
            חזרה לרשימת הפרויקטים
          </Button>
        </Link>
      </section>
    );
  }

  const remaining = Math.max(0, project.totalAmount - project.paidAmount);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{project.projectName}</h2>
          <p className="text-sm text-muted-foreground">
            {project.client?.clientName ?? "—"} · {project.status}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => setEditOpen(true)}>
            עריכת פרויקט
          </Button>
          <Link to="/projects">
            <Button type="button" size="sm" variant="outline">
              חזרה לפרויקטים
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">סכום כולל</div>
          <div className="mt-1 text-lg font-semibold">
            ₪{project.totalAmount.toLocaleString("he-IL")}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">שולם</div>
          <div className="mt-1 text-lg font-semibold">
            ₪{project.paidAmount.toLocaleString("he-IL")}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">נותר לגבייה</div>
          <div className="mt-1 text-lg font-semibold">₪{remaining.toLocaleString("he-IL")}</div>
        </div>
      </div>

      {project.notes && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">הערות</div>
          <p className="mt-1 text-sm text-muted-foreground">{project.notes}</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">אפיון פרויקט</div>
          {!inBriefForm && !brief && (
            <Button type="button" size="sm" onClick={() => setBriefMode("create")}>
              + צור אפיון לפרויקט
            </Button>
          )}
          {!inBriefForm && brief && (
            <Button type="button" size="sm" variant="outline" onClick={() => setBriefMode("edit")}>
              עריכת אפיון
            </Button>
          )}
        </div>

        {inBriefForm ? (
          <div className="mx-auto w-full max-w-4xl">
            <ProjectBriefForm
              mode={briefMode!}
              initialBrief={briefMode === "edit" ? brief ?? undefined : undefined}
              onCancel={requestLeaveBriefForm}
              onSubmit={handleBriefSubmit}
              onDirtyChange={setDirty}
              onRequestDelete={briefMode === "edit" && brief ? () => setDeleteOpen(true) : undefined}
            />
          </div>
        ) : brief ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium">{brief.title || brief.businessNameSnapshot}</p>
            <p className="text-muted-foreground">
              עודכן לאחרונה: {new Date(brief.updatedAt).toLocaleDateString("he-IL")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">טרם נוצר אפיון לפרויקט זה.</p>
        )}
      </div>

      <ProjectFormModal
        open={editOpen}
        mode="edit"
        initialProject={project}
        onClose={() => setEditOpen(false)}
        onSubmit={async (updated) => {
          const saved = await apiUpdateProject(project.id, {
            projectName: updated.projectName,
            clientId: updated.clientId,
            status: updated.status,
            totalAmount: updated.totalAmount,
            paidAmount: updated.paidAmount,
            notes: updated.notes ?? null,
          });
          setProject(saved);
          setEditOpen(false);
        }}
      />

      <DeleteProjectBriefDialog
        open={deleteOpen}
        brief={brief ?? undefined}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (!brief) return;
          await deleteBrief(brief.id);
          setBrief(null);
          clearBriefForm();
          setDeleteOpen(false);
        }}
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
