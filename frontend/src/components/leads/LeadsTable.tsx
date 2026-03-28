import type { Lead } from "@/types/lead";
import { Pencil, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLeadCreatedAt } from "@/lib/leads";

type LeadsTableProps = {
  leads: Lead[];
  onAdd: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
};

export function LeadsTable({
  leads,
  onAdd,
  onEdit,
  onDelete,
  onConvert,
}: LeadsTableProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">לידים</h2>
          <p className="text-sm text-muted-foreground">
            ניהול לידים מקומי – ללא שרת.
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
              <th className="px-3 py-2 font-medium">תאריך יצירה</th>
              <th className="px-3 py-2 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  אין לידים. הוסף ליד חדש.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isConverted = Boolean(lead.convertedClientId);
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
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onConvert(lead)}
                          size="sm"
                          className="h-7 px-3 text-xs"
                          disabled={isConverted}
                        >
                          <UserCheck className="me-2 h-4 w-4 text-[#3B82F6]" />
                          {isConverted ? "הפך ללקוח" : "הפוך ללקוח"}
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
