"use client";

import React, { useState, useEffect } from "react";
import { X, Database, Bot, Search, RefreshCw, CheckCircle2, ShieldAlert, IndianRupee } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

interface ServerSettings {
  runtime: string;
  nodeVersion: string;
  persistence: {
    adapter: string;
    isPostgres: boolean;
  };
  llm: {
    provider: string;
    geminiConfigured: boolean;
    openaiConfigured: boolean;
    groqConfigured: boolean;
    model: string;
  };
  search: {
    provider: string;
    tavilyConfigured: boolean;
    braveConfigured: boolean;
    serperConfigured: boolean;
  };
  user: {
    defaultUserId: string;
    defaultTimezone: string;
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isOpen]);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        setSeedSuccess(true);
        onRefreshData?.();
      }
    } catch {
      // ignore
    } finally {
      setSeeding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          title="Close Settings"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <h2 id="settings-modal-title" className="font-doto text-base font-bold text-slate-900 mb-1">
          Minimi Agent Telemetry & Settings
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Server-side provider adapters, isolation boundaries, and persistence telemetry.
        </p>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Loading system telemetry...
          </div>
        ) : settings ? (
          <div className="space-y-3.5 text-xs">
            {/* Persistence Layer */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Database className="w-4 h-4 text-blue-600" />
                  Persistence Layer
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    settings.persistence.isPostgres
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {settings.persistence.adapter}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {settings.persistence.isPostgres
                  ? "Connected to primary PostgreSQL database with relational indexing, JSONB snapshots, and full-text search."
                  : "Using embedded persistent local store (.data/minimi.db.json) with atomic writes."}
              </p>
            </div>

            {/* LLM Adapter */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Bot className="w-4 h-4 text-blue-600" />
                  LLM Provider Adapter
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                  {settings.llm.provider.toUpperCase()} ({settings.llm.model})
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1.5">
                <span>
                  Gemini API:{" "}
                  {settings.llm.geminiConfigured ? (
                    <span className="text-emerald-600 font-medium">Configured</span>
                  ) : (
                    <span className="text-slate-400">Unset</span>
                  )}
                </span>
                <span>
                  OpenAI API:{" "}
                  {settings.llm.openaiConfigured ? (
                    <span className="text-emerald-600 font-medium">Configured</span>
                  ) : (
                    <span className="text-slate-400">Unset</span>
                  )}
                </span>
              </div>
            </div>

            {/* Web Search Adapter */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Search className="w-4 h-4 text-blue-600" />
                  Web Search Engine
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                  {settings.search.provider.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1.5">
                <span>
                  Tavily:{" "}
                  {settings.search.tavilyConfigured ? (
                    <span className="text-emerald-600 font-medium">Active</span>
                  ) : (
                    <span className="text-slate-400">Unset</span>
                  )}
                </span>
                <span>
                  DuckDuckGo: <span className="text-emerald-600 font-medium">Zero-Key Fallback Active</span>
                </span>
              </div>
            </div>

            {/* User Session, Timezone & Rupee Currency */}
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-slate-400 block mb-0.5">User Identity:</span>
                <span className="font-mono text-slate-700 truncate block">{settings.user.defaultUserId}</span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-slate-400 block mb-0.5">Timezone:</span>
                <span className="font-mono text-slate-700">{settings.user.defaultTimezone}</span>
              </div>
              <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/40">
                <span className="text-blue-500 block mb-0.5 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-blue-600" /> Currency:
                </span>
                <span className="font-semibold text-blue-800">₹ INR / $ USD</span>
              </div>
            </div>

            {/* Seed Benchmark Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block text-xs">
                  Seed Test Benchmark Data
                </span>
                <span className="text-[10px] text-slate-400">
                  Populates Monday CRM, 3 Nov, and Postgres hosting
                </span>
              </div>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
                {seeding ? "Seeding..." : "Seed Scenarios"}
              </button>
            </div>

            {seedSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Benchmark conversations and evidence snapshots successfully seeded!
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-rose-600 text-xs py-4">
            <ShieldAlert className="w-4 h-4" />
            Unable to retrieve server telemetry.
          </div>
        )}
      </div>
    </div>
  );
};
