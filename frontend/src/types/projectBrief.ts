export type ProjectBriefStatus = "טיוטה" | "הושלם";

export const PROJECT_BRIEF_STATUSES: ProjectBriefStatus[] = ["טיוטה", "הושלם"];

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

export type ProjectBrief = {
  id: string;
  projectId: string;
  clientId: string;
  projectNameSnapshot: string;
  clientNameSnapshot: string;
  status: ProjectBriefStatus;
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

export type ProjectBriefInput = Omit<
  ProjectBrief,
  | "id"
  | "projectId"
  | "clientId"
  | "projectNameSnapshot"
  | "clientNameSnapshot"
  | "createdAt"
  | "updatedAt"
>;

