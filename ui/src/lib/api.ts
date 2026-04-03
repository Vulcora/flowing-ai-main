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
