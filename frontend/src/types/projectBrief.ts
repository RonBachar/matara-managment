/** @deprecated Legacy preset — migration only; new questionnaire uses free-text מטרה */
export const WEBSITE_GOAL_OPTIONS = [
  "לידים",
  "מכירות",
  "חשיפה",
  "הרשמה",
] as const;

/** סוג אתר — ברירות מחדל + ערכים נפוצים (ניתן גם "אחר") */
export const WEBSITE_TYPE_OPTIONS = [
  "דף נחיתה",
  "אתר תדמית",
  "אתר שירותים",
  "אתר קטלוג",
  "חנות אינטרנט",
  "חנות",
  "מערכת",
  "אתר אישי",
  "אתר טכני",
] as const;

export const MAIN_ACTION_SUGGESTIONS = [
  "השארת פרטים",
  "רכישה",
  "שיחה",
] as const;

export const TONE_SELECTION_OPTIONS = [
  "מקצועי",
  "ישיר",
  "נגיש",
  "יוקרתי",
  "חם",
  "סמכותי",
  "אנושי",
  "צעיר",
  "נקי",
  "אלגנטי",
  "בטוח בעצמו",
  "מרגיע",
  "אנרגטי",
  "מדויק",
  "ענייני",
  "ידידותי",
  "יוניסקסי",
  "יצירתי",
] as const;

export const LANGUAGE_STYLE_SELECTION_OPTIONS = [
  "קצר ותכליתי",
  "שיווקי",
  "בגובה העיניים",
  "פשוטה וברורה",
  "שיווקית",
  "עניינית",
  "קצרה ותכליתית",
  "מפורטת ומסבירה",
  "רשמית",
  "קלילה",
  "אלגנטית",
  "חכמה",
  "ממוקדת המרה",
  "מבוססת אמון",
  "מבוססת מומחיות",
  "רגשית",
  "תוצאתית",
] as const;

/**
 * Project specification — one document per project, aligned with the discovery questionnaire.
 */
export type ProjectBrief = {
  id: string;
  projectId: string;
  clientId: string;
  briefTitle: string;
  /** שם העסק (למסמך / ייצוא) */
  businessNameSnapshot: string;
  clientNameSnapshot: string;
  projectNameSnapshot?: string;
  createdAt: string;
  updatedAt: string;

  /** 1 — פרטי העסק */
  businessWhatTheyDo: string;
  servicesProductsOnSite: string;
  differentiators: string;

  /** 2 — קהל ומטרה */
  targetAudience: string;
  idealClient: string;
  audiencePainPoints: string;
  sitePrimaryBusinessGoal: string;
  mainUserAction: string;

  /** 3 — מבנה האתר */
  websiteType: string;
  sitePagesAndStructure: string;
  siteEmphasis: string;

  /** 4 — שפה וניסוח */
  toneSelections: string[];
  languageStyleSelections: string[];
  linguisticAddressing: string;

  /** 5 — הנחיות נוספות */
  contentAvoid: string;
  additionalNotes: string;

  gpt1Output?: string;
  gpt2Output?: string;
  gpt3Output?: string;
};

export type ProjectBriefInput = Omit<ProjectBrief, "id" | "createdAt" | "updatedAt">;

export function getBriefDisplayTitle(
  brief: Pick<ProjectBrief, "briefTitle" | "projectNameSnapshot">,
): string {
  const t = brief.projectNameSnapshot?.trim() || brief.briefTitle?.trim();
  return t || "ללא שם פרויקט";
}
