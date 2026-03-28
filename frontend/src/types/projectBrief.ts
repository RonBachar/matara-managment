export const TONE_SELECTION_OPTIONS = [
  "מקצועי",
  "חם",
  "נגיש",
  "יוקרתי",
  "ישיר",
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
  "פשוטה וברורה",
  "שיווקית",
  "עניינית",
  "קצרה ותכליתית",
  "מפורטת ומסבירה",
  "בגובה העיניים",
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
  requiredPages: string;
  strategicDecisions: string;
  lockedFixedInput: string;
  sourceMaterials: string;
  mainService: string;
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
