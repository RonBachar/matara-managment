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
  TONE_SELECTION_OPTIONS,
  WEBSITE_TYPE_OPTIONS,
  type ProjectBrief,
  type ProjectBriefInput,
} from "@/types/projectBrief";
import { buildProjectBriefSummary } from "@/lib/projectBriefSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Building2,
  ChevronDown,
  Check,
  Copy,
  FileText,
  LayoutTemplate,
  Lightbulb,
  MessageSquare,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ProjectBriefFormProps = {
  mode: "create" | "edit";
  initialBrief?: ProjectBrief;
  onCancel: () => void;
  onSubmit: (input: ProjectBriefInput) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onRequestDelete?: () => void;
};

function briefToInput(brief: ProjectBrief): ProjectBriefInput {
  return {
    businessNameSnapshot: brief.businessNameSnapshot,
    businessWhatTheyDo: brief.businessWhatTheyDo,
    servicesProductsOnSite: brief.servicesProductsOnSite,
    differentiators: brief.differentiators,
    targetAudience: brief.targetAudience,
    idealClient: brief.idealClient,
    audiencePainPoints: brief.audiencePainPoints,
    sitePrimaryBusinessGoal: brief.sitePrimaryBusinessGoal,
    mainUserAction: brief.mainUserAction,
    websiteType: brief.websiteType,
    requestedPages: brief.requestedPages,
    siteEmphasis: brief.siteEmphasis,
    toneSelections: brief.toneSelections,
    languageStyleSelections: brief.languageStyleSelections,
    linguisticAddressing: brief.linguisticAddressing,
    contentAvoid: brief.contentAvoid,
    additionalNotes: brief.additionalNotes,
  };
}

const EMPTY_INPUT: ProjectBriefInput = {
  businessNameSnapshot: "",
  businessWhatTheyDo: "",
  servicesProductsOnSite: "",
  differentiators: "",
  targetAudience: "",
  idealClient: "",
  audiencePainPoints: "",
  sitePrimaryBusinessGoal: "",
  mainUserAction: "",
  websiteType: "",
  requestedPages: "",
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
  onCancel,
  onSubmit,
  onDirtyChange,
  onRequestDelete,
}: ProjectBriefFormProps) {
  return (
    <ProjectBriefFormContent
      key={`${mode}:${initialBrief?.id ?? "new"}`}
      mode={mode}
      initialBrief={initialBrief}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onDirtyChange={onDirtyChange}
      onRequestDelete={onRequestDelete}
    />
  );
}

function ProjectBriefFormContent({
  mode,
  initialBrief,
  onCancel,
  onSubmit,
  onDirtyChange,
  onRequestDelete,
}: ProjectBriefFormProps) {
  const [input, setInput] = useState<ProjectBriefInput>(() =>
    initialBrief ? briefToInput(initialBrief) : EMPTY_INPUT,
  );
  const [summaryCopyState, setSummaryCopyState] = useState<
    "idle" | "copied" | "failed"
  >("idle");

  const baselineInput = useMemo(
    () => (initialBrief ? briefToInput(initialBrief) : EMPTY_INPUT),
    [initialBrief],
  );

  const skipNextDirtySync = useRef(false);
  const copyResetTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!onDirtyChange) return;
    if (skipNextDirtySync.current) {
      skipNextDirtySync.current = false;
      return;
    }
    const isDirty = JSON.stringify(input) !== JSON.stringify(baselineInput);
    onDirtyChange(isDirty);
  }, [input, baselineInput, onDirtyChange]);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) {
        window.clearTimeout(copyResetTimer.current);
      }
    };
  }, []);

  const summaryBrief = useMemo<ProjectBrief>(
    () => ({
      id: initialBrief?.id ?? "preview",
      projectId: initialBrief?.projectId ?? "",
      title: initialBrief?.title ?? (input.businessNameSnapshot?.trim() || "תצוגה מקדימה"),
      createdAt: initialBrief?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...input,
    }),
    [initialBrief?.createdAt, initialBrief?.id, initialBrief?.projectId, initialBrief?.title, input],
  );

  const summarySections = useMemo(
    () => buildProjectBriefSummary(summaryBrief),
    [summaryBrief],
  );

  const summaryCopyText = useMemo(
    () =>
      summarySections
        .map((section) =>
          [
            section.title,
            ...section.items.map((item) => `${item.label}: ${item.value}`),
          ].join("\n"),
        )
        .join("\n\n"),
    [summarySections],
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

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(summaryCopyText);
      setSummaryCopyState("copied");
    } catch {
      setSummaryCopyState("failed");
    }

    if (copyResetTimer.current) {
      window.clearTimeout(copyResetTimer.current);
    }
    copyResetTimer.current = window.setTimeout(() => {
      setSummaryCopyState("idle");
    }, 1800);
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <SectionCard title="1 - פרטי העסק" icon={Building2} accent="border-blue-100 bg-blue-50/40">
            <Field label="שם העסק">
              <Input
                value={input.businessNameSnapshot}
                onChange={(e) => update("businessNameSnapshot", e.target.value)}
                placeholder="שם העסק או המותג"
              />
            </Field>

            <FieldWithHint
              label="מה העסק עושה בפועל?"
              hint="מה העסק מציע בפועל ביום-יום, בצורה פשוטה וברורה"
              examples="משרד עורכי דין לדיני משפחה / רואה חשבון לעסקים קטנים / מורה פרטי למתמטיקה / חברה לייצור מוצרי פלסטיק"
            >
              <Textarea
                rows={3}
                value={input.businessWhatTheyDo}
                onChange={(e) => update("businessWhatTheyDo", e.target.value)}
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה השירותים / המוצרים שצריך להציג באתר?"
              hint="רשום את השירותים או המוצרים העיקריים שצריכים להופיע באתר"
              examples="הנהלת חשבונות, דוחות שנתיים, החזרי מס / עיצוב מטבחים, ליווי שיפוץ, הדמיות / קורס דיגיטלי, פגישות ייעוץ, סדנאות"
            >
              <Textarea
                rows={3}
                value={input.servicesProductsOnSite}
                onChange={(e) =>
                  update("servicesProductsOnSite", e.target.value)
                }
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה מבדל אותך ממתחרים?"
              hint="למה שלקוח יבחר דווקא בך ולא באחרים"
              examples="ניסיון של 15 שנה / שירות אישי / זמינות גבוהה / התמחות בתחום מאוד ספציפי / תהליך עבודה מסודר / מחיר נגיש"
            >
              <Textarea
                rows={3}
                value={input.differentiators}
                onChange={(e) => update("differentiators", e.target.value)}
              />
            </FieldWithHint>
          </SectionCard>

          <SectionCard title="2 - קהל ומטרה" icon={Users} accent="border-violet-100 bg-violet-50/40">
            <FieldWithHint
              label="מי קהל היעד של האתר?"
              hint="למי האתר צריך לדבר ולמי הוא מיועד בפועל"
              examples="בעלי עסקים קטנים / זוגות לפני גירושין / הורים לתלמידי תיכון / חברות תעשייה / לקוחות פרטיים"
            >
              <Textarea
                rows={3}
                value={input.targetAudience}
                onChange={(e) => update("targetAudience", e.target.value)}
              />
            </FieldWithHint>

            <FieldWithHint
              label="מי הלקוח האידיאלי שאתה רוצה למשוך?"
              hint="איזה סוג לקוחות הכי נכון לך למשוך דרך האתר"
              examples="לקוחות רציניים שמבינים ערך / עסקים שצריכים ליווי קבוע / אנשים שמחפשים פתרון מקצועי ולא זול בלבד"
            >
              <Textarea
                rows={3}
                value={input.idealClient}
                onChange={(e) => update("idealClient", e.target.value)}
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה הבעיה / הצורך המרכזי של הלקוח?"
              hint="מה הכאב, הבעיה או הצורך שהלקוח מגיע איתו"
              examples="צריך סדר מול הרשויות / מחפש יותר לידים / לא מבין מה השירות כולל / רוצה אתר שייראה מקצועי / צריך פתרון מהיר ואמין"
            >
              <Textarea
                rows={3}
                value={input.audiencePainPoints}
                onChange={(e) =>
                  update("audiencePainPoints", e.target.value)
                }
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה המטרה המרכזית של האתר?"
              hint="מה האתר צריך להשיג ברמה העסקית"
              examples="לייצר פניות / לקבוע שיחות / למכור מוצר / לחזק אמון / להציג שירותים בצורה ברורה"
            >
              <Textarea
                rows={3}
                value={input.sitePrimaryBusinessGoal}
                onChange={(e) =>
                  update("sitePrimaryBusinessGoal", e.target.value)
                }
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה הפעולה המרכזית שאתה רוצה שהגולש יבצע?"
              hint="מה ה-CTA המרכזי שצריך להוביל את האתר"
              examples="להשאיר פרטים / לשלוח וואטסאפ / לקבוע פגישה / להתקשר / לבצע רכישה"
            >
              <Input
                value={input.mainUserAction}
                onChange={(e) => update("mainUserAction", e.target.value)}
                placeholder="כתוב כאן את הפעולה המרכזית שתרצה שהגולש יבצע"
              />
            </FieldWithHint>
          </SectionCard>

          <SectionCard title="3 - מבנה האתר" icon={LayoutTemplate} accent="border-emerald-100 bg-emerald-50/40">
            <PresetOrCustomSelect
              label="איזה סוג אתר צריך לבנות?"
              options={WEBSITE_TYPE_OPTIONS}
              value={input.websiteType}
              onChange={(v) => update("websiteType", v)}
              placeholderCustom="פרטו סוג אתר"
              help="איזה סוג אתר הכי מתאים למטרה העסקית"
              examples="דף נחיתה / אתר תדמית / אתר שירותים / אתר קטלוג / חנות אינטרנט / אתר אישי / אתר טכני"
            />

            <FieldWithHint
              label="עמודים נדרשים באתר"
              hint="אם יש עמודים ספציפיים שחייבים להופיע — רשום אותם. אם לא, השאר ריק ו-GPT יחליט בשבילך."
              examples="דף בית, אודות, שירותים, צור קשר / או: רק דף נחיתה אחד"
            >
              <Textarea
                rows={4}
                value={input.requestedPages}
                onChange={(e) => update("requestedPages", e.target.value)}
              />
            </FieldWithHint>

            <FieldWithHint
              label="מה חשוב במיוחד להבליט באתר?"
              hint="מה הדבר שהכי חשוב לך שהגולש ירגיש או יבין"
              examples="מקצועיות / אמינות / תוצאות / שירות אישי / מהירות / ניסיון / פתרון מותאם / מחירים נגישים"
            >
              <Textarea
                rows={3}
                value={input.siteEmphasis}
                onChange={(e) => update("siteEmphasis", e.target.value)}
              />
            </FieldWithHint>
          </SectionCard>

          <SectionCard title="4 - שפה וניסוח" icon={MessageSquare} accent="border-amber-100 bg-amber-50/40">
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
                placeholder="למשל: פנייה בלשון רבים, טון נייטרלי..."
              />
            </FieldWithHint>
          </SectionCard>

          <SectionCard title="5 - הנחיות נוספות" icon={Lightbulb} accent="border-rose-100 bg-rose-50/40">
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
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleCopySummary()}
                  aria-label="העתק סיכום מהיר"
                >
                  {summaryCopyState === "copied" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {summaryCopyState === "copied"
                    ? "הועתק"
                    : summaryCopyState === "failed"
                      ? "העתקה נכשלה"
                      : "העתק סיכום"}
                </Button>
              </div>
              {summarySections.map((section) => (
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
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" className="px-5 text-sm">
                שמירה
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

function SectionCard({
  title,
  children,
  icon: Icon,
  accent,
}: {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  accent?: string;
}) {
  return (
    <div className={`space-y-3 rounded-xl border p-4 shadow-sm ${accent ?? "border-border bg-card"}`}>
      <div className="flex items-center gap-2 border-b border-inherit pb-1">
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-60" />}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="!select-text text-sm font-medium leading-snug">
        {label}
      </Label>
      {children}
    </div>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
};

function FieldWithHint({
  label,
  hint,
  examples,
  children,
}: {
  label: string;
  hint?: string;
  examples?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="!select-text text-sm font-medium leading-snug">
        {label}
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
  options,
  value,
  onChange,
  placeholderCustom,
  help,
  examples,
}: {
  label: string;
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
      <Label className="!select-text text-sm font-medium leading-snug">
        {label}
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
        <option value="">בחרו...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={CUSTOM}>אחר (הזנה חופשית)</option>
      </select>
      {(selectValue === CUSTOM || (!presetMatch && trimmed)) && (
        <Input
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
      <div className="select-text text-sm font-medium">{title}</div>
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
