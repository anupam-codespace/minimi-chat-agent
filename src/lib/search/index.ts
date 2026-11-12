import { IWebSearchProvider } from "./types";
import {
  TavilySearchProvider,
  BraveSearchProvider,
  SerperSearchProvider,
  DuckDuckGoSearchProvider,
} from "./providers";
import { config } from "../config";

export function getSearchProvider(): IWebSearchProvider {
  if (config.searchProvider === "tavily" && config.tavilyApiKey) {
    return new TavilySearchProvider(config.tavilyApiKey);
  }

  if (config.searchProvider === "brave" && config.braveApiKey) {
    return new BraveSearchProvider(config.braveApiKey);
  }

  if (config.searchProvider === "serper" && config.serperApiKey) {
    return new SerperSearchProvider(config.serperApiKey);
  }

  if (config.tavilyApiKey) {
    return new TavilySearchProvider(config.tavilyApiKey);
  }
  if (config.braveApiKey) {
    return new BraveSearchProvider(config.braveApiKey);
  }
  if (config.serperApiKey) {
    return new SerperSearchProvider(config.serperApiKey);
  }

  // Fallback to DuckDuckGo (zero-key web search)
  return new DuckDuckGoSearchProvider();
}

export * from "./types";
export * from "./retriever";
export * from "./evidence";

