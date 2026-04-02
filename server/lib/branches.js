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
