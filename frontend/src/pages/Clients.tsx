import { useEffect, useState } from "react";
import type { Client } from "@/types/client";
import type { Project } from "@/types/project";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { BulkDeleteClientsDialog } from "@/components/clients/BulkDeleteClientsDialog";

const STORAGE_KEY = "matara_clients";
const STORAGE_CLEAN_FLAG = "matara_clients_clean_v1";
const PROJECTS_STORAGE_KEY = "matara_projects";

function loadStoredProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadInitialClients(): Client[] {
  if (typeof window === "undefined") return [];
  const cleaned = window.localStorage.getItem(STORAGE_CLEAN_FLAG);
  if (!cleaned) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.setItem(STORAGE_CLEAN_FLAG, "1");
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Client[];
    if (!Array.isArray(parsed)) return [];
    // Backward-compatible migration for older stored clients.
    return parsed.map((c) => ({
      ...c,
      createdAt:
        typeof (c as any).createdAt === "string"
          ? (c as any).createdAt
          : undefined,
      clientType: c.clientType ?? "Website Client",
      packageType: c.packageType ?? "Hosting + Elementor Pro",
      renewalPrice: typeof c.renewalPrice === "number" ? c.renewalPrice : 0,
      renewalDate: c.renewalDate ?? "",
    }));
  } catch {
    return [];
  }
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>(() => loadInitialClients());
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeClient, setActiveClient] = useState<Client | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<
    string | undefined
  >();
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    setSelectedClientIds((prev) =>
      prev.filter((id) => clients.some((c) => c.id === id)),
    );
  }, [clients]);
  function handleAdd() {
    setFormMode("create");
    setActiveClient(undefined);
    setFormOpen(true);
  }

  function handleEdit(client: Client) {
    setFormMode("edit");
    setActiveClient(client);
    setFormOpen(true);
  }

  function handleFormSubmit(data: Omit<Client, "id">) {
    setClients((prev) => {
      if (formMode === "edit" && activeClient) {
        return prev.map((c) =>
          c.id === activeClient.id
            ? {
                ...data,
                id: activeClient.id,
                createdAt: activeClient.createdAt,
              }
            : c,
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

  function handleDeleteRequest(client: Client) {
    const projects = loadStoredProjects();
    const linkedCount = projects.filter((p) => p.clientId === client.id).length;
    if (linkedCount > 0) {
      setDeleteBlockedMessage(
        `לא ניתן למחוק לקוח זה כי קיימים ${linkedCount} פרויקטים המשויכים אליו. יש למחוק/להעביר את הפרויקטים לפני מחיקת הלקוח.`,
      );
    } else {
      setDeleteBlockedMessage(undefined);
    }
    setActiveClient(client);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!activeClient) return;
    setClients((prev) => prev.filter((c) => c.id !== activeClient.id));
    setDeleteOpen(false);
  }

  function handleBulkDeleteRequest() {
    if (selectedClientIds.length === 0) return;
    setBulkDeleteOpen(true);
  }

  const bulkSelectedClients = clients.filter((c) =>
    selectedClientIds.includes(c.id),
  );
  const projects = loadStoredProjects();
  const blockedClientIdSet = new Set(
    projects
      .map((p) => p.clientId)
      .filter((id) => selectedClientIds.includes(id)),
  );
  const bulkBlockedClients = bulkSelectedClients.filter((c) =>
    blockedClientIdSet.has(c.id),
  );
  const bulkDeletableClients = bulkSelectedClients.filter(
    (c) => !blockedClientIdSet.has(c.id),
  );

  function handleBulkDeleteConfirm() {
    if (bulkDeletableClients.length === 0) {
      setBulkDeleteOpen(false);
      return;
    }
    const deletableIds = new Set(bulkDeletableClients.map((c) => c.id));
    setClients((prev) => prev.filter((c) => !deletableIds.has(c.id)));
    setSelectedClientIds((prev) => prev.filter((id) => !deletableIds.has(id)));
    setBulkDeleteOpen(false);
  }

  function handleView(client: Client) {
    // Placeholder for future behavior such as preloading details.
    void client;
  }

  return (
    <>
      <ClientsTable
        clients={clients}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onView={handleView}
        selectedClientIds={selectedClientIds}
        onSelectedClientIdsChange={setSelectedClientIds}
        onBulkDelete={handleBulkDeleteRequest}
      />

      <ClientFormModal
        open={formOpen}
        mode={formMode}
        initialClient={formMode === "edit" ? activeClient : undefined}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteClientDialog
        open={deleteOpen}
        client={activeClient}
        blockedMessage={deleteBlockedMessage}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteBlockedMessage(undefined);
        }}
        onConfirm={handleDeleteConfirm}
      />

      <BulkDeleteClientsDialog
        open={bulkDeleteOpen}
        deletableClients={bulkDeletableClients}
        blockedClients={bulkBlockedClients}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
      />
    </>
  );
}
