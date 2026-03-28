import { useEffect, useState } from "react";
import type { Lead } from "@/types/lead";
import type { Client } from "@/types/client";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { DeleteLeadDialog } from "@/components/leads/DeleteLeadDialog";
import { ConvertLeadDialog } from "@/components/leads/ConvertLeadDialog";
import { readStoredLeads, writeStoredLeads } from "@/lib/leads";

const CLIENTS_STORAGE_KEY = "matara_clients";

function loadStoredClients(): Client[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Client[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c) => ({
      ...c,
      clientType: c.clientType ?? "Website Client",
      packageType: c.packageType ?? "Hosting + Elementor Pro",
      renewalPrice: typeof c.renewalPrice === "number" ? c.renewalPrice : 0,
      renewalDate: c.renewalDate ?? "",
      agreementFileId:
        typeof (c as { agreementFileId?: string }).agreementFileId ===
        "string"
          ? (c as { agreementFileId?: string }).agreementFileId
          : undefined,
      agreementFileName:
        typeof (c as { agreementFileName?: string }).agreementFileName ===
        "string"
          ? (c as { agreementFileName?: string }).agreementFileName
          : undefined,
      agreementFileType:
        typeof (c as { agreementFileType?: string }).agreementFileType ===
        "string"
          ? (c as { agreementFileType?: string }).agreementFileType
          : undefined,
    }));
  } catch {
    return [];
  }
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>(() => readStoredLeads());
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeLead, setActiveLead] = useState<Lead | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    writeStoredLeads(leads);
  }, [leads]);

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

  function handleFormSubmit(data: Omit<Lead, "id">) {
    setLeads((prev) => {
      if (formMode === "edit" && activeLead) {
        if (activeLead.convertedClientId) {
          return prev.map((l) =>
            l.id === activeLead.id
              ? {
                  ...data,
                  id: activeLead.id,
                  createdAt: activeLead.createdAt,
                  convertedClientId: activeLead.convertedClientId,
                }
              : l,
          );
        }
        return prev.map((l) =>
          l.id === activeLead.id
            ? { ...data, id: activeLead.id, createdAt: activeLead.createdAt }
            : l,
        );
      }
      const newId = String(Date.now());
      return [
        ...prev,
        {
          ...data,
          id: newId,
          createdAt: new Date().toISOString(),
        },
      ];
    });
    setFormOpen(false);
  }

  function handleDeleteRequest(lead: Lead) {
    setActiveLead(lead);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!activeLead) return;
    setLeads((prev) => prev.filter((l) => l.id !== activeLead.id));
    setDeleteOpen(false);
  }

  function handleConvertRequest(lead: Lead) {
    if (lead.convertedClientId) return;
    setActiveLead(lead);
    setConvertOpen(true);
  }

  function handleConvertToClient(newClient: Client) {
    const storedClients = loadStoredClients();
    const nextClients = [...storedClients, newClient];
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        CLIENTS_STORAGE_KEY,
        JSON.stringify(nextClients),
      );
    }

    if (activeLead) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === activeLead.id
            ? { ...l, convertedClientId: newClient.id }
            : l,
        ),
      );
    }

    setConvertOpen(false);
  }

  return (
    <>
      <LeadsTable
        leads={leads}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onConvert={handleConvertRequest}
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
