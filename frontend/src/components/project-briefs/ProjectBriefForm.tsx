import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  LANGUAGE_STYLE_SELECTION_OPTIONS,
  MAIN_ACTION_SUGGESTIONS,
  TONE_SELECTION_OPTIONS,
  WEBSITE_GOAL_OPTIONS,
  WEBSITE_TYPE_OPTIONS,
  type ProjectBrief,
  type ProjectBriefInput,
} from "@/types/projectBrief";
import { buildProjectBriefSummary } from "@/lib/projectBriefSummary";
import {
  generateBriefJSON,
  type NormalizedBriefJSON,
} from "@/lib/generateBriefJSON";
import { SitemapHandoffDialog } from "./SitemapHandoffDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChevronDown, FileText } from "lucide-react";

type ProjectBriefFormProps = {
  mode: "create" | "edit";
  initialBrief?: ProjectBrief;
  onCancel: () => void;
  onSubmit: (input: ProjectBriefInput) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

function briefToInput(brief: ProjectBrief): ProjectBriefInput {
  const { id, createdAt, updatedAt, ...rest } = brief;
  return rest;
}

const EMPTY_INPUT: ProjectBriefInput = {
  projectId: undefined,
  clientId: undefined,
  briefTitle: "",
  businessNameSnapshot: "",
  clientNameSnapshot: "",
  projectNameSnapshot: undefined,
  websiteType: "",
  websiteGoal: "",
  pageCount: "",
  pageListAiSuggested: false,
  requiredPages: "",
  strategicDecisions: "",
  lockedFixedInput: "",
  sourceMaterials: "",
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

const CUSTOM = "__custom__";

export function ProjectBriefForm({
  mode,
  initialBrief,
  onCancel,
  onSubmit,
  onDirtyChange,
}: ProjectBriefFormProps) {
  const [sitemapHandoffOpen, setSitemapHandoffOpen] = useState(false);

  const [input, setInput] = useState<ProjectBriefInput>(() =>
    initialBrief ? briefToInput(initialBrief) : EMPTY_INPUT,
  );

  const baselineInput = useMemo(
    () => (initialBrief ? briefToInput(initialBrief) : EMPTY_INPUT),
    [initialBrief],
  );

  const skipNextDirtySync = useRef(false);

  useEffect(() => {
    setInput(initialBrief ? briefToInput(initialBrief) : EMPTY_INPUT);
  }, [initialBrief]);

  useEffect(() => {
    if (!onDirtyChange) return;
    if (skipNextDirtySync.current) {
      skipNextDirtySync.current = false;
      return;
    }
    const isDirty = JSON.stringify(input) !== JSON.stringify(baselineInput);
    onDirtyChange(isDirty);
  }, [input, baselineInput, onDirtyChange]);

  const summaryBrief = useMemo<ProjectBrief>(
    () => ({
      id: initialBrief?.id ?? "preview",
      createdAt: initialBrief?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input,
    }),
    [initialBrief?.createdAt, initialBrief?.id, input],
  );

  const normalizedBrief = useMemo<NormalizedBriefJSON>(
    () => generateBriefJSON(input),
    [input],
  );

  const normalizedBriefJsonText = useMemo(
    () => JSON.stringify(normalizedBrief, null, 2),
    [normalizedBrief],
  );

  function update<K extends keyof ProjectBriefInput>(
    key: K,
    value: ProjectBriefInput[K],
  ) {
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
        [key]: exists
          ? list.filter((entry) => entry !== value)
          : [...list, value],
      };
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    skipNextDirtySync.current = true;
    onDirtyChange?.(false);
    onSubmit(input);
  }

  const legacyTones = (input.toneSelections ?? []).filter(
    (t) => !(TONE_SELECTION_OPTIONS as readonly string[]).includes(t),
  );
  const legacyLang = (input.languageStyleSelections ?? []).filter(
    (t) =>
      !(LANGUAGE_STYLE_SELECTION_OPTIONS as readonly string[]).includes(t),
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5 text-base [&_input]:min-h-9 [&_input]:py-2 [&_input]:text-base md:[&_input]:!text-base [&_textarea]:text-base md:[&_textarea]:!text-base">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            {mode === "create" ? "בריף חדש" : "עריכת בריף"}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            בריף ממוקד: מבנה אתר, כיוון תוכן ו-wireframe — בלי רעש מיותר.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <SectionCard title="פרטי פרויקט">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="כותרת הבריף (לרשימה)" required>
                <Input
                  required
                  value={input.briefTitle}
                  onChange={(e) => update("briefTitle", e.target.value)}
                  placeholder="למשל: אתר תדמית — שם העסק"
                />
              </Field>
              <Field label="שם העסק" required>
                <Input
                  required
                  value={input.businessNameSnapshot}
                  onChange={(e) =>
                    update("businessNameSnapshot", e.target.value)
                  }
                  placeholder="שם העסק או המותג"
                />
              </Field>
            </div>

            <PresetOrCustomSelect
              label="סוג אתר"
              required
              options={WEBSITE_TYPE_OPTIONS}
              value={input.websiteType}
              onChange={(v) => update("websiteType", v)}
              placeholderCustom="פרטו סוג אתר"
            />

            <PresetOrCustomSelect
              label="מטרת האתר"
              required
              options={WEBSITE_GOAL_OPTIONS}
              value={input.websiteGoal}
              onChange={(v) => update("websiteGoal", v)}
              placeholderCustom="פרטו מטרה"
            />

            <Field label="פעולה מרכזית" required>
              <div className="flex flex-wrap gap-2">
                {MAIN_ACTION_SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-normal"
                    onClick={() => update("mainUserAction", s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
              <Input
                required
                className="mt-2"
                value={input.mainUserAction}
                onChange={(e) => update("mainUserAction", e.target.value)}
                placeholder="למשל: השארת פרטים / רכישה / שיחה"
              />
            </Field>
          </SectionCard>

          <SectionCard title="קהל יעד">
            <Field label="מי קהל היעד" required>
              <Textarea
                required
                rows={2}
                value={input.targetAudience}
                onChange={(e) => update("targetAudience", e.target.value)}
                placeholder="בקצרה — מי הלקוחות?"
              />
            </Field>
            <Field label="כאב מרכזי אחד" required>
              <Textarea
                required
                rows={2}
                value={input.audiencePainPoints}
                onChange={(e) => update("audiencePainPoints", e.target.value)}
                placeholder="הבעיה העיקרית שהאתר צריך לגעת בה"
              />
            </Field>
            <Field label="למה שיבחרו דווקא בלקוח" required>
              <Textarea
                required
                rows={2}
                value={input.differentiators}
                onChange={(e) => update("differentiators", e.target.value)}
                placeholder="יתרון מרכזי אחד שמניע בחירה"
              />
            </Field>
          </SectionCard>

          <SectionCard title="שירותים / הצעה">
            <Field label="מה העסק מוכר / מציע" required>
              <Textarea
                required
                rows={2}
                value={input.businessDescription}
                onChange={(e) => update("businessDescription", e.target.value)}
                placeholder="בשורה או שתיים"
              />
            </Field>
            <Field label="שירות מרכזי אחד" required>
              <Input
                required
                value={input.mainService}
                onChange={(e) => update("mainService", e.target.value)}
                placeholder="השירות או המוצר המרכזי"
              />
            </Field>
          </SectionCard>

          <SectionCard title="מבנה אתר">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={input.pageListAiSuggested}
                onChange={(e) => {
                  const on = e.target.checked;
                  update("pageListAiSuggested", on);
                  if (on) {
                    update("pageCount", "");
                    update("requiredPages", "");
                  }
                }}
                className="h-4 w-4 shrink-0"
              />
              <span>תן ל-AI להציע רשימת עמודים</span>
            </label>

            <Field
              label="מספר עמודים"
              required={!input.pageListAiSuggested}
            >
              <Input
                type="text"
                inputMode="numeric"
                disabled={input.pageListAiSuggested}
                required={!input.pageListAiSuggested}
                value={input.pageCount}
                onChange={(e) => update("pageCount", e.target.value)}
                placeholder="למשל: 5"
              />
            </Field>

            <Field
              label="רשימת עמודים מדויקת"
              required={!input.pageListAiSuggested}
            >
              <Textarea
                required={!input.pageListAiSuggested}
                disabled={input.pageListAiSuggested}
                rows={3}
                value={input.requiredPages}
                onChange={(e) => update("requiredPages", e.target.value)}
                placeholder="דוגמה: בית · אודות · שירותים · צור קשר"
              />
            </Field>
          </SectionCard>

          <SectionCard title="טון וסגנון">
            <MultiCheckGroup
              title="טון"
              options={TONE_SELECTION_OPTIONS as unknown as string[]}
              selected={input.toneSelections}
              onToggle={(value) => toggleMulti("toneSelections", value)}
            />
            {legacyTones.length > 0 && (
              <p className="text-xs text-muted-foreground">
                ערכי טון מהדגם הקודם (נשמרו): {legacyTones.join(" · ")}
              </p>
            )}
            <MultiCheckGroup
              title="סגנון שפה"
              options={LANGUAGE_STYLE_SELECTION_OPTIONS as unknown as string[]}
              selected={input.languageStyleSelections}
              onToggle={(value) =>
                toggleMulti("languageStyleSelections", value)
              }
            />
            {legacyLang.length > 0 && (
              <p className="text-xs text-muted-foreground">
                ערכי שפה מהדגם הקודם (נשמרו): {legacyLang.join(" · ")}
              </p>
            )}
          </SectionCard>

          <SectionCard title="הערות חשובות">
            <Field label="משהו חשוב שצריך לדעת">
              <Textarea
                rows={3}
                value={input.contentNotes}
                onChange={(e) => update("contentNotes", e.target.value)}
                placeholder="מגבלות, הקשר, או כל דבר קריטי שלא נכנס למעלה"
              />
            </Field>
          </SectionCard>

          <details className="group rounded-xl border border-border bg-muted/15 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-foreground">
              <span>הרחבות ושדות מהדגם הקודם (אופציונלי)</span>
              <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-5 border-t border-border/60 pt-4">
              <p className="text-xs text-muted-foreground">
                שדות אלה לא נדרשים למבנה הבריף החדש; נשמרים לתאימות ולמקרה
                שצריך פירוט נוסף.
              </p>

              <Field label="שם הלקוח">
                <Input
                  value={input.clientNameSnapshot}
                  onChange={(e) =>
                    update("clientNameSnapshot", e.target.value)
                  }
                  placeholder="איש קשר"
                />
              </Field>

              <Field label="מטרת פרויקט (טקסט חופשי, מהדגם הקודם)">
                <Textarea
                  rows={2}
                  value={input.projectGoal}
                  onChange={(e) => update("projectGoal", e.target.value)}
                  placeholder="אם יש ניסוח מלא מהבריף הישן"
                />
              </Field>

              <Field label="החלטות אסטרטגיות / קווים אדומים">
                <Textarea
                  rows={2}
                  value={input.strategicDecisions}
                  onChange={(e) =>
                    update("strategicDecisions", e.target.value)
                  }
                />
              </Field>

              <div className="text-sm font-medium">מבנה ו-UX (מפורט)</div>
              <Field label="סקשנים שחייבים להופיע">
                <Textarea
                  rows={2}
                  value={input.mustHaveSections}
                  onChange={(e) => update("mustHaveSections", e.target.value)}
                />
              </Field>
              <Field label="מידע מעל הקפל">
                <Textarea
                  rows={2}
                  value={input.keyInfoAboveTheFold}
                  onChange={(e) =>
                    update("keyInfoAboveTheFold", e.target.value)
                  }
                />
              </Field>
              <Field label="שאלות לקוח שחוזרות">
                <Textarea
                  rows={2}
                  value={input.repeatedCustomerQuestions}
                  onChange={(e) =>
                    update("repeatedCustomerQuestions", e.target.value)
                  }
                />
              </Field>
              <Field label="הערות UX">
                <Textarea
                  rows={2}
                  value={input.uxNotes}
                  onChange={(e) => update("uxNotes", e.target.value)}
                />
              </Field>

              <div className="text-sm font-medium">תוכן נוסף</div>
              <Field label="מסרים מרכזיים">
                <Textarea
                  rows={2}
                  value={input.keyMessages}
                  onChange={(e) => update("keyMessages", e.target.value)}
                />
              </Field>
              <Field label="ביטויים להימנע">
                <Textarea
                  rows={2}
                  value={input.forbiddenPhrases}
                  onChange={(e) => update("forbiddenPhrases", e.target.value)}
                />
              </Field>
              <Field label="הערות על תוכן קיים">
                <Textarea
                  rows={2}
                  value={input.existingContentNotes}
                  onChange={(e) =>
                    update("existingContentNotes", e.target.value)
                  }
                />
              </Field>

              <div className="text-sm font-medium">כיוון עיצוב (משני)</div>
              <Field label="תחושה חזותית">
                <Textarea
                  rows={2}
                  value={input.visualFeeling}
                  onChange={(e) => update("visualFeeling", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="צבעים מועדפים">
                  <Textarea
                    rows={2}
                    value={input.preferredColors}
                    onChange={(e) => update("preferredColors", e.target.value)}
                  />
                </Field>
                <Field label="צבעים להימנע">
                  <Textarea
                    rows={2}
                    value={input.unwantedColors}
                    onChange={(e) => update("unwantedColors", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="רפרנסים אהובים">
                <Textarea
                  rows={2}
                  value={input.likedReferences}
                  onChange={(e) => update("likedReferences", e.target.value)}
                />
              </Field>
              <Field label="רפרנסים לא רצויים">
                <Textarea
                  rows={2}
                  value={input.dislikedReferences}
                  onChange={(e) =>
                    update("dislikedReferences", e.target.value)
                  }
                />
              </Field>
              <Field label="הערות סגנון עיצובי">
                <Textarea
                  rows={2}
                  value={input.designStyleNotes}
                  onChange={(e) => update("designStyleNotes", e.target.value)}
                />
              </Field>
              <Field label="הערות עיצוב נוספות">
                <Textarea
                  rows={2}
                  value={input.designNotes}
                  onChange={(e) => update("designNotes", e.target.value)}
                />
              </Field>

              <div className="text-sm font-medium">נעילות ומקורות</div>
              <Field label="תכנים/אלמנטים נעולים">
                <Textarea
                  rows={2}
                  value={input.lockedFixedInput}
                  onChange={(e) => update("lockedFixedInput", e.target.value)}
                />
              </Field>
              <Field label="חומרי גלם / קישורים">
                <Textarea
                  rows={2}
                  value={input.sourceMaterials}
                  onChange={(e) => update("sourceMaterials", e.target.value)}
                />
              </Field>
            </div>
          </details>

          <details className="group rounded-xl border border-dashed border-border bg-muted/10 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                סיכום מהיר (לקריאה)
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              {buildProjectBriefSummary(summaryBrief).map((section) => (
                <div key={section.title} className="space-y-2">
                  <div className="text-sm font-semibold">{section.title}</div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <div
                        key={item.label}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">
                          {item.label}:{" "}
                        </span>
                        {item.value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details className="group rounded-xl border border-dashed border-border bg-muted/10 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
              <span>JSON מנורמל (תצוגה / debug)</span>
              <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-xs text-muted-foreground">
              פלט פנימי לפני אינטגרציה עם GPT — מתעדכן לפי הטופס.
            </p>
            <pre
              dir="ltr"
              className="mt-2 max-h-80 overflow-auto rounded-md border border-border bg-background p-3 text-left font-mono text-xs leading-relaxed text-foreground"
            >
              {normalizedBriefJsonText}
            </pre>
          </details>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="px-4"
              onClick={() => setSitemapHandoffOpen(true)}
            >
              צור Sitemap & Wireframe
            </Button>
          </div>

          <div className="flex justify-between gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit" className="px-5 text-sm">
              שמירה
            </Button>
          </div>
        </form>

        <SitemapHandoffDialog
          open={sitemapHandoffOpen}
          normalizedBrief={normalizedBrief}
          onClose={() => setSitemapHandoffOpen(false)}
        />
      </div>
    </section>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm shadow-black/[0.02]">
      <div className="text-base font-semibold text-foreground">{title}</div>
      <div className="space-y-3">{children}</div>
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
    <div className="space-y-1.5">
      <Label className="text-sm font-medium leading-snug">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function PresetOrCustomSelect({
  label,
  required,
  options,
  value,
  onChange,
  placeholderCustom,
}: {
  label: string;
  required?: boolean;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  placeholderCustom: string;
}) {
  const trimmed = value.trim();
  const presetMatch = options.find((o) => o === trimmed);
  const selectValue = presetMatch ?? (trimmed ? CUSTOM : "");

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium leading-snug">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <select
        required={required && selectValue === ""}
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === CUSTOM) onChange("");
          else onChange(v);
        }}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <option value="">בחרו…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={CUSTOM}>אחר (הזנה חופשית)</option>
      </select>
      {(selectValue === CUSTOM || (!presetMatch && trimmed)) && (
        <Input
          required={required && selectValue === CUSTOM && !trimmed}
          value={trimmed}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholderCustom}
        />
      )}
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
      <div className="text-sm font-medium">{title}</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-sm leading-snug"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 shrink-0"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
