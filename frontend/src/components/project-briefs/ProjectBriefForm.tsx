import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Project } from "@/types/project";
import {
  LANGUAGE_STYLE_SELECTION_OPTIONS,
  MAIN_ACTION_SUGGESTIONS,
  TONE_SELECTION_OPTIONS,
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
  linkedProject: Project;
  onCancel: () => void;
  onSubmit: (input: ProjectBriefInput) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestDelete?: () => void;
};

function briefToInput(brief: ProjectBrief): ProjectBriefInput {
  const { id, createdAt, updatedAt, ...rest } = brief;
  return rest;
}

function projectLinkFields(project: Project): Pick<
  ProjectBriefInput,
  | "projectId"
  | "clientId"
  | "briefTitle"
  | "projectNameSnapshot"
  | "clientNameSnapshot"
> {
  return {
    projectId: project.id,
    clientId: project.clientId,
    briefTitle: project.projectName,
    projectNameSnapshot: project.projectName,
    clientNameSnapshot: project.clientName,
  };
}

const EMPTY_INPUT: ProjectBriefInput = {
  projectId: "",
  clientId: "",
  briefTitle: "",
  businessNameSnapshot: "",
  clientNameSnapshot: "",
  projectNameSnapshot: undefined,
  businessWhatTheyDo: "",
  servicesProductsOnSite: "",
  differentiators: "",
  targetAudience: "",
  idealClient: "",
  audiencePainPoints: "",
  sitePrimaryBusinessGoal: "",
  mainUserAction: "",
  websiteType: "",
  sitePagesAndStructure: "",
  siteEmphasis: "",
  toneSelections: [],
  languageStyleSelections: [],
  linguisticAddressing: "",
  contentAvoid: "",
  additionalNotes: "",
};

const CUSTOM = "__custom__";

export function ProjectBriefForm({
  mode,
  initialBrief,
  linkedProject,
  onCancel,
  onSubmit,
  onDirtyChange,
  onRequestDelete,
}: ProjectBriefFormProps) {
  const [sitemapHandoffOpen, setSitemapHandoffOpen] = useState(false);

  const [input, setInput] = useState<ProjectBriefInput>(() =>
    initialBrief
      ? { ...briefToInput(initialBrief), ...projectLinkFields(linkedProject) }
      : { ...EMPTY_INPUT, ...projectLinkFields(linkedProject) },
  );

  const baselineInput = useMemo(
    () =>
      initialBrief
        ? { ...briefToInput(initialBrief), ...projectLinkFields(linkedProject) }
        : { ...EMPTY_INPUT, ...projectLinkFields(linkedProject) },
    [initialBrief, linkedProject],
  );

  const skipNextDirtySync = useRef(false);

  useEffect(() => {
    setInput(
      initialBrief
        ? { ...briefToInput(initialBrief), ...projectLinkFields(linkedProject) }
        : { ...EMPTY_INPUT, ...projectLinkFields(linkedProject) },
    );
  }, [initialBrief, linkedProject]);

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
        <div className="rounded-lg border border-[#312E81]/40 bg-[#111827]/40 px-4 py-3 text-start">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                שם פרויקט
              </p>
              <p className="text-base font-semibold text-foreground">
                {linkedProject.projectName}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                שם לקוח
              </p>
              <p className="text-base font-semibold text-foreground">
                {linkedProject.clientName}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            שאלון אפיון — חמישה פרקים, מותאם לשיחה חיה עם לקוח.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <SectionCard title="1 — פרטי העסק">
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

            <FieldWithHint
              label="מה העסק עושה בפועל?"
              required
              hint="מה העסק מציע בפועל ביום־יום, בצורה פשוטה וברורה"
              examples="משרד עורכי דין לדיני משפחה / רואה חשבון לעסקים קטנים / מורה פרטי למתמטיקה / חברה לייצור מוצרי פלסטיק"
            >
              <Textarea
                required
                rows={3}
                value={input.businessWhatTheyDo}
                onChange={(e) =>
                  update("businessWhatTheyDo", e.target.value)
                }
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה השירותים / המוצרים שצריך להציג באתר?"
              required
              hint="רשום את השירותים או המוצרים העיקריים שצריכים להופיע באתר"
              examples="הנהלת חשבונות, דוחות שנתיים, החזרי מס / עיצוב מטבחים, ליווי שיפוץ, הדמיות / קורס דיגיטלי, פגישות ייעוץ, סדנאות"
            >
              <Textarea
                required
                rows={3}
                value={input.servicesProductsOnSite}
                onChange={(e) =>
                  update("servicesProductsOnSite", e.target.value)
                }
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה מבדל אותך ממתחרים?"
              required
              hint="למה שלקוח יבחר דווקא בך ולא באחרים"
              examples="ניסיון של 15 שנה / שירות אישי / זמינות גבוהה / התמחות בתחום מאוד ספציפי / תהליך עבודה מסודר / מחיר נגיש"
            >
              <Textarea
                required
                rows={3}
                value={input.differentiators}
                onChange={(e) => update("differentiators", e.target.value)}
              />
            </FieldWithHint>
          </SectionCard>

          <SectionCard title="2 — קהל ומטרה">
            <FieldWithHint
              label="מי קהל היעד של האתר?"
              required
              hint="למי האתר צריך לדבר ולמי הוא מיועד בפועל"
              examples="בעלי עסקים קטנים / זוגות לפני גירושין / הורים לתלמידי תיכון / חברות תעשייה / לקוחות פרטיים"
            >
              <Textarea
                required
                rows={3}
                value={input.targetAudience}
                onChange={(e) => update("targetAudience", e.target.value)}
              />
            </FieldWithHint>

            <FieldWithHint
              label="מי הלקוח האידיאלי שאתה רוצה למשוך?"
              required
              hint="איזה סוג לקוחות הכי נכון לך למשוך דרך האתר"
              examples="לקוחות רציניים שמבינים ערך / עסקים שצריכים ליווי קבוע / אנשים שמחפשים פתרון מקצועי ולא זול בלבד"
            >
              <Textarea
                required
                rows={3}
                value={input.idealClient}
                onChange={(e) => update("idealClient", e.target.value)}
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה הבעיה / הצורך המרכזי של הלקוח?"
              required
              hint="מה הכאב, הבעיה או הצורך שהלקוח מגיע איתו"
              examples="צריך סדר מול הרשויות / מחפש יותר לידים / לא מבין מה השירות כולל / רוצה אתר שייראה מקצועי / צריך פתרון מהיר ואמין"
            >
              <Textarea
                required
                rows={3}
                value={input.audiencePainPoints}
                onChange={(e) =>
                  update("audiencePainPoints", e.target.value)
                }
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה המטרה המרכזית של האתר?"
              required
              hint="מה האתר צריך להשיג ברמה העסקית"
              examples="לייצר פניות / לקבוע שיחות / למכור מוצר / לחזק אמון / להציג שירותים בצורה ברורה"
            >
              <Textarea
                required
                rows={3}
                value={input.sitePrimaryBusinessGoal}
                onChange={(e) =>
                  update("sitePrimaryBusinessGoal", e.target.value)
                }
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה הפעולה המרכזית שאתה רוצה שהגולש יבצע?"
              required
              hint="מה ה-CTA המרכזי שצריך להוביל את האתר"
              examples="להשאיר פרטים / לשלוח וואטסאפ / לקבוע פגישה / להתקשר / לבצע רכישה"
            >
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
              />
            </FieldWithHint>
          </SectionCard>

          <SectionCard title="3 — מבנה האתר">
            <PresetOrCustomSelect
              label="איזה סוג אתר צריך לבנות?"
              required
              options={WEBSITE_TYPE_OPTIONS}
              value={input.websiteType}
              onChange={(v) => update("websiteType", v)}
              placeholderCustom="פרטו סוג אתר"
              help="איזה סוג אתר הכי מתאים למטרה העסקית"
              examples="דף נחיתה / אתר תדמית / אתר שירותים / אתר קטלוג / חנות אינטרנט / אתר אישי / אתר טכני"
            />

            <FieldWithHint
              label="כמה עמודים האתר צריך לכלול? האם יש עמודים שחייבים להופיע?"
              required
              hint="אם יש מספר עמודים ידוע או עמודים שחייבים להיכלל, רשום אותם כאן"
              examples="דף בית, אודות, שירותים, המלצות, שאלות נפוצות, יצירת קשר / או רק דף נחיתה אחד ממוקד"
            >
              <Textarea
                required
                rows={4}
                value={input.sitePagesAndStructure}
                onChange={(e) =>
                  update("sitePagesAndStructure", e.target.value)
                }
                placeholder="מספר עמודים, שמות עמודים, או תיאור קצר של המבנה"
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה חשוב במיוחד להבליט באתר?"
              required
              hint="מה הדבר שהכי חשוב לך שהגולש ירגיש או יבין"
              examples="מקצועיות / אמינות / תוצאות / שירות אישי / מהירות / ניסיון / פתרון מותאם / מחירים נגישים"
            >
              <Textarea
                required
                rows={3}
                value={input.siteEmphasis}
                onChange={(e) => update("siteEmphasis", e.target.value)}
              />
            </FieldWithHint>
          </SectionCard>

          <SectionCard title="4 — שפה וניסוח">
            <MultiCheckGroup
              title="איזה טון דיבור אתה רוצה?"
              hint="איך האתר צריך להישמע מבחינת אופי הדיבור"
              examples="מקצועי / אישי / אנושי / סמכותי / יוקרתי / פשוט ונגיש / ישיר ושיווקי"
              options={TONE_SELECTION_OPTIONS as unknown as string[]}
              selected={input.toneSelections}
              onToggle={(value) => toggleMulti("toneSelections", value)}
            />
            {legacyTones.length > 0 && (
              <p className="text-xs text-muted-foreground">
                ערכי טון נוספים (מהדגם הקודם): {legacyTones.join(" · ")}
              </p>
            )}

            <MultiCheckGroup
              title="איזה סגנון כתיבה אתה רוצה?"
              hint="איך התוכן צריך להיות כתוב בפועל"
              examples="קצר ותכליתי / מפורט / מכירתי / ענייני / טכני / נעים וזורם / פשוט מאוד"
              options={LANGUAGE_STYLE_SELECTION_OPTIONS as unknown as string[]}
              selected={input.languageStyleSelections}
              onToggle={(value) =>
                toggleMulti("languageStyleSelections", value)
              }
            />
            {legacyLang.length > 0 && (
              <p className="text-xs text-muted-foreground">
                ערכי שפה נוספים (מהדגם הקודם): {legacyLang.join(" · ")}
              </p>
            )}

            <FieldWithHint
              label="איך תרצה שהאתר יפנה לגולשים?"
              hint="בחר את צורת הפנייה הלשונית הרצויה לתוכן באתר"
              examples="יוניסקסי / פנייה לנשים / פנייה לגברים / לשון רבים / לפי קהל היעד"
            >
              <Textarea
                rows={3}
                value={input.linguisticAddressing}
                onChange={(e) =>
                  update("linguisticAddressing", e.target.value)
                }
                placeholder="למשל: פנייה בלשון רבים, טון נייטרלי…"
              />
            </FieldWithHint>
          </SectionCard>

          <SectionCard title="5 — הנחיות נוספות">
            <FieldWithHint
              label="האם יש משהו שלא תרצה שיופיע באתר?"
              hint="דברים שחשוב להימנע מהם בתוכן, במסרים או במבנה"
              examples="לא להישמע אגרסיבי / לא לדבר על מחירים / לא להבטיח תוצאות / לא להשתמש בשפה משפטית כבדה / לא להציג שירות מסוים"
            >
              <Textarea
                rows={4}
                value={input.contentAvoid}
                onChange={(e) => update("contentAvoid", e.target.value)}
              />
            </FieldWithHint>

            <FieldWithHint
              label="האם יש הערות חשובות / דוגמאות / השראות?"
              hint="כל דבר נוסף שיכול לעזור לכוון נכון את המבנה, התוכן והסגנון"
              examples="אהבתי את המבנה של האתר הזה / חשוב לי מראה נקי / לא אוהב אתרים עמוסים / חובה שתהיה תחושת יוקרה / חייב להיות ברור גם במובייל"
            >
              <Textarea
                rows={5}
                value={input.additionalNotes}
                onChange={(e) => update("additionalNotes", e.target.value)}
              />
            </FieldWithHint>
          </SectionCard>

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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {mode === "edit" && onRequestDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={onRequestDelete}
                >
                  מחק אפיון
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={onCancel}>
                ביטול
              </Button>
            </div>
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
      <div className="space-y-4">{children}</div>
    </div>
  );
}

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

type FieldProps = {
  label: string;
  required?: boolean;
  children: ReactNode;
};

function FieldWithHint({
  label,
  required,
  hint,
  examples,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  examples?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium leading-snug">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      {examples ? (
        <p className="text-xs italic leading-relaxed text-muted-foreground/90">
          דוגמאות: {examples}
        </p>
      ) : null}
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
  help,
  examples,
}: {
  label: string;
  required?: boolean;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  placeholderCustom: string;
  help?: string;
  examples?: string;
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
      {help ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{help}</p>
      ) : null}
      {examples ? (
        <p className="text-xs italic leading-relaxed text-muted-foreground/90">
          דוגמאות: {examples}
        </p>
      ) : null}
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
  hint,
  examples,
  options,
  selected,
  onToggle,
}: {
  title: string;
  hint?: string;
  examples?: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      {hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      {examples ? (
        <p className="text-xs italic leading-relaxed text-muted-foreground/90">
          דוגמאות: {examples}
        </p>
      ) : null}
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
