import { useCallback, useMemo, useState } from "react";
import { copyTextToClipboard } from "@/lib/copyToClipboard";
import type { BriefGpt1RunResult } from "@/lib/projectBriefsApi";
import { Button } from "@/components/ui/button";

type SitemapHandoffDialogProps = {
  open: boolean;
  status: "idle" | "loading" | "success" | "error";
  result: BriefGpt1RunResult | null;
  errorMessage: string | null;
  onClose: () => void;
};

export function SitemapHandoffDialog({
  open,
  status,
  result,
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
              שליחה לתזרים GPT 1 בבקאנד ותצוגת התוצאה הנוכחית.
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
              {status === "loading" && "מריץ עכשיו את תזרים GPT 1 בבקאנד..."}
              {status === "success" && "התזרים הושלם בהצלחה. התוצאה נשמרה בבקאנד."}
              {status === "error" && (errorMessage || "ההרצה נכשלה.")}
              {status === "idle" && "אין כרגע תוצאה לתצוגה."}
            </div>
          </section>

          {result && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">פרטי הרצה</h3>
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                <div>Run ID: {result.runId}</div>
                <div>Step ID: {result.stepId}</div>
                <div>Status: {result.status}</div>
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              בריף מנורמל (JSON)
            </h3>
            <pre
              dir="ltr"
              className="max-h-56 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-left font-mono text-xs leading-relaxed text-foreground"
            >
              {normalizedBriefText}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              פלט GPT 1 (stub)
            </h3>
            <pre
              dir="ltr"
              className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-dashed border-border bg-background p-3 text-left font-mono text-[11px] leading-relaxed text-muted-foreground"
            >
              {outputText}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
