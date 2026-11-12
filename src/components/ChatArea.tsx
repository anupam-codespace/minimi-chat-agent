"use client";

import React, { useEffect, useRef } from "react";
import { Message, Source } from "@/types";
import { MarkdownView } from "./MarkdownView";
import { ComparisonMatrix } from "./ComparisonMatrix";
import {
  Loader2,
  Mic,
  GraduationCap,
  Rocket,
  Sparkles,
  Compass,
  Bot,
  ExternalLink,
} from "lucide-react";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  activeStatusMessage?: string;
  streamingMessageText?: string;
  onSelectSuggestion: (text: string) => void;
  onCitationClick: (sourceNumber: number) => void;
  activeTab?: "chat" | "voice";
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  activeStatusMessage,
  streamingMessageText,
  onSelectSuggestion,
  onCitationClick,
  activeTab = "chat",
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessageText, activeStatusMessage]);

  if (activeTab === "voice") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-100 animate-ping absolute inset-0 opacity-40" />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 text-white relative z-10">
            <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Voice Assistant Active</h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Ask Minimi any live web research or temporal pricing comparison question.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 md:py-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.length === 0 && !isLoading ? (
          <div className="pt-4 sm:pt-8 pb-4 select-none">
            {/* Top Greeting Pill */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Bot className="w-3.5 h-3.5" />
              </span>
              <span>Good afternoon, Samson</span>
            </div>

            {/* Bold Headline */}
            <h2 className="font-doto text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 text-center tracking-tight mb-6">
              How can I help?
            </h2>

            {/* 2x2 Clean Vector Icon Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {/* Card 1: Top Left */}
              <button
                onClick={() =>
                  onSelectSuggestion(
                    "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"
                  )
                }
                className="text-left bg-white/85 hover:bg-white active:scale-[0.99] backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80 hover:border-blue-300 transition-all group flex flex-col justify-between min-h-[110px]"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-3 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                    Practice an interview question with me
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Temporal Benchmark 1: CRM pricing delta since Monday
                  </div>
                </div>
              </button>

              {/* Card 2: Top Right */}
              <button
                onClick={() =>
                  onSelectSuggestion(
                    "What did I ask you on 3 November? Is your answer still correct today?"
                  )
                }
                className="text-left bg-white/85 hover:bg-white active:scale-[0.99] backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80 hover:border-blue-300 transition-all group flex flex-col justify-between min-h-[110px]"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition-transform">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                    What drill should I try next?
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Temporal Benchmark 2: 3 Nov model pricing validity
                  </div>
                </div>
              </button>

              {/* Card 3: Bottom Left */}
              <button
                onClick={() =>
                  onSelectSuggestion(
                    "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"
                  )
                }
                className="text-left bg-white/85 hover:bg-white active:scale-[0.99] backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80 hover:border-blue-300 transition-all group flex flex-col justify-between min-h-[110px]"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                    Tips for sounding more confident
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Temporal Benchmark 3: Postgres hosting delta since last Tuesday
                  </div>
                </div>
              </button>

              {/* Card 4: Bottom Right */}
              <button
                onClick={() =>
                  onSelectSuggestion(
                    "Compare Supabase vs Neon vs AWS RDS pricing and features for 50GB storage"
                  )
                }
                className="text-left bg-white/85 hover:bg-white active:scale-[0.99] backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80 hover:border-blue-300 transition-all group flex flex-col justify-between min-h-[110px]"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-3 group-hover:scale-105 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                    How is my progress looking?
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Multi-entity comparative web research & matrix synthesis
                  </div>
                </div>
              </button>
            </div>

            {/* Intro text */}
            <p className="text-[11px] text-slate-500 text-center max-w-sm mx-auto mt-6 leading-relaxed font-normal">
              I am Echo, your AI research and temporal comparison assistant. Live web search and zero-hallucination verification are active.
            </p>
          </div>
        ) : null}

        {/* Message Stream */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-2xl rounded-br-xs px-4 py-3 max-w-[85%] sm:max-w-[75%] shadow-xs"
                  : "bg-white/95 backdrop-blur-md text-slate-800 rounded-2xl rounded-bl-xs p-4 sm:p-5 w-full shadow-xs border border-slate-200/80"
              }`}
            >
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <>
                  {msg.comparison && (
                    <ComparisonMatrix
                      comparison={msg.comparison}
                      onSourceClick={() => onCitationClick(1)}
                    />
                  )}
                  <MarkdownView
                    content={msg.content}
                    onCitationClick={onCitationClick}
                  />
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-600 text-[11px] uppercase tracking-wider mr-1">
                        Sources:
                      </span>
                      {msg.sources.map((s: Source, idx: number) => (
                        <button
                          key={s.id || idx}
                          onClick={() => onCitationClick(idx + 1)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors"
                        >
                          <span className="font-mono font-medium">[{idx + 1}]</span>
                          <span className="truncate max-w-[120px]">{s.domain}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Loading / Streaming State */}
        {isLoading && (
          <div className="flex flex-col items-start w-full">
            <div className="bg-white/95 backdrop-blur-md text-slate-800 rounded-2xl rounded-bl-xs p-4 sm:p-5 w-full shadow-xs border border-slate-200/80 space-y-3">
              {activeStatusMessage && (
                <div className="inline-flex items-center gap-2 text-xs text-blue-700 bg-blue-50/90 px-3 py-1.5 rounded-lg border border-blue-200/60 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>{activeStatusMessage}</span>
                </div>
              )}

              {streamingMessageText ? (
                <MarkdownView
                  content={streamingMessageText}
                  onCitationClick={onCitationClick}
                />
              ) : (
                <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>Synthesizing verified research response...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
