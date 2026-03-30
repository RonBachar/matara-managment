/** מטרת האתר — ברירות מחדל לבריף הממוקד */
export const WEBSITE_GOAL_OPTIONS = [
  "לידים",
  "מכירות",
  "חשיפה",
  "הרשמה",
] as const;

/** סוג אתר — ברירות מחדל */
export const WEBSITE_TYPE_OPTIONS = [
  "אתר תדמית",
  "דף נחיתה",
  "חנות",
  "מערכת",
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
] as const;

export const LANGUAGE_STYLE_SELECTION_OPTIONS = [
  "קצר ותכליתי",
  "שיווקי",
  "בגובה העיניים",
] as const;

/**
 * Standalone specification document. Optional `projectId` / `clientId` for legacy or future linking.
 */
export type ProjectBrief = {
  id: string;
  /** Optional — legacy or future link to a project */
  projectId?: string;
  /** Optional — legacy or future link to a client */
  clientId?: string;
  /** שם האפיון — primary title for the document */
  briefTitle: string;
  /** שם העסק */
  businessNameSnapshot: string;
  /** שם הלקוח */
  clientNameSnapshot: string;
  /** @deprecated Legacy display field; migrated into `briefTitle` when missing */
  projectNameSnapshot?: string;
  createdAt: string;
  updatedAt: string;
  /** Website/product framing – GPT-ready inputs */
  websiteType: string;
  /** מטרת האתר (לידים / מכירות / …) — שדה מרכזי בבריף הממוקד */
  websiteGoal: string;
  /** מספר עמודים מתוכנן — שדה מובנה */
  pageCount: string;
  /** כשמסומן: רשימת עמודים מדויקת לא חובה; ניתן להציע ב-AI */
  pageListAiSuggested: boolean;
  requiredPages: string;
  strategicDecisions: string;
  lockedFixedInput: string;
  sourceMaterials: string;
  mainService: string;
  /** טקסט חופשי ישן (מטרת פרויקט מילולית); אופציונלי — תאימות לבריפים קודמים */
  projectGoal: string;
  targetAudience: string;
  audiencePainPoints: string;
  mainUserAction: string;
  mustHaveSections: string;
  keyInfoAboveTheFold: string;
  repeatedCustomerQuestions: string;
  uxNotes: string;
  businessDescription: string;
  differentiators: string;
  keyMessages: string;
  forbiddenPhrases: string;
  existingContentNotes: string;
  toneSelections: string[];
  languageStyleSelections: string[];
  contentNotes: string;
  visualFeeling: string;
  likedReferences: string;
  dislikedReferences: string;
  preferredColors: string;
  unwantedColors: string;
  designStyleNotes: string;
  designNotes: string;
  /** שמור לעתיד: פלט GPT 1 (למשל Sitemap) לאחר שזרימת השמירה תתווסף */
  gpt1Output?: string;
  /** שמור לעתיד: פלט GPT 2 */
  gpt2Output?: string;
  /** שמור לעתיד: פלט GPT 3 */
  gpt3Output?: string;
};

/** All brief fields except id and timestamps (used for create/edit form state + submit). */
export type ProjectBriefInput = Omit<ProjectBrief, "id" | "createdAt" | "updatedAt">;

/** Table / dialogs — prefer `briefTitle`, fall back to legacy `projectNameSnapshot`. */
export function getBriefDisplayTitle(
  brief: Pick<ProjectBrief, "briefTitle" | "projectNameSnapshot">,
): string {
  const t = brief.briefTitle?.trim() || brief.projectNameSnapshot?.trim();
  return t || "ללא כותרת";
}
