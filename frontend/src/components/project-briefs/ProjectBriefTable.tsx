import { Pencil, Trash2 } from "lucide-react";
import type { ProjectBrief } from "@/types/projectBrief";
import { getBriefDisplayTitle } from "@/types/projectBrief";
import { Button } from "@/components/ui/button";

type ProjectBriefTableProps = {
  briefs: ProjectBrief[];
  onCreate: () => void;
  onEdit: (brief: ProjectBrief) => void;
  onDelete: (brief: ProjectBrief) => void;
};

export function ProjectBriefTable({
  briefs,
  onCreate,
  onEdit,
  onDelete,
}: ProjectBriefTableProps) {
  return (
    <section className="space-y-5 text-base">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">אפיון פרויקטים</h2>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            מסמכי אפיון עצמאיים — ניתן לפתוח בריף חדש בכל עת.
          </p>
        </div>
        <Button
          onClick={onCreate}
          className="bg-[#10B981] px-4 text-sm text-white hover:bg-[#059669]"
        >
          בריף חדש
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-base">
          <thead className="bg-muted/60 text-sm font-semibold">
            <tr className="text-right">
              <th className="px-3 py-2.5 font-medium">שם האפיון</th>
              <th className="px-3 py-2.5 font-medium">שם העסק</th>
              <th className="px-3 py-2.5 font-medium">שם הלקוח</th>
              <th className="px-3 py-2.5 font-medium">תאריך יצירה</th>
              <th className="px-3 py-2.5 font-medium">תאריך עדכון</th>
              <th className="px-3 py-2.5 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {briefs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-base text-muted-foreground"
                >
                  אין בריפים עדיין. לחץ על &quot;בריף חדש&quot; כדי להתחיל.
                </td>
              </tr>
            ) : (
              briefs.map((brief) => (
                <tr
                  key={brief.id}
                  className="border-t border-border/60 even:bg-muted/30"
                >
                  <td className="px-3 py-2.5 align-middle leading-snug">
                    {getBriefDisplayTitle(brief)}
                  </td>
                  <td className="px-3 py-2.5 align-middle leading-snug">
                    {brief.businessNameSnapshot?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2.5 align-middle leading-snug">
                    {brief.clientNameSnapshot?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-sm text-muted-foreground">
                    {new Date(brief.createdAt).toLocaleDateString("he-IL")}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-sm text-muted-foreground">
                    {new Date(brief.updatedAt).toLocaleDateString("he-IL")}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-sm"
                        onClick={() => onEdit(brief)}
                        aria-label="עריכת בריף"
                      >
                        <Pencil className="h-4 w-4 text-[#FBBF24]" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => onDelete(brief)}
                        aria-label="מחיקת בריף"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
