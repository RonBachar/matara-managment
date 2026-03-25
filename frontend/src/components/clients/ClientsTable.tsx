import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Client } from "@/types/client";
import { getPackageTypeLabel } from "@/types/client";
import { Button } from "@/components/ui/button";
import { getClientTypeLabel } from "@/lib/client-type";

type ClientsTableProps = {
  clients: Client[];
  onAdd: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView?: (client: Client) => void;
  selectedClientIds: string[];
  onSelectedClientIdsChange: (next: string[]) => void;
  onBulkDelete: () => void;
};

export function ClientsTable({
  clients,
  onAdd,
  onEdit,
  onDelete,
  selectedClientIds,
  onSelectedClientIdsChange,
  onBulkDelete,
}: ClientsTableProps) {
  const sortedByRenewalDate = [...clients].sort((a, b) => {
    const aDate = a.renewalDate ?? "";
    const bDate = b.renewalDate ?? "";
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.localeCompare(bDate);
  });

  const selectedSet = useMemo(
    () => new Set(selectedClientIds),
    [selectedClientIds],
  );
  const allIds = useMemo(
    () => sortedByRenewalDate.map((c) => c.id),
    [sortedByRenewalDate],
  );
  const selectedCount = selectedClientIds.length;
  const allSelected = allIds.length > 0 && selectedCount === allIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const selectAllRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  function toggleOne(id: string) {
    onSelectedClientIdsChange(
      selectedSet.has(id)
        ? selectedClientIds.filter((x) => x !== id)
        : [...selectedClientIds, id],
    );
  }

  function toggleAll() {
    onSelectedClientIdsChange(allSelected ? [] : allIds);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">לקוחות</h2>
          <p className="text-sm text-muted-foreground">
            ניהול בסיסי של לקוחות במערכת.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onBulkDelete}
              className="px-3"
            >
              מחיקה ({selectedCount})
            </Button>
          )}
          <Button
            size="sm"
            onClick={onAdd}
            className="bg-[#10B981] text-white hover:bg-[#059669]"
          >
            לקוח חדש
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr className="text-right">
              <th className="px-2.5 py-1.5 text-center">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="בחר הכל"
                  className="h-4 w-4 accent-slate-900"
                />
              </th>
              <th className="px-2.5 py-1.5 font-medium">שם העסק</th>
              <th className="px-2.5 py-1.5 font-medium">סוג שירות</th>
              <th className="px-2.5 py-1.5 font-medium">איש קשר</th>
              <th className="px-2.5 py-1.5 font-medium">טלפון</th>
              <th className="px-2.5 py-1.5 font-medium">אימייל</th>
              <th className="px-2.5 py-1.5 font-medium">אתר</th>
              <th className="px-2.5 py-1.5 font-medium">חבילה</th>
              <th className="px-2.5 py-1.5 font-medium">מחיר חידוש</th>
              <th className="px-2.5 py-1.5 font-medium">תאריך חידוש</th>
              <th className="px-2.5 py-1.5 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {sortedByRenewalDate.map((client) => (
              <tr
                key={client.id}
                className="border-t border-border/60 even:bg-muted/30"
              >
                <td className="px-2.5 py-1.5 align-middle text-center">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(client.id)}
                    onChange={() => toggleOne(client.id)}
                    aria-label={`בחר ${client.businessName}`}
                    className="h-4 w-4 accent-slate-900"
                  />
                </td>
                <td className="px-2.5 py-1.5 align-middle">
                  {client.businessName}
                </td>
                <td className="px-2.5 py-1.5 align-middle">
                  {getClientTypeLabel(client.clientType)}
                </td>
                <td className="px-2.5 py-1.5 align-middle">
                  {client.contactPerson}
                </td>
                <td className="px-2.5 py-1.5 align-middle">{client.phone}</td>
                <td className="px-2.5 py-1.5 align-middle">{client.email}</td>
                <td className="px-2.5 py-1.5 align-middle">
                  {client.website ? (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      {client.website}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-2.5 py-1.5 align-middle">
                  <span className="text-xs text-muted-foreground">
                    {client.clientType === "Website Client"
                      ? getPackageTypeLabel(client.packageType)
                      : "—"}
                  </span>
                </td>
                <td className="px-2.5 py-1.5 align-middle">
                  {client.clientType === "Website Client" &&
                  client.packageType !== "None" ? (
                    <>
                      ₪
                      {Number(client.renewalPrice ?? 0).toLocaleString("he-IL")}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-2.5 py-1.5 align-middle">
                  {client.clientType === "Website Client" &&
                  client.packageType !== "None" &&
                  client.renewalDate ? (
                    new Date(client.renewalDate).toLocaleDateString("he-IL")
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-2.5 py-1.5 align-middle text-center">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link
                      to={`/clients/${client.id}`}
                      state={{ client }}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#D1D5DB] bg-background text-[#374151] size-7 transition-colors hover:bg-[#F9FAFB]"
                      aria-label="צפייה בלקוח"
                    >
                      <Eye className="h-4 w-4 text-[#3B82F6]" />
                    </Link>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      onClick={() => onEdit(client)}
                      aria-label="עריכת לקוח"
                    >
                      <Pencil className="h-4 w-4 text-[#FBBF24]" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => onDelete(client)}
                      aria-label="מחיקת לקוח"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
