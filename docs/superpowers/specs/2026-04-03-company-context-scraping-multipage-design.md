# Design: Företagsbeskrivning, Webbscraping & Multi-page

**Datum:** 2026-04-03
**Status:** Godkänd

## Sammanfattning

Utöka Flowing AI med tre nya förmågor:

1. **Fritextbeskrivning av företaget** — extra kontext som styr tonalitet och innehåll
2. **Webbscraping** — hämta info från befintlig hemsida (tjänster, undersidor, kontaktinfo)
3. **Multi-page generering** — skapa hela sajter med flera sidor och delat designsystem

## UI-flöde

### Steg 1: Grundinfo (utökat formulär)

- **Företagsnamn** — textfält (befintligt)
- **Bransch** — dropdown (befintligt)
- **Företagsbeskrivning** — ny textarea. Placeholder: "Beskriv ditt företag, vad ni erbjuder, er stil och målgrupp..."
- **Hemsida (valfritt)** — nytt URL-fält + "Scrapa"-knapp

### Steg 2: Sidstruktur (visas efter lyckad scraping)

- Checkboxar med föreslagna sidor baserade på scraping-resultat (t.ex. "Hem", "Tjänster", "Om oss", "Kontakt")
- Varje sida har en expanderbar fritext-ruta för sidspecifik kontext/instruktioner
- Förbockade baserat på vad scrapern hittade
- Användaren kan bocka av/i och lägga till egna sidor

### Inget steg 2 = single-page

Om ingen URL anges eller scraping misslyckas genereras en single-page som idag, men med fritextbeskrivningen som extra kontext.

### Generera-knappen

- Alltid synlig längst ner
- Text ändras dynamiskt: "Generera single-page" eller "Generera X sidor"

## Scraping-backend

### Ny endpoint: `POST /api/scrape`

**Input:**
```json
{ "url": "https://example.com" }
```

**Process:**
1. Hämta startsidan med `node-fetch`
2. Parsa med `cheerio`:
   - Sidtitel, meta-description
   - Brödtext (rensad från nav/footer/script/style-brus)
   - Interna länkar (filtrerade till samma domän)
3. Crawla hittade undersidor (max 10 st, timeout 5s per request)
4. Extrahera per undersida: titel, brödtext, typ (tjänster/om/kontakt baserat på URL/rubrik)

**Output:**
```json
{
  "mainPage": {
    "title": "Salong Harmony",
    "description": "Meta-description...",
    "content": "Brödtext från startsidan..."
  },
  "subPages": [
    {
      "url": "/tjanster",
      "title": "Tjänster",
      "content": "Klippning 350kr...",
      "suggested": true
    },
    {
      "url": "/om-oss",
      "title": "Om oss",
      "content": "Vi har funnits sedan...",
      "suggested": true
    }
  ]
}
```

### Ny modul: `server/lib/scraper.js`

- Beroenden: `cheerio`, `node-fetch` (redan tillgänglig via Node 18+)
- Timeout per request: 5 sekunder
- Max 10 undersidor
- Content-extraction: ta bort `<nav>`, `<footer>`, `<script>`, `<style>` — behåll `<main>`/`<article>` eller fallback till `<body>`
- Filtrera bort externa länkar, anchors, mailto etc.

## Multi-page generering (två-stegs-pipeline)

### Steg 1: Design-system

Claude får briefen med all kontext (branch-data, fritext, scrapad info) och genererar:

- **`shared.css`** — gemensam CSS: färger, typografi, spacing, komponenter, responsivitet
- **`header.html`** — gemensam navigation med länkar till alla valda sidor
- **`footer.html`** — gemensam footer

### Steg 2: Per-sida-generering

För varje vald sida kör Claude en separat generering:

- Får design-systemet (shared.css, header.html, footer.html) som kontext
- Får sidspecifik info: scrapad content + användarens fritext för den sidan
- Genererar en komplett HTML-fil som inkluderar det delade designsystemet
- **Validering efter varje sida:**
  - Kontrollera att designsystemet följs (rätt färger, fonts)
  - Responsivitet (mobile-first)
  - Navigation fungerar (rätt länkar)
  - Ingen placeholder-text
  - Konsistens med övriga genererade sidor
  - Max 3 valideringsiterationer per sida

### Utmappning

```
/output/{slug}/site/
  ├── shared.css
  ├── index.html        (Hem)
  ├── tjanster.html     (Tjänster)
  ├── om-oss.html       (Om oss)
  └── kontakt.html      (Kontakt)
```

### Single-page (ingen scraping)

Samma pipeline men bara en sida. Allt inline i en `index.html` som idag, men med fritextbeskrivningen som extra kontext i briefen.

## Brief-template och kontext

### Uppdaterad `pipeline/brief.md`

Nya sektioner:

- **Företagsbeskrivning** — fritexten injiceras som kontextblock
- **Scrapad information** — strukturerad per sida (titel + content), markerad som referensmaterial
- **Sidstruktur** — lista med valda sidor + sidspecifik fritext
- **Multi-page instruktioner** — regler för designsystem-steget och per-sida-steget

### Kontext-hierarki (prioritet för Claude)

1. **Branch designsystem** (färger, fonts, bilder) — alltid grund
2. **Användarens fritextbeskrivning** — högsta prio för tonalitet och innehåll
3. **Scrapad info** — referens för riktiga tjänster, priser, kontaktinfo
4. **Branch dummy-data** — fallback om scrapad info saknas

### Validerings-prompt

Separat prompt som körs efter varje genererad sida:
- Kontrollera designsystem, responsivitet, navigation, placeholder-text, konsistens
- Om problem hittas: fixa och kör validering igen (max 3 iterationer)

## API-kontrakt

### Uppdaterad `POST /api/generate`

```json
{
  "companyName": "string",
  "branchKey": "string",
  "description": "string",
  "scrapedData": {
    "mainPage": { "title": "...", "description": "...", "content": "..." },
    "subPages": [...]
  } | null,
  "pages": [
    { "slug": "tjanster", "title": "Tjänster", "context": "Extra info..." },
    { "slug": "om-oss", "title": "Om oss", "context": "" }
  ]
}
```

`pages` tom array = single-page generering.

### Uppdaterad projektmodell (in-memory)

```json
{
  "slug": "string",
  "status": "generating | done | error",
  "companyName": "string",
  "branchKey": "string",
  "description": "string",
  "isMultiPage": true,
  "pages": ["index.html", "tjanster.html", "om-oss.html"],
  "currentPage": "tjanster.html",
  "error": "string | null"
}
```

### Uppdaterad `GET /api/generate/{slug}/status`

Returnerar nu även `isMultiPage`, `pages` och `currentPage` för progress-visning per sida i frontend.

## Nya beroenden

- `cheerio` — HTML-parsning för scraping

## Filer som skapas/ändras

### Nya filer
- `server/lib/scraper.js` — scraping-modul
- `pipeline/brief-multipage.md` — multi-page brief-template (eller utöka befintlig)

### Ändrade filer
- `ui/src/pages/Home.tsx` — utökat formulär med steg 1 + steg 2
- `ui/src/components/GenerateCard.tsx` — visa multi-page progress
- `ui/src/lib/api.ts` — nya interfaces och API-anrop
- `server/routes/generate.js` — ny scrape-endpoint, uppdaterad generate-endpoint
- `server/lib/claude-runner.js` — två-stegs-pipeline, validering
- `server/lib/branches.js` — inga ändringar (branch-data behålls som är)
- `pipeline/brief.md` — nya sektioner för fritext, scraping, multi-page
- `package.json` — cheerio dependency
