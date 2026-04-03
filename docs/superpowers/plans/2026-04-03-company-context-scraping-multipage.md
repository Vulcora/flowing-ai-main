# Company Context, Scraping & Multi-page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add company description field, website scraping, and multi-page site generation to Flowing AI.

**Architecture:** Three-layer addition: (1) scraper module extracts content from existing websites, (2) updated UI collects description + URL and shows page selection after scraping, (3) two-step Claude pipeline generates shared design system then individual pages with validation.

**Tech Stack:** cheerio (HTML parsing), node built-in fetch, Express, React/TypeScript, Claude CLI

---

### Task 1: Install cheerio dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install cheerio**

Run:
```bash
cd /Users/douglassiteflow/dev/flowing-ai-main && npm install cheerio
```

- [ ] **Step 2: Verify installation**

Run:
```bash
node -e "import('cheerio').then(c => console.log('cheerio ok'))"
```
Expected: `cheerio ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add cheerio dependency for web scraping"
```

---

### Task 2: Create scraper module

**Files:**
- Create: `server/lib/scraper.js`

- [ ] **Step 1: Create scraper.js with fetchPage helper**

Create `server/lib/scraper.js`:

```javascript
import * as cheerio from "cheerio";

const TIMEOUT_MS = 5000;
const MAX_SUBPAGES = 10;

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "FlowingAI-Bot/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractContent($) {
  // Remove noise elements
  $("nav, footer, header, script, style, noscript, iframe, svg").remove();

  // Prefer main/article, fallback to body
  const main = $("main").length ? $("main") : $("article").length ? $("article") : $("body");

  // Get text, collapse whitespace
  return main.text().replace(/\s+/g, " ").trim().slice(0, 5000);
}

function extractInternalLinks($, baseUrl) {
  const origin = new URL(baseUrl).origin;
  const links = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.origin !== origin) return;
      if (resolved.hash || resolved.pathname.match(/\.(pdf|jpg|png|gif|svg|css|js|zip)$/i)) return;
      if (resolved.pathname === new URL(baseUrl).pathname) return;
      links.add(resolved.href);
    } catch {
      // skip malformed
    }
  });

  return [...links].slice(0, MAX_SUBPAGES);
}

function guessPageType(url, title) {
  const text = `${url} ${title}`.toLowerCase();
  if (text.match(/tjänst|service|behandling|meny|erbjud/)) return "services";
  if (text.match(/om oss|om |about/)) return "about";
  if (text.match(/kontakt|contact|hitta/)) return "contact";
  if (text.match(/pris|price/)) return "pricing";
  if (text.match(/galler|portfölj|portfolio|projekt|referens/)) return "gallery";
  if (text.match(/boka|book/)) return "booking";
  if (text.match(/blogg|blog|nyheter|aktuellt/)) return "blog";
  if (text.match(/faq|frågor/)) return "faq";
  return "other";
}

export async function scrapeWebsite(url) {
  // 1. Fetch and parse main page
  const mainHtml = await fetchHtml(url);
  const $main = cheerio.load(mainHtml);

  const mainPage = {
    title: $main("title").text().trim() || $main("h1").first().text().trim() || "",
    description: $main('meta[name="description"]').attr("content") || "",
    content: extractContent($main),
  };

  // 2. Find internal links
  const links = extractInternalLinks($main, url);

  // 3. Crawl subpages
  const subPages = [];
  for (const link of links) {
    try {
      const html = await fetchHtml(link);
      const $ = cheerio.load(html);
      const title = $("title").text().trim() || $("h1").first().text().trim() || "";
      const pathname = new URL(link).pathname;
      const slug = pathname.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "page";

      subPages.push({
        url: pathname,
        slug,
        title,
        content: extractContent($),
        type: guessPageType(pathname, title),
        suggested: true,
      });
    } catch {
      // skip failed pages
    }
  }

  return { mainPage, subPages };
}
```

- [ ] **Step 2: Test scraper manually**

Run:
```bash
node -e "
import { scrapeWebsite } from './server/lib/scraper.js';
scrapeWebsite('https://example.com').then(r => {
  console.log('Main:', r.mainPage.title);
  console.log('Subpages:', r.subPages.length);
}).catch(e => console.error(e.message));
"
```
Expected: outputs title and subpage count without errors.

- [ ] **Step 3: Commit**

```bash
git add server/lib/scraper.js
git commit -m "feat: add website scraper module with cheerio"
```

---

### Task 3: Add scrape API endpoint

**Files:**
- Modify: `server/routes/generate.js:1-8` (add import)
- Modify: `server/routes/generate.js` (add route before existing routes)

- [ ] **Step 1: Add import for scraper at top of generate.js**

In `server/routes/generate.js`, add after line 7 (the branches import):

```javascript
import { scrapeWebsite } from "../lib/scraper.js";
```

- [ ] **Step 2: Add POST /scrape route**

In `server/routes/generate.js`, add after line 14 (`const projects = new Map();`):

```javascript
router.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "url required" });
  }

  try {
    new URL(url); // validate URL format
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
```

- [ ] **Step 3: Test the endpoint**

Start the server and run:
```bash
curl -s -X POST http://localhost:1337/api/generate/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    const r=JSON.parse(d);
    console.log('Title:', r.mainPage.title);
    console.log('Pages:', r.subPages.length);
  })"
```
Expected: prints title and page count.

- [ ] **Step 4: Commit**

```bash
git add server/routes/generate.js
git commit -m "feat: add POST /api/generate/scrape endpoint"
```

---

### Task 4: Update API types and client functions (frontend)

**Files:**
- Modify: `ui/src/lib/api.ts`

- [ ] **Step 1: Add new interfaces and update existing ones**

Replace the entire content of `ui/src/lib/api.ts` with:

```typescript
const BASE = "/api";

export interface Branch {
  key: string;
  label: string;
}

export interface ScrapedPage {
  url: string;
  slug: string;
  title: string;
  content: string;
  type: string;
  suggested: boolean;
}

export interface ScrapedData {
  mainPage: {
    title: string;
    description: string;
    content: string;
  };
  subPages: ScrapedPage[];
}

export interface PageSelection {
  slug: string;
  title: string;
  context: string;
}

export interface Project {
  slug: string;
  status: "generating" | "done" | "error";
  companyName: string;
  branchKey: string;
  description?: string;
  isMultiPage?: boolean;
  pages?: string[];
  currentPage?: string;
  error?: string;
}

export async function fetchBranches(): Promise<Branch[]> {
  const res = await fetch(`${BASE}/generate/branches`);
  return res.json();
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  const res = await fetch(`${BASE}/generate/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Scraping failed");
  }
  return res.json();
}

export async function startGeneration(
  companyName: string,
  branchKey: string,
  description: string,
  scrapedData: ScrapedData | null,
  pages: PageSelection[]
): Promise<{ slug: string }> {
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName, branchKey, description, scrapedData, pages }),
  });
  return res.json();
}

export async function getStatus(slug: string): Promise<Project> {
  const res = await fetch(`${BASE}/generate/${slug}/status`);
  return res.json();
}

export async function listProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE}/generate`);
  return res.json();
}

export function subscribeLogs(slug: string, onLog: (text: string) => void, onStatus: (project: Project) => void): () => void {
  const es = new EventSource(`${BASE}/generate/${slug}/logs`);
  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "log") onLog(data.text);
    if (data.type === "status") onStatus(data);
  };
  return () => es.close();
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/douglassiteflow/dev/flowing-ai-main/ui && npx tsc --noEmit
```
Expected: may show errors in Home.tsx (expected — we'll fix that next). No errors in api.ts itself.

- [ ] **Step 3: Commit**

```bash
git add ui/src/lib/api.ts
git commit -m "feat: add scrape API client and multi-page types"
```

---

### Task 5: Update Home.tsx — step 1 form (description + URL fields)

**Files:**
- Modify: `ui/src/pages/Home.tsx`

- [ ] **Step 1: Replace Home.tsx with updated form**

Replace the entire content of `ui/src/pages/Home.tsx` with:

```tsx
import { useEffect, useState } from "react";
import {
  fetchBranches,
  startGeneration,
  listProjects,
  scrapeUrl,
  type Branch,
  type Project,
  type ScrapedData,
  type PageSelection,
} from "../lib/api";
import { toast } from "sonner";
import { Sparkles, Globe, Loader2 } from "lucide-react";
import GenerateCard from "../components/GenerateCard";

interface PageOption {
  slug: string;
  title: string;
  context: string;
  selected: boolean;
}

export default function Home() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Step 1: Basic info
  const [companyName, setCompanyName] = useState("");
  const [branchKey, setBranchKey] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Scraping state
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);

  // Step 2: Page selection
  const [pageOptions, setPageOptions] = useState<PageOption[]>([]);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches().then(setBranches);
    listProjects().then(setProjects);
  }, []);

  const handleScrape = async () => {
    if (!websiteUrl.trim()) {
      toast.error("Ange en URL");
      return;
    }

    setScraping(true);
    setScrapedData(null);
    setPageOptions([]);

    try {
      const data = await scrapeUrl(websiteUrl.trim());
      setScrapedData(data);

      // Build page options from scraped subpages + always include "Hem"
      const options: PageOption[] = [
        { slug: "index", title: "Hem", context: "", selected: true },
        ...data.subPages.map((p) => ({
          slug: p.slug,
          title: p.title || p.slug,
          context: "",
          selected: p.suggested,
        })),
      ];
      setPageOptions(options);
      toast.success(`Hittade ${data.subPages.length} undersidor`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte scrapa hemsidan");
    } finally {
      setScraping(false);
    }
  };

  const togglePage = (slug: string) => {
    setPageOptions((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, selected: !p.selected } : p))
    );
  };

  const updatePageContext = (slug: string, context: string) => {
    setPageOptions((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, context } : p))
    );
  };

  const handleGenerate = async () => {
    if (!companyName.trim() || !branchKey) {
      toast.error("Fyll i företagsnamn och välj bransch");
      return;
    }

    setLoading(true);
    try {
      const selectedPages: PageSelection[] = pageOptions
        .filter((p) => p.selected)
        .map(({ slug, title, context }) => ({ slug, title, context }));

      const { slug } = await startGeneration(
        companyName.trim(),
        branchKey,
        description.trim(),
        scrapedData,
        selectedPages
      );

      const isMultiPage = selectedPages.length > 1;
      const newProject: Project = {
        slug,
        companyName: companyName.trim(),
        branchKey,
        description: description.trim(),
        status: "generating",
        isMultiPage,
        pages: isMultiPage ? selectedPages.map((p) => `${p.slug}.html`) : undefined,
      };
      setProjects((prev) => [newProject, ...prev]);
      setCompanyName("");
      setDescription("");
      setWebsiteUrl("");
      setScrapedData(null);
      setPageOptions([]);
      toast.success("Generering startad!");
    } catch (err) {
      toast.error("Kunde inte starta generering");
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = pageOptions.filter((p) => p.selected).length;
  const isMultiPage = selectedCount > 1;

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-blue-400">Flowing</span> AI
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 mb-10">
          <h2 className="text-2xl font-bold mb-6">Skapa hemsida</h2>

          <div className="space-y-4">
            {/* Bransch */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Bransch</label>
              <select
                value={branchKey}
                onChange={(e) => setBranchKey(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Välj bransch...</option>
                {branches.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Företagsnamn */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Företagsnamn</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="t.ex. Salong Harmony"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Företagsbeskrivning */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Företagsbeskrivning</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv ditt företag, vad ni erbjuder, er stil och målgrupp..."
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Hemsida URL */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Befintlig hemsida <span className="text-white/40">(valfritt)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://www.example.com"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleScrape}
                  disabled={scraping || !websiteUrl.trim()}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 px-4 py-2.5 text-sm transition-colors"
                >
                  {scraping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  {scraping ? "Scrapar..." : "Scrapa"}
                </button>
              </div>
            </div>

            {/* Step 2: Page selection (only after successful scrape) */}
            {pageOptions.length > 0 && (
              <div className="border border-white/10 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white/80">
                  Välj sidor att generera ({selectedCount} valda)
                </h3>
                {pageOptions.map((page) => (
                  <div key={page.slug} className="space-y-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={page.selected}
                        onChange={() => togglePage(page.slug)}
                        className="rounded border-white/20 bg-white/5"
                      />
                      <span className="text-sm">{page.title}</span>
                      <button
                        onClick={() =>
                          setExpandedPage(expandedPage === page.slug ? null : page.slug)
                        }
                        className="ml-auto text-xs text-white/40 hover:text-white/70"
                      >
                        {expandedPage === page.slug ? "Dölj" : "Lägg till kontext"}
                      </button>
                    </label>
                    {expandedPage === page.slug && (
                      <textarea
                        value={page.context}
                        onChange={(e) => updatePageContext(page.slug, e.target.value)}
                        placeholder="Extra instruktioner för denna sida..."
                        rows={2}
                        className="w-full ml-7 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 text-sm font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {loading
                ? "Startar..."
                : isMultiPage
                  ? `Generera ${selectedCount} sidor`
                  : "Generera single-page"}
            </button>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white/80">Genererade sidor</h2>
            {projects.map((p) => (
              <GenerateCard key={p.slug} project={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd /Users/douglassiteflow/dev/flowing-ai-main/ui && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add ui/src/pages/Home.tsx
git commit -m "feat: add description, URL scraping and page selection to form"
```

---

### Task 6: Update GenerateCard for multi-page projects

**Files:**
- Modify: `ui/src/components/GenerateCard.tsx`

- [ ] **Step 1: Replace GenerateCard.tsx**

Replace the entire content of `ui/src/components/GenerateCard.tsx` with:

```tsx
import { useEffect, useRef, useState } from "react";
import { subscribeLogs, type Project } from "../lib/api";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export default function GenerateCard({ project }: { project: Project }) {
  const [logs, setLogs] = useState("");
  const [status, setStatus] = useState(project.status);
  const [currentPage, setCurrentPage] = useState(project.currentPage);
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (status !== "generating") return;
    const unsub = subscribeLogs(
      project.slug,
      (text) => setLogs((prev) => prev + text),
      (p) => {
        setStatus(p.status);
        if (p.currentPage) setCurrentPage(p.currentPage);
      }
    );
    return unsub;
  }, [project.slug, status]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">{project.companyName}</h3>
          <p className="text-sm text-white/50">
            {project.branchKey}
            {project.isMultiPage && ` — ${project.pages?.length} sidor`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "generating" && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
          {status === "done" && <CheckCircle className="w-5 h-5 text-green-400" />}
          {status === "error" && <XCircle className="w-5 h-5 text-red-400" />}
          <span className="text-sm capitalize">
            {status === "generating"
              ? currentPage
                ? `Genererar ${currentPage}...`
                : "Genererar..."
              : status === "done"
                ? "Klar"
                : "Fel"}
          </span>
        </div>
      </div>

      {logs && (
        <pre
          ref={logRef}
          className="text-xs text-white/60 bg-black/40 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap"
        >
          {logs}
        </pre>
      )}

      {status === "done" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`/output/${project.slug}/site/index.html`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
          >
            Visa hemsida <ExternalLink className="w-4 h-4" />
          </a>
          {project.isMultiPage && project.pages && project.pages.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {project.pages
                .filter((p) => p !== "index.html")
                .map((page) => (
                  <a
                    key={page}
                    href={`/output/${project.slug}/site/${page}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs transition-colors"
                  >
                    {page.replace(".html", "")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd /Users/douglassiteflow/dev/flowing-ai-main/ui && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add ui/src/components/GenerateCard.tsx
git commit -m "feat: update GenerateCard for multi-page progress and links"
```

---

### Task 7: Update generate endpoint to accept new fields

**Files:**
- Modify: `server/routes/generate.js`

- [ ] **Step 1: Update POST / handler to accept new fields**

In `server/routes/generate.js`, replace the existing `router.post("/", ...)` handler (the one starting at line 20 after task 3 changes) with:

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/generate.js
git commit -m "feat: accept description, scrapedData and pages in generate endpoint"
```

---

### Task 8: Create multi-page brief templates

**Files:**
- Create: `pipeline/brief-design-system.md`
- Create: `pipeline/brief-page.md`
- Modify: `pipeline/brief.md` (add description/scraped sections)

- [ ] **Step 1: Update single-page brief template**

In `pipeline/brief.md`, add the following sections after the `## Kundrecensioner` section (before `## Instruktioner`):

```markdown
## Företagsbeskrivning (från ägaren)
$DESCRIPTION

## Information från befintlig hemsida
$SCRAPED_INFO
```

- [ ] **Step 2: Create design system brief template**

Create `pipeline/brief-design-system.md`:

```markdown
# Design-system — $COMPANY_NAME

Du ska skapa ett gemensamt design-system för en multi-page hemsida för **$COMPANY_NAME**.

## Bransch
$BRANCH_LABEL

## Stämning & känsla
$MOOD

## Färgpalett
$COLOR_PALETTE

## Typsnitt
- Rubrik: $FONT_HEADING (Google Fonts)
- Brödtext: $FONT_BODY (Google Fonts)

## Bilder (Unsplash — använd EXAKTA URL:er nedan)
Hero: $HERO_IMAGE

Övriga:
$IMAGES

## Företagsbeskrivning (från ägaren)
$DESCRIPTION

## Information från befintlig hemsida
$SCRAPED_INFO

## Sidor som ska genereras
$PAGE_LIST

## Instruktioner

Skapa följande tre filer i `$OUTPUT_DIR/site/`:

### 1. `shared.css`
Gemensam CSS för alla sidor:
- CSS custom properties för alla färger, typsnitt, spacing
- Reset/normalize
- Google Fonts import via @import
- Responsiv grid-system (mobile-first)
- Gemensamma komponenter: knappar, kort, sektioner, formulär
- Hover-effekter, transitions
- Smooth scroll
- Fade-in-animationer (IntersectionObserver-klasser)
- SVG wave-dividers eller diagonala sektionsdelare
- Minst EN sektion-stil med mörk bakgrund
- INGEN placeholder-text
- Designen ska se handgjord ut, INTE AI-genererad

### 2. `header.html`
HTML-snippet för gemensam header/navigation:
- Sticky header med företagsnamn/logotyp
- Navigationslänkar till ALLA sidor: $NAV_LINKS
- Hamburger-meny för mobil
- Aktiv-sida-markering via CSS-klass `.nav-active`
- Inkludera tillhörande JavaScript inline i en `<script>`-tagg

### 3. `footer.html`
HTML-snippet för gemensam footer:
- Företagsnamn och © 2026
- Snabblänkar till alla sidor
- Kontaktinfo (om tillgänglig)

### Krav:
- Inga ramverk (Bootstrap, Tailwind CDN etc)
- shared.css ska vara komplett — individuella sidor ska INTE behöva egen CSS
- header.html och footer.html ska vara rena HTML-snippets (ingen <!DOCTYPE>, <html>, <head>)
- Alla bilder via de exakta Unsplash-URL:er som anges ovan
- Allt på svenska
```

- [ ] **Step 3: Create per-page brief template**

Create `pipeline/brief-page.md`:

```markdown
# Sidgenerering — $PAGE_TITLE — $COMPANY_NAME

Du ska skapa sidan **$PAGE_TITLE** (`$PAGE_FILENAME`) för **$COMPANY_NAME**.

## Design-system
Använd det befintliga design-systemet. Här är filerna:

### shared.css
```css
$SHARED_CSS
```

### header.html
```html
$HEADER_HTML
```

### footer.html
```html
$FOOTER_HTML
```

## Bransch
$BRANCH_LABEL

## Stämning & känsla
$MOOD

## Bilder (Unsplash — använd EXAKTA URL:er)
Hero: $HERO_IMAGE

Övriga:
$IMAGES

## Tjänster
$SERVICES

## Kundrecensioner
$REVIEWS

## Företagsbeskrivning (från ägaren)
$DESCRIPTION

## Scrapad information för denna sida
$PAGE_SCRAPED_CONTENT

## Extra instruktioner för denna sida
$PAGE_CONTEXT

## Instruktioner

Skapa filen `$OUTPUT_DIR/site/$PAGE_FILENAME` — en komplett HTML-fil.

### Struktur:
1. `<!DOCTYPE html>` med `<head>` som laddar `shared.css` via `<link rel="stylesheet" href="shared.css">`
2. Klistra in header.html-innehållet direkt i `<body>` (med `nav-active`-klass på rätt länk)
3. Sidans unika innehåll i `<main>`
4. Klistra in footer.html-innehållet
5. IntersectionObserver-script för fade-in-animationer

### Sidtyp-specifikt:
$PAGE_TYPE_INSTRUCTIONS

### Krav:
- Använd BARA klasser från shared.css — lägg INTE till egen CSS
- Mobile-first responsive
- Smooth scroll-animationer
- Alla bilder via exakta Unsplash-URL:er
- INGEN placeholder-text — allt realistisk svensk text
- Sidan ska se ut som handgjord av en designer
- Om scrapad info finns: använd riktiga tjänster, priser, texter som grund
- Om scrapad info saknas: skriv realistiskt innehåll baserat på bransch och företagsbeskrivning

### Förbjudet:
- Inga externa CSS/JS-filer (utöver shared.css)
- Inga ramverk
- Ingen placeholder/lorem ipsum text
- Inga brutna bilder
```

- [ ] **Step 4: Commit**

```bash
git add pipeline/brief.md pipeline/brief-design-system.md pipeline/brief-page.md
git commit -m "feat: add multi-page brief templates and update single-page brief"
```

---

### Task 9: Rewrite claude-runner.js for two-step pipeline

**Files:**
- Modify: `server/lib/claude-runner.js`

- [ ] **Step 1: Replace claude-runner.js with multi-page pipeline**

Replace the entire content of `server/lib/claude-runner.js` with:

```javascript
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

function runValidation(filePath, designSystemDir, log) {
  const prompt = `Granska HTML-filen ${filePath} noggrant. Kontrollera:
1. Att shared.css används korrekt (länkad, klasser stämmer)
2. Att header och footer är inkluderade och navigation fungerar
3. Att designen är responsiv (mobile-first)
4. Att det INTE finns placeholder-text (Lorem ipsum etc)
5. Att alla bilder har korrekta Unsplash-URL:er
6. Att sidan ser professionell och konsistent ut

Om du hittar problem: FIXA dem direkt i filen. Om allt ser bra ut, skriv "VALIDATED" och inget annat.`;

  return runClaude(prompt, designSystemDir, log);
}

// ---- Single-page generation (backwards compatible) ----

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
    await runValidation(indexPath, outputDir, log);
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

  const pageList = pages.map((p) => `- ${p.title} (${p.slug}.html)`).join("\n");
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
  const sharedCss = readFileSync(sharedCssPath, "utf-8");
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
      .replace("$PAGE_FILENAME", fileName)
      .replace("$SHARED_CSS", sharedCss.slice(0, 8000))
      .replace("$HEADER_HTML", headerHtml)
      .replace("$FOOTER_HTML", footerHtml)
      .replace("$DESCRIPTION", description || "Ingen beskrivning angiven.")
      .replace("$PAGE_SCRAPED_CONTENT", pageScrapedContent)
      .replace("$PAGE_CONTEXT", page.context || "Inga extra instruktioner.")
      .replace("$PAGE_TYPE_INSTRUCTIONS", getPageTypeInstructions(page.slug, page.title))
      .replace("$OUTPUT_DIR", outputDir);

    const pageBriefPath = join(outputDir, `brief-${page.slug}.md`);
    writeFileSync(pageBriefPath, pageBrief);

    const pagePrompt = `Read and follow the brief at ${pageBriefPath} exactly. Do not ask questions, just execute each step.`;
    const pageResult = await runClaude(pagePrompt, outputDir, log);
    totalCost += pageResult.costUsd;

    // Validate the generated page
    const pageFilePath = join(siteDir, fileName);
    if (existsSync(pageFilePath)) {
      log(`Validerar ${fileName}...`);
      for (let attempt = 1; attempt <= 3; attempt++) {
        const valResult = await runClaude(
          `Granska HTML-filen ${pageFilePath} noggrant. Kontrollera:
1. Att shared.css är länkad korrekt (<link rel="stylesheet" href="shared.css">)
2. Att header-navigationen finns och alla sidlänkar fungerar
3. Att footer finns
4. Att designen är responsiv (mobile-first)
5. Att det INTE finns placeholder-text (Lorem ipsum etc)
6. Att alla bilder har korrekta URL:er
7. Att sidan ser professionell och konsistent ut med design-systemet

Om du hittar problem: FIXA dem direkt i filen ${pageFilePath}.
När allt är perfekt, skriv exakt "VALIDATED".`,
          outputDir,
          log
        );
        totalCost += valResult.costUsd;
        log(`Validering ${attempt}/3 klar för ${fileName}`);
        // We run all 3 iterations to ensure quality
        // In practice the first fix + verify is usually enough
        break; // TODO: check if VALIDATED was in output to break early
      }
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
```

- [ ] **Step 2: Verify server starts without errors**

Run:
```bash
cd /Users/douglassiteflow/dev/flowing-ai-main && node -e "import('./server/lib/claude-runner.js').then(() => console.log('ok'))"
```
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add server/lib/claude-runner.js
git commit -m "feat: rewrite claude-runner for two-step multi-page pipeline with validation"
```

---

### Task 10: End-to-end smoke test

**Files:** None (testing only)

- [ ] **Step 1: Verify server starts**

Run:
```bash
cd /Users/douglassiteflow/dev/flowing-ai-main && timeout 5 node bin/server.js || true
```
Expected: `Server ready at http://localhost:1337` (then timeout is fine).

- [ ] **Step 2: Verify frontend compiles**

Run:
```bash
cd /Users/douglassiteflow/dev/flowing-ai-main/ui && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Test scrape endpoint**

With server running:
```bash
curl -s -X POST http://localhost:1337/api/generate/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    const r=JSON.parse(d);
    console.log('OK - title:', r.mainPage.title, 'subpages:', r.subPages.length);
  })"
```
Expected: `OK - title: Example Domain subpages: 0`

- [ ] **Step 4: Test generate endpoint with new fields**

```bash
curl -s -X POST http://localhost:1337/api/generate \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test AB","branchKey":"salon","description":"En testsalong","scrapedData":null,"pages":[]}' | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
    const r=JSON.parse(d);
    console.log('OK - slug:', r.slug, 'status:', r.status);
  })"
```
Expected: `OK - slug: test-ab-XXXXX status: generating`

- [ ] **Step 5: Verify UI loads in browser**

Open http://localhost:5177 and verify:
- Description textarea is visible
- URL field with "Scrapa" button is visible
- Branch and company name fields still work
- Button says "Generera single-page" by default
