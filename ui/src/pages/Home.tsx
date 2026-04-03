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

            {/* Step 2: Page selection */}
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
