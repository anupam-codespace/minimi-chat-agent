import { EvidenceQuality } from "@/types";

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  publicationDate?: string;
  evidenceQuality: EvidenceQuality;
  confidenceScore: number;
}

export interface ExtractedPage {
  url: string;
  title: string;
  domain: string;
  content: string;
  paragraphs: string[];
  publicationDate?: string;
  retrievalTimestamp: string;
}

export interface IWebSearchProvider {
  name: string;
  search(query: string, maxResults?: number): Promise<SearchResult[]>;
}

