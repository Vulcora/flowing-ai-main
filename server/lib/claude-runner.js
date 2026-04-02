import { spawn } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { EventEmitter } from "events";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESOURCES = join(__dirname, "../..");
const BRIEF_TEMPLATE = join(RESOURCES, "pipeline/brief.md");

const CLAUDE_BIN = process.platform === "win32" ? "claude.cmd" : "claude";

export const pipelineEvents = new EventEmitter();

export function runGeneration(slug, companyName, branch, outputDir) {
  return new Promise((resolve, reject) => {
    const siteDir = join(outputDir, "site");
    if (!existsSync(siteDir)) mkdirSync(siteDir, { recursive: true });

    const logPath = join(outputDir, "pipeline.log");
    const log = (msg) => {
      const line = `[${new Date().toLocaleTimeString("sv-SE")}] ${msg}\n`;
      appendFileSync(logPath, line);
      pipelineEvents.emit(slug, line);
    };

    log(`Pipeline startad för ${companyName} (${branch.label})`);

    const palette = Object.entries(branch.palette)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const services = branch.dummyServices
      .map(s => `- ${s.namn}: ${s.pris}${s.tid ? ` (${s.tid})` : ""}`)
      .join("\n");

    const reviews = branch.dummyReviews
      .map(r => `- ${r.namn} (${r.betyg}★): "${r.text}"`)
      .join("\n");

    const images = branch.images
      .map((url, i) => `- Bild ${i + 1}: ${url}`)
      .join("\n");

    const template = readFileSync(BRIEF_TEMPLATE, "utf-8");
    const brief = template
      .replaceAll("$COMPANY_NAME", companyName)
      .replace("$BRANCH_LABEL", branch.label)
      .replace("$MOOD", branch.mood)
      .replace("$COLOR_PALETTE", palette)
      .replace("$FONT_HEADING", branch.fonts.heading)
      .replace("$FONT_BODY", branch.fonts.body)
      .replace("$HERO_IMAGE", branch.heroImage)
      .replace("$IMAGES", images)
      .replace("$SERVICES", services)
      .replace("$REVIEWS", reviews)
      .replace("$OUTPUT_DIR", outputDir);

    const briefPath = join(outputDir, "brief.md");
    writeFileSync(briefPath, brief);
    log("Brief skapad");

    const prompt = `Read and follow the brief at ${briefPath} exactly. Do not ask questions, just execute each step.`;

    const proc = spawn(CLAUDE_BIN, [
      "--dangerously-skip-permissions",
      "--bare",
      "-p", prompt,
      "--output-format", "stream-json",
    ], {
      env: process.env,
      cwd: outputDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let costUsd = 0;

    proc.stdout.on("data", d => {
      const chunk = d.toString();
      stdout += chunk;
      for (const line of chunk.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (msg.type === "assistant" && msg.message?.content) {
            for (const block of msg.message.content) {
              if (block.type === "tool_use") {
                log(`Använder ${block.name}...`);
              } else if (block.type === "text" && block.text?.length > 10) {
                log(block.text.slice(0, 150));
              }
            }
          } else if (msg.type === "result") {
            costUsd = msg.cost_usd || 0;
          }
        } catch {
          if (trimmed.length > 10) log(trimmed.slice(0, 150));
        }
      }
    });

    proc.stderr.on("data", d => { stderr += d.toString(); });

    proc.on("error", (err) => {
      log(`Spawn error: ${err.message}`);
      reject(err);
    });

    proc.on("close", code => {
      if (code === 0) {
        const siteExists = existsSync(join(siteDir, "index.html"));
        if (costUsd > 0) log(`Kostnad: $${costUsd.toFixed(4)}`);
        if (siteExists) {
          log("Hemsida genererad!");
        } else {
          log("Claude avslutades men ingen index.html skapades");
        }

        writeFileSync(join(outputDir, "cost.json"), JSON.stringify({
          costUsd,
          timestamp: new Date().toISOString(),
          company: companyName,
          branch: branch.label,
        }, null, 2));

        resolve({ ok: true, siteCreated: siteExists, costUsd });
      } else {
        const errMsg = (stderr || stdout).slice(0, 300);
        log(`Fel: ${errMsg}`);
        reject(new Error(errMsg));
      }
    });
  });
}
