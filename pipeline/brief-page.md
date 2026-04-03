# Sidgenerering — $PAGE_TITLE — $COMPANY_NAME

Du ska skapa sidan **$PAGE_TITLE** (`$PAGE_FILENAME`) för **$COMPANY_NAME**.

## Design-system
Använd det befintliga design-systemet. Här är filerna:

### shared.css (sammandrag)
Se filen `$OUTPUT_DIR/site/shared.css` för komplett CSS.

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

### Chattwidget (OBLIGATORISK):
Footer-snippeten innehåller redan chattwidget-scriptet. Se till att footer inkluderas korrekt i slutet av `<body>`.

### Förbjudet:
- Inga externa CSS/JS-filer (utöver shared.css och chattwidgeten)
- Inga ramverk
- Ingen placeholder/lorem ipsum text
- Inga brutna bilder
