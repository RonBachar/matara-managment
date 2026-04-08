import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import type { ClientRecord } from "@/types/clientRecord";
import type { ClientServiceRecord } from "@/types/clientService";
import { Button } from "@/components/ui/button";
import { getAgreementFile } from "@/lib/agreementFiles";
import { apiGetClients } from "@/lib/clientsApi";
import {
  apiCreateClientService,
  apiDeleteClientService,
  apiGetClientServices,
  apiUpdateClientService,
} from "@/lib/clientServicesApi";
import { ClientServicesSection } from "@/components/clients/ClientServicesSection";

type LocationState = {
  client?: ClientRecord;
};

export function ClientDetails() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [client, setClient] = useState<ClientRecord | null>(state?.client ?? null);
  const [services, setServices] = useState<ClientServiceRecord[]>(state?.client?.services ?? []);

  useEffect(() => {
    if (client && state?.client) return;
    let cancelled = false;

    apiGetClients()
      .then((rows) => {
        if (cancelled) return;
        const match = rows.find((c) => c.id === params.id) ?? null;
        setClient(match);
        setServices(match?.services ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setClient(null);
        setServices([]);
      });

    return () => {
      cancelled = true;
    };
  }, [client, params.id, state?.client]);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    apiGetClientServices(params.id)
      .then((rows) => {
        if (!cancelled) setServices(rows);
      })
      .catch(() => undefined);

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
          <p className="text-sm text-muted-foreground">פרטי לקוח - צפייה בלבד.</p>
        </div>
        <Link to="/clients">
          <Button type="button" size="sm" variant="outline">
            חזרה ללקוחות
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <DetailsField label="שם העסק" value={client.businessName || "—"} />
        <DetailsField label="איש קשר" value={client.clientName} />
        <DetailsField label="מספר טלפון" value={client.phone} />
        <DetailsField label="אימייל" value={client.email} />
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
        <DetailsField
          label="תאריך תחילת ההתקשרות"
          value={client.createdAt ? new Date(client.createdAt).toLocaleDateString("he-IL") : "—"}
        />
      </div>

      <ClientServicesSection
        services={services}
        onCreate={async (input) => {
          if (!client) return;
          const created = await apiCreateClientService(client.id, input);
          setServices((prev) => [...prev, created]);
        }}
        onUpdate={async (id, patch) => {
          const updated = await apiUpdateClientService(id, patch);
          setServices((prev) => prev.map((service) => (service.id === updated.id ? updated : service)));
        }}
        onDelete={async (id) => {
          await apiDeleteClientService(id);
          setServices((prev) => prev.filter((service) => service.id !== id));
        }}
      />

      {hasAgreementRef && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">הסכם חתום</div>
          <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {client.agreementFileName}
              {agreementMissing && (
                <span className="ms-2 text-xs text-destructive">(הקובץ לא נמצא בדפדפן)</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!agreementBlobUrl || agreementLoading}
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
                disabled={!agreementBlobUrl || agreementLoading}
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
            </div>
          </div>
        </div>
      )}
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
