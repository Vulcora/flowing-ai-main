import * as cheerio from "cheerio";

const USER_AGENT = "FlowingAI-Bot/1.0";
const TIMEOUT_MS = 5000;
const MAX_SUBPAGES = 10;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    const html = await res.text();
    return html;
  } finally {
    clearTimeout(timer);
  }
}

function extractContent($) {
  // Remove noise elements
  $("nav, footer, header, script, style, noscript, iframe, svg").remove();

  // Prefer <main> or <article>, fallback to <body>
  let root = $("main").first();
  if (!root.length) root = $("article").first();
  if (!root.length) root = $("body");

  const text = root
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  return text;
}

function extractMeta($) {
  const title = $("title").first().text().trim() || "";
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";
  return { title, description: description.trim() };
}

function findInternalLinks($, baseUrl) {
  const base = new URL(baseUrl);
  const seen = new Set();
  const links = [];

  $("a[href]").each((_, el) => {
    if (links.length >= MAX_SUBPAGES) return false;
    const raw = $(el).attr("href") || "";

    // Skip anchors, mailto, tel, files
    if (
      raw.startsWith("#") ||
      raw.startsWith("mailto:") ||
      raw.startsWith("tel:") ||
      /\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|docx?|xlsx?)$/i.test(raw)
    ) {
      return;
    }

    let resolved;
    try {
      resolved = new URL(raw, baseUrl);
    } catch {
      return;
    }

    // Same domain only
    if (resolved.hostname !== base.hostname) return;

    // Strip hash & trailing slash for dedup
    resolved.hash = "";
    const normalized = resolved.href.replace(/\/$/, "");

    const baseNormalized = base.href.replace(/\/$/, "");
    if (normalized === baseNormalized) return; // skip self

    if (!seen.has(normalized)) {
      seen.add(normalized);
      links.push(resolved.href);
    }
  });

  return links.slice(0, MAX_SUBPAGES);
}

function guessPageType(url, title) {
  const combined = (url + " " + title).toLowerCase();

  if (/tjänst|service|behandling|meny|erbjud/.test(combined)) return "services";
  if (/om oss|om |about/.test(combined)) return "about";
  if (/kontakt|contact|hitta/.test(combined)) return "contact";
  if (/pris|price/.test(combined)) return "pricing";
  if (/galler|portfölj|portfolio|projekt|referens/.test(combined)) return "gallery";
  if (/boka|book/.test(combined)) return "booking";
  if (/blogg|blog|nyheter|aktuellt/.test(combined)) return "blog";
  if (/faq|frågor/.test(combined)) return "faq";
  return "other";
}

function generateSlug(url) {
  try {
    const { pathname } = new URL(url);
    const slug = pathname.replace(/^\/|\/$/g, "").replace(/\//g, "-");
    return slug || "page";
  } catch {
    return "page";
  }
}

export async function scrapeWebsite(url) {
  // Fetch main page
  const mainHtml = await fetchWithTimeout(url);
  const $main = cheerio.load(mainHtml);
  const { title, description } = extractMeta($main);
  const content = extractContent($main);

  // Find internal links from main page (reload fresh so removals don't affect link scan)
  const $links = cheerio.load(mainHtml);
  const internalLinks = findInternalLinks($links, url);

  // Crawl subpages
  const subPages = [];
  for (const subUrl of internalLinks) {
    try {
      const subHtml = await fetchWithTimeout(subUrl);
      const $sub = cheerio.load(subHtml);
      const { title: subTitle } = extractMeta($sub);
      const subContent = extractContent($sub);
      const slug = generateSlug(subUrl);
      const type = guessPageType(subUrl, subTitle);

      subPages.push({
        url: subUrl,
        slug,
        title: subTitle,
        content: subContent,
        type,
        suggested: true,
      });
    } catch {
      // Skip pages that fail or time out
    }
  }

  return {
    mainPage: { title, description, content },
    subPages,
  };
}
