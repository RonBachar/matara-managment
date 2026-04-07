import { useCallback, useMemo, useState } from "react";
import { copyTextToClipboard } from "@/lib/copyToClipboard";
import type { BriefGpt1HistoryRun } from "@/lib/projectBriefsApi";
import { Button } from "@/components/ui/button";

type SitemapHandoffDialogProps = {
  open: boolean;
  status: "idle" | "loading" | "success" | "error";
  result: BriefGpt1HistoryRun | null;
  runs: BriefGpt1HistoryRun[];
  errorMessage: string | null;
  onClose: () => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("he-IL");
}

function shortErrorMessage(value: string | null): string | null {
  if (!value) return null;
  return value.length > 160 ? `${value.slice(0, 157)}...` : value;
}

export function SitemapHandoffDialog({
  open,
  status,
  result,
  runs,
  errorMessage,
  onClose,
}: SitemapHandoffDialogProps) {
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const normalizedBriefText = useMemo(
    () => JSON.stringify(result?.normalizedBrief ?? {}, null, 2),
    [result],
  );
  const outputText = useMemo(
    () => JSON.stringify(result?.output ?? {}, null, 2),
    [result],
  );

  const flash = useCallback((ok: boolean) => {
    setCopyHint(ok ? "הועתק ללוח" : "העתקה נכשלה");
    window.setTimeout(() => setCopyHint(null), 2000);
  }, []);

  const copyJson = useCallback(async () => {
    flash(await copyTextToClipboard(normalizedBriefText));
  }, [flash, normalizedBriefText]);

  const copyOutput = useCallback(async () => {
    flash(await copyTextToClipboard(outputText));
  }, [flash, outputText]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sitemap-handoff-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2
              id="sitemap-handoff-title"
              className="text-base font-semibold text-foreground"
            >
              יצירת Sitemap & Wireframe
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              תוצאת GPT 1 הנוכחית והיסטוריית הרצות.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            סגירה
          </Button>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-b border-border bg-muted/20 px-4 py-2.5">
          <Button type="button" variant="secondary" size="sm" onClick={copyJson} disabled={!result}>
            העתקת JSON מנורמל
          </Button>
          <Button type="button" size="sm" onClick={copyOutput} disabled={!result}>
            העתקת פלט GPT 1
          </Button>
          {copyHint && (
            <span className="self-center text-xs text-muted-foreground">
              {copyHint}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-right">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">מצב</h3>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
              {status === "loading" && "מריץ עכשיו את GPT 1 בבקאנד..."}
              {status === "success" && "ההרצה הושלמה בהצלחה. ההיסטוריה והתוצאה עודכנו."}
              {status === "error" &&
                (errorMessage ||
                  "ההרצה האחרונה נכשלה. אם קיימת תוצאה מוצלחת קודמת, היא עדיין מוצגת למעלה.")}
              {status === "idle" && "אין כרגע הרצה חדשה. מוצגת התוצאה המוצלחת האחרונה אם קיימת."}
            </div>
          </section>

          {result && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">התוצאה הראשית המוצגת</h3>
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                <div>Run ID: {result.runId}</div>
                <div>Status: {result.status}</div>
                <div>Created At: {formatDate(result.createdAt)}</div>
                <div>Model: {result.model || "לא זמין"}</div>
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">בריף מנורמל (JSON)</h3>
            <pre
              dir="ltr"
              className="max-h-56 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-left font-mono text-xs leading-relaxed text-foreground"
            >
              {normalizedBriefText}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">פלט GPT 1 (OpenAI)</h3>
            <pre
              dir="ltr"
              className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-dashed border-border bg-background p-3 text-left font-mono text-[11px] leading-relaxed text-muted-foreground"
            >
              {outputText}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">היסטוריית הרצות</h3>
            <div className="space-y-2">
              {runs.length === 0 ? (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  עדיין אין הרצות GPT 1 עבור האפיון הזה.
                </div>
              ) : (
                runs.map((run) => (
                  <div
                    key={run.runId}
                    className="rounded-md border border-border bg-muted/20 p-3 text-sm leading-relaxed text-foreground"
                  >
                    <div>Status: {run.status}</div>
                    <div>Created At: {formatDate(run.createdAt)}</div>
                    <div>Model: {run.model || "לא זמין"}</div>
                    <div>Run ID: {run.runId}</div>
                    {run.error && (
                      <div className="text-destructive">
                        Error: {shortErrorMessage(run.error)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
