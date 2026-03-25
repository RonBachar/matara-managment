import type { Lead, LeadStatus } from "@/types/lead";
import { Pencil, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type LeadsTableProps = {
  leads: Lead[];
  onAdd: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
};

const STATUS_OPTIONS: LeadStatus[] = [
  "חדש",
  "במעקב",
  "הצעת מחיר נשלחה",
  "נסגר",
  "לא רלוונטי",
];

const STATUS_STYLES: Record<LeadStatus, string> = {
  חדש: "bg-sky-50 text-sky-700 border-sky-200/70",
  במעקב: "bg-amber-50 text-amber-700 border-amber-200/70",
  "הצעת מחיר נשלחה": "bg-violet-50 text-violet-700 border-violet-200/70",
  נסגר: "bg-rose-50 text-rose-700 border-rose-200/70",
  "לא רלוונטי": "bg-slate-100 text-slate-600 border-slate-200/70",
  "הפך ללקוח": "bg-emerald-50/70 text-emerald-800 border-emerald-200/70",
};

function getStatusStyle(status: LeadStatus): string {
  return (
    STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border"
  );
}

export function LeadsTable({
  leads,
  onAdd,
  onEdit,
  onDelete,
  onConvert,
  onStatusChange,
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
              <th className="px-3 py-2 font-medium">נוצר בתאריך</th>
              <th className="px-3 py-2 font-medium">שם מלא</th>
              <th className="px-3 py-2 font-medium">טלפון</th>
              <th className="px-3 py-2 font-medium">אימייל</th>
              <th className="px-3 py-2 font-medium">שירות מבוקש</th>
              <th className="px-3 py-2 font-medium">מקור ליד</th>
              <th className="px-3 py-2 font-medium">סטטוס</th>
              <th className="px-3 py-2 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  אין לידים. הוסף ליד חדש.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-border/60 even:bg-muted/30"
                >
                  <td className="px-3 py-2 align-middle">
                    <span className="text-xs text-muted-foreground">
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleDateString("he-IL")
                        : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    {lead.contactPerson}
                  </td>
                  <td className="px-3 py-2 align-middle">{lead.phone}</td>
                  <td className="px-3 py-2 align-middle">{lead.email}</td>
                  <td className="px-3 py-2 align-middle">
                    <span className="text-xs text-muted-foreground">
                      {lead.requestedService || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="text-xs text-muted-foreground">
                      {lead.leadSource || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    {lead.status === "הפך ללקוח" ||
                    Boolean(lead.convertedClientId) ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          getStatusStyle("הפך ללקוח"),
                        )}
                      >
                        הפך ללקוח
                      </span>
                    ) : (
                      <Select
                        value={lead.status}
                        onValueChange={(value) =>
                          onStatusChange(lead, value as LeadStatus)
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className={cn(
                            "h-7 min-w-[7rem] border text-xs font-medium transition-colors hover:opacity-90",
                            getStatusStyle(lead.status),
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem
                              key={status}
                              value={status}
                              className="text-xs"
                            >
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-3 py-2 align-middle text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onConvert(lead)}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        disabled={
                          lead.status === "הפך ללקוח" ||
                          Boolean(lead.convertedClientId)
                        }
                      >
                        <UserCheck className="me-2 h-4 w-4 text-[#3B82F6]" />
                        {lead.status === "הפך ללקוח" || lead.convertedClientId
                          ? "הפך ללקוח"
                          : "הפוך ללקוח"}
                      </Button>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
