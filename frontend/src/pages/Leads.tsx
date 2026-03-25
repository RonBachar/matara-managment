import { useEffect, useState } from "react";
import type { Lead } from "@/types/lead";
import type { Client } from "@/types/client";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import { DeleteLeadDialog } from "@/components/leads/DeleteLeadDialog";
import { ConvertLeadDialog } from "@/components/leads/ConvertLeadDialog";

const LEADS_STORAGE_KEY = "matara_leads";
const CLIENTS_STORAGE_KEY = "matara_clients";

function migrateLeadStatus(status: unknown): Lead["status"] {
  switch (status) {
    case "New":
    case "חדש":
      return "חדש";
    case "Follow Up":
    case "במעקב":
      return "במעקב";
    case "Proposal Sent":
    case "הצעת מחיר נשלחה":
      return "הצעת מחיר נשלחה";
    case "Closed":
    case "נסגר":
      return "נסגר";
    case "Not Relevant":
    case "לא רלוונטי":
      return "לא רלוונטי";
    case "הפך ללקוח":
      return "הפך ללקוח";
    default:
      return "חדש";
  }
}

function loadInitialLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LEADS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as any[]).map((l) => ({
      id: String(l.id ?? Date.now()),
      convertedClientId:
        typeof l.convertedClientId === "string"
          ? l.convertedClientId
          : undefined,
      createdAt:
        typeof l.createdAt === "string" ? l.createdAt : undefined,
      contactPerson: String(l.contactPerson ?? ""),
      phone: String(l.phone ?? ""),
      email: String(l.email ?? ""),
      requestedService:
        typeof l.requestedService === "string" ? l.requestedService : undefined,
      leadSource: String(l.leadSource ?? ""),
      notes: typeof l.notes === "string" ? l.notes : undefined,
      agreementFileId:
        typeof l.agreementFileId === "string" ? l.agreementFileId : undefined,
      agreementFileName:
        typeof l.agreementFileName === "string" ? l.agreementFileName : undefined,
      agreementFileType:
        typeof l.agreementFileType === "string" ? l.agreementFileType : undefined,
      status:
        typeof l.convertedClientId === "string" && l.convertedClientId
          ? "הפך ללקוח"
          : migrateLeadStatus(l.status),
    })) as Lead[];
  } catch {
    return [];
  }
}

function loadStoredClients(): Client[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Client[];
    if (!Array.isArray(parsed)) return [];
    // Backward-compatible migration for older stored clients.
    return parsed.map((c) => ({
      ...c,
      clientType: c.clientType ?? "Website Client",
      packageType: c.packageType ?? "Hosting + Elementor Pro",
      renewalPrice: typeof c.renewalPrice === "number" ? c.renewalPrice : 0,
      renewalDate: c.renewalDate ?? "",
      agreementFileId:
        typeof (c as any).agreementFileId === "string"
          ? (c as any).agreementFileId
          : undefined,
      agreementFileName:
        typeof (c as any).agreementFileName === "string"
          ? (c as any).agreementFileName
          : undefined,
      agreementFileType:
        typeof (c as any).agreementFileType === "string"
          ? (c as any).agreementFileType
          : undefined,
    }));
  } catch {
    return [];
  }
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>(() => loadInitialLeads());
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeLead, setActiveLead] = useState<Lead | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
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
        if (activeLead.convertedClientId || activeLead.status === "הפך ללקוח") {
          return prev.map((l) =>
            l.id === activeLead.id
              ? {
                  ...data,
                  id: activeLead.id,
                  createdAt: activeLead.createdAt,
                  convertedClientId: activeLead.convertedClientId,
                  status: "הפך ללקוח",
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
          status: "חדש",
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
    if (lead.status === "הפך ללקוח" || lead.convertedClientId) return;
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
            ? { ...l, status: "הפך ללקוח", convertedClientId: newClient.id }
            : l,
        ),
      );
    }

    setConvertOpen(false);
  }

  function handleStatusChange(lead: Lead, status: Lead["status"]) {
    if (lead.convertedClientId || lead.status === "הפך ללקוח") return;
    if (status === "הפך ללקוח" && !lead.convertedClientId) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status } : l)),
    );
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
