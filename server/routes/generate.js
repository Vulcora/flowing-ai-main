import { Router } from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import { nanoid } from "nanoid";
import { runGeneration, pipelineEvents } from "../lib/claude-runner.js";
import { getBranch, listBranches } from "../lib/branches.js";
import { scrapeWebsite } from "../lib/scraper.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "../../output");

const router = Router();

const projects = new Map();

router.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "url required" });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    const result = await scrapeWebsite(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: `Scraping failed: ${err.message}` });
  }
});

router.get("/branches", (req, res) => {
  res.json(listBranches());
});

router.post("/", (req, res) => {
  const { companyName, branchKey, description, scrapedData, pages } = req.body;

  if (!companyName || !branchKey) {
    return res.status(400).json({ error: "companyName and branchKey required" });
  }

  const branch = getBranch(branchKey);
  if (!branch) {
    return res.status(400).json({ error: `Unknown branch: ${branchKey}` });
  }

  const isMultiPage = Array.isArray(pages) && pages.length > 1;
  const pageFiles = isMultiPage
    ? pages.map((p) => `${p.slug === "index" ? "index" : p.slug}.html`)
    : ["index.html"];

  const slug = `${companyName.toLowerCase().replace(/[^a-zåäö0-9]+/g, "-").replace(/-+$/, "")}-${nanoid(5)}`;
  const outputDir = join(OUTPUT, slug);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "pipeline.log"), "");

  projects.set(slug, {
    status: "generating",
    companyName,
    branchKey,
    description: description || "",
    isMultiPage,
    pages: pageFiles,
    currentPage: null,
  });

  res.json({ status: "generating", slug });

  runGeneration(slug, companyName, branch, outputDir, {
    description: description || "",
    scrapedData: scrapedData || null,
    pages: pages || [],
    isMultiPage,
    onPageStart: (pageName) => {
      const project = projects.get(slug);
      if (project) projects.set(slug, { ...project, currentPage: pageName });
    },
  })
    .then(() => {
      projects.set(slug, { ...projects.get(slug), status: "done", currentPage: null });
    })
    .catch((err) => {
      console.error("Pipeline error:", err.message);
      projects.set(slug, { ...projects.get(slug), status: "error", error: err.message });
    });
});

router.get("/:slug/status", (req, res) => {
  const project = projects.get(req.params.slug);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

router.get("/:slug/logs", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const slug = req.params.slug;
  const logPath = join(OUTPUT, slug, "pipeline.log");

  if (existsSync(logPath)) {
    const existing = readFileSync(logPath, "utf-8");
    if (existing) {
      res.write(`data: ${JSON.stringify({ type: "log", text: existing })}\n\n`);
    }
  }

  const onLog = (line) => {
    res.write(`data: ${JSON.stringify({ type: "log", text: line })}\n\n`);
  };
  pipelineEvents.on(slug, onLog);

  const statusInterval = setInterval(() => {
    const project = projects.get(slug);
    if (project) {
      res.write(`data: ${JSON.stringify({ type: "status", ...project })}\n\n`);
      if (project.status === "done" || project.status === "error") {
        clearInterval(statusInterval);
      }
    }
  }, 2000);

  req.on("close", () => {
    pipelineEvents.off(slug, onLog);
    clearInterval(statusInterval);
  });
});

router.get("/", (req, res) => {
  const list = Array.from(projects.entries()).map(([slug, data]) => ({ slug, ...data }));
  res.json(list);
});

export default router;
