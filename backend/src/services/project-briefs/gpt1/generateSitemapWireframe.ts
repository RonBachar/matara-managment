import type { NormalizedProjectBrief } from "../buildNormalizedProjectBrief";

export type Gpt1SitemapWireframeResult = {
  provider: "stub";
  model: "gpt1-placeholder";
  generatedAt: string;
  summary: string;
  sitemap: Array<{
    pageName: string;
    purpose: string;
  }>;
  wireframe: Array<{
    pageName: string;
    sections: string[];
  }>;
  notes: string;
};

export async function generateSitemapWireframe(
  brief: NormalizedProjectBrief,
): Promise<Gpt1SitemapWireframeResult> {
  const displayProjectName = brief.projectName || brief.briefTitle || "Untitled Project";

  return {
    provider: "stub",
    model: "gpt1-placeholder",
    generatedAt: new Date().toISOString(),
    summary: `Stub GPT 1 result for ${displayProjectName}. Replace this service with a real model call later.`,
    sitemap: [
      {
        pageName: "Home",
        purpose: "Primary landing page for the project.",
      },
      {
        pageName: "About",
        purpose: "Present the business and build trust.",
      },
      {
        pageName: "Contact",
        purpose: "Drive the main user action.",
      },
    ],
    wireframe: [
      {
        pageName: "Home",
        sections: ["Hero", "Value Proposition", "Key Services", "Call To Action"],
      },
      {
        pageName: "About",
        sections: ["Intro", "Business Story", "Differentiators", "Trust Signals"],
      },
      {
        pageName: "Contact",
        sections: ["Contact Options", "Form", "FAQ", "Closing CTA"],
      },
    ],
    notes: "This is placeholder output saved through the backend pipeline flow.",
  };
}
