import { spawn } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { EventEmitter } from "events";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESOURCES = join(__dirname, "../..");
const BRIEF_SINGLE = join(RESOURCES, "pipeline/brief.md");
const BRIEF_DESIGN_SYSTEM = join(RESOURCES, "pipeline/brief-design-system.md");
const BRIEF_PAGE = join(RESOURCES, "pipeline/brief-page.md");

const CLAUDE_BIN = process.platform === "win32" ? "claude.cmd" : "claude";

export const pipelineEvents = new EventEmitter();

function createLogger(outputDir, slug) {
  const logPath = join(outputDir, "pipeline.log");
  return (msg) => {
    const line = `[${new Date().toLocaleTimeString("sv-SE")}] ${msg}\n`;
    appendFileSync(logPath, line);
    pipelineEvents.emit(slug, line);
  };
}

function fillBranchVars(template, companyName, branch) {
  const palette = Object.entries(branch.palette)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const services = branch.dummyServices
    .map((s) => `- ${s.namn}: ${s.pris}${s.tid ? ` (${s.tid})` : ""}`)
    .join("\n");

  const reviews = branch.dummyReviews
    .map((r) => `- ${r.namn} (${r.betyg}★): "${r.text}"`)
    .join("\n");

  const images = branch.images
    .map((url, i) => `- Bild ${i + 1}: ${url}`)
    .join("\n");

  return template
    .replaceAll("$COMPANY_NAME", companyName)
    .replace("$BRANCH_LABEL", branch.label)
    .replace("$MOOD", branch.mood)
    .replace("$COLOR_PALETTE", palette)
    .replace("$FONT_HEADING", branch.fonts.heading)
    .replace("$FONT_BODY", branch.fonts.body)
    .replace("$HERO_IMAGE", branch.heroImage)
    .replace("$IMAGES", images)
    .replace("$SERVICES", services)
    .replace("$REVIEWS", reviews);
}

function formatScrapedInfo(scrapedData) {
  if (!scrapedData) return "Ingen befintlig hemsida tillgänglig.";

  let info = `Startsida: ${scrapedData.mainPage.title}\n`;
  if (scrapedData.mainPage.description) {
    info += `Beskrivning: ${scrapedData.mainPage.description}\n`;
  }
  info += `\n${scrapedData.mainPage.content}\n`;

  for (const page of scrapedData.subPages) {
    info += `\n### ${page.title} (${page.url})\n${page.content}\n`;
  }

  return info;
}

function getPageTypeInstructions(slug, title) {
  const text = `${slug} ${title}`.toLowerCase();
  if (text.match(/index|hem|start/)) {
    return `Detta är startsidan. Inkludera:
- Hero-sektion med parallax bakgrundsbild, företagsnamn, tagline
- Kort introduktion/om oss
- Highlights av tjänster (kort med länk till tjänstesidan)
- Ett par recensioner
- CTA-sektion`;
  }
  if (text.match(/tjänst|service|behandling/)) {
    return `Detta är tjänstesidan. Inkludera:
- Alla tjänster i ett snyggt grid/lista-format med kort
- Priser och tider om tillgängligt
- CTA-knappar per tjänst`;
  }
  if (text.match(/om|about/)) {
    return `Detta är om-oss-sidan. Inkludera:
- Företagets historia och värderingar
- Team/personal-sektion om relevant
- Bildgalleri`;
  }
  if (text.match(/kontakt|contact/)) {
    return `Detta är kontaktsidan. Inkludera:
- Kontaktformulär (HTML-form, behöver ej fungera)
- Adress, telefon, e-post
- Öppettider
- Karta-placeholder (styled div)`;
  }
  if (text.match(/galler|portfölj|portfolio|referens|projekt/)) {
    return `Detta är galleri/portfolio-sidan. Inkludera:
- Bilder i asymmetrisk grid
- Beskrivningar/projektnamn
- Lightbox-effekt (CSS-only eller minimal JS)`;
  }
  if (text.match(/pris|price/)) {
    return `Detta är prissidan. Inkludera:
- Tydlig pristabell eller priskort
- Jämförelse av paket om relevant
- CTA-knappar`;
  }
  return `Skapa en innehållsrik sida med relevant information för "${title}". Använd sektioner, bilder och CTA-knappar.`;
}

function runClaude(prompt, cwd, log) {
  return new Promise((resolve, reject) => {
    const proc = spawn(CLAUDE_BIN, [
      "--dangerously-skip-permissions",
      "--bare",
      "-p", prompt,
      "--output-format", "stream-json",
    ], {
      env: process.env,
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let costUsd = 0;

    proc.stdout.on("data", (d) => {
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

    proc.stderr.on("data", (d) => { stderr += d.toString(); });
    proc.on("error", (err) => {
      log(`Spawn error: ${err.message}`);
      reject(err);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ costUsd });
      } else {
        const errMsg = (stderr || stdout).slice(0, 300);
        log(`Fel: ${errMsg}`);
        reject(new Error(errMsg));
      }
    });
  });
}

// ---- Single-page generation ----

async function runSinglePage(slug, companyName, branch, outputDir, options, log) {
  const siteDir = join(outputDir, "site");
  if (!existsSync(siteDir)) mkdirSync(siteDir, { recursive: true });

  const template = readFileSync(BRIEF_SINGLE, "utf-8");
  let brief = fillBranchVars(template, companyName, branch);
  brief = brief
    .replace("$DESCRIPTION", options.description || "Ingen beskrivning angiven.")
    .replace("$SCRAPED_INFO", formatScrapedInfo(options.scrapedData))
    .replace("$OUTPUT_DIR", outputDir);

  const briefPath = join(outputDir, "brief.md");
  writeFileSync(briefPath, brief);
  log("Brief skapad (single-page)");

  const prompt = `Read and follow the brief at ${briefPath} exactly. Do not ask questions, just execute each step.`;
  const result = await runClaude(prompt, outputDir, log);

  // Validate
  const indexPath = join(siteDir, "index.html");
  if (existsSync(indexPath)) {
    log("Validerar index.html...");
    const valPrompt = `Granska HTML-filen ${indexPath} noggrant. Kontrollera:
1. Att designen är responsiv (mobile-first)
2. Att det INTE finns placeholder-text (Lorem ipsum etc)
3. Att alla bilder har korrekta Unsplash-URL:er
4. Att sidan ser professionell ut

Om du hittar problem: FIXA dem direkt i filen. Om allt ser bra ut, skriv "VALIDATED".`;
    const valResult = await runClaude(valPrompt, outputDir, log);
    result.costUsd += valResult.costUsd;
    log("Validering klar");
  }

  return result;
}

// ---- Multi-page generation ----

async function runMultiPage(slug, companyName, branch, outputDir, options, log) {
  const siteDir = join(outputDir, "site");
  if (!existsSync(siteDir)) mkdirSync(siteDir, { recursive: true });

  const { pages, scrapedData, description } = options;

  // --- Step 1: Generate design system ---
  log("=== Steg 1: Genererar design-system ===");
  if (options.onPageStart) options.onPageStart("design-system");

  const dsTemplate = readFileSync(BRIEF_DESIGN_SYSTEM, "utf-8");
  let dsBrief = fillBranchVars(dsTemplate, companyName, branch);

  const pageList = pages.map((p) => `- ${p.title} (${p.slug === "index" ? "index.html" : p.slug + ".html"})`).join("\n");
  const navLinks = pages
    .map((p) => `${p.title} → ${p.slug === "index" ? "index.html" : p.slug + ".html"}`)
    .join(", ");

  dsBrief = dsBrief
    .replace("$DESCRIPTION", description || "Ingen beskrivning angiven.")
    .replace("$SCRAPED_INFO", formatScrapedInfo(scrapedData))
    .replace("$PAGE_LIST", pageList)
    .replace("$NAV_LINKS", navLinks)
    .replace("$OUTPUT_DIR", outputDir);

  const dsBriefPath = join(outputDir, "brief-design-system.md");
  writeFileSync(dsBriefPath, dsBrief);
  log("Design-system brief skapad");

  const dsPrompt = `Read and follow the brief at ${dsBriefPath} exactly. Do not ask questions, just execute each step.`;
  let totalCost = 0;
  const dsResult = await runClaude(dsPrompt, outputDir, log);
  totalCost += dsResult.costUsd;

  // Verify design system files exist
  const sharedCssPath = join(siteDir, "shared.css");
  const headerPath = join(siteDir, "header.html");
  const footerPath = join(siteDir, "footer.html");

  if (!existsSync(sharedCssPath)) throw new Error("shared.css was not created");
  if (!existsSync(headerPath)) throw new Error("header.html was not created");
  if (!existsSync(footerPath)) throw new Error("footer.html was not created");

  log("Design-system skapat: shared.css, header.html, footer.html");

  // Read design system for injection into page briefs
  const headerHtml = readFileSync(headerPath, "utf-8");
  const footerHtml = readFileSync(footerPath, "utf-8");

  // --- Step 2: Generate each page ---
  const pageTemplate = readFileSync(BRIEF_PAGE, "utf-8");

  for (const page of pages) {
    const fileName = page.slug === "index" ? "index.html" : `${page.slug}.html`;
    log(`=== Genererar sida: ${page.title} (${fileName}) ===`);
    if (options.onPageStart) options.onPageStart(page.title);

    // Find scraped content for this page
    let pageScrapedContent = "Ingen scrapad information för denna sida.";
    if (scrapedData) {
      if (page.slug === "index") {
        pageScrapedContent = scrapedData.mainPage.content || pageScrapedContent;
      } else {
        const match = scrapedData.subPages.find(
          (sp) => sp.slug === page.slug || sp.url.includes(page.slug)
        );
        if (match) pageScrapedContent = match.content;
      }
    }

    let pageBrief = fillBranchVars(pageTemplate, companyName, branch);
    pageBrief = pageBrief
      .replace("$PAGE_TITLE", page.title)
      .replaceAll("$PAGE_FILENAME", fileName)
      .replace("$HEADER_HTML", headerHtml)
      .replace("$FOOTER_HTML", footerHtml)
      .replace("$DESCRIPTION", description || "Ingen beskrivning angiven.")
      .replace("$PAGE_SCRAPED_CONTENT", pageScrapedContent)
      .replace("$PAGE_CONTEXT", page.context || "Inga extra instruktioner.")
      .replace("$PAGE_TYPE_INSTRUCTIONS", getPageTypeInstructions(page.slug, page.title))
      .replaceAll("$OUTPUT_DIR", outputDir);

    const pageBriefPath = join(outputDir, `brief-${page.slug}.md`);
    writeFileSync(pageBriefPath, pageBrief);

    const pagePrompt = `Read and follow the brief at ${pageBriefPath} exactly. Do not ask questions, just execute each step.`;
    const pageResult = await runClaude(pagePrompt, outputDir, log);
    totalCost += pageResult.costUsd;

    // Validate the generated page
    const pageFilePath = join(siteDir, fileName);
    if (existsSync(pageFilePath)) {
      log(`Validerar ${fileName}...`);
      const valPrompt = `Granska HTML-filen ${pageFilePath} noggrant. Kontrollera:
1. Att shared.css är länkad korrekt (<link rel="stylesheet" href="shared.css">)
2. Att header-navigationen finns och alla sidlänkar fungerar
3. Att footer finns
4. Att designen är responsiv (mobile-first)
5. Att det INTE finns placeholder-text (Lorem ipsum etc)
6. Att alla bilder har korrekta URL:er
7. Att sidan ser professionell och konsistent ut med design-systemet

Om du hittar problem: FIXA dem direkt i filen ${pageFilePath}.
När allt är perfekt, skriv exakt "VALIDATED".`;
      const valResult = await runClaude(valPrompt, outputDir, log);
      totalCost += valResult.costUsd;
      log(`Validering klar för ${fileName}`);
    } else {
      log(`VARNING: ${fileName} skapades inte!`);
    }
  }

  return { costUsd: totalCost };
}

// ---- Main entry point ----

export async function runGeneration(slug, companyName, branch, outputDir, options = {}) {
  const log = createLogger(outputDir, slug);
  const siteDir = join(outputDir, "site");
  if (!existsSync(siteDir)) mkdirSync(siteDir, { recursive: true });

  log(`Pipeline startad för ${companyName} (${branch.label})`);

  let result;
  if (options.isMultiPage && options.pages && options.pages.length > 1) {
    result = await runMultiPage(slug, companyName, branch, outputDir, options, log);
  } else {
    result = await runSinglePage(slug, companyName, branch, outputDir, options, log);
  }

  if (result.costUsd > 0) log(`Total kostnad: $${result.costUsd.toFixed(4)}`);

  const siteExists = existsSync(join(siteDir, "index.html"));
  if (siteExists) {
    log("Hemsida genererad!");
  } else {
    log("Pipeline avslutad men ingen index.html skapades");
  }

  writeFileSync(join(outputDir, "cost.json"), JSON.stringify({
    costUsd: result.costUsd,
    timestamp: new Date().toISOString(),
    company: companyName,
    branch: branch.label,
    isMultiPage: options.isMultiPage || false,
    pages: options.pages?.map((p) => p.title) || [],
  }, null, 2));

  return { ok: true, siteCreated: siteExists, costUsd: result.costUsd };
}
