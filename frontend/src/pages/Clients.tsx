import { useEffect, useState } from "react";
import type { ClientRecord } from "@/types/clientRecord";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { apiCreateClient, apiDeleteClient, apiGetClients, apiUpdateClient } from "@/lib/clientsApi";

export function Clients() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeClient, setActiveClient] = useState<ClientRecord | undefined>();
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

  function handleEdit(client: ClientRecord) {
    setFormMode("edit");
    setActiveClient(client);
    setFormOpen(true);
  }

  async function handleFormSubmit(data: Omit<ClientRecord, "id" | "createdAt" | "updatedAt">) {
    if (formMode === "edit" && activeClient) {
      const updated = await apiUpdateClient(activeClient.id, data);
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setFormOpen(false);
      return;
    }

    const created = await apiCreateClient(data);
    setClients((prev) => [created, ...prev]);
    setFormOpen(false);
  }

  function handleDeleteRequest(client: ClientRecord) {
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
