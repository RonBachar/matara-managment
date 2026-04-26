import { useEffect, useState } from "react";
import type { Lead, LeadEditableStatus } from "@/types/lead";
import type { Client } from "@/types/client";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { DeleteLeadDialog } from "@/components/leads/DeleteLeadDialog";
import { ConvertLeadDialog } from "@/components/leads/ConvertLeadDialog";
import {
  createLead,
  deleteLead,
  fetchLeads,
  updateLead,
} from "@/lib/leadsApi";
import {
  CLIENTS_STORAGE_KEY,
  readStoredClients,
} from "@/lib/clientStorage";

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeLead, setActiveLead] = useState<Lead | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

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

  function handleConvertRequest(lead: Lead) {
    if (lead.convertedClientId) return;
    setActiveLead(lead);
    setConvertOpen(true);
  }

  async function handleStatusChange(leadId: string, status: LeadEditableStatus) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.convertedClientId) return;

    try {
      const updated = await updateLead(leadId, { status });
      setLeads((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      console.error("Failed to update lead status", error);
    }
  }

  async function handleConvertToClient(newClient: Client) {
    const lead = activeLead;
    if (!lead) return;

    try {
      const updated = await updateLead(lead.id, {
        convertedClientId: newClient.id,
        status: "הפך ללקוח",
      });

      const storedClients = readStoredClients();
      const nextClients = [...storedClients, newClient];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          CLIENTS_STORAGE_KEY,
          JSON.stringify(nextClients),
        );
      }

      setLeads((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setConvertOpen(false);
    } catch (error) {
      console.error("Failed to convert lead", error);
    }
  }

  return (
    <>
      <LeadsTable
        leads={leads}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onConvert={handleConvertRequest}
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

      <ConvertLeadDialog
        open={convertOpen}
        lead={activeLead}
        onClose={() => setConvertOpen(false)}
        onConvert={handleConvertToClient}
      />
    </>
  );
}
