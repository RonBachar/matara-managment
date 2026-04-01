import type { Project } from "@/types/project";
import { Button } from "@/components/ui/button";

type ProjectBriefProjectPickerProps = {
  open: boolean;
  projects: Project[];
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ProjectBriefProjectPicker({
  open,
  projects,
  selectedId,
  onSelectedIdChange,
  onConfirm,
  onCancel,
}: ProjectBriefProjectPickerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-lg"
        dir="rtl"
      >
        <h2 className="text-base font-semibold text-foreground">
          בחר פרויקט לאפיון
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          לכל פרויקט אפיון אחד בלבד. אם כבר קיים אפיון — ייפתח לעריכה.
        </p>
        <div className="mt-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              אין פרויקטים. צרו פרויקט בעמוד פרויקטים, ואז חזרו לכאן.
            </p>
          ) : (
            <>
              <label className="sr-only" htmlFor="brief-project-select">
                פרויקט
              </label>
              <select
                id="brief-project-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedId}
                onChange={(e) => onSelectedIdChange(e.target.value)}
              >
                <option value="">בחרו פרויקט…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} — {p.clientName}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="mt-5 flex justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            ביטול
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-[#10B981] text-white hover:bg-[#059669]"
            disabled={!selectedId || projects.length === 0}
            onClick={onConfirm}
          >
            המשך
          </Button>
        </div>
      </div>
    </div>
  );
}
