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

## Företagsbeskrivning (från ägaren)
$DESCRIPTION

## Information från befintlig hemsida
$SCRAPED_INFO

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
