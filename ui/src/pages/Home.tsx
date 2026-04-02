import { useEffect, useState } from "react";
import { fetchBranches, startGeneration, listProjects, type Branch, type Project } from "../lib/api";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import GenerateCard from "../components/GenerateCard";

export default function Home() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [branchKey, setBranchKey] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches().then(setBranches);
    listProjects().then(setProjects);
  }, []);

  const handleGenerate = async () => {
    if (!companyName.trim() || !branchKey) {
      toast.error("Fyll i företagsnamn och välj bransch");
      return;
    }

    setLoading(true);
    try {
      const { slug } = await startGeneration(companyName.trim(), branchKey);
      const newProject: Project = { slug, companyName: companyName.trim(), branchKey, status: "generating" };
      setProjects((prev) => [newProject, ...prev]);
      setCompanyName("");
      toast.success("Generering startad!");
    } catch (err) {
      toast.error("Kunde inte starta generering");
    } finally {
      setLoading(false);
    }
  };

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

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Företagsnamn</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="t.ex. Salong Harmony"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-3 text-sm font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Startar..." : "Generera hemsida"}
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
