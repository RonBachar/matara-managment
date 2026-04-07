import { Router } from "express";
import { runProjectBriefGpt3Flow } from "../services/project-briefs/gpt3/runProjectBriefGpt3Flow";

export const projectBriefGpt3Router = Router();

projectBriefGpt3Router.post("/:id/gpt3/wireframe-site", async (req, res) => {
  try {
    const briefId = String(req.params.id ?? "").trim();
    if (!briefId) {
      return res.status(400).json({ error: "Missing brief id" });
    }

    const result = await runProjectBriefGpt3Flow(briefId);
    return res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();

    if (lower.includes("brief not found")) {
      return res.status(404).json({ error: "Brief not found" });
    }

    if (
      lower.includes("gpt 1 must be run first") ||
      lower.includes("gpt 2 must be run first") ||
      lower.includes("outputjson is missing or invalid") ||
      lower.includes("page structure mismatch") ||
      lower.includes("section structure mismatch")
    ) {
      return res.status(400).json({ error: message });
    }

    return res.status(500).json({ error: message });
  }
});
