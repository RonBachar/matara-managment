import type { Lead } from "@/types/lead";
import { LEAD_STATUS_OPTIONS } from "@/types/lead";
import { Link } from "react-router-dom";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLeadCreatedAt, leadStatusPillClass } from "@/lib/leads";
import { cn } from "@/lib/utils";

type LeadsTableProps = {
  leads: Lead[];
  selectedIds: string[];
  onAdd: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: Lead["status"]) => void;
  onToggleSelect: (leadId: string) => void;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
  onConvert: (lead: Lead) => void;
  convertingId?: string;
};

const CHECKBOX_CLASS = "size-4 cursor-pointer accent-[#7C3AED] disabled:cursor-not-allowed";

export function LeadsTable({
  leads,
  selectedIds,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleSelect,
  onToggleSelectAll,
  onDeleteSelected,
  onConvert,
  convertingId,
}: LeadsTableProps) {
  const selected = new Set(selectedIds);
  const allSelected = leads.length > 0 && selectedIds.length === leads.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">לידים</h2>
          <p className="text-sm text-muted-foreground">ניהול ומעקב לידים.</p>
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          className="bg-[#10B981] text-white hover:bg-[#059669]"
        >
          ליד חדש
        </Button>
      </div>

      {/* Only takes up room once something is selected. */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#7C3AED]/40 bg-[#7C3AED]/5 px-3 py-2">
          <span className="text-sm font-medium text-foreground">
            נבחרו {selectedIds.length} לידים
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onToggleSelectAll}>
              {allSelected ? "נקה בחירה" : "בחר הכל"}
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onDeleteSelected}>
              <Trash2 className="h-4 w-4" />
              מחיקת הנבחרים
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr className="text-right">
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  className={CHECKBOX_CLASS}
                  checked={allSelected}
                  ref={(el) => {
                    // Half-filled box when only some rows are ticked.
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  disabled={leads.length === 0}
                  aria-label="בחירת כל הלידים"
                />
              </th>
              <th className="px-3 py-2 font-medium">תאריך יצירה</th>
              <th className="px-3 py-2 font-medium">שם הלקוח</th>
              <th className="px-3 py-2 font-medium">טלפון</th>
              <th className="px-3 py-2 font-medium">אימייל</th>
              <th className="px-3 py-2 font-medium">שירות מבוקש</th>
              <th className="px-3 py-2 font-medium">מקור הליד</th>
              <th className="px-3 py-2 font-medium">סטטוס</th>
              <th className="px-3 py-2 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                  אין לידים. הוסף ליד חדש.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isSelected = selected.has(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className={cn(
                      "border-t border-border/60",
                      isSelected ? "bg-[#7C3AED]/5" : "even:bg-muted/30",
                    )}
                  >
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="checkbox"
                        className={CHECKBOX_CLASS}
                        checked={isSelected}
                        onChange={() => onToggleSelect(lead.id)}
                        aria-label={`בחירת ${lead.clientName}`}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-xs text-muted-foreground">
                        {formatLeadCreatedAt(lead.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        <span>{lead.clientName}</span>
                        {(lead.submissionCount ?? 1) > 1 && (
                          <span
                            className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[0.7rem] font-medium text-violet-800"
                            title="מספר הפניות שהתקבלו מאדם זה"
                          >
                            פנה {lead.submissionCount} פעמים
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">{lead.phone}</td>
                    <td className="px-3 py-2 align-middle">
                      {lead.email?.trim() ? lead.email : "—"}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="text-xs text-muted-foreground">
                        {lead.serviceType || "—"}
                      </span>
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
                          onStatusChange(lead.id, e.target.value as Lead["status"])
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
                    <td className="px-3 py-2 align-middle text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {lead.convertedClientId ? (
                          <Link
                            to={`/clients/${lead.convertedClientId}`}
                            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
                          >
                            לקוח
                          </Link>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 border-emerald-300 text-xs text-emerald-800 hover:bg-emerald-50"
                            onClick={() => onConvert(lead)}
                            disabled={convertingId === lead.id}
                            aria-label="הפוך ללקוח"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            {convertingId === lead.id ? "ממיר..." : "הפוך ללקוח"}
                          </Button>
                        )}
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
