import type { ProjectBrief } from "@/types/projectBrief";

type SummarySection = {
  title: string;
  items: Array<{ label: string; value: string }>;
};

function toSummaryValue(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "—";
}

export function buildProjectBriefSummary(brief: ProjectBrief): SummarySection[] {
  return [
    {
      title: "פרטי המסמך",
      items: [
        { label: "שם האפיון", value: toSummaryValue(brief.briefTitle) },
        { label: "שם העסק", value: toSummaryValue(brief.businessNameSnapshot) },
        { label: "שם הלקוח", value: toSummaryValue(brief.clientNameSnapshot) },
      ],
    },
    {
      title: "מסגרת והחלטות",
      items: [
        { label: "סוג האתר", value: toSummaryValue(brief.websiteType) },
        { label: "שירות מרכזי", value: toSummaryValue(brief.mainService) },
        { label: "מטרת הפרויקט", value: toSummaryValue(brief.projectGoal) },
        {
          label: "החלטות אסטרטגיות",
          value: toSummaryValue(brief.strategicDecisions),
        },
      ],
    },
    {
      title: "מבנה UX",
      items: [
        { label: "עמודים חובה", value: toSummaryValue(brief.requiredPages) },
        { label: "קהל יעד", value: toSummaryValue(brief.targetAudience) },
        {
          label: "כאבים/חסמים של הקהל",
          value: toSummaryValue(brief.audiencePainPoints),
        },
        { label: "פעולה מרכזית", value: toSummaryValue(brief.mainUserAction) },
        { label: "סקשנים חובה", value: toSummaryValue(brief.mustHaveSections) },
        {
          label: "מה חובה מעל הקפל",
          value: toSummaryValue(brief.keyInfoAboveTheFold),
        },
        {
          label: "שאלות לקוחות שחוזרות",
          value: toSummaryValue(brief.repeatedCustomerQuestions),
        },
        { label: "הערות UX", value: toSummaryValue(brief.uxNotes) },
      ],
    },
    {
      title: "כיוון תוכן",
      items: [
        { label: "תיאור העסק", value: toSummaryValue(brief.businessDescription) },
        { label: "בידול", value: toSummaryValue(brief.differentiators) },
        { label: "מסרים מרכזיים", value: toSummaryValue(brief.keyMessages) },
        { label: "ביטויים להימנע", value: toSummaryValue(brief.forbiddenPhrases) },
        {
          label: "הערות תוכן קיים",
          value: toSummaryValue(brief.existingContentNotes),
        },
        {
          label: "טון",
          value:
            brief.toneSelections.length > 0
              ? brief.toneSelections.join(" | ")
              : "—",
        },
        {
          label: "סגנון שפה",
          value:
            brief.languageStyleSelections.length > 0
              ? brief.languageStyleSelections.join(" | ")
              : "—",
        },
        { label: "הערות תוכן", value: toSummaryValue(brief.contentNotes) },
      ],
    },
    {
      title: "כיוון עיצוב",
      items: [
        { label: "תחושה חזותית", value: toSummaryValue(brief.visualFeeling) },
        { label: "רפרנסים אהובים", value: toSummaryValue(brief.likedReferences) },
        {
          label: "רפרנסים לא רצויים",
          value: toSummaryValue(brief.dislikedReferences),
        },
        {
          label: "צבעים מועדפים",
          value: toSummaryValue(brief.preferredColors),
        },
        { label: "צבעים להימנע", value: toSummaryValue(brief.unwantedColors) },
        { label: "סגנון עיצובי", value: toSummaryValue(brief.designStyleNotes) },
        { label: "הערות עיצוב", value: toSummaryValue(brief.designNotes) },
      ],
    },
    {
      title: "Locked / Fixed Input",
      items: [
        {
          label: "תכנים/אלמנטים נעולים",
          value: toSummaryValue(brief.lockedFixedInput),
        },
      ],
    },
    {
      title: "מקורות וחומרים",
      items: [
        { label: "חומרי גלם/קישורים", value: toSummaryValue(brief.sourceMaterials) },
      ],
    },
  ];
}

