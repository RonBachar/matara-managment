import { useEffect, useState } from "react";
import type { Client } from "@/types/client";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import {
  apiCreateClient,
  apiDeleteClient,
  apiGetClients,
  apiUpdateClient,
  type ClientPayload,
} from "@/lib/clientsApi";

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeClient, setActiveClient] = useState<Client | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<
    string | undefined
  >();

  useEffect(() => {
    let cancelled = false;
    apiGetClients()
      .then((rows) => {
        if (cancelled) return;
        setClients(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setClients([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  async function handleFormSubmit(data: ClientPayload) {
    if (formMode === "edit" && activeClient) {
      const updated = await apiUpdateClient(activeClient.id, data);
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      return;
    }

    const created = await apiCreateClient(data);
    setClients((prev) => [created, ...prev]);
  }

  function handleDeleteRequest(client: Client) {
    setActiveClient(client);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!activeClient) return;
    try {
      await apiDeleteClient(activeClient.id);
      setClients((prev) => prev.filter((c) => c.id !== activeClient.id));
      setDeleteBlockedMessage(undefined);
      setDeleteOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setDeleteBlockedMessage(msg);
    }
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
