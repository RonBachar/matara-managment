import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Project } from "@/types/project";
import {
  LANGUAGE_STYLE_SELECTION_OPTIONS,
  PROJECT_BRIEF_STATUSES,
  TONE_SELECTION_OPTIONS,
  type ProjectBrief,
  type ProjectBriefInput,
} from "@/types/projectBrief";
import { buildProjectBriefSummary } from "@/lib/projectBriefSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ProjectBriefFormProps = {
  mode: "create" | "edit";
  projects: Project[];
  existingBriefs: ProjectBrief[];
  initialBrief?: ProjectBrief;
  onCancel: () => void;
  onSubmit: (data: {
    projectId: string;
    projectNameSnapshot: string;
    clientId: string;
    clientNameSnapshot: string;
    input: ProjectBriefInput;
  }) => void;
};

const EMPTY_INPUT: ProjectBriefInput = {
  status: "טיוטה",
  mainService: "",
  projectGoal: "",
  targetAudience: "",
  audiencePainPoints: "",
  mainUserAction: "",
  mustHaveSections: "",
  keyInfoAboveTheFold: "",
  repeatedCustomerQuestions: "",
  uxNotes: "",
  businessDescription: "",
  differentiators: "",
  keyMessages: "",
  forbiddenPhrases: "",
  existingContentNotes: "",
  toneSelections: [],
  languageStyleSelections: [],
  contentNotes: "",
  visualFeeling: "",
  likedReferences: "",
  dislikedReferences: "",
  preferredColors: "",
  unwantedColors: "",
  designStyleNotes: "",
  designNotes: "",
};

export function ProjectBriefForm({
  mode,
  projects,
  existingBriefs,
  initialBrief,
  onCancel,
  onSubmit,
}: ProjectBriefFormProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialBrief?.projectId ?? "",
  );
  const [input, setInput] = useState<ProjectBriefInput>(
    initialBrief
      ? {
          status: initialBrief.status,
          mainService: initialBrief.mainService,
          projectGoal: initialBrief.projectGoal,
          targetAudience: initialBrief.targetAudience,
          audiencePainPoints: initialBrief.audiencePainPoints,
          mainUserAction: initialBrief.mainUserAction,
          mustHaveSections: initialBrief.mustHaveSections,
          keyInfoAboveTheFold: initialBrief.keyInfoAboveTheFold,
          repeatedCustomerQuestions: initialBrief.repeatedCustomerQuestions,
          uxNotes: initialBrief.uxNotes,
          businessDescription: initialBrief.businessDescription,
          differentiators: initialBrief.differentiators,
          keyMessages: initialBrief.keyMessages,
          forbiddenPhrases: initialBrief.forbiddenPhrases,
          existingContentNotes: initialBrief.existingContentNotes,
          toneSelections: initialBrief.toneSelections ?? [],
          languageStyleSelections: initialBrief.languageStyleSelections ?? [],
          contentNotes: initialBrief.contentNotes,
          visualFeeling: initialBrief.visualFeeling,
          likedReferences: initialBrief.likedReferences,
          dislikedReferences: initialBrief.dislikedReferences,
          preferredColors: initialBrief.preferredColors,
          unwantedColors: initialBrief.unwantedColors,
          designStyleNotes: initialBrief.designStyleNotes,
          designNotes: initialBrief.designNotes,
        }
      : EMPTY_INPUT,
  );
  const [projectError, setProjectError] = useState<string>("");

  useEffect(() => {
    if (initialBrief) {
      setSelectedProjectId(initialBrief.projectId);
      return;
    }
    setSelectedProjectId("");
  }, [initialBrief]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  const isProjectAlreadyUsed = useMemo(() => {
    if (!selectedProjectId) return false;
    const duplicate = existingBriefs.find((brief) => brief.projectId === selectedProjectId);
    if (!duplicate) return false;
    return initialBrief ? duplicate.id !== initialBrief.id : true;
  }, [existingBriefs, initialBrief, selectedProjectId]);

  const summaryBrief = useMemo<ProjectBrief>(
    () => ({
      id: initialBrief?.id ?? "preview",
      projectId: selectedProject?.id ?? "",
      clientId: selectedProject?.clientId ?? "",
      projectNameSnapshot: selectedProject?.projectName ?? "",
      clientNameSnapshot: selectedProject?.clientName ?? "",
      createdAt: initialBrief?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input,
    }),
    [initialBrief?.createdAt, initialBrief?.id, input, selectedProject],
  );

  function update<K extends keyof ProjectBriefInput>(key: K, value: ProjectBriefInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMulti(
    key: "toneSelections" | "languageStyleSelections",
    value: string,
  ) {
    setInput((prev) => {
      const list = prev[key] ?? [];
      const exists = list.includes(value);
      return {
        ...prev,
        [key]: exists ? list.filter((entry) => entry !== value) : [...list, value],
      };
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedProject) {
      setProjectError("יש לבחור פרויקט לפני שמירת הבריף.");
      return;
    }
    if (isProjectAlreadyUsed) {
      setProjectError("לפרויקט זה כבר קיים בריף. ניתן לערוך את הבריף הקיים.");
      return;
    }
    setProjectError("");
    onSubmit({
      projectId: selectedProject.id,
      projectNameSnapshot: selectedProject.projectName,
      clientId: selectedProject.clientId,
      clientNameSnapshot: selectedProject.clientName,
      input,
    });
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            {mode === "create" ? "בריף חדש" : "עריכת בריף"}
          </h3>
          <p className="text-xs text-muted-foreground">
            מסמך עבודה מובנה בין שלב הגילוי לשלב הסקיצה.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="בחירת פרויקט" required>
          <Select
            value={selectedProjectId || undefined}
            onValueChange={(value) => {
              setSelectedProjectId(value ?? "");
              setProjectError("");
            }}
            disabled={mode === "edit"}
          >
            <SelectTrigger className={cn(projectError && "border-destructive")}>
              <SelectValue placeholder="בחר פרויקט קיים" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectName} / {project.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {projectError && <p className="text-xs text-destructive">{projectError}</p>}
          {isProjectAlreadyUsed && mode === "create" && (
            <p className="text-xs text-destructive">
              לפרויקט זה כבר קיים בריף. בחר פרויקט אחר או ערוך את הבריף הקיים.
            </p>
          )}
        </Field>

        {selectedProject && (
          <div className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm md:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">שם הפרויקט</div>
              <div className="font-medium">{selectedProject.projectName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">שם הלקוח</div>
              <div className="font-medium">{selectedProject.clientName}</div>
            </div>
          </div>
        )}

        {selectedProject && !isProjectAlreadyUsed && (
          <>
            <SectionTitle title="פרטי בסיס" />
            <Field label="סטטוס בריף">
              <Select
                value={input.status}
                onValueChange={(value) =>
                  update("status", (value as ProjectBriefInput["status"]) ?? "טיוטה")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_BRIEF_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="שירות מרכזי">
              <Input
                value={input.mainService}
                onChange={(e) => update("mainService", e.target.value)}
              />
            </Field>
            <Field label="מטרת הפרויקט">
              <Textarea
                rows={3}
                value={input.projectGoal}
                onChange={(e) => update("projectGoal", e.target.value)}
              />
            </Field>

            <SectionTitle title="מבנה UX" />
            <TextFieldsBlock
              fields={[
                ["קהל יעד", "targetAudience"],
                ["כאבים/חסמים של קהל היעד", "audiencePainPoints"],
                ["פעולה מרכזית שהמשתמש צריך לבצע", "mainUserAction"],
                ["סקשנים שחייבים להופיע", "mustHaveSections"],
                ["מידע קריטי מעל הקפל", "keyInfoAboveTheFold"],
                ["שאלות לקוח שחוזרות", "repeatedCustomerQuestions"],
                ["הערות UX", "uxNotes"],
              ]}
              input={input}
              onChange={update}
            />

            <SectionTitle title="כיוון תוכן" />
            <TextFieldsBlock
              fields={[
                ["תיאור העסק", "businessDescription"],
                ["בידול", "differentiators"],
                ["מסרים מרכזיים", "keyMessages"],
                ["ביטויים/ניסוחים להימנע מהם", "forbiddenPhrases"],
                ["הערות על תוכן קיים", "existingContentNotes"],
                ["הערות תוכן נוספות", "contentNotes"],
              ]}
              input={input}
              onChange={update}
            />

            <MultiCheckGroup
              title="בחירת טון"
              options={TONE_SELECTION_OPTIONS as unknown as string[]}
              selected={input.toneSelections}
              onToggle={(value) => toggleMulti("toneSelections", value)}
            />
            <MultiCheckGroup
              title="בחירת סגנון שפה"
              options={LANGUAGE_STYLE_SELECTION_OPTIONS as unknown as string[]}
              selected={input.languageStyleSelections}
              onToggle={(value) => toggleMulti("languageStyleSelections", value)}
            />

            <SectionTitle title="כיוון עיצוב" />
            <TextFieldsBlock
              fields={[
                ["תחושה חזותית רצויה", "visualFeeling"],
                ["רפרנסים אהובים", "likedReferences"],
                ["רפרנסים שלא אהבתם", "dislikedReferences"],
                ["צבעים מועדפים", "preferredColors"],
                ["צבעים להימנע", "unwantedColors"],
                ["הערות על סגנון עיצובי", "designStyleNotes"],
                ["הערות עיצוב נוספות", "designNotes"],
              ]}
              input={input}
              onChange={update}
            />

            <SectionTitle title="תקציר אפיון" />
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
              {buildProjectBriefSummary(summaryBrief).map((section) => (
                <div key={section.title} className="space-y-1">
                  <div className="text-sm font-semibold">{section.title}</div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <div key={item.label} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{item.label}: </span>
                        {item.value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between gap-3 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            ביטול
          </Button>
          <Button
            type="submit"
            size="sm"
            className="px-4"
            disabled={!selectedProject || isProjectAlreadyUsed}
          >
            שמירה
          </Button>
        </div>
      </form>
    </section>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="border-b border-border pb-1">
      <h4 className="text-sm font-semibold">{title}</h4>
    </div>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
};

function Field({ label, required, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

type TextFieldKey = Extract<
  keyof ProjectBriefInput,
  | "targetAudience"
  | "audiencePainPoints"
  | "mainUserAction"
  | "mustHaveSections"
  | "keyInfoAboveTheFold"
  | "repeatedCustomerQuestions"
  | "uxNotes"
  | "businessDescription"
  | "differentiators"
  | "keyMessages"
  | "forbiddenPhrases"
  | "existingContentNotes"
  | "contentNotes"
  | "visualFeeling"
  | "likedReferences"
  | "dislikedReferences"
  | "preferredColors"
  | "unwantedColors"
  | "designStyleNotes"
  | "designNotes"
>;

function TextFieldsBlock({
  fields,
  input,
  onChange,
}: {
  fields: Array<[string, TextFieldKey]>;
  input: ProjectBriefInput;
  onChange: <K extends keyof ProjectBriefInput>(
    key: K,
    value: ProjectBriefInput[K],
  ) => void;
}) {
  return (
    <div className="space-y-3">
      {fields.map(([label, key]) => (
        <Field key={key} label={label}>
          <Textarea
            rows={3}
            value={input[key]}
            onChange={(e) => onChange(key, e.target.value as ProjectBriefInput[typeof key])}
          />
        </Field>
      ))}
    </div>
  );
}

function MultiCheckGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">{title}</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="h-3.5 w-3.5"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

