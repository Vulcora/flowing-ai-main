import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import generateRouter from "./routes/generate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "../output");

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api/generate", generateRouter);
  app.use("/output", express.static(OUTPUT));

  // Serve built UI
  const uiDist = join(__dirname, "../ui/dist");
  app.use(express.static(uiDist));

  return app;
}
