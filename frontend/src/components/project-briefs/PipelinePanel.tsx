"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  apiRunBriefGpt1SitemapWireframe,
  apiRunBriefGpt2Content,
  apiRunBriefGpt3WireframeSite,
  type BriefGpt1RunResult,
  type BriefGpt2RunResult,
  type BriefGpt3RunResult,
} from "@/lib/projectBriefsApi";
import { cn } from "@/lib/utils";

type StepNumber = 1 | 2 | 3;
type StepStatus = "idle" | "loading" | "done" | "error";

type PipelinePanelProps = {
  briefId: string;
};

const STEPS: Array<{ id: StepNumber; label: string }> = [
  { id: 1, label: "מפת אתר ותכנון" },
  { id: 2, label: "תוכן" },
  { id: 3, label: "קוד HTML" },
];

const IDLE_MESSAGES: Record<StepNumber, string> = {
  1: "לחץ על יצירה כדי להתחיל את תהליך בניית מפת האתר",
  2: "אשר את שלב 1 כדי להמשיך לייצור תוכן",
  3: "אשר את שלב 2 כדי להמשיך לייצור קוד",
};

type ProjectFile = {
  fileName: string;
  content: string;
  kind: "html" | "css" | "js";
};

export function PipelinePanel({ briefId }: PipelinePanelProps) {
  return <PipelinePanelContent key={briefId} briefId={briefId} />;
}

function PipelinePanelContent({ briefId }: PipelinePanelProps) {
  const [activeStep, setActiveStep] = useState<StepNumber>(1);
  const [step1Status, setStep1Status] = useState<StepStatus>("idle");
  const [step2Status, setStep2Status] = useState<StepStatus>("idle");
  const [step3Status, setStep3Status] = useState<StepStatus>("idle");
  const [step1Result, setStep1Result] = useState<BriefGpt1RunResult | null>(null);
  const [step2Result, setStep2Result] = useState<BriefGpt2RunResult | null>(null);
  const [step3Result, setStep3Result] = useState<BriefGpt3RunResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);
  const [selectedProjectFile, setSelectedProjectFile] = useState<string>("index.html");

  const projectFiles = useMemo<ProjectFile[]>(() => {
    if (!step3Result) return [];

    return [
      { fileName: "main.css", content: step3Result.output.artifact.globalCss ?? "", kind: "css" },
      { fileName: "main.js", content: step3Result.output.artifact.globalJs ?? "", kind: "js" },
      ...step3Result.output.artifact.pages.map((page) => ({
        fileName: page.fileName,
        content: page.html,
        kind: "html" as const,
      })),
    ];
  }, [step3Result]);

  const selectedProjectFileName = projectFiles.some(
    (file) => file.fileName === selectedProjectFile,
  )
    ? selectedProjectFile
    : (projectFiles[0]?.fileName ?? "index.html");

  const selectedFile =
    projectFiles.find((file) => file.fileName === selectedProjectFileName) ?? null;

  function flashCopied(step: StepNumber) {
    if (step === 1) setCopied1(true);
    if (step === 2) setCopied2(true);
    window.setTimeout(() => {
      if (step === 1) setCopied1(false);
      if (step === 2) setCopied2(false);
    }, 2000);
  }

  async function copyText(text: string, step: StepNumber) {
    await navigator.clipboard.writeText(text);
    flashCopied(step);
  }

  async function handleRunStep1() {
    setStep1Status("loading");
    setErrorMessage(null);

    try {
      const result = await apiRunBriefGpt1SitemapWireframe(briefId);
      setStep1Result(result);
      setStep1Status("done");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "ההרצה נכשלה.");
      setStep1Status("error");
    }
  }

  async function handleRunStep2() {
    setStep2Status("loading");
    setErrorMessage(null);

    try {
      const result = await apiRunBriefGpt2Content(briefId);
      setStep2Result(result);
      setStep2Status("done");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "ההרצה נכשלה.");
      setStep2Status("error");
    }
  }

  async function handleRunStep3() {
    setStep3Status("loading");
    setErrorMessage(null);

    try {
      const result = await apiRunBriefGpt3WireframeSite(briefId);
      setStep3Result(result);
      setStep3Status("done");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "ההרצה נכשלה.");
      setStep3Status("error");
    }
  }

  async function handleDownload() {
    if (!step3Result) return;

    const zip = new JSZip();
    const folder = zip.folder("project");

    for (const page of step3Result.output.artifact.pages) {
      folder?.file(page.fileName, page.html);
    }

    folder?.file("main.css", step3Result.output.artifact.globalCss ?? "");
    folder?.file("main.js", step3Result.output.artifact.globalJs ?? "");

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  function getStepStatus(step: StepNumber): StepStatus {
    if (step === 1) return step1Status;
    if (step === 2) return step2Status;
    return step3Status;
  }

  function isLocked(step: StepNumber) {
    if (step === 1) return false;
    if (step === 2) return step1Status !== "done";
    return step2Status !== "done";
  }

  function handleContinue(step: StepNumber) {
    if (step === 1) {
      setStep2Status("idle");
      setActiveStep(2);
    }
    if (step === 2) {
      setStep3Status("idle");
      setActiveStep(3);
    }
  }

  function renderSpinner(label: string) {
    return (
      <div className="flex items-center justify-end gap-2 text-sm text-foreground">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>{label}</span>
      </div>
    );
  }

  function renderJsonBlock(value: Record<string, unknown>) {
    return (
      <pre
        dir="rtl"
        className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted p-4 text-right font-mono text-xs"
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  function renderStepContent() {
    if (activeStep === 1) {
      if (step1Status === "loading") {
        return renderSpinner("מייצר מפת אתר ותכנון...");
      }

      if (step1Status === "error") {
        return (
          <div className="space-y-4">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => void handleRunStep1()}>
                נסה שוב
              </Button>
            </div>
          </div>
        );
      }

      if (step1Status === "done" && step1Result) {
        const step1Json = JSON.stringify(step1Result.output, null, 2);
        return (
          <div className="space-y-4">
            {renderJsonBlock(step1Result.output)}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyText(step1Json, 1)}
              >
                {copied1 ? "הועתק ✓" : "העתק"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleContinue(1)}>
                אשר והמשך לתוכן
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{IDLE_MESSAGES[1]}</p>
          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleRunStep1()}>
              צור מפת אתר
            </Button>
          </div>
        </div>
      );
    }

    if (activeStep === 2) {
      if (step2Status === "loading") {
        return renderSpinner("מייצר תוכן...");
      }

      if (step2Status === "error") {
        return (
          <div className="space-y-4">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => void handleRunStep2()}>
                נסה שוב
              </Button>
            </div>
          </div>
        );
      }

      if (step2Status === "done" && step2Result) {
        const step2Json = JSON.stringify(step2Result.output, null, 2);
        return (
          <div className="space-y-4">
            {renderJsonBlock(step2Result.output)}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyText(step2Json, 2)}
              >
                {copied2 ? "הועתק ✓" : "העתק"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleContinue(2)}>
                אשר והמשך לקוד
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{IDLE_MESSAGES[2]}</p>
          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleRunStep2()}>
              צור תוכן
            </Button>
          </div>
        </div>
      );
    }

    if (step3Status === "loading") {
      return renderSpinner("בונה אב-טיפוס...");
    }

    if (step3Status === "error") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-destructive">{errorMessage}</p>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => void handleRunStep3()}>
              נסה שוב
            </Button>
          </div>
        </div>
      );
    }

    if (step3Status === "done" && step3Result) {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-background">
            <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">
              📁 project/
            </div>
            <div className="space-y-1 p-3">
              {projectFiles.map((file) => (
                <button
                  key={file.fileName}
                  type="button"
                  onClick={() => setSelectedProjectFile(file.fileName)}
                  className={cn(
                    "block w-full rounded-md px-2 py-1 text-right font-mono text-sm transition-colors",
                    selectedProjectFileName === file.fileName
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted/60",
                  )}
                >
                  📄 {file.fileName}
                </button>
              ))}
            </div>
          </div>

          {selectedFile && (
            <pre
              dir="ltr"
              className="max-h-96 overflow-auto rounded-lg border bg-zinc-950 p-4 text-left font-mono text-xs text-zinc-100"
            >
              {selectedFile.content}
            </pre>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => void handleDownload()}>
              הורד את הפרויקט
            </Button>
            <div className="text-sm font-medium text-foreground">הושלם ✓</div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{IDLE_MESSAGES[3]}</p>
        <div className="flex justify-end">
          <Button type="button" onClick={() => void handleRunStep3()}>
            צור קוד HTML
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section
      data-brief-id={briefId}
      className="space-y-6 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id);
          const done = status === "done";
          const active = activeStep === step.id;
          const locked = isLocked(step.id);

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={locked}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex items-center gap-3 text-right",
                  locked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border text-sm",
                    done && "border-foreground bg-foreground text-background",
                    active && !done && "border-2 border-foreground bg-background text-foreground",
                    locked && "border-muted-foreground/30 bg-muted text-muted-foreground",
                    !done && !active && !locked && "border-border bg-background text-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    locked ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>

              {index < STEPS.length - 1 && (
                <div className="mx-3 h-px flex-1 bg-border" />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4">
        {renderStepContent()}
      </div>
    </section>
  );
}
