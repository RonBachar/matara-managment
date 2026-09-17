// Vercel serverless entry. vercel.json rewrites /api/* here; Express sees the original URL.
import { app } from "../server/app";

export default app;
