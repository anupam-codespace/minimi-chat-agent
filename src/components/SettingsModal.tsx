"use client";

import React, { useState, useEffect } from "react";
import { X, Database, Bot, Search, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 id="settings-modal-title" className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
          Minimi Agent Architecture & Configuration
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Server-side provider adapters, isolation boundaries, and persistence telemetry.
        </p>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Loading system telemetry...
          </div>
        ) : settings ? (
          <div className="space-y-4 text-xs">
            {/* Persistence Layer */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Persistence Layer
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    settings.persistence.isPostgres
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                  }`}
                >
                  {settings.persistence.adapter}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {settings.persistence.isPostgres
                  ? "Connected to primary PostgreSQL database with relational indexing, JSONB snapshots, and full-text search."
                  : "Using embedded persistent local store (.data/minimi.db.json) with atomic writes and full-text index."}
              </p>
            </div>

            {/* LLM Adapter */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  LLM Provider Adapter
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                  {settings.llm.provider.toUpperCase()} ({settings.llm.model})
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  Gemini API:{" "}
                  {settings.llm.geminiConfigured ? (
                    <span className="text-emerald-400">Configured</span>
                  ) : (
                    <span className="text-slate-500">Unset</span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  OpenAI API:{" "}
                  {settings.llm.openaiConfigured ? (
                    <span className="text-emerald-400">Configured</span>
                  ) : (
                    <span className="text-slate-500">Unset</span>
                  )}
                </span>
              </div>
            </div>

            {/* Web Search Adapter */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Search className="w-4 h-4 text-indigo-400" />
                  Web Search Engine
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                  {settings.search.provider.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                <span>
                  Tavily:{" "}
                  {settings.search.tavilyConfigured ? (
                    <span className="text-emerald-400">Active</span>
                  ) : (
                    <span className="text-slate-500">Unset</span>
                  )}
                </span>
                <span>
                  Brave:{" "}
                  {settings.search.braveConfigured ? (
                    <span className="text-emerald-400">Active</span>
                  ) : (
                    <span className="text-slate-500">Unset</span>
                  )}
                </span>
                <span>
                  DuckDuckGo: <span className="text-emerald-400">Ready</span>
                </span>
              </div>
            </div>

            {/* User Session & Timezone */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40">
                <span className="text-slate-500 block mb-0.5">User Identity Isolation:</span>
                <span className="font-mono text-slate-200">{settings.user.defaultUserId}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40">
                <span className="text-slate-500 block mb-0.5">Resolved Timezone:</span>
                <span className="font-mono text-slate-200">{settings.user.defaultTimezone}</span>
              </div>
            </div>

            {/* Seed Test Scenarios Action */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">
                  Seed Test Benchmark Data
                </span>
                <span className="text-[10px] text-slate-500">
                  Populates Test 1 (Monday CRM), Test 2 (Nov 3), and Test 3 (Hosting)
                </span>
              </div>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
                {seeding ? "Seeding..." : "Seed Scenarios"}
              </button>
            </div>

            {seedSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded border border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                Benchmark conversations and evidence snapshots successfully seeded!
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-rose-400 text-xs py-4">
            <ShieldAlert className="w-4 h-4" />
            Unable to retrieve server telemetry.
          </div>
        )}
      </div>
    </div>
  );
};

