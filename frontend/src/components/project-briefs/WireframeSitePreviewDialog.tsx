import { useCallback, useEffect, useMemo, useState } from "react";
import type { BriefGpt3RunResult } from "@/lib/projectBriefsApi";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/lib/copyToClipboard";

type WireframeSitePreviewDialogProps = {
  open: boolean;
  status: "idle" | "loading" | "success" | "error";
  result: BriefGpt3RunResult | null;
  errorMessage: string | null;
  onRegenerate: () => void;
  onClose: () => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("he-IL");
}

function buildPreviewDoc(
  pageHtml: string,
  globalCss: string,
  globalJs: string,
): string {
  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wireframe Preview</title>
    <style>${globalCss}</style>
  </head>
  <body>
    ${pageHtml}
    <script>${globalJs}</script>
  </body>
</html>`;
}

function normalizeErrorMessage(value: string | null): string {
  if (!value) return "";
  return value.replace(/^HTTP\s+\d+\s*:\s*/i, "").trim();
}

export function WireframeSitePreviewDialog({
  open,
  status,
  result,
  errorMessage,
  onRegenerate,
  onClose,
}: WireframeSitePreviewDialogProps) {
  const pages = result?.output.artifact.pages ?? [];
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

  useEffect(() => {
    setSelectedPageIndex(0);
  }, [result?.runId]);

  const safeSelectedIndex =
    pages.length === 0 ? 0 : Math.min(selectedPageIndex, pages.length - 1);
  const selectedPage = pages[safeSelectedIndex] ?? null;

  const srcDoc = useMemo(() => {
    if (!result || !selectedPage) return "";
    return buildPreviewDoc(
      selectedPage.html,
      result.output.artifact.globalCss,
      result.output.artifact.globalJs,
    );
  }, [result, selectedPage]);

  const flashCopyHint = useCallback((ok: boolean) => {
    setCopyHint(ok ? "HTML copied" : "Copy failed");
    window.setTimeout(() => setCopyHint(null), 2000);
  }, []);

  const handleCopyHtml = useCallback(async () => {
    if (!srcDoc) return;
    flashCopyHint(await copyTextToClipboard(srcDoc));
  }, [flashCopyHint, srcDoc]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wireframe-site-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-xl border border-border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2
              id="wireframe-site-preview-title"
              className="text-base font-semibold text-foreground"
            >
              GPT 3 Wireframe Site Preview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Minimal in-app preview of the generated coded wireframe artifact.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRegenerate}
            disabled={status === "loading"}
          >
            Regenerate Wireframe Preview
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCopyHtml}
            disabled={!srcDoc || status === "loading"}
          >
            Copy Full HTML
          </Button>
          {copyHint && <span className="text-xs text-muted-foreground">{copyHint}</span>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-4">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Status</h3>
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                  {status === "loading" && "Running GPT 3 and building the wireframe site preview..."}
                  {status === "success" && "GPT 3 completed successfully. The preview is ready below."}
                  {status === "error" &&
                    "GPT 3 generation failed. Please review the error details below."}
                  {status === "idle" &&
                    "No GPT 3 run is active. Start a generation to preview the wireframe site."}
                </div>
              </section>

              {status === "error" && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Error</h3>
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm leading-relaxed text-foreground">
                    <div className="font-medium text-destructive">
                      GPT 3 generation failed
                    </div>
                    <div className="mt-2 whitespace-pre-wrap break-words text-foreground">
                      {normalizedErrorMessage ||
                        "Please try again and review the backend error details."}
                    </div>
                  </div>
                </section>
              )}

              {result && (
                <>
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Run Info</h3>
                    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                      <div>Run ID: {result.runId}</div>
                      <div>Step ID: {result.stepId}</div>
                      <div>Status: {result.status}</div>
                      <div>Provider: {result.output.provider || "N/A"}</div>
                      <div>Model: {result.output.model || "N/A"}</div>
                      <div>Generated At: {formatDate(result.output.generatedAt)}</div>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Artifact Summary</h3>
                    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                      <div>Framework: {result.output.artifact.framework || "N/A"}</div>
                      <div>Pages: {pages.length}</div>
                      <div>globalCss: {result.output.artifact.globalCss ? "Yes" : "No"}</div>
                      <div>globalJs: {result.output.artifact.globalJs ? "Yes" : "No"}</div>
                    </div>
                    <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3 text-sm text-foreground">
                      {pages.map((page, index) => (
                        <button
                          key={`${page.fileName}-${index}`}
                          type="button"
                          className={`block w-full rounded-md border px-3 py-2 text-right transition ${
                            index === safeSelectedIndex
                              ? "border-foreground bg-background font-medium"
                              : "border-border bg-transparent hover:bg-muted/30"
                          }`}
                          onClick={() => setSelectedPageIndex(index)}
                        >
                          <div>{page.pageName}</div>
                          <div className="text-xs text-muted-foreground">{page.fileName}</div>
                        </button>
                      ))}
                    </div>
                  </section>

                  {result.output.summary && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Summary</h3>
                      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                        {result.output.summary}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            <section className="min-h-[60vh] space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Preview</h3>
                {selectedPage && (
                  <div className="text-xs text-muted-foreground">
                    {selectedPage.pageName} · {selectedPage.fileName}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Copy Full HTML copies the complete document for the currently selected page.
              </p>

              <div className="h-[70vh] overflow-hidden rounded-lg border border-border bg-muted/20">
                {status === "loading" ? (
                  <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                    Generating preview...
                  </div>
                ) : selectedPage && srcDoc ? (
                  <iframe
                    title={`Wireframe preview ${selectedPage.pageName}`}
                    srcDoc={srcDoc}
                    className="h-full w-full bg-white"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                    No preview available yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
