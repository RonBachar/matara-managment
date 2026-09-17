import { useEffect, useState } from "react";
import type { Lead } from "@/types/lead";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { DeleteLeadDialog } from "@/components/leads/DeleteLeadDialog";
import {
  createLead,
  deleteLead,
  fetchLeads,
  updateLead,
} from "@/lib/leadsApi";

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeLead, setActiveLead] = useState<Lead | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLeads() {
      try {
        const data = await fetchLeads();
        if (!cancelled) setLeads(data);
      } catch (error) {
        console.error("Failed to load leads", error);
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
        setLeads((prev) => [...prev, created]);
      }
      setFormOpen(false);
    } catch (error) {
      console.error("Failed to save lead", error);
    }
  }

  function handleDeleteRequest(lead: Lead) {
    setActiveLead(lead);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!activeLead) return;
    try {
      await deleteLead(activeLead.id);
      setLeads((prev) => prev.filter((l) => l.id !== activeLead.id));
      setDeleteOpen(false);
    } catch (error) {
      console.error("Failed to delete lead", error);
    }
  }

  async function handleStatusChange(leadId: string, status: Lead["status"]) {
    try {
      const updated = await updateLead(leadId, { status });
      setLeads((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      console.error("Failed to update lead status", error);
    }
  }

  return (
    <>
      <LeadsTable
        leads={leads}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onStatusChange={handleStatusChange}
      />

      <LeadFormModal
        open={formOpen}
        mode={formMode}
        initialLead={formMode === "edit" ? activeLead : undefined}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteLeadDialog
        open={deleteOpen}
        lead={activeLead}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
