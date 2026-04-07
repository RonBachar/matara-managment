import { Router } from "express";
import { runProjectBriefGpt1Flow } from "../services/project-briefs/gpt1/runProjectBriefGpt1Flow";

export const projectBriefGpt1Router = Router();

projectBriefGpt1Router.post("/:id/gpt1/sitemap-wireframe", async (req, res) => {
  try {
    const briefId = String(req.params.id ?? "").trim();
    if (!briefId) {
      return res.status(400).json({ error: "Missing brief id" });
    }

    const result = await runProjectBriefGpt1Flow(briefId);
    return res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("brief not found")) {
      return res.status(404).json({ error: "Brief not found" });
    }
    return res.status(500).json({ error: message });
  }
});
