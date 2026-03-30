import type { ProjectBrief } from "@/types/projectBrief";

type SummarySection = {
  title: string;
  items: Array<{ label: string; value: string }>;
};

function toSummaryValue(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "—";
}

function listOrDash(arr: string[] | undefined): string {
  if (!arr?.length) return "—";
  return arr.join(" | ");
}

export function buildProjectBriefSummary(brief: ProjectBrief): SummarySection[] {
  const sections: SummarySection[] = [
    {
      title: "פרטי מסמך ופרויקט",
      items: [
        { label: "כותרת הבריף", value: toSummaryValue(brief.briefTitle) },
        { label: "שם העסק", value: toSummaryValue(brief.businessNameSnapshot) },
        { label: "סוג אתר", value: toSummaryValue(brief.websiteType) },
        { label: "מטרת האתר", value: toSummaryValue(brief.websiteGoal) },
        { label: "פעולה מרכזית", value: toSummaryValue(brief.mainUserAction) },
      ],
    },
    {
      title: "קהל יעד",
      items: [
        { label: "מי קהל היעד", value: toSummaryValue(brief.targetAudience) },
        {
          label: "כאב מרכזי",
          value: toSummaryValue(brief.audiencePainPoints),
        },
        {
          label: "למה יבחרו בלקוח",
          value: toSummaryValue(brief.differentiators),
        },
      ],
    },
    {
      title: "שירותים והצעה",
      items: [
        {
          label: "מה העסק מציע",
          value: toSummaryValue(brief.businessDescription),
        },
        { label: "שירות מרכזי", value: toSummaryValue(brief.mainService) },
      ],
    },
    {
      title: "מבנה אתר",
      items: [
        {
          label: "מספר עמודים",
          value: brief.pageListAiSuggested
            ? "— (תן ל-AI להציע)"
            : toSummaryValue(brief.pageCount),
        },
        {
          label: "רשימת עמודים",
          value: brief.pageListAiSuggested
            ? "תן ל-AI להציע"
            : toSummaryValue(brief.requiredPages),
        },
      ],
    },
    {
      title: "טון וסגנון",
      items: [
        { label: "טון", value: listOrDash(brief.toneSelections) },
        {
          label: "סגנון שפה",
          value: listOrDash(brief.languageStyleSelections),
        },
      ],
    },
    {
      title: "הערות חשובות",
      items: [
        {
          label: "משהו חשוב לדעת",
          value: toSummaryValue(brief.contentNotes),
        },
      ],
    },
  ];

  const hasLegacy =
    brief.clientNameSnapshot?.trim() ||
    brief.projectGoal?.trim() ||
    brief.strategicDecisions?.trim() ||
    brief.mustHaveSections?.trim() ||
    brief.keyInfoAboveTheFold?.trim() ||
    brief.repeatedCustomerQuestions?.trim() ||
    brief.uxNotes?.trim() ||
    brief.keyMessages?.trim() ||
    brief.forbiddenPhrases?.trim() ||
    brief.existingContentNotes?.trim() ||
    brief.visualFeeling?.trim() ||
    brief.likedReferences?.trim() ||
    brief.dislikedReferences?.trim() ||
    brief.preferredColors?.trim() ||
    brief.unwantedColors?.trim() ||
    brief.designStyleNotes?.trim() ||
    brief.designNotes?.trim() ||
    brief.lockedFixedInput?.trim() ||
    brief.sourceMaterials?.trim();

  if (hasLegacy) {
    sections.push({
      title: "הרחבות (אופציונלי)",
      items: [
        {
          label: "שם לקוח",
          value: toSummaryValue(brief.clientNameSnapshot),
        },
        {
          label: "מטרת פרויקט (טקסט חופשי, ישן)",
          value: toSummaryValue(brief.projectGoal),
        },
        {
          label: "החלטות אסטרטגיות",
          value: toSummaryValue(brief.strategicDecisions),
        },
        {
          label: "סקשנים חובה / מעל הקפל / FAQ / UX",
          value: [
            brief.mustHaveSections,
            brief.keyInfoAboveTheFold,
            brief.repeatedCustomerQuestions,
            brief.uxNotes,
          ]
            .map((s) => s?.trim())
            .filter(Boolean)
            .join(" · ") || "—",
        },
        {
          label: "מסרים / ניסוחים / תוכן קיים",
          value: [
            brief.keyMessages,
            brief.forbiddenPhrases,
            brief.existingContentNotes,
          ]
            .map((s) => s?.trim())
            .filter(Boolean)
            .join(" · ") || "—",
        },
        {
          label: "כיוון עיצוב",
          value: [
            brief.visualFeeling,
            brief.preferredColors,
            brief.unwantedColors,
            brief.likedReferences,
            brief.dislikedReferences,
            brief.designStyleNotes,
            brief.designNotes,
          ]
            .map((s) => s?.trim())
            .filter(Boolean)
            .join(" · ") || "—",
        },
        {
          label: "תוכן נעול / חומרי מקור",
          value: [brief.lockedFixedInput, brief.sourceMaterials]
            .map((s) => s?.trim())
            .filter(Boolean)
            .join(" · ") || "—",
        },
      ],
    });
  }

  return sections;
}
