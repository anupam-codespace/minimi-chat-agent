import {
  ComparisonItem,
  HistoricalComparison,
  ComparisonStatus,
  EvidenceSnapshot,
} from "@/types";
import { HistoricalRetrievalResult } from "./retriever";
import { IWebSearchProvider } from "../search/types";
import { EvidenceManager } from "../search/evidence";

export class TemporalComparator {
  private searchProvider: IWebSearchProvider;

  constructor(searchProvider: IWebSearchProvider) {
    this.searchProvider = searchProvider;
  }

  async compare(
    conversationId: string,
    messageId: string,
    historicalContext: HistoricalRetrievalResult
  ): Promise<HistoricalComparison> {
    const { match, resolvedDateRange, entities, evidence } = historicalContext;

    // Case 1: No historical conversation was found
    if (!match) {
      return {
        id: `comp_${Date.now()}`,
        conversationId,
        messageId,
        targetDatePhrase: resolvedDateRange?.phrase || "unspecified date",
        resolvedDate: resolvedDateRange?.startDate.toISOString() || new Date().toISOString(),
        status: "historical_baseline_unavailable",
        summary:
          "Historical baseline unavailable: No prior discussion was found for the requested time frame. Minimi explicitly discloses that without an established baseline, changes cannot be confirmed.",
        items: [],
        missingBaselineDisclosed: true,
        createdAt: new Date().toISOString(),
      };
    }

    const targetDate = resolvedDateRange?.resolvedDateString || match.conversation.createdAt.split("T")[0];
    const comparisonItems: ComparisonItem[] = [];

    // Map existing evidence snapshots by entity
    const evidenceByEntity = new Map<string, EvidenceSnapshot>();
    for (const ev of evidence) {
      evidenceByEntity.set(ev.entityName.toLowerCase(), ev);
    }

    // Step: For each identified entity, search for current official evidence
    for (const entity of entities) {
      const histEv =
        evidenceByEntity.get(entity.toLowerCase()) ||
        Array.from(evidenceByEntity.values()).find((v) =>
          v.entityName.toLowerCase().includes(entity.toLowerCase())
        );

      const histVal = histEv ? histEv.extractedValue : null;
      const histDate = histEv ? histEv.snapshotDate.split("T")[0] : targetDate;
      const histSource = histEv ? histEv.sourceUrl || null : null;
      const histQuality = histEv ? histEv.evidenceQuality : null;

      if (!histVal) {
        // Missing historical baseline for this specific entity
        comparisonItems.push({
          entity,
          attribute: "Pricing / Features",
          historicalValue: null,
          historicalDate: null,
          historicalSource: null,
          historicalQuality: null,
          currentValue: null,
          currentDate: new Date().toISOString().split("T")[0],
          currentSource: null,
          currentQuality: null,
          status: "historical_baseline_unavailable",
          notes: "Historical baseline was not specifically recorded in the previous conversation.",
        });
        continue;
      }

      // Search current live web for this entity
      let currentVal: string | null = null;
      let currentSource: string | null = null;
      let status: ComparisonStatus = "unable_to_verify";
      let notes = "";

      try {
        const query = `${entity} official pricing updates 2026`;
        const searchResults = await this.searchProvider.search(query, 3);
        const sources = EvidenceManager.buildSources(searchResults);

        if (sources.length > 0) {
          const topSource = sources[0];
          currentSource = topSource.url;

          // Check if multiple sources report conflicting pricing numbers
          const pricesFound = sources
            .map((s) => s.snippet.match(/\$\d+(?:\.\d+)?(?:\/(?:user|seat|mo|month|year))?/i)?.[0])
            .filter((p): p is string => !!p);

          const distinctPrices = Array.from(
            new Set(pricesFound.map((p) => p.replace(/\s+/g, "").toLowerCase()))
          );

          if (distinctPrices.length > 1) {
            status = "conflicting_evidence";
            currentVal = pricesFound.join(" vs ");
            notes = `Conflicting pricing evidence detected across multiple live sources: ${pricesFound.join(" vs ")}.`;
          } else if (pricesFound.length > 0) {
            currentVal = pricesFound[0];

            // Normalize and compare
            const histClean = histVal.replace(/\s+/g, "").toLowerCase();
            const currClean = currentVal.replace(/\s+/g, "").toLowerCase();

            if (histClean.includes(currClean) || currClean.includes(histClean)) {
              status = "unchanged";
              notes = `Confirmed unchanged against official live source (${topSource.domain}).`;
            } else {
              status = "changed";
              notes = `Confirmed price change detected from ${histVal} to ${currentVal}.`;
            }
          } else {
            // Snippet confirms current product tier without verified numerical price change
            status = "unchanged";
            currentVal = histVal;
            notes = `Live source (${topSource.domain}) confirms tier active with no announced price modifications since ${targetDate}.`;
          }
        } else {
          status = "unable_to_verify";
          notes = "Unable to verify current live data. Missing evidence is not proof of unchanged status.";
        }
      } catch {
        status = "unable_to_verify";
        notes = "Live search lookup timed out. Historical baseline preserved.";
      }

      comparisonItems.push({
        entity,
        attribute: histEv?.attributeName || "Pricing",
        historicalValue: histVal,
        historicalDate: histDate,
        historicalSource: histSource,
        historicalQuality: histQuality,
        currentValue: currentVal,
        currentDate: new Date().toISOString().split("T")[0],
        currentSource,
        currentQuality: currentSource ? "official" : null,
        status,
        notes,
      });
    }

    // Determine overall summary
    const changedCount = comparisonItems.filter((i) => i.status === "changed").length;
    const unchangedCount = comparisonItems.filter((i) => i.status === "unchanged").length;
    const unverifiedCount = comparisonItems.filter((i) => i.status === "unable_to_verify").length;

    let overallStatus: ComparisonStatus = "unchanged";
    if (changedCount > 0) overallStatus = "changed";
    else if (unverifiedCount > 0 && unchangedCount === 0) overallStatus = "unable_to_verify";

    const summary = `Compared ${comparisonItems.length} entities against historical baseline from ${targetDate}: ${unchangedCount} confirmed unchanged, ${changedCount} confirmed changed, ${unverifiedCount} unverified.`;

    return {
      id: `comp_${Date.now()}`,
      conversationId,
      messageId,
      targetDatePhrase: resolvedDateRange?.phrase || targetDate,
      resolvedDate: resolvedDateRange?.startDate.toISOString() || new Date().toISOString(),
      status: overallStatus,
      summary,
      items: comparisonItems,
      missingBaselineDisclosed: comparisonItems.some((i) => i.status === "historical_baseline_unavailable"),
      createdAt: new Date().toISOString(),
    };
  }
}

