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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <aside
        aria-label="Source and Evidence Inspector"
        className="relative w-88 max-w-full bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-doto text-xs font-bold text-slate-900">
              Verified Sources ({sources.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            title="Close drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter sources..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No sources recorded for this session.
            </div>
          ) : (
            filtered.map((source, idx) => {
              const isHighlighted = highlightedIndex === idx + 1;
              return (
                <div
                  key={source.id || idx}
                  id={`source-card-${idx + 1}`}
                  className={`p-3 rounded-xl border transition-all ${
                    isHighlighted
                      ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 font-mono">
                        [{idx + 1}]
                      </span>
                      <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                        {source.title}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        source.evidenceQuality === "official"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {source.evidenceQuality}
                    </span>
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline mb-1.5 break-all"
                  >
                    {source.domain} <ExternalLink className="w-2 h-2" />
                  </a>

                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 leading-relaxed font-mono">
                    &ldquo;{source.snippet}&rdquo;
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(source.retrievalTimestamp).toLocaleDateString()}
                    </span>
                    {source.publicationDate && (
                      <span className="text-blue-600">Pub: {source.publicationDate}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};
