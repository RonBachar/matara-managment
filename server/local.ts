// Local dev only. In production the app is served by api/index.ts on Vercel.
import { app } from "./app";

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
