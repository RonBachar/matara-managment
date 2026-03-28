import { useEffect, useState } from "react";
import type { Client } from "@/types/client";
import type { Project } from "@/types/project";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import {
  CLIENTS_STORAGE_KEY,
  normalizeClientFromStorage,
} from "@/lib/clientStorage";

const STORAGE_KEY = CLIENTS_STORAGE_KEY;
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
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((c) => normalizeClientFromStorage(c))
      .filter((x): x is Client => x != null);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
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

  return (
    <>
      <ClientsTable
        clients={clients}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
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
    </>
  );
}
