"use client";

import React, { useState } from "react";
import { Mic, ArrowUp, Loader2, Sparkles, Database, History, Search } from "lucide-react";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onOpenSettings?: () => void;
  viewMode?: "desktop" | "mobile";
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  isLoading,
  onOpenSettings,
  viewMode = "mobile",
}) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDesktop = viewMode === "desktop";

  return (
    <div className={`px-4 sm:px-6 pb-4 pt-2 z-20 shrink-0 ${isDesktop ? "max-w-3xl w-full mx-auto" : "w-full"}`}>
      <div className={isDesktop ? "w-full" : "max-w-md mx-auto"}>
        {/* Desktop Quick Shortcuts (when input is idle) */}
        {isDesktop && (
          <div className="flex items-center justify-center gap-2 mb-2.5 overflow-x-auto py-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() =>
                onSendMessage(
                  "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"
                )
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 border border-white/80 shadow-2xs backdrop-blur-xs transition-all hover:scale-[1.02] shrink-0"
            >
              <History className="w-3 h-3 text-amber-500" />
              <span>CRM Pricing Delta</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onSendMessage(
                  "What did I ask you on 3 November? Is your answer still correct today?"
                )
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 border border-white/80 shadow-2xs backdrop-blur-xs transition-all hover:scale-[1.02] shrink-0"
            >
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>3 Nov Model Pricing</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onSendMessage(
                  "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"
                )
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 border border-white/80 shadow-2xs backdrop-blur-xs transition-all hover:scale-[1.02] shrink-0"
            >
              <Database className="w-3 h-3 text-indigo-500" />
              <span>Postgres Hosting Delta</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onSendMessage(
                  "What are the latest pricing tiers and rate limits for Claude 3.5 Sonnet vs GPT-4o today?"
                )
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 border border-white/80 shadow-2xs backdrop-blur-xs transition-all hover:scale-[1.02] shrink-0"
            >
              <Search className="w-3 h-3 text-emerald-500" />
              <span>Live Web Search</span>
            </button>
          </div>
        )}

        {/* Floating Rounded Pill Input */}
        <form
          onSubmit={handleSubmit}
          className={`bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/90 pl-5 pr-1.5 py-1.5 flex items-center justify-between transition-all focus-within:shadow-[0_8px_35px_rgb(37,99,235,0.18)] focus-within:border-blue-400 ${
            isDesktop ? "ring-1 ring-blue-500/10" : ""
          }`}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isDesktop
                ? "Ask anything... (e.g. 'Compare CRM pricing since Monday' or 'Search latest AI models')"
                : "Ask anything..."
            }
            disabled={isLoading}
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none pr-3"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {isDesktop && (
              <span className="hidden lg:inline text-[10px] text-slate-400 font-mono pr-1 select-none">
                ↵ to send
              </span>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-[#2563eb] hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center shadow-md shrink-0 transition-all disabled:opacity-50"
              title={input.trim() ? "Send message" : "Voice input"}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : input.trim() ? (
                <ArrowUp className="w-4 h-4 text-white stroke-[2.5]" />
              ) : (
                <Mic className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </form>

        {/* Footer Subtext */}
        <div className="text-center mt-2.5 flex items-center justify-center gap-2">
          <span className="text-[11px] text-slate-500">
            Experiencing issues?{" "}
            <button
              onClick={onOpenSettings}
              className="text-blue-600 underline font-medium hover:text-blue-700 cursor-pointer"
            >
              Try it on web
            </button>
          </span>
          {isDesktop && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-400 font-mono">
                Minimi v1.0.0 (Zero-Fabrication Guard Active)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
