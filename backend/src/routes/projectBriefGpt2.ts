import { Router } from "express";
import { runProjectBriefGpt2Flow } from "../services/project-briefs/gpt2/runProjectBriefGpt2Flow";

export const projectBriefGpt2Router = Router();

projectBriefGpt2Router.post("/:id/gpt2/content", async (req, res) => {
  try {
    const briefId = String(req.params.id ?? "").trim();
    if (!briefId) {
      return res.status(400).json({ error: "Missing brief id" });
    }

    const result = await runProjectBriefGpt2Flow(briefId);
    return res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.toLowerCase().includes("brief not found")) {
      return res.status(404).json({ error: "Brief not found" });
    }

    if (message.toLowerCase().includes("gpt 1 must be run first")) {
      return res.status(400).json({ error: message });
    }

    if (message.toLowerCase().includes("gpt 1 output")) {
      return res.status(400).json({ error: message });
    }

    return res.status(500).json({ error: message });
  }
});
