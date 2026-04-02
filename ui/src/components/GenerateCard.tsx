import { useEffect, useRef, useState } from "react";
import { subscribeLogs, type Project } from "../lib/api";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export default function GenerateCard({ project }: { project: Project }) {
  const [logs, setLogs] = useState("");
  const [status, setStatus] = useState(project.status);
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (status !== "generating") return;
    const unsub = subscribeLogs(
      project.slug,
      (text) => setLogs((prev) => prev + text),
      (p) => setStatus(p.status)
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
          <p className="text-sm text-white/50">{project.branchKey}</p>
        </div>
        <div className="flex items-center gap-2">
          {status === "generating" && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
          {status === "done" && <CheckCircle className="w-5 h-5 text-green-400" />}
          {status === "error" && <XCircle className="w-5 h-5 text-red-400" />}
          <span className="text-sm capitalize">{status === "generating" ? "Genererar..." : status === "done" ? "Klar" : "Fel"}</span>
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
        <a
          href={`/output/${project.slug}/site/index.html`}
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium transition-colors"
        >
          Visa hemsida <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
