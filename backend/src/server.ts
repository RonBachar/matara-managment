import cors from "cors";
import express from "express";
import { projectsRouter } from "./routes/projects";

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

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
