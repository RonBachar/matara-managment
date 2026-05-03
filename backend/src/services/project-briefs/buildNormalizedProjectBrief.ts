type ProjectBriefRecord = Record<string, unknown>;

export type NormalizedProjectBrief = {
  briefId: string;
  title: string;
  business: {
    businessName: string;
    whatTheyDo: string;
    servicesOrProductsOnSite: string;
    differentiators: string;
  };
  audience: {
    targetAudience: string;
    idealClient: string;
    painPoints: string;
  };
  goals: {
    primaryBusinessGoal: string;
    mainUserAction: string;
  };
  structure: {
    websiteType: string;
    requestedPages: string;
    siteEmphasis: string;
  };
  toneAndLanguage: {
    toneSelections: string[];
    languageStyleSelections: string[];
    linguisticAddressing: string;
  };
  notes: {
    contentAvoid: string;
    additionalNotes: string;
  };
};

function asRecord(value: unknown): ProjectBriefRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as ProjectBriefRecord;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildNormalizedProjectBrief(args: {
  briefId: string;
  data: unknown;
}): NormalizedProjectBrief {
  const brief = asRecord(args.data);

  return {
    briefId: args.briefId,
    title: readString(brief.title),
    business: {
      businessName: readString(brief.businessNameSnapshot),
      whatTheyDo: readString(brief.businessWhatTheyDo),
      servicesOrProductsOnSite: readString(brief.servicesProductsOnSite),
      differentiators: readString(brief.differentiators),
    },
    audience: {
      targetAudience: readString(brief.targetAudience),
      idealClient: readString(brief.idealClient),
      painPoints: readString(brief.audiencePainPoints),
    },
    goals: {
      primaryBusinessGoal: readString(brief.sitePrimaryBusinessGoal),
      mainUserAction: readString(brief.mainUserAction),
    },
    structure: {
      websiteType: readString(brief.websiteType),
      requestedPages: readString(brief.requestedPages),
      siteEmphasis: readString(brief.siteEmphasis),
    },
    toneAndLanguage: {
      toneSelections: readStringArray(brief.toneSelections),
      languageStyleSelections: readStringArray(brief.languageStyleSelections),
      linguisticAddressing: readString(brief.linguisticAddressing),
    },
    notes: {
      contentAvoid: readString(brief.contentAvoid),
      additionalNotes: readString(brief.additionalNotes),
    },
  };
}
