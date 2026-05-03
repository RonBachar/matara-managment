import type { ProjectBrief } from "@/types/projectBrief";
import { Button } from "@/components/ui/button";

type ProjectBriefTableProps = {
  briefs: ProjectBrief[];
  onCreate: () => void;
  onOpenBrief: (brief: ProjectBrief) => void;
};

export function ProjectBriefTable({
  briefs,
  onCreate,
  onOpenBrief,
}: ProjectBriefTableProps) {
  return (
    <section className="space-y-5 text-base">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">אפיונים</h2>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            אפיונים עצמאיים הנשמרים בבסיס הנתונים.
          </p>
        </div>
        <Button
          onClick={onCreate}
          className="bg-[#10B981] px-4 text-sm text-white hover:bg-[#059669]"
        >
          אפיון חדש
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-base">
          <thead className="bg-muted/60 text-sm font-semibold">
            <tr className="text-start">
              <th className="px-3 py-2.5 font-medium">שם העסק</th>
            </tr>
          </thead>
          <tbody>
            {briefs.length === 0 ? (
              <tr>
                <td
                  colSpan={1}
                  className="px-3 py-8 text-center text-base text-muted-foreground"
                >
                  אין אפיונים עדיין. צרו אפיון חדש.
                </td>
              </tr>
            ) : (
              briefs.map((brief) => (
                <tr
                  key={brief.id}
                  className="cursor-pointer border-t border-border/60 even:bg-muted/30 hover:bg-muted/50"
                  onClick={() => onOpenBrief(brief)}
                >
                  <td className="px-3 py-2.5 align-middle leading-snug">
                    {brief.businessNameSnapshot?.trim() || "ללא שם"}
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
