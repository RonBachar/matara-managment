import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { PACKAGE_TYPE_LABELS, REMINDER_OPTIONS, type Client } from "@/types/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteAgreementFile,
  getAgreementFile,
  saveAgreementFile,
} from "@/lib/agreementFiles";
import { apiGetClients, apiUpdateClient } from "@/lib/clientsApi";
import { ClientFormModal } from "@/components/clients/ClientFormModal";

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
  const [editOpen, setEditOpen] = useState(false);
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

  const [agreementBlobUrl, setAgreementBlobUrl] = useState<string | null>(null);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [agreementMissing, setAgreementMissing] = useState(false);

  const hasAgreementRef = useMemo(
    () => Boolean(client?.agreementFileId && client?.agreementFileName),
    [client?.agreementFileId, client?.agreementFileName],
  );

  const reminderLabel = useMemo(() => {
    if (client?.reminderDaysBefore == null) return "—";
    return (
      REMINDER_OPTIONS.find((option) => option.value === client.reminderDaysBefore)?.label ??
      `${client.reminderDaysBefore} ימים לפני`
    );
  }, [client?.reminderDaysBefore]);

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

  function formatDate(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-GB");
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
          <p className="text-sm text-muted-foreground">פרטי לקוח, חבילה והסכם במקום אחד.</p>
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
          <div className="text-sm font-semibold">חבילה</div>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailsField
              label="סוג חבילה"
              value={PACKAGE_TYPE_LABELS[client.packageType] ?? PACKAGE_TYPE_LABELS.none}
            />
            <DetailsField
              label="מחיר"
              value={
                client.packagePrice == null
                  ? "—"
                  : `₪${client.packagePrice.toLocaleString("he-IL", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}`
              }
            />
            <DetailsField label="תאריך חידוש" value={formatDate(client.renewalDate)} />
            <DetailsField label="תזכורת" value={reminderLabel} />
          </div>
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
