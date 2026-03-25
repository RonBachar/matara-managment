import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import type { Client } from "@/types/client";
import { Button } from "@/components/ui/button";
import { getClientTypeLabel } from "@/lib/client-type";
import { getPackageTypeLabel } from "@/types/client";
import { getAgreementFile, getContractFile } from "@/lib/agreementFiles";

const STORAGE_KEY = "matara_clients";

type LocationState = {
  client?: Client;
};

function getStoredClients(): Client[] {
  if (typeof window === "undefined") return [];
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

export function ClientDetails() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const storedClients = getStoredClients();

  const client =
    state?.client ?? storedClients.find((c) => c.id === params.id) ?? null;

  const [agreementBlobUrl, setAgreementBlobUrl] = useState<string | null>(null);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [agreementMissing, setAgreementMissing] = useState(false);

  const [contractBlobUrl, setContractBlobUrl] = useState<string | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractMissing, setContractMissing] = useState(false);

  const hasAgreementRef = useMemo(
    () => Boolean(client?.agreementFileId && client?.agreementFileName),
    [client?.agreementFileId, client?.agreementFileName],
  );

  const hasContractRef = useMemo(
    () => Boolean(client?.contractFileId && client?.contractFileName),
    [client?.contractFileId, client?.contractFileName],
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

  useEffect(() => {
    let revokedUrl: string | null = null;
    async function run() {
      if (!client?.contractFileId) return;
      setContractLoading(true);
      setContractMissing(false);
      try {
        const record = await getContractFile(client.contractFileId);
        if (!record) {
          setContractMissing(true);
          setContractBlobUrl(null);
          return;
        }
        const url = URL.createObjectURL(record.blob);
        revokedUrl = url;
        setContractBlobUrl(url);
      } catch {
        setContractMissing(true);
        setContractBlobUrl(null);
      } finally {
        setContractLoading(false);
      }
    }
    void run();
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [client?.contractFileId]);

  if (!client) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">לקוח לא נמצא</h2>
        <p className="text-sm text-muted-foreground">
          לא הצלחנו למצוא את פרטי הלקוח.
        </p>
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
          <h2 className="text-lg font-semibold">{client.businessName}</h2>
          <p className="text-sm text-muted-foreground">
            פרטי לקוח – צפייה בלבד.
          </p>
        </div>
        <Link to="/clients">
          <Button type="button" size="sm" variant="outline">
            חזרה ללקוחות
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <DetailsField label="שם העסק" value={client.businessName} />
        <DetailsField
          label="שם הלקוח / איש הקשר"
          value={client.contactPerson}
        />
        <DetailsField label="מספר טלפון" value={client.phone} />
        <DetailsField label="אימייל" value={client.email} />
        <DetailsField
          label="סוג שירות"
          value={getClientTypeLabel(client.clientType)}
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
        <DetailsField
          label="סוג חבילה"
          value={
            client.clientType === "Website Client"
              ? getPackageTypeLabel(client.packageType)
              : "—"
          }
        />
        <DetailsField
          label="מחיר חידוש"
          value={
            client.clientType === "Website Client" &&
            client.packageType !== "None"
              ? `₪${Number(client.renewalPrice ?? 0).toLocaleString("he-IL")}`
              : "—"
          }
        />
        <DetailsField
          label="תאריך חידוש"
          value={
            client.clientType === "Website Client" &&
            client.packageType !== "None" &&
            client.renewalDate
              ? new Date(client.renewalDate).toLocaleDateString("he-IL")
              : "—"
          }
        />
        {!hasContractRef && client.workContractFileName && (
          <DetailsField
            label="חוזה עבודה (שם בלבד, לפני שמירת קובץ)"
            value={client.workContractFileName}
          />
        )}
        {!hasContractRef && !client.workContractFileName && (
          <DetailsField label="חוזה עבודה" value="—" />
        )}
        <DetailsField label="הערות" value={client.notes || "—"} />
        <DetailsField
          label="תאריך תחילת התקשרות"
          value={
            client.createdAt
              ? new Date(client.createdAt).toLocaleDateString("he-IL")
              : "—"
          }
        />
      </div>

      {hasContractRef && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">חוזה עבודה</div>
          <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {client.contractFileName}
              {contractMissing && (
                <span className="ms-2 text-xs text-destructive">
                  (הקובץ לא נמצא בדפדפן)
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!contractBlobUrl || contractLoading}
                onClick={() => {
                  if (!contractBlobUrl) return;
                  window.open(contractBlobUrl, "_blank", "noreferrer");
                }}
              >
                פתיחה
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!contractBlobUrl || contractLoading}
                onClick={() => {
                  if (!contractBlobUrl) return;
                  const a = document.createElement("a");
                  a.href = contractBlobUrl;
                  a.download = client.contractFileName ?? "contract";
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

      {hasAgreementRef && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold">הסכם חתום</div>
          <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {client.agreementFileName}
              {agreementMissing && (
                <span className="ms-2 text-xs text-destructive">
                  (הקובץ לא נמצא בדפדפן)
                </span>
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
