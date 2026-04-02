# Flowing AI Main — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Minimal-input website generator — pick a branch, type a company name, get a beautiful landing page with dummy data and curated stock photos.

**Architecture:** Express backend spawns Claude CLI to generate single-file HTML landing pages. React frontend with a simple form (branch dropdown + company name) and live generation progress. Branch-specific prompt templates include curated Unsplash URLs, dummy services/testimonials, and color palettes.

**Tech Stack:** Node.js/Express, React 19 + Vite + Tailwind v4 + shadcn, Claude CLI (`--output-format stream-json`)

---

## File Structure

```
flowing-ai-main/
├── package.json                    # Root: Express backend + scripts
├── bin/server.js                   # Entry point — starts Express on :1337
├── server/
│   ├── index.js                    # Express app factory
│   ├── lib/
│   │   ├── claude-runner.js        # Spawn Claude CLI, parse stream-json, track cost
│   │   └── branches.js            # Branch definitions (stock images, dummy data, palettes)
│   └── routes/
│       └── generate.js            # POST /api/generate, GET /api/generate/:slug/status, SSE logs
├── pipeline/
│   └── brief.md                   # Claude prompt template with placeholders
├── output/                        # Generated sites land here (output/{slug}/site/index.html)
├── ui/
│   ├── package.json               # Vite + React
│   ├── vite.config.ts
│   ├── index.html
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx               # React entry
│       ├── index.css              # Tailwind imports
│       ├── App.tsx                # Router: / and /preview/:slug
│       ├── lib/
│       │   └── api.ts             # API client (generate, status, logs)
│       ├── pages/
│       │   ├── Home.tsx           # Main form + generation list
│       │   └── Preview.tsx        # Iframe preview of generated site
│       └── components/
│           └── GenerateCard.tsx   # Status card with live log stream
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `ui/package.json`
- Create: `ui/vite.config.ts`
- Create: `ui/tsconfig.json`
- Create: `ui/index.html`
- Create: `ui/src/main.tsx`
- Create: `ui/src/index.css`
- Create: `ui/src/App.tsx`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "flowing-ai-main",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node bin/server.js",
    "build:ui": "cd ui && npm run build"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "nanoid": "^5.0.9"
  }
}
```

- [ ] **Step 2: Install backend deps**

Run: `npm install`
Expected: `node_modules/` created, lock file generated.

- [ ] **Step 3: Create UI package.json**

```json
{
  "name": "flowing-ai-main-ui",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",
    "lucide-react": "^0.469.0",
    "sonner": "^1.7.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

- [ ] **Step 4: Install UI deps**

Run: `cd ui && npm install`

- [ ] **Step 5: Create ui/vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:1337",
      "/output": "http://localhost:1337",
    },
  },
  build: {
    outDir: "dist",
  },
});
```

- [ ] **Step 6: Create ui/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Create ui/index.html**

```html
<!DOCTYPE html>
<html lang="sv">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flowing AI</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create ui/src/index.css**

```css
@import "tailwindcss";

body {
  font-family: "Inter", system-ui, sans-serif;
  background: #0a0a0a;
  color: #fafafa;
}
```

- [ ] **Step 9: Create ui/src/main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster theme="dark" richColors />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 10: Create ui/src/App.tsx (placeholder)**

```tsx
import { Routes, Route } from "react-router-dom";

function Home() {
  return <div className="p-8 text-center text-2xl">Flowing AI Main</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
```

- [ ] **Step 11: Verify UI starts**

Run: `cd ui && npx vite --port 5174`
Expected: Vite dev server at http://localhost:5174 shows "Flowing AI Main"

- [ ] **Step 12: Commit**

```bash
git init && git add -A && git commit -m "scaffold: project structure with Express + React/Vite/Tailwind"
```

---

### Task 2: Branch Definitions (Dummy Data & Stock Images)

**Files:**
- Create: `server/lib/branches.js`

- [ ] **Step 1: Create branches.js with industry definitions**

```javascript
// Each branch contains everything Claude needs to generate a realistic landing page
// with REAL Unsplash photo URLs (not placeholder), dummy services, testimonials, and color palette.

export const BRANCHES = {
  salon: {
    label: "Frisör / Salong",
    palette: {
      primary: "#2C5F40",
      secondary: "#DEB55A",
      accent: "#C8962B",
      background: "#FAF8F3",
      text: "#1A1A18",
    },
    fonts: {
      heading: "Cormorant Garamond",
      body: "Lato",
    },
    heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=80",
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80",
      "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80",
    ],
    dummyServices: [
      { namn: "Klippning dam", pris: "595 kr", tid: "60 min" },
      { namn: "Klippning herr", pris: "395 kr", tid: "30 min" },
      { namn: "Färgning hel", pris: "1 495 kr", tid: "120 min" },
      { namn: "Slingor", pris: "1 295 kr", tid: "90 min" },
      { namn: "Balayage", pris: "2 195 kr", tid: "150 min" },
      { namn: "Behandling & Inpackning", pris: "495 kr", tid: "45 min" },
    ],
    dummyReviews: [
      { namn: "Anna L.", betyg: 5, text: "Fantastisk salong! Min frisör lyssnade verkligen på vad jag ville ha. Bästa klippningen jag haft." },
      { namn: "Erik S.", betyg: 5, text: "Alltid lika nöjd. Proffsig personal och trevlig atmosfär." },
      { namn: "Maria K.", betyg: 4, text: "Riktigt bra balayage, exakt den tonen jag ville ha. Kommer tillbaka!" },
    ],
    mood: "Lyxig men välkomnande. Varm belysning, naturliga toner, guld-accenter.",
  },

  restaurant: {
    label: "Restaurang / Café",
    palette: {
      primary: "#1B1B1B",
      secondary: "#D4A574",
      accent: "#C0392B",
      background: "#FDF6EE",
      text: "#1B1B1B",
    },
    fonts: {
      heading: "Playfair Display",
      body: "Source Sans 3",
    },
    heroImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    ],
    dummyServices: [
      { namn: "Lunch buffé", pris: "145 kr", tid: "" },
      { namn: "Kvällsmeny 3 rätter", pris: "595 kr", tid: "" },
      { namn: "After Work-meny", pris: "195 kr", tid: "" },
      { namn: "Helgbrunch", pris: "295 kr", tid: "" },
      { namn: "Catering (per person)", pris: "395 kr", tid: "" },
      { namn: "Privat event", pris: "Offert", tid: "" },
    ],
    dummyReviews: [
      { namn: "Johan F.", betyg: 5, text: "Underbar mat och service. Pasta al tartufo var helt fantastisk!" },
      { namn: "Sara B.", betyg: 5, text: "Mysig atmosfär, perfekt för date night. Vi kommer definitivt tillbaka." },
      { namn: "Anders P.", betyg: 4, text: "Lunchbuffén är bäst i stan. Prisvärt och alltid färska råvaror." },
    ],
    mood: "Intim och sofistikerad. Mörka toner, varmt ljus, koppar-accenter.",
  },

  bygg: {
    label: "Bygg / Hantverkare",
    palette: {
      primary: "#1C3144",
      secondary: "#F2A541",
      accent: "#E85D04",
      background: "#F7F7F7",
      text: "#1C1C1C",
    },
    fonts: {
      heading: "Montserrat",
      body: "Open Sans",
    },
    heroImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
      "https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=800&q=80",
      "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?w=800&q=80",
      "https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&q=80",
    ],
    dummyServices: [
      { namn: "Renovering badrum", pris: "Offert", tid: "" },
      { namn: "Renovering kök", pris: "Offert", tid: "" },
      { namn: "Tillbyggnad", pris: "Offert", tid: "" },
      { namn: "Målning invändigt", pris: "Offert", tid: "" },
      { namn: "Altanbygge", pris: "Offert", tid: "" },
      { namn: "ROT-arbeten", pris: "Offert", tid: "" },
    ],
    dummyReviews: [
      { namn: "Magnus H.", betyg: 5, text: "Renoverade vårt badrum — fantastiskt resultat. Proffsiga, punktliga och städade efter sig." },
      { namn: "Lena W.", betyg: 5, text: "Byggde vår altan förra sommaren. Översteg alla förväntningar!" },
      { namn: "Peter G.", betyg: 4, text: "Bra kommunikation under hela projektet. Rekommenderas varmt." },
    ],
    mood: "Pålitlig och professionell. Starka kontraster, industrikänsla, action-bilder.",
  },

  halsa: {
    label: "Hälsa / Wellness / Spa",
    palette: {
      primary: "#4A6741",
      secondary: "#C4A882",
      accent: "#8B6F47",
      background: "#F9F6F1",
      text: "#2D2D2D",
    },
    fonts: {
      heading: "Cormorant Garamond",
      body: "Nunito",
    },
    heroImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80",
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&q=80",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80",
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
    ],
    dummyServices: [
      { namn: "Klassisk massage 60 min", pris: "795 kr", tid: "60 min" },
      { namn: "Hot stone massage", pris: "995 kr", tid: "75 min" },
      { namn: "Ansiktsbehandling", pris: "895 kr", tid: "60 min" },
      { namn: "Spa-paket Deluxe", pris: "1 995 kr", tid: "180 min" },
      { namn: "Zonterapi", pris: "695 kr", tid: "45 min" },
      { namn: "Par-massage", pris: "1 595 kr", tid: "60 min" },
    ],
    dummyReviews: [
      { namn: "Camilla R.", betyg: 5, text: "Helt underbar upplevelse. Kände mig som ny efteråt. Rekommenderar varmt!" },
      { namn: "David N.", betyg: 5, text: "Bästa massagen jag haft. Lugn miljö och otroligt kunnig personal." },
      { namn: "Frida J.", betyg: 4, text: "Spa-paketet var perfekt för en helgtreat. Kommer tillbaka snart!" },
    ],
    mood: "Lugn och harmonisk. Naturnära toner, mjuka former, zen-känsla.",
  },

  tandvard: {
    label: "Tandvård / Klinik",
    palette: {
      primary: "#0D4F8B",
      secondary: "#4ECDC4",
      accent: "#2196F3",
      background: "#FFFFFF",
      text: "#1A1A2E",
    },
    fonts: {
      heading: "Poppins",
      body: "Inter",
    },
    heroImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80",
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80",
      "https://images.unsplash.com/photo-1571772996211-2f02974a304a?w=800&q=80",
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
      "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80",
    ],
    dummyServices: [
      { namn: "Undersökning & rengöring", pris: "895 kr", tid: "45 min" },
      { namn: "Tandblekning", pris: "2 995 kr", tid: "60 min" },
      { namn: "Akut tandvård", pris: "Från 595 kr", tid: "30 min" },
      { namn: "Tandställning Invisalign", pris: "Offert", tid: "" },
      { namn: "Implantat", pris: "Offert", tid: "" },
      { namn: "Estetisk tandvård", pris: "Offert", tid: "" },
    ],
    dummyReviews: [
      { namn: "Henrik A.", betyg: 5, text: "Äntligen en tandläkare som tar sig tid att förklara. Helt smärtfritt!" },
      { namn: "Sofia M.", betyg: 5, text: "Blekningen blev fantastisk. Professionell klinik med modern utrustning." },
      { namn: "Oscar T.", betyg: 4, text: "Bra bemötande och snabb bokning. Rekommenderas till alla som är tandläkarrädda." },
    ],
    mood: "Ren, modern och trygg. Ljusa toner, blå accenter, klinisk precision.",
  },

  tradgard: {
    label: "Trädgård / Landskapsarkitektur",
    palette: {
      primary: "#2D5A27",
      secondary: "#8B7355",
      accent: "#E8A838",
      background: "#F5F5F0",
      text: "#2C2C2C",
    },
    fonts: {
      heading: "Libre Baskerville",
      body: "Karla",
    },
    heroImage: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1400&q=80",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
      "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80",
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&q=80",
      "https://images.unsplash.com/photo-1598902108854-d1446305a66e?w=800&q=80",
    ],
    dummyServices: [
      { namn: "Trädgårdsdesign", pris: "Offert", tid: "" },
      { namn: "Gräsmatta & sådd", pris: "Offert", tid: "" },
      { namn: "Häckklippning", pris: "Från 995 kr", tid: "" },
      { namn: "Stenläggning", pris: "Offert", tid: "" },
      { namn: "Trädgårdsskötsel (avtal)", pris: "Från 1 995 kr/mån", tid: "" },
      { namn: "Beskärning & trädfällning", pris: "Offert", tid: "" },
    ],
    dummyReviews: [
      { namn: "Karin B.", betyg: 5, text: "Förvandlade vår tråkiga gräsmatta till en dröm. Otroligt öga för design!" },
      { namn: "Thomas L.", betyg: 5, text: "Proffsig stenläggning. Snabbt, snyggt och till rimligt pris." },
      { namn: "Ingrid Ö.", betyg: 4, text: "Bra kommunikation och fint resultat. Rekommenderar deras trädgårdsskötselavtal." },
    ],
    mood: "Fräsch och naturlig. Gröna nyanser, jord-toner, utomhuskänsla.",
  },
};

export function getBranch(key) {
  return BRANCHES[key] || null;
}

export function listBranches() {
  return Object.entries(BRANCHES).map(([key, b]) => ({ key, label: b.label }));
}
```

- [ ] **Step 2: Commit**

```bash
git add server/lib/branches.js && git commit -m "feat: add branch definitions with stock images, dummy data, palettes"
```

---

### Task 3: Pipeline Brief Template

**Files:**
- Create: `pipeline/brief.md`

- [ ] **Step 1: Create the brief template**

```markdown
# Webbplatsgenerering — $COMPANY_NAME

Du ska skapa en komplett, professionell, snygg single-page hemsida för **$COMPANY_NAME**.

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

## Tjänster att visa
$SERVICES

## Kundrecensioner
$REVIEWS

## Instruktioner

Skapa filen `$OUTPUT_DIR/site/index.html` — EN enda HTML-fil med ALL CSS och JS inline.

### Obligatoriskt:
1. **Hero-sektion** med parallax bakgrundsbild, företagsnamn som stor rubrik, och en kort tagline
2. **Tjänster-sektion** med snygga kort (grid-layout)
3. **Om oss-sektion** med dummy-text som passar branschen (2-3 meningar)
4. **Galleri-sektion** med 3-4 bilder i asymmetrisk grid
5. **Recensioner-sektion** med kundomdömen
6. **Kontakt-sektion** med dummy-adress, telefon, öppettider
7. **Footer** med företagsnamn och "© 2026"
8. **Sticky header/nav** med smooth scroll till sektioner

### Design-krav:
- Mobile-first responsive design
- Smooth scroll-animationer (fade-in on scroll med IntersectionObserver)
- SVG wave-dividers eller diagonala sektionsdelare mellan minst 2 sektioner
- Hover-effekter på kort och knappar
- Google Fonts via CDN
- Alla bilder via de exakta Unsplash-URL:erna ovan
- Minst EN sektion med mörk bakgrund för kontrast
- CTA-knappar med tydlig hover-state
- Gradient-overlay på hero-bilden för textläsbarhet
- INGEN placeholder-text ("Lorem ipsum") — allt ska vara realistisk svensk text
- Sidan ska se ut som den är handgjord av en designer, INTE AI-genererad

### Förbjudet:
- Inga externa CSS/JS-filer
- Inga ramverk (Bootstrap, Tailwind CDN etc)
- Ingen placeholder/lorem ipsum text
- Inga brutna bilder — använd EXAKT de Unsplash-URL:er som anges ovan
```

- [ ] **Step 2: Commit**

```bash
git add pipeline/brief.md && git commit -m "feat: add Claude prompt template for website generation"
```

---

### Task 4: Claude Runner (Backend)

**Files:**
- Create: `server/lib/claude-runner.js`

- [ ] **Step 1: Create claude-runner.js**

```javascript
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

    // Build color palette string
    const palette = Object.entries(branch.palette)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    // Build services string
    const services = branch.dummyServices
      .map(s => `- ${s.namn}: ${s.pris}${s.tid ? ` (${s.tid})` : ""}`)
      .join("\n");

    // Build reviews string
    const reviews = branch.dummyReviews
      .map(r => `- ${r.namn} (${r.betyg}★): "${r.text}"`)
      .join("\n");

    // Build images string
    const images = branch.images
      .map((url, i) => `- Bild ${i + 1}: ${url}`)
      .join("\n");

    // Fill template
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

        // Save cost
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
```

- [ ] **Step 2: Commit**

```bash
git add server/lib/claude-runner.js && git commit -m "feat: add Claude CLI runner with cost tracking"
```

---

### Task 5: Express Server & API Routes

**Files:**
- Create: `bin/server.js`
- Create: `server/index.js`
- Create: `server/routes/generate.js`

- [ ] **Step 1: Create bin/server.js**

```javascript
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("\n  ✓ Starting Flowing AI Main...\n");

const { createApp } = await import("../server/index.js");
const app = createApp();
const port = process.env.PORT || 1337;

app.listen(port, "0.0.0.0", () => {
  console.log(`  ✓ Server ready at http://localhost:${port}\n`);
});
```

- [ ] **Step 2: Create server/index.js**

```javascript
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
```

- [ ] **Step 3: Create server/routes/generate.js**

```javascript
import { Router } from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import { nanoid } from "nanoid";
import { runGeneration, pipelineEvents } from "../lib/claude-runner.js";
import { getBranch, listBranches } from "../lib/branches.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "../../output");

const router = Router();

// In-memory project status tracking
const projects = new Map();

// List available branches
router.get("/branches", (req, res) => {
  res.json(listBranches());
});

// Start generation
router.post("/", (req, res) => {
  const { companyName, branchKey } = req.body;

  if (!companyName || !branchKey) {
    return res.status(400).json({ error: "companyName and branchKey required" });
  }

  const branch = getBranch(branchKey);
  if (!branch) {
    return res.status(400).json({ error: `Unknown branch: ${branchKey}` });
  }

  const slug = `${companyName.toLowerCase().replace(/[^a-zåäö0-9]+/g, "-").replace(/-+$/, "")}-${nanoid(5)}`;
  const outputDir = join(OUTPUT, slug);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "pipeline.log"), "");

  projects.set(slug, { status: "generating", companyName, branchKey });

  res.json({ status: "generating", slug });

  // Run pipeline in background
  runGeneration(slug, companyName, branch, outputDir)
    .then(() => {
      projects.set(slug, { ...projects.get(slug), status: "done" });
    })
    .catch((err) => {
      console.error("Pipeline error:", err.message);
      projects.set(slug, { ...projects.get(slug), status: "error", error: err.message });
    });
});

// Check status
router.get("/:slug/status", (req, res) => {
  const project = projects.get(req.params.slug);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

// SSE logs
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

// List all projects
router.get("/", (req, res) => {
  const list = Array.from(projects.entries()).map(([slug, data]) => ({ slug, ...data }));
  res.json(list);
});

export default router;
```

- [ ] **Step 4: Verify backend starts**

Run: `node bin/server.js`
Expected: `✓ Server ready at http://localhost:1337`

- [ ] **Step 5: Commit**

```bash
git add bin/ server/ && git commit -m "feat: add Express server with generate API, SSE logs, branch listing"
```

---

### Task 6: Frontend — API Client

**Files:**
- Create: `ui/src/lib/api.ts`

- [ ] **Step 1: Create api.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add ui/src/lib/api.ts && git commit -m "feat: add API client for generation, status, SSE logs"
```

---

### Task 7: Frontend — Home Page (Form + Generation List)

**Files:**
- Create: `ui/src/pages/Home.tsx`
- Create: `ui/src/components/GenerateCard.tsx`
- Modify: `ui/src/App.tsx`

- [ ] **Step 1: Create GenerateCard.tsx**

```tsx
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
```

- [ ] **Step 2: Create Home.tsx**

```tsx
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
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-blue-400">Flowing</span> AI
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Generation form */}
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

        {/* Projects list */}
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

- [ ] **Step 3: Update App.tsx with routes**

```tsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
```

- [ ] **Step 4: Verify full stack works**

Run (terminal 1): `node bin/server.js`
Run (terminal 2): `cd ui && npx vite --port 5174`

Open http://localhost:5174, select a branch, enter a company name, click "Generera hemsida".
Expected: Live logs stream in, site gets generated, "Visa hemsida" button appears when done.

- [ ] **Step 5: Commit**

```bash
git add ui/src/ && git commit -m "feat: add Home page with generation form, live log streaming, project cards"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - [x] Dropdown for branch selection → `branches.js` + `/api/generate/branches` + `<select>` in Home.tsx
   - [x] Company name input → text input in Home.tsx
   - [x] Dummy data per branch → `branches.js` with services, reviews, palette, images
   - [x] Stock images (Unsplash) → real URLs in `branches.js`
   - [x] Beautiful landing page → detailed `brief.md` template with design requirements
   - [x] Cost tracking → `claude-runner.js` extracts `cost_usd`
   - [x] Live progress → SSE logs + GenerateCard
   - [x] Preview result → link to `/output/{slug}/site/index.html`

2. **Placeholder scan:** No TBD, TODO, or "implement later" — all code is complete.

3. **Type consistency:** Branch type used consistently (`branch.palette`, `branch.fonts`, `branch.dummyServices`, etc). Slug format consistent across API and filesystem.
