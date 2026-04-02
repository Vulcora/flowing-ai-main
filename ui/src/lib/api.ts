const BASE = "/api";

export interface Branch {
  key: string;
  label: string;
}

export interface Project {
  slug: string;
  status: "generating" | "done" | "error";
  companyName: string;
  branchKey: string;
  error?: string;
}

export async function fetchBranches(): Promise<Branch[]> {
  const res = await fetch(`${BASE}/generate/branches`);
  return res.json();
}

export async function startGeneration(companyName: string, branchKey: string): Promise<{ slug: string }> {
  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName, branchKey }),
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
