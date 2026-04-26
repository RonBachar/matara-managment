import type { Lead } from "@/types/lead";
import { LEAD_STATUS_OPTIONS } from "@/types/lead";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLeadCreatedAt, leadStatusPillClass } from "@/lib/leads";
import { cn } from "@/lib/utils";

type LeadsTableProps = {
  leads: Lead[];
  onAdd: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: Lead["status"]) => void;
};

export function LeadsTable({
  leads,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
}: LeadsTableProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">לידים</h2>
          <p className="text-sm text-muted-foreground">
            ניהול ומעקב לידים.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          className="bg-[#10B981] text-white hover:bg-[#059669]"
        >
          ליד חדש
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr className="text-right">
              <th className="px-3 py-2 font-medium">שם הלקוח</th>
              <th className="px-3 py-2 font-medium">טלפון</th>
              <th className="px-3 py-2 font-medium">אימייל</th>
              <th className="px-3 py-2 font-medium">מקור ליד</th>
              <th className="px-3 py-2 font-medium">סטטוס</th>
              <th className="px-3 py-2 font-medium">תאריך יצירה</th>
              <th className="px-3 py-2 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  אין לידים. הוסף ליד חדש.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                return (
                  <tr
                    key={lead.id}
                    className="border-t border-border/60 even:bg-muted/30"
                  >
                    <td className="px-3 py-2 align-middle">{lead.clientName}</td>
                    <td className="px-3 py-2 align-middle">{lead.phone}</td>
                    <td className="px-3 py-2 align-middle">
                      {lead.email?.trim() ? lead.email : "—"}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-xs text-muted-foreground">
                        {lead.leadSource || "—"}
                      </span>
                    </td>
                    <td className="min-w-[9.5rem] px-2 py-1.5 align-middle">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          onStatusChange(
                            lead.id,
                            e.target.value as Lead["status"],
                          )
                        }
                        className={cn(
                          "w-full min-w-[8.5rem] cursor-pointer rounded-md border px-2 py-1.5 text-xs font-medium shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                          leadStatusPillClass(lead.status),
                        )}
                        aria-label="סטטוס ליד"
                      >
                        {LEAD_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-xs text-muted-foreground">
                        {formatLeadCreatedAt(lead.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          onClick={() => onEdit(lead)}
                          aria-label="עריכת ליד"
                        >
                          <Pencil className="h-4 w-4 text-[#FBBF24]" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => onDelete(lead)}
                          aria-label="מחיקת ליד"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
