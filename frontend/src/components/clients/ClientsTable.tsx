import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Client } from "@/types/client";
import { Button } from "@/components/ui/button";

type ClientsTableProps = {
  clients: Client[];
  onAdd: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
};

export function ClientsTable({ clients, onAdd, onEdit, onDelete }: ClientsTableProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">לקוחות</h2>
          <p className="text-sm text-muted-foreground">ניהול בסיסי של לקוחות במערכת.</p>
        </div>
        <div className="flex items-center gap-2">
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
              <th className="px-2.5 py-1.5 font-medium">איש קשר</th>
              <th className="px-2.5 py-1.5 font-medium">שם העסק</th>
              <th className="px-2.5 py-1.5 font-medium">טלפון</th>
              <th className="px-2.5 py-1.5 font-medium">אימייל</th>
              <th className="px-2.5 py-1.5 text-center font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-border/60 even:bg-muted/30">
                <td className="px-2.5 py-1.5 align-middle">{client.clientName}</td>
                <td className="px-2.5 py-1.5 align-middle">{client.businessName || "—"}</td>
                <td className="px-2.5 py-1.5 align-middle">{client.phone}</td>
                <td className="px-2.5 py-1.5 align-middle">{client.email}</td>
                <td className="px-2.5 py-1.5 align-middle text-center">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link
                      to={`/clients/${client.id}`}
                      state={{ client }}
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#D1D5DB] bg-background text-[#374151] transition-colors hover:bg-[#F9FAFB]"
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
