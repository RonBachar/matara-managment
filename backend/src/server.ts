import cors from "cors";
import express from "express";
import { projectsRouter } from "./routes/projects";
import { clientsRouter } from "./routes/clients";
import { clientServicesRouter } from "./routes/clientServices";
import { projectBriefsRouter } from "./routes/projectBriefs";
import { projectBriefGpt1Router } from "./routes/projectBriefGpt1";
import { projectBriefGpt2Router } from "./routes/projectBriefGpt2";
import { projectBriefGpt3Router } from "./routes/projectBriefGpt3";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/projects", projectsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api", clientServicesRouter);
app.use("/api/project-briefs", projectBriefsRouter);
app.use("/api/project-briefs", projectBriefGpt1Router);
app.use("/api/project-briefs", projectBriefGpt2Router);
app.use("/api/project-briefs", projectBriefGpt3Router);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
