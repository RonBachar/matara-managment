import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { Client } from "@/types/client";
import {
  BILLING_CYCLE_LABELS,
  REMINDER_OPTIONS,
  type BillingCycle,
  type ClientService,
} from "@/types/clientService";
import { Button } from "@/components/ui/button";
import { apiGetClients, apiUpdateClient } from "@/lib/clientsApi";
import {
  createService,
  deleteService,
  listServicesForClient,
  updateService,
} from "@/lib/clientServicesApi";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { ClientServiceFormModal } from "@/components/clients/ClientServiceFormModal";
import { DeleteClientServiceDialog } from "@/components/clients/DeleteClientServiceDialog";

type LocationState = {
  client?: Client;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("he-IL");
}

function reminderLabel(days: number | null) {
  if (days == null) return "—";
  return REMINDER_OPTIONS.find((option) => option.value === days)?.label ?? `${days} ימים לפני`;
}

export function ClientDetails() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [client, setClient] = useState<Client | null>(state?.client ?? null);
  const [services, setServices] = useState<ClientService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceFormMode, setServiceFormMode] = useState<"create" | "edit">("create");
  const [activeService, setActiveService] = useState<ClientService | undefined>();
  const [deleteServiceOpen, setDeleteServiceOpen] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    Promise.all([apiGetClients(), listServicesForClient(params.id)])
      .then(([clients, rows]) => {
        if (cancelled) return;
        setClient(clients.find((c) => c.id === params.id) ?? null);
        setServices(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "טעינת הלקוח נכשלה.");
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (!client) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">לקוח לא נמצא</h2>
        <p className="text-sm text-muted-foreground">{error ?? "לא הצלחנו למצוא את פרטי הלקוח."}</p>
        <Link to="/clients">
          <Button type="button" size="sm" variant="outline">
            חזרה לרשימת הלקוחות
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{client.businessName || client.clientName}</h2>
          <p className="text-sm text-muted-foreground">פרטי לקוח, שירותים והסכם במקום אחד.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => setEditOpen(true)}>
            עריכת לקוח
          </Button>
          <Link to="/clients">
            <Button type="button" size="sm" variant="outline">
              חזרה ללקוחות
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6 rounded-xl border border-border bg-card p-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold">פרטים בסיסיים</div>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailsField label="שם העסק" value={client.businessName || "—"} />
            <DetailsField label="איש קשר" value={client.clientName} />
            <DetailsField label="מספר טלפון" value={client.phone || "—"} />
            <DetailsField label="אימייל" value={client.email || "—"} />
            <DetailsField label="תאריך יצירה" value={formatDate(client.createdAt)} />
            <DetailsField
              label="כתובת אתר"
              value={client.website ? <ExternalAnchor href={client.website} /> : "—"}
            />
            <DetailsField
              label="הסכם חתום"
              value={client.contractUrl ? <ExternalAnchor href={client.contractUrl} label="פתיחת ההסכם" /> : "—"}
            />
            <DetailsField label="הערות" value={client.notes || "—"} />
          </div>
        </div>

        <div className="space-y-3 border-t border-border/70 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">שירותים</div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setServiceFormMode("create");
                setActiveService(undefined);
                setServiceFormOpen(true);
              }}
            >
              + שירות חדש
            </Button>
          </div>

          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין שירותים רשומים ללקוח זה.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/70">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-right">
                    <th className="px-2.5 py-1.5 font-medium">שם שירות</th>
                    <th className="px-2.5 py-1.5 font-medium">מחזור</th>
                    <th className="px-2.5 py-1.5 font-medium">מחיר</th>
                    <th className="px-2.5 py-1.5 font-medium">חידוש</th>
                    <th className="px-2.5 py-1.5 font-medium">תזכורת</th>
                    <th className="px-2.5 py-1.5 text-center font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-t border-border/60">
                      <td className="px-2.5 py-1.5">{service.serviceName}</td>
                      <td className="px-2.5 py-1.5">
                        {BILLING_CYCLE_LABELS[service.billingCycle as BillingCycle] ?? service.billingCycle}
                      </td>
                      <td className="px-2.5 py-1.5">
                        {service.renewalPrice == null
                          ? "—"
                          : `₪${service.renewalPrice.toLocaleString("he-IL")}`}
                      </td>
                      <td className="px-2.5 py-1.5">{formatDate(service.renewalDate)}</td>
                      <td className="px-2.5 py-1.5">{reminderLabel(service.reminderDaysBefore)}</td>
                      <td className="px-2.5 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon-sm"
                            onClick={() => {
                              setServiceFormMode("edit");
                              setActiveService(service);
                              setServiceFormOpen(true);
                            }}
                            aria-label="עריכת שירות"
                          >
                            <Pencil className="h-4 w-4 text-[#FBBF24]" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => {
                              setActiveService(service);
                              setDeleteServiceOpen(true);
                            }}
                            aria-label="מחיקת שירות"
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
          )}
        </div>
      </div>

      <ClientFormModal
        open={editOpen}
        mode="edit"
        initialClient={client}
        onClose={() => setEditOpen(false)}
        onSubmit={async (input) => {
          setClient(await apiUpdateClient(client.id, input));
        }}
      />

      <ClientServiceFormModal
        open={serviceFormOpen}
        mode={serviceFormMode}
        initialService={serviceFormMode === "edit" ? activeService : undefined}
        onClose={() => setServiceFormOpen(false)}
        onSubmit={async (input) => {
          if (serviceFormMode === "edit" && activeService) {
            const updated = await updateService(activeService.id, input);
            setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          } else {
            const created = await createService(client.id, input);
            setServices((prev) => [...prev, created]);
          }
          setServiceFormOpen(false);
        }}
      />

      <DeleteClientServiceDialog
        open={deleteServiceOpen}
        service={activeService}
        onCancel={() => setDeleteServiceOpen(false)}
        onConfirm={async () => {
          if (!activeService) return;
          await deleteService(activeService.id);
          setServices((prev) => prev.filter((s) => s.id !== activeService.id));
          setDeleteServiceOpen(false);
        }}
      />
    </section>
  );
}

function DetailsField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}

function ExternalAnchor({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-sm text-foreground underline-offset-2 hover:underline"
    >
      {label ?? href}
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
    </a>
  );
}
