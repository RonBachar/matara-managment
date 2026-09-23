import { useState } from "react";
import { useEffect } from "react";
import type { Lead } from "@/types/lead";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { DeleteLeadDialog } from "@/components/leads/DeleteLeadDialog";
import { createLead, deleteLead, fetchLeads, updateLead } from "@/lib/leadsApi";
import { apiConvertLead } from "@/lib/clientsApi";
import { useNavigate } from "react-router-dom";

export function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [convertingId, setConvertingId] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeLead, setActiveLead] = useState<Lead | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  /** The leads the open dialog is about: one row, or the current selection. */
  const [pendingDelete, setPendingDelete] = useState<Lead[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeads() {
      try {
        const data = await fetchLeads();
        if (!cancelled) setLeads(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "טעינת הלידים נכשלה.");
      }
    }

    void loadLeads();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleAdd() {
    setFormMode("create");
    setActiveLead(undefined);
    setFormOpen(true);
  }

  function handleEdit(lead: Lead) {
    setFormMode("edit");
    setActiveLead(lead);
    setFormOpen(true);
  }

  async function handleFormSubmit(data: Omit<Lead, "id">) {
    try {
      if (formMode === "edit" && activeLead) {
        const updated = await updateLead(activeLead.id, data);
        setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
      } else {
        const created = await createLead(data);
        setLeads((prev) => [created, ...prev]);
      }
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שמירת הליד נכשלה.");
    }
  }

  function toggleSelect(leadId: string) {
    setSelectedIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId],
    );
  }

  /** Clears the selection when everything is already ticked, selects all otherwise. */
  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.length === leads.length ? [] : leads.map((l) => l.id)));
  }

  function requestDeleteOne(lead: Lead) {
    setPendingDelete([lead]);
  }

  function requestDeleteSelected() {
    const chosen = leads.filter((lead) => selectedIds.includes(lead.id));
    if (chosen.length > 0) setPendingDelete(chosen);
  }

  async function handleDeleteConfirm() {
    if (pendingDelete.length === 0) return;
    setDeleting(true);

    // One request per lead, all at once. A failure on one must not hide the
    // ones that did get deleted, so the list drops exactly what succeeded.
    const results = await Promise.allSettled(pendingDelete.map((lead) => deleteLead(lead.id)));

    const deletedIds = new Set(
      pendingDelete.filter((_, i) => results[i].status === "fulfilled").map((lead) => lead.id),
    );
    const failed = pendingDelete.length - deletedIds.size;

    setLeads((prev) => prev.filter((lead) => !deletedIds.has(lead.id)));
    setSelectedIds((prev) => prev.filter((id) => !deletedIds.has(id)));
    setError(failed > 0 ? `מחיקת ${failed} מתוך ${pendingDelete.length} הלידים נכשלה.` : null);

    setDeleting(false);
    setPendingDelete([]);
  }

  /** Creates the client, stamps the lead, then opens the new client's page. */
  async function handleConvert(lead: Lead) {
    setConvertingId(lead.id);
    setError(null);
    try {
      const client = await apiConvertLead(lead.id);
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, convertedClientId: client.id } : l)),
      );
      navigate(`/clients/${client.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "המרת הליד ללקוח נכשלה.");
    } finally {
      setConvertingId(undefined);
    }
  }

  async function handleStatusChange(leadId: string, status: Lead["status"]) {
    try {
      const updated = await updateLead(leadId, { status });
      setLeads((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "עדכון הסטטוס נכשל.");
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <LeadsTable
        leads={leads}
        selectedIds={selectedIds}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={requestDeleteOne}
        onStatusChange={handleStatusChange}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onDeleteSelected={requestDeleteSelected}
        onConvert={handleConvert}
        convertingId={convertingId}
      />

      <LeadFormModal
        open={formOpen}
        mode={formMode}
        initialLead={formMode === "edit" ? activeLead : undefined}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteLeadDialog
        open={pendingDelete.length > 0}
        leads={pendingDelete}
        deleting={deleting}
        onCancel={() => setPendingDelete([])}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
