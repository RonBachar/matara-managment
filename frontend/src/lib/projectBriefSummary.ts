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
  return [
    {
      title: "1 — פרטי העסק",
      items: [
        { label: "שם העסק", value: toSummaryValue(brief.businessNameSnapshot) },
        {
          label: "מה העסק עושה בפועל",
          value: toSummaryValue(brief.businessWhatTheyDo),
        },
        {
          label: "שירותים / מוצרים באתר",
          value: toSummaryValue(brief.servicesProductsOnSite),
        },
        {
          label: "מה מבדל ממתחרים",
          value: toSummaryValue(brief.differentiators),
        },
      ],
    },
    {
      title: "2 — קהל ומטרה",
      items: [
        { label: "קהל יעד", value: toSummaryValue(brief.targetAudience) },
        { label: "לקוח אידיאלי", value: toSummaryValue(brief.idealClient) },
        {
          label: "בעיה / צורך מרכזי",
          value: toSummaryValue(brief.audiencePainPoints),
        },
        {
          label: "מטרה מרכזית של האתר",
          value: toSummaryValue(brief.sitePrimaryBusinessGoal),
        },
        {
          label: "פעולה מרכזית מהגולש",
          value: toSummaryValue(brief.mainUserAction),
        },
      ],
    },
    {
      title: "3 — מבנה האתר",
      items: [
        { label: "סוג אתר", value: toSummaryValue(brief.websiteType) },
        {
          label: "עמודים ומבנה",
          value: toSummaryValue(brief.sitePagesAndStructure),
        },
        {
          label: "מה להבליט",
          value: toSummaryValue(brief.siteEmphasis),
        },
      ],
    },
    {
      title: "4 — שפה וניסוח",
      items: [
        { label: "טון דיבור", value: listOrDash(brief.toneSelections) },
        {
          label: "סגנון כתיבה",
          value: listOrDash(brief.languageStyleSelections),
        },
        {
          label: "פנייה לגולשים",
          value: toSummaryValue(brief.linguisticAddressing),
        },
      ],
    },
    {
      title: "5 — הנחיות נוספות",
      items: [
        {
          label: "מה להימנע מלהציג",
          value: toSummaryValue(brief.contentAvoid),
        },
        {
          label: "הערות / השראה",
          value: toSummaryValue(brief.additionalNotes),
        },
      ],
    },
  ];
}
