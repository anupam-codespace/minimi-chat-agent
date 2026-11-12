import { ExtractedPage } from "./types";
import { config } from "../config";

export class PageRetriever {
  private timeoutMs: number;
  private maxChars: number;

  constructor(timeoutMs?: number, maxChars?: number) {
    this.timeoutMs = timeoutMs || config.fetchPageTimeoutMs;
    this.maxChars = maxChars || config.maxContentCharsPerPage;
  }

  async retrievePage(url: string): Promise<ExtractedPage | null> {
    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname.replace(/^www\./, "");

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MinimiResearchBot/1.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!res.ok) {
        return null;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        return null;
      }

      const rawHtml = await res.text();
      return this.parseHtml(rawHtml, url, domain);
    } catch {
      return null;
    }
  }

  private parseHtml(html: string, url: string, domain: string): ExtractedPage {
    // 1. Extract Title
    let title = domain;
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      if (ogTitleMatch) title = ogTitleMatch[1].trim();
    }

    // 2. Extract Publication Date
    let pubDate: string | undefined;
    const pubDateMatch =
      html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["'](?:date|pubdate|publication_date)["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<time[^>]+datetime=["']([^"']+)["']/i);
    if (pubDateMatch) {
      pubDate = pubDateMatch[1].trim();
    }

    // 3. Clean Content
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ");

    // Replace paragraph/heading breaks with double newlines
    cleaned = cleaned
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ");

    // Decode HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");

    const paragraphs = cleaned
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length >= 40); // meaningful sentence threshold

    const content = paragraphs.join("\n\n").slice(0, this.maxChars);

    return {
      url,
      title,
      domain,
      content,
      paragraphs: paragraphs.slice(0, 15),
      publicationDate: pubDate,
      retrievalTimestamp: new Date().toISOString(),
    };
  }
}

