import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import type { Client } from "@/types/client";
import {
  BILLING_CYCLE_LABELS,
  REMINDER_OPTIONS,
  type BillingCycle,
  type ClientService,
} from "@/types/clientService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteAgreementFile,
  getAgreementFile,
  saveAgreementFile,
} from "@/lib/agreementFiles";
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

const AGREEMENT_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type LocationState = {
  client?: Client;
};

export function ClientDetails() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [client, setClient] = useState<Client | null>(state?.client ?? null);
  const [services, setServices] = useState<ClientService[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceFormMode, setServiceFormMode] = useState<"create" | "edit">("create");
  const [activeService, setActiveService] = useState<ClientService | undefined>();
  const [deleteServiceOpen, setDeleteServiceOpen] = useState(false);
  const [agreementActionLoading, setAgreementActionLoading] = useState(false);
  const [agreementActionError, setAgreementActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiGetClients()
      .then((rows) => {
        if (cancelled) return;
        const match = rows.find((c) => c.id === params.id) ?? null;
        setClient(match);
      })
      .catch(() => {
        if (cancelled) return;
        setClient(null);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    listServicesForClient(params.id)
      .then((rows) => {
        if (cancelled) return;
        setServices(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setServices([]);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const [agreementBlobUrl, setAgreementBlobUrl] = useState<string | null>(null);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [agreementMissing, setAgreementMissing] = useState(false);

  const hasAgreementRef = useMemo(
    () => Boolean(client?.agreementFileId && client?.agreementFileName),
    [client?.agreementFileId, client?.agreementFileName],
  );

  useEffect(() => {
    let revokedUrl: string | null = null;

    async function run() {
      if (!client?.agreementFileId) return;
      setAgreementLoading(true);
      setAgreementMissing(false);
      try {
        const record = await getAgreementFile(client.agreementFileId);
        if (!record) {
          setAgreementMissing(true);
          setAgreementBlobUrl(null);
          return;
        }
        const url = URL.createObjectURL(record.blob);
        revokedUrl = url;
        setAgreementBlobUrl(url);
      } catch {
        setAgreementMissing(true);
        setAgreementBlobUrl(null);
      } finally {
        setAgreementLoading(false);
      }
    }

    void run();
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [client?.agreementFileId]);

  function formatDate(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-GB");
  }

  function reminderLabel(days: number | null) {
    if (days == null) return "—";
    return (
      REMINDER_OPTIONS.find((option) => option.value === days)?.label ?? `${days} ימים לפני`
    );
  }

  async function handleAgreementFileChange(file: File | null) {
    if (!client || !file) return;
    setAgreementActionLoading(true);
    setAgreementActionError(null);

    try {
      if (client.agreementFileId) {
        await deleteAgreementFile(client.agreementFileId);
      }
      const ref = await saveAgreementFile(file);
      const updated = await apiUpdateClient(client.id, ref);
      setClient(updated);
    } catch (error: unknown) {
      setAgreementActionError(error instanceof Error ? error.message : "שמירת ההסכם נכשלה.");
    } finally {
      setAgreementActionLoading(false);
    }
  }

  async function handleAgreementRemove() {
    if (!client) return;
    setAgreementActionLoading(true);
    setAgreementActionError(null);

    try {
      if (client.agreementFileId) {
        await deleteAgreementFile(client.agreementFileId);
      }
      const updated = await apiUpdateClient(client.id, {
        agreementFileId: null,
        agreementFileName: null,
        agreementFileType: null,
      });
      setClient(updated);
    } catch (error: unknown) {
      setAgreementActionError(error instanceof Error ? error.message : "הסרת ההסכם נכשלה.");
    } finally {
      setAgreementActionLoading(false);
    }
  }

  if (!client) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">לקוח לא נמצא</h2>
        <p className="text-sm text-muted-foreground">לא הצלחנו למצוא את פרטי הלקוח.</p>
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

      <div className="space-y-6 rounded-xl border border-border bg-card p-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold">פרטים בסיסיים</div>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailsField label="שם העסק" value={client.businessName || "—"} />
            <DetailsField label="איש קשר" value={client.clientName} />
            <DetailsField label="מספר טלפון" value={client.phone || "—"} />
            <DetailsField label="אימייל" value={client.email || "—"} />
            <DetailsField
              label="תאריך יצירה"
              value={client.createdAt ? new Date(client.createdAt).toLocaleDateString("he-IL") : "—"}
            />
            <DetailsField
              label="כתובת אתר"
              value={
                client.website ? (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                  >
                    {client.website}
                  </a>
                ) : (
                  "—"
                )
              }
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
                        {BILLING_CYCLE_LABELS[service.billingCycle as BillingCycle] ??
                          service.billingCycle}
                      </td>
                      <td className="px-2.5 py-1.5">
                        {service.renewalPrice == null
                          ? "—"
                          : `₪${service.renewalPrice.toLocaleString("he-IL")}`}
                      </td>
                      <td className="px-2.5 py-1.5">{formatDate(service.renewalDate)}</td>
                      <td className="px-2.5 py-1.5">
                        {reminderLabel(service.reminderDaysBefore)}
                      </td>
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

        <div className="space-y-3 border-t border-border/70 pt-4">
          <div className="text-sm font-semibold">הסכם</div>
          <div className="space-y-3">
            <Input
              type="file"
              accept={AGREEMENT_ACCEPT}
              disabled={agreementActionLoading}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void handleAgreementFileChange(file);
                e.target.value = "";
              }}
              className="max-w-md cursor-pointer"
            />

            <DetailsField
              label="קובץ שמור"
              value={
                hasAgreementRef ? (
                  <span>
                    {client.agreementFileName}
                    {agreementMissing && (
                      <span className="ms-2 text-xs text-destructive">(הקובץ לא נמצא בדפדפן)</span>
                    )}
                  </span>
                ) : (
                  "—"
                )
              }
            />

            {agreementActionError && (
              <div className="text-sm text-destructive">{agreementActionError}</div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!agreementBlobUrl || agreementLoading || agreementActionLoading}
                onClick={() => {
                  if (!agreementBlobUrl) return;
                  window.open(agreementBlobUrl, "_blank", "noreferrer");
                }}
              >
                פתיחה
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!agreementBlobUrl || agreementLoading || agreementActionLoading}
                onClick={() => {
                  if (!agreementBlobUrl) return;
                  const a = document.createElement("a");
                  a.href = agreementBlobUrl;
                  a.download = client.agreementFileName ?? "agreement";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
              >
                הורדה
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!hasAgreementRef || agreementActionLoading}
                onClick={() => void handleAgreementRemove()}
              >
                הסר קובץ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ClientFormModal
        open={editOpen}
        mode="edit"
        initialClient={client}
        onClose={() => setEditOpen(false)}
        onSubmit={async (input) => {
          const updated = await apiUpdateClient(client.id, input);
          setClient(updated);
          setEditOpen(false);
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

type DetailsFieldProps = {
  label: string;
  value: React.ReactNode;
};

function DetailsField({ label, value }: DetailsFieldProps) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
