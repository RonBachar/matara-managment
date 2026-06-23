import cors from "cors";
import express from "express";
import { projectsRouter } from "./routes/projects";
import { clientsRouter } from "./routes/clients";
import { clientServicesRouter } from "./routes/clientServices";
import { leadsRouter } from "./routes/leads";
import { projectBriefsRouter } from "./routes/projectBriefs";
import { tasksRouter } from "./routes/tasks";
import { webhooksRouter } from "./routes/webhooks";
import { requireAuth } from "./middleware/auth";

const app = express();
const port = Number(process.env.PORT) || 3000;
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173"];

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/webhooks", webhooksRouter);

app.use("/api/projects", requireAuth, projectsRouter);
app.use("/api/clients", requireAuth, clientsRouter);
app.use("/api", requireAuth, clientServicesRouter);
app.use("/api/leads", requireAuth, leadsRouter);
app.use("/api/tasks", requireAuth, tasksRouter);
app.use("/api/project-briefs", requireAuth, projectBriefsRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
