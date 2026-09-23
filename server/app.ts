import express from "express";
import { projectsRouter } from "./routes/projects";
import { clientsRouter } from "./routes/clients";
import { leadsRouter } from "./routes/leads";
import { tasksRouter } from "./routes/tasks";
import { quotesRouter } from "./routes/quotes";
import { webhooksRouter } from "./routes/webhooks";
import { requireAuth } from "./middleware/auth";

// No CORS: the API is served from the same origin as the UI
// (Vercel in production, the Vite proxy in development).
export const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/webhooks", webhooksRouter);

app.use("/api/projects", requireAuth, projectsRouter);
app.use("/api/clients", requireAuth, clientsRouter);
app.use("/api/leads", requireAuth, leadsRouter);
app.use("/api/tasks", requireAuth, tasksRouter);
app.use("/api/quotes", requireAuth, quotesRouter);
