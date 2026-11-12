import { IWebSearchProvider, SearchResult } from "./types";
import { EvidenceQuality } from "@/types";

function extractDomain(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function assessQuality(url: string, title: string): EvidenceQuality {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Official domains or docs/pricing pages
  if (
    lowerUrl.includes("/pricing") ||
    lowerUrl.includes("/docs") ||
    lowerUrl.includes("/official") ||
    lowerUrl.includes("apple.com") ||
    lowerUrl.includes("google.com") ||
    lowerUrl.includes("salesforce.com") ||
    lowerUrl.includes("hubspot.com") ||
    lowerUrl.includes("supabase.com") ||
    lowerUrl.includes("neon.tech") ||
    lowerUrl.includes("aws.amazon.com")
  ) {
    return "official";
  }

  if (
    lowerTitle.includes("official") ||
    lowerUrl.includes("github.com") ||
    lowerUrl.includes("reuters.com") ||
    lowerUrl.includes("bloomberg.com")
  ) {
    return "primary";
  }

  return "secondary";
}

// -----------------------------------------------------------------------------
// Tavily AI Search Provider
// -----------------------------------------------------------------------------
export class TavilySearchProvider implements IWebSearchProvider {
  name = "Tavily";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        search_depth: "advanced",
        include_answer: false,
        max_results: maxResults,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Tavily search API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const results: SearchResult[] = (data.results || []).map((r: {
      url: string;
      title: string;
      content: string;
      published_date?: string;
      score?: number;
    }) => {
      const domain = extractDomain(r.url);
      return {
        url: r.url,
        title: r.title || domain,
        snippet: r.content || "",
        domain,
        publicationDate: r.published_date,
        evidenceQuality: assessQuality(r.url, r.title || ""),
        confidenceScore: r.score ?? 0.85,
      };
    });

    return results;
  }
}

// -----------------------------------------------------------------------------
// Brave Search Provider
// -----------------------------------------------------------------------------
export class BraveSearchProvider implements IWebSearchProvider {
  name = "Brave Search";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(maxResults));

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": this.apiKey,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Brave search API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const webResults = data.web?.results || [];

    return webResults.map((r: {
      url: string;
      title: string;
      description: string;
      page_age?: string;
    }) => {
      const domain = extractDomain(r.url);
      return {
        url: r.url,
        title: r.title || domain,
        snippet: r.description || "",
        domain,
        publicationDate: r.page_age,
        evidenceQuality: assessQuality(r.url, r.title || ""),
        confidenceScore: 0.85,
      };
    });
  }
}

// -----------------------------------------------------------------------------
// Serper (Google Search) Provider
// -----------------------------------------------------------------------------
export class SerperSearchProvider implements IWebSearchProvider {
  name = "Serper";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: maxResults }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Serper search error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const organic = data.organic || [];

    return organic.map((r: {
      link: string;
      title: string;
      snippet: string;
      date?: string;
    }) => {
      const domain = extractDomain(r.link);
      return {
        url: r.link,
        title: r.title || domain,
        snippet: r.snippet || "",
        domain,
        publicationDate: r.date,
        evidenceQuality: assessQuality(r.link, r.title || ""),
        confidenceScore: 0.88,
      };
    });
  }
}

// -----------------------------------------------------------------------------
// DuckDuckGo Search Provider (Zero-Key Fallback)
// -----------------------------------------------------------------------------
export class DuckDuckGoSearchProvider implements IWebSearchProvider {
  name = "DuckDuckGo";

  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return [];
      }

      const html = await res.text();
      const results: SearchResult[] = [];

      // Parse DuckDuckGo html results via regex for zero dependencies
      const resultRegex = /<a[^>]+class="result__url"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;

      while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
        let rawLink = match[1];
        if (rawLink.includes("uddg=")) {
          const matchUddg = rawLink.match(/uddg=([^&]+)/);
          if (matchUddg) rawLink = decodeURIComponent(matchUddg[1]);
        }
        const title = match[2].replace(/<[^>]+>/g, "").trim();
        const snippet = match[3].replace(/<[^>]+>/g, "").trim();
        const domain = extractDomain(rawLink);

        results.push({
          url: rawLink,
          title: title || domain,
          snippet,
          domain,
          evidenceQuality: assessQuality(rawLink, title),
          confidenceScore: 0.8,
        });
      }

      return results;
    } catch {
      return [];
    }
  }
}

