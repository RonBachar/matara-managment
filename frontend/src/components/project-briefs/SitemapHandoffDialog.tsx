import { useCallback, useState } from "react";
import type { NormalizedBriefJSON } from "@/lib/generateBriefJSON";
import { GPT1_SITEMAP_PROMPT } from "@/lib/gpt1SitemapPrompt";
import {
  buildGpt1SitemapFullHandoff,
} from "@/lib/gpt1SitemapHandoff";
import { copyTextToClipboard } from "@/lib/copyToClipboard";
import { Button } from "@/components/ui/button";

type SitemapHandoffDialogProps = {
  open: boolean;
  normalizedBrief: NormalizedBriefJSON;
  onClose: () => void;
};

export function SitemapHandoffDialog({
  open,
  normalizedBrief,
  onClose,
}: SitemapHandoffDialogProps) {
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const jsonText = JSON.stringify(normalizedBrief, null, 2);
  const fullText = buildGpt1SitemapFullHandoff(normalizedBrief);

  const flash = useCallback((ok: boolean) => {
    setCopyHint(ok ? "הועתק ללוח" : "העתקה נכשלה");
    window.setTimeout(() => setCopyHint(null), 2000);
  }, []);

  const copyPrompt = useCallback(async () => {
    flash(await copyTextToClipboard(GPT1_SITEMAP_PROMPT));
  }, [flash]);

  const copyJson = useCallback(async () => {
    flash(await copyTextToClipboard(jsonText));
  }, [flash, jsonText]);

  const copyFull = useCallback(async () => {
    flash(await copyTextToClipboard(fullText));
  }, [flash, fullText]);

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
              יצירת Sitemap — העברה ל-GPT 1
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              פרומפט קבוע + JSON מנורמל — ללא קריאת API בשלב זה.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            סגירה
          </Button>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-b border-border bg-muted/20 px-4 py-2.5">
          <Button type="button" variant="secondary" size="sm" onClick={copyPrompt}>
            העתקת פרומפט GPT 1
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={copyJson}>
            העתקת JSON מנורמל
          </Button>
          <Button type="button" size="sm" onClick={copyFull}>
            העתקת חבילה מלאה
          </Button>
          {copyHint && (
            <span className="self-center text-xs text-muted-foreground">
              {copyHint}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-right">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              פרומפט GPT 1 (Sitemap)
            </h3>
            <pre
              dir="ltr"
              className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-left font-mono text-xs leading-relaxed text-foreground"
            >
              {GPT1_SITEMAP_PROMPT}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              בריף מנורמל (JSON)
            </h3>
            <pre
              dir="ltr"
              className="max-h-56 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-left font-mono text-xs leading-relaxed text-foreground"
            >
              {jsonText}
            </pre>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              חבילת ייצוא מלאה (תצוגה)
            </h3>
            <pre
              dir="ltr"
              className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-dashed border-border bg-background p-3 text-left font-mono text-[11px] leading-relaxed text-muted-foreground"
            >
              {fullText}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
