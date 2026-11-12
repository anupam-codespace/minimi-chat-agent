"use client";

import React, { useState } from "react";
import { HistoricalComparison, ComparisonStatus } from "@/types";
import { CheckCircle2, AlertCircle, HelpCircle, ExternalLink, IndianRupee } from "lucide-react";

interface ComparisonMatrixProps {
  comparison: HistoricalComparison;
  onSourceClick?: (url: string) => void;
}

// Convert USD to INR (approximate baseline rate for comparison context: 1 USD = 86.5 INR)
function formatWithRupee(value: string | null, enableRupee: boolean): string {
  if (!value) return "—";
  if (!enableRupee) return value;
  if (value.includes("₹") || value.includes("INR")) return value;

  // Find occurrences of $amount and augment with Rupee equivalent
  return value.replace(/\$([0-9,]+(?:\.[0-9]+)?)/g, (match, p1) => {
    const num = parseFloat(p1.replace(/,/g, ""));
    if (isNaN(num)) return match;
    const inr = Math.round(num * 86.5).toLocaleString("en-IN");
    return `${match} (₹${inr})`;
  });
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  comparison,
  onSourceClick,
}) => {
  const [showRupee, setShowRupee] = useState(true);

  const getStatusBadge = (status: ComparisonStatus) => {
    switch (status) {
      case "unchanged":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Unchanged
          </span>
        );
      case "changed":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
            Changed
          </span>
        );
      case "conflicting_evidence":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <AlertCircle className="w-2.5 h-2.5 text-purple-600" />
            Conflicting
          </span>
        );
      case "unable_to_verify":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <HelpCircle className="w-2.5 h-2.5 text-slate-500" />
            Unverified
          </span>
        );
      case "historical_baseline_unavailable":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
            Missing Baseline
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="my-3 rounded-xl border border-blue-200/80 bg-white/95 p-3.5 shadow-xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <h4 className="font-doto text-xs font-bold text-slate-800 uppercase tracking-wider">
            Temporal Comparison Matrix
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {/* Rupee Toggle Button */}
          <button
            onClick={() => setShowRupee(!showRupee)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
              showRupee
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Toggle Indian Rupee (₹ INR) currency conversion"
          >
            <IndianRupee className="w-2.5 h-2.5 text-blue-600" />
            <span>₹ INR {showRupee ? "Active" : "Off"}</span>
          </button>

          <div className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full font-mono">
            Baseline: {comparison.targetDatePhrase}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 mb-3 leading-relaxed">{comparison.summary}</p>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 font-semibold">Entity</th>
              <th className="px-3 py-2 font-semibold">Historical Baseline</th>
              <th className="px-3 py-2 font-semibold">Current Verified</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {comparison.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-3 py-2 font-medium">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{item.entity}</span>
                    <span className="text-[10px] text-slate-400">{item.attribute}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-slate-800 font-medium">
                      {formatWithRupee(item.historicalValue, showRupee)}
                    </span>
                    {item.historicalSource && (
                      <button
                        onClick={() => onSourceClick?.(item.historicalSource!)}
                        className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline mt-0.5"
                      >
                        Baseline source <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-emerald-700 font-medium">
                      {formatWithRupee(item.currentValue, showRupee) || "Unverified"}
                    </span>
                    {item.currentSource && (
                      <button
                        onClick={() => onSourceClick?.(item.currentSource!)}
                        className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline mt-0.5"
                      >
                        Live source <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(item.status)}
                    {item.notes && (
                      <span className="text-[10px] text-slate-500 line-clamp-2">
                        {item.notes}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comparison.missingBaselineDisclosed && (
        <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Formal Disclosure:</strong> Historical baseline is partial or absent. Missing evidence is never interpreted as proof of unchanged state.
          </span>
        </div>
      )}
    </div>
  );
};
