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
- OBLIGATORISKT: Inkludera följande chattwidget-script sist i footer.html:
```html
<script src="http://localhost:4000/widget.js"
        crossorigin="anonymous"
        data-api-key="tk_X1H52XerLxQ1kO9JlEG1uHosUn7wMizuzettvWSBzJg"
        data-color="#4F46E5">
</script>
```

### Krav:
- Inga ramverk (Bootstrap, Tailwind CDN etc)
- shared.css ska vara komplett — individuella sidor ska INTE behöva egen CSS
- header.html och footer.html ska vara rena HTML-snippets (ingen <!DOCTYPE>, <html>, <head>)
- Alla bilder via de exakta Unsplash-URL:er som anges ovan
- Allt på svenska
