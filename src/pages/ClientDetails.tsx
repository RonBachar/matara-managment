import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { Client } from "@/types/client";
import { REMINDER_OPTIONS } from "@/types/client";
import { Button } from "@/components/ui/button";
import { apiGetClients, apiUpdateClient } from "@/lib/clientsApi";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { ClientQuotes } from "@/components/quotes/ClientQuotes";

type LocationState = { client?: Client };

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("he-IL");
}

function reminderLabel(days: number | null | undefined) {
  if (days == null) return "—";
  return REMINDER_OPTIONS.find((o) => o.value === days)?.label ?? `${days} ימים לפני`;
}

/** Days until renewal, so an overdue or imminent one can be called out. */
function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.ceil((day.getTime() - today.getTime()) / 86_400_000);
}

export function ClientDetails() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [client, setClient] = useState<Client | null>(state?.client ?? null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    apiGetClients()
      .then((clients) => {
        if (cancelled) return;
        setClient(clients.find((c) => c.id === params.id) ?? null);
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

  const left = daysUntil(client.renewalDate);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{client.clientName}</h2>
          <p className="text-sm text-muted-foreground">
            {client.businessName || "ללא שם עסק"}
          </p>
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
          <div className="text-sm font-semibold">פרטים</div>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailsField label="שם הלקוח" value={client.clientName} />
            <DetailsField label="שם העסק" value={client.businessName || "—"} />
            <DetailsField label="טלפון" value={client.phone || "—"} />
            <DetailsField label="אימייל" value={client.email || "—"} />
            <DetailsField label="שירות מבוקש" value={client.serviceType || "—"} />
            <DetailsField label="מקור" value={client.leadSource || "—"} />
            <DetailsField label="תאריך יצירה" value={formatDate(client.createdAt)} />
            <DetailsField
              label="כתובת אתר"
              value={client.website ? <ExternalAnchor href={client.website} /> : "—"}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-border/70 pt-4">
          <div className="text-sm font-semibold">חוזה עבודה חתום</div>
          {client.contractUrl ? (
            <ExternalAnchor href={client.contractUrl} label="פתיחת החוזה" />
          ) : (
            <p className="text-sm text-muted-foreground">
              לא צורף חוזה. הוסף קישור דרך "עריכת לקוח".
            </p>
          )}
        </div>

        <div className="space-y-3 border-t border-border/70 pt-4">
          <div className="text-sm font-semibold">חבילה מתחדשת</div>
          {client.packageType ? (
            <div className="grid gap-4 md:grid-cols-2">
              <DetailsField label="סוג חבילה" value={client.packageType} />
              <DetailsField
                label="מחיר חידוש"
                value={
                  client.renewalPrice == null
                    ? "—"
                    : `₪${client.renewalPrice.toLocaleString("he-IL")}`
                }
              />
              <DetailsField
                label="תאריך חידוש"
                value={
                  <span className="flex items-center gap-2">
                    {formatDate(client.renewalDate)}
                    {left != null && (
                      <span
                        className={
                          left < 0
                            ? "rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                            : "rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        }
                      >
                        {left < 0
                          ? `עבר לפני ${Math.abs(left)} ימים`
                          : left === 0
                            ? "היום"
                            : `בעוד ${left} ימים`}
                      </span>
                    )}
                  </span>
                }
              />
              <DetailsField label="תזכורת" value={reminderLabel(client.reminderDaysBefore)} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">ללא חבילה מתחדשת.</p>
          )}
        </div>

        <div className="space-y-2 border-t border-border/70 pt-4">
          <div className="text-sm font-semibold">הערות</div>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {client.notes || "—"}
          </p>
        </div>
      </div>

      <ClientQuotes clientId={client.id} />

      <ClientFormModal
        open={editOpen}
        mode="edit"
        initialClient={client}
        onClose={() => setEditOpen(false)}
        onSubmit={async (input) => {
          setClient(await apiUpdateClient(client.id, input));
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
