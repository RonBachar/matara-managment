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

export const TONE_SELECTION_OPTIONS = [
  "מקצועי",
  "סמכותי",
  "אנושי וחם",
  "יוקרתי",
  "ישיר",
  "ידידותי",
  "צעיר ואנרגטי",
  "מרגיע ובטוח",
  "נקי ומינימלי",
] as const;

export const LANGUAGE_STYLE_SELECTION_OPTIONS = [
  "קצר ותכליתי",
  "מפורט ומסביר",
  "שיווקי",
  "רשמי",
  "בגובה העיניים",
  "ממוקד המרה",
  "מבוסס אמון",
  "רגשי",
] as const;

/** Standalone project brief document. */
export type ProjectBrief = {
  id: string;
  /** שם העסק (למסמך / ייצוא) */
  businessNameSnapshot: string;
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
  requestedPages: string;
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

export function getBriefDisplayTitle(brief: Pick<ProjectBrief, "businessNameSnapshot">): string {
  const t = brief.businessNameSnapshot?.trim();
  return t || "ללא שם";
}
