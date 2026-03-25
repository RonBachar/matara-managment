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
import {
  Building2,
  FileText,
  LayoutPanelTop,
  Link2,
  Lock,
  Palette,
  Settings2,
  Users,
} from "lucide-react";

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
  websiteType: "",
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
          websiteType: initialBrief.websiteType ?? "",
          requiredPages: initialBrief.requiredPages ?? "",
          strategicDecisions: initialBrief.strategicDecisions ?? "",
          lockedFixedInput: initialBrief.lockedFixedInput ?? "",
          sourceMaterials: initialBrief.sourceMaterials ?? "",
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
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">
              {mode === "create" ? "בריף חדש" : "עריכת בריף"}
            </h3>
            <p className="text-xs text-muted-foreground">
              מסמך אפיון/אסטרטגיה: בסיס ל-UX, תוכן, ועיצוב — ובהמשך גם להזנה לתהליך AI.
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
            <SectionCard
              title="Project Control"
              subtitle="שליטה במסמך והגדרת מסגרת הפרויקט"
              icon={<Settings2 className="h-4 w-4 text-sky-700" />}
              accentClassName="border-sky-200 bg-sky-50/40"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="סטטוס בריף">
                  <Select
                    value={input.status}
                    onValueChange={(value) =>
                      update(
                        "status",
                        (value as ProjectBriefInput["status"]) ?? "טיוטה",
                      )
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

                <Field label="סוג האתר / סוג המוצר">
                  <Input
                    value={input.websiteType}
                    onChange={(e) => update("websiteType", e.target.value)}
                    placeholder='לדוגמה: אתר תדמית / דף נחיתה / חנות / פורטל / מיני-סייט'
                  />
                </Field>
              </div>

              <Field label="שירות מרכזי">
                <Input
                  value={input.mainService}
                  onChange={(e) => update("mainService", e.target.value)}
                  placeholder="מה בדיוק אנחנו מספקים? (לדוגמה: אתר תדמית + כתיבת תוכן בסיסית)"
                />
              </Field>

              <Field label="מטרת הפרויקט (במשפט אחד)">
                <Textarea
                  rows={3}
                  value={input.projectGoal}
                  onChange={(e) => update("projectGoal", e.target.value)}
                  placeholder="מה רוצים להשיג ומה ייחשב הצלחה? (למשל: להגדיל פניות איכותיות ולהציג מומחיות)"
                />
              </Field>

              <Field label="החלטות אסטרטגיות / קווים אדומים">
                <Textarea
                  rows={3}
                  value={input.strategicDecisions}
                  onChange={(e) => update("strategicDecisions", e.target.value)}
                  placeholder="דוגמאות: אין מחיר באתר | חייב CTA אחד ברור | מיקוד בשירות X בלבד"
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Business Summary"
              subtitle="תמונה ברורה של העסק וההצעה"
              icon={<Building2 className="h-4 w-4 text-emerald-700" />}
              accentClassName="border-emerald-200 bg-emerald-50/35"
            >
              <Field label="תיאור העסק (קצר וברור)">
                <Textarea
                  rows={3}
                  value={input.businessDescription}
                  onChange={(e) => update("businessDescription", e.target.value)}
                  placeholder="מי העסק, מה הוא עושה, ובשביל מי — בלי סלוגנים."
                />
              </Field>
              <Field label="בידול (מה שונה/ייחודי)">
                <Textarea
                  rows={3}
                  value={input.differentiators}
                  onChange={(e) => update("differentiators", e.target.value)}
                  placeholder="למה לבחור דווקא בהם? (תוצאה, תהליך, מומחיות, מהירות, שירות)"
                />
              </Field>
              <Field label="מסרים מרכזיים (3–7 נקודות)">
                <Textarea
                  rows={3}
                  value={input.keyMessages}
                  onChange={(e) => update("keyMessages", e.target.value)}
                  placeholder="לדוגמה: ניסיון | זמינות | אחריות | תוצאה מדידה | מומחיות בתחום"
                />
              </Field>
              <Field label="ביטויים/ניסוחים להימנע מהם">
                <Textarea
                  rows={2}
                  value={input.forbiddenPhrases}
                  onChange={(e) => update("forbiddenPhrases", e.target.value)}
                  placeholder='לדוגמה: "הכי טובים" | "מובילים בארץ" | קלישאות לא מבוססות'
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Audience and Strategy"
              subtitle="למי פונים ומה מניע את הפעולה"
              icon={<Users className="h-4 w-4 text-violet-700" />}
              accentClassName="border-violet-200 bg-violet-50/35"
            >
              <Field label="קהל יעד (ספציפי ככל האפשר)">
                <Textarea
                  rows={3}
                  value={input.targetAudience}
                  onChange={(e) => update("targetAudience", e.target.value)}
                  placeholder="תפקיד/ענף/גודל חברה/מיקום/מצב — מי בדיוק?"
                />
              </Field>
              <Field label="כאבים/חסמים של קהל היעד">
                <Textarea
                  rows={3}
                  value={input.audiencePainPoints}
                  onChange={(e) => update("audiencePainPoints", e.target.value)}
                  placeholder="מה מפחיד/מעכב/מבלבל אותם לפני שהם פונים?"
                />
              </Field>
              <Field label="פעולה מרכזית שהמשתמש צריך לבצע (CTA)">
                <Textarea
                  rows={2}
                  value={input.mainUserAction}
                  onChange={(e) => update("mainUserAction", e.target.value)}
                  placeholder='לדוגמה: "לתאם שיחה" | "להשאיר פרטים" | "לבקש הצעת מחיר"'
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="UX Structure"
              subtitle="מבנה האתר, עמודים, והנחיות שימוש"
              icon={<LayoutPanelTop className="h-4 w-4 text-amber-700" />}
              accentClassName="border-amber-200 bg-amber-50/35"
            >
              <Field label="עמודים/מסכים חובה (רשימה)">
                <Textarea
                  rows={3}
                  value={input.requiredPages}
                  onChange={(e) => update("requiredPages", e.target.value)}
                  placeholder="דוגמה:\n- בית\n- שירותים\n- אודות\n- תיק עבודות\n- צור קשר"
                />
              </Field>
              <Field label="סקשנים שחייבים להופיע (בעמודים השונים)">
                <Textarea
                  rows={3}
                  value={input.mustHaveSections}
                  onChange={(e) => update("mustHaveSections", e.target.value)}
                  placeholder="דוגמה:\n- הצעת ערך\n- יתרונות\n- תהליך עבודה\n- שאלות נפוצות\n- קריאה לפעולה"
                />
              </Field>
              <Field label="מידע קריטי מעל הקפל (Above the fold)">
                <Textarea
                  rows={2}
                  value={input.keyInfoAboveTheFold}
                  onChange={(e) => update("keyInfoAboveTheFold", e.target.value)}
                  placeholder="מה המשתמש חייב להבין ב-5 שניות הראשונות?"
                />
              </Field>
              <Field label="שאלות לקוח שחוזרות (FAQ ideas)">
                <Textarea
                  rows={3}
                  value={input.repeatedCustomerQuestions}
                  onChange={(e) => update("repeatedCustomerQuestions", e.target.value)}
                  placeholder="דוגמאות: מחיר? זמן תהליך? אחריות? מה כלול?"
                />
              </Field>
              <Field label="הערות UX">
                <Textarea
                  rows={3}
                  value={input.uxNotes}
                  onChange={(e) => update("uxNotes", e.target.value)}
                  placeholder="דגשים על זרימה, היררכיה, מיקרו-קופי, טפסים, ניווט…"
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Content Direction"
              subtitle="מסרים, טון, שפה וחומרי גלם"
              icon={<FileText className="h-4 w-4 text-slate-700" />}
              accentClassName="border-slate-200 bg-slate-50/35"
            >
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

              <Field label="הערות על תוכן קיים">
                <Textarea
                  rows={3}
                  value={input.existingContentNotes}
                  onChange={(e) => update("existingContentNotes", e.target.value)}
                  placeholder="מה כבר קיים? מה חסר? מה לא עובד?"
                />
              </Field>
              <Field label="הערות תוכן נוספות (תהליך, סדר, דגשים)">
                <Textarea
                  rows={3}
                  value={input.contentNotes}
                  onChange={(e) => update("contentNotes", e.target.value)}
                  placeholder="כותרות, הוכחות, סיפורים, הימנעויות, מבנה טקסטים…"
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Design Direction"
              subtitle="תחושה חזותית, צבעים, ורפרנסים"
              icon={<Palette className="h-4 w-4 text-pink-700" />}
              accentClassName="border-pink-200 bg-pink-50/30"
            >
              <Field label="תחושה חזותית רצויה">
                <Textarea
                  rows={3}
                  value={input.visualFeeling}
                  onChange={(e) => update("visualFeeling", e.target.value)}
                  placeholder="מילים שמתארות: נקי, פרימיום, טכנולוגי, חם, טבעי…"
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="צבעים מועדפים">
                  <Textarea
                    rows={2}
                    value={input.preferredColors}
                    onChange={(e) => update("preferredColors", e.target.value)}
                    placeholder="HEX/שמות/כיוון כללי"
                  />
                </Field>
                <Field label="צבעים להימנע">
                  <Textarea
                    rows={2}
                    value={input.unwantedColors}
                    onChange={(e) => update("unwantedColors", e.target.value)}
                    placeholder="מה לא מתאים למותג/לקהל"
                  />
                </Field>
              </div>
              <Field label="רפרנסים אהובים">
                <Textarea
                  rows={3}
                  value={input.likedReferences}
                  onChange={(e) => update("likedReferences", e.target.value)}
                  placeholder="הדבק לינקים + מה אהבת בכל אחד (מבנה/צבע/טיפוגרפיה)"
                />
              </Field>
              <Field label="רפרנסים שלא אהבתם">
                <Textarea
                  rows={3}
                  value={input.dislikedReferences}
                  onChange={(e) => update("dislikedReferences", e.target.value)}
                  placeholder="הדבק לינקים + מה לא עובד ולמה"
                />
              </Field>
              <Field label="הערות על סגנון עיצובי">
                <Textarea
                  rows={3}
                  value={input.designStyleNotes}
                  onChange={(e) => update("designStyleNotes", e.target.value)}
                  placeholder="גרידים, תמונות, אייקונים, כפתורים, תנועה, טיפוגרפיה…"
                />
              </Field>
              <Field label="הערות עיצוב נוספות">
                <Textarea
                  rows={3}
                  value={input.designNotes}
                  onChange={(e) => update("designNotes", e.target.value)}
                  placeholder="כל דבר שלא נכנס למעלה — העיקר שיהיה חד וברור."
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Locked / Fixed Input"
              subtitle="תכנים/החלטות שלא זזים (מונע חוסר עקביות בתוצרים)"
              icon={<Lock className="h-4 w-4 text-rose-700" />}
              accentClassName="border-rose-200 bg-rose-50/30"
            >
              <Field label="תכנים/אלמנטים שחייבים להופיע כפי שהם">
                <Textarea
                  rows={3}
                  value={input.lockedFixedInput}
                  onChange={(e) => update("lockedFixedInput", e.target.value)}
                  placeholder="דוגמה: רשימת שירותים קבועה | משפט משפטי | CTA קבוע | טלפון/וואטסאפ"
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Source Material / References"
              subtitle="לינקים, חומרים, קבצים, ותשתית לייצור מהיר"
              icon={<Link2 className="h-4 w-4 text-teal-700" />}
              accentClassName="border-teal-200 bg-teal-50/30"
            >
              <Field label="חומרי גלם (לינקים לקבצים/דרייב/מסמכים/תיק עבודות)">
                <Textarea
                  rows={3}
                  value={input.sourceMaterials}
                  onChange={(e) => update("sourceMaterials", e.target.value)}
                  placeholder="למשל: לינק ל-Google Drive | אתר קיים | PDFים | מצגות | כתבות"
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Final Summary"
              subtitle="קריאה מהירה לפני מעבר ל-wireframes / תוכן / AI"
              icon={<FileText className="h-4 w-4 text-indigo-700" />}
              accentClassName="border-indigo-200 bg-indigo-50/30"
            >
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                {buildProjectBriefSummary(summaryBrief).map((section) => (
                  <div key={section.title} className="space-y-1">
                    <div className="text-sm font-semibold">{section.title}</div>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <div key={item.label} className="text-xs text-muted-foreground">
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
            </SectionCard>
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
      </div>
    </section>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  accentClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  accentClassName: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border p-4",
        "shadow-sm shadow-black/0",
        accentClassName,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 rounded-md border border-border bg-background p-1.5">
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{title}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>
        </div>
      </div>
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
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
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

