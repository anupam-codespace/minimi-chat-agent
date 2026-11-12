"use client";

import React, { useState } from "react";
import { Source } from "@/types";
import { X, ExternalLink, Calendar, ShieldCheck, Search } from "lucide-react";

interface SourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
  highlightedIndex?: number | null;
}

export const SourceDrawer: React.FC<SourceDrawerProps> = ({
  isOpen,
  onClose,
  sources,
  highlightedIndex,
}) => {
  const [filterQuery, setFilterQuery] = useState("");

  if (!isOpen) return null;

  const filtered = sources.filter(
    (s) =>
      s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.domain.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.snippet.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <aside
      aria-label="Source and Evidence Inspector"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Sources & Evidence Inspector ({sources.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter sources by title, domain, quote..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No sources matching your filter.
          </div>
        ) : (
          filtered.map((source, idx) => {
            const isHighlighted = highlightedIndex === idx + 1;
            return (
              <div
                key={source.id || idx}
                id={`source-card-${idx + 1}`}
                className={`p-3 rounded-lg border transition-all ${
                  isHighlighted
                    ? "border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500"
                    : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                      [{idx + 1}]
                    </span>
                    <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {source.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      source.evidenceQuality === "official"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {source.evidenceQuality}
                  </span>
                </div>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline mb-2 break-all"
                >
                  {source.domain} <ExternalLink className="w-2.5 h-2.5" />
                </a>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/60 leading-relaxed font-mono text-[11px]">
                  &ldquo;{source.snippet}&rdquo;
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    Retrieved: {new Date(source.retrievalTimestamp).toLocaleDateString()}
                  </span>
                  {source.publicationDate && (
                    <span className="text-indigo-300/80">
                      Published: {source.publicationDate}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

