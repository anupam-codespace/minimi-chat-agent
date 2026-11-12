"use client";

import React from "react";
import { HistoricalComparison, ComparisonStatus } from "@/types";
import { CheckCircle2, AlertCircle, HelpCircle, ExternalLink } from "lucide-react";

interface ComparisonMatrixProps {
  comparison: HistoricalComparison;
  onSourceClick?: (url: string) => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  comparison,
  onSourceClick,
}) => {
  const getStatusBadge = (status: ComparisonStatus) => {
    switch (status) {
      case "unchanged":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Unchanged
          </span>
        );
      case "changed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Confirmed Change
          </span>
        );
      case "conflicting_evidence":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800">
            <AlertCircle className="w-3 h-3 text-purple-400" />
            Conflicting Evidence
          </span>
        );
      case "unable_to_verify":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            Unverified
          </span>
        );
      case "historical_baseline_unavailable":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Missing Baseline
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="my-4 rounded-xl border border-indigo-900/60 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h4 className="font-doto text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Structured Temporal Comparison Matrix
          </h4>
        </div>
        <div className="text-xs text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2.5 py-1 rounded-full font-mono">
          Baseline: {comparison.targetDatePhrase}
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-3 leading-relaxed">{comparison.summary}</p>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/80">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5 font-semibold">Entity</th>
              <th className="px-3.5 py-2.5 font-semibold">Historical Value</th>
              <th className="px-3.5 py-2.5 font-semibold">Current Value</th>
              <th className="px-3.5 py-2.5 font-semibold">Verification Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {comparison.items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                <td className="px-3.5 py-2.5 font-medium text-slate-200">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">{item.entity}</span>
                    <span className="text-[10px] text-slate-400">{item.attribute}</span>
                  </div>
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex flex-col">
                    <span className="font-mono text-slate-200">
                      {item.historicalValue || "—"}
                    </span>
                    {item.historicalSource && (
                      <button
                        onClick={() => onSourceClick?.(item.historicalSource!)}
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline mt-0.5"
                      >
                        Source <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex flex-col">
                    <span className="font-mono text-emerald-300">
                      {item.currentValue || "Unverified"}
                    </span>
                    {item.currentSource && (
                      <button
                        onClick={() => onSourceClick?.(item.currentSource!)}
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline mt-0.5"
                      >
                        Live source <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(item.status)}
                    {item.notes && (
                      <span className="text-[10px] text-slate-400 line-clamp-2">
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
        <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Formal Disclosure:</strong> Minimi explicitly flags when historical evidence is partial or absent. Missing evidence is never interpreted as proof of unchanged state.
          </span>
        </div>
      )}
    </div>
  );
};

