"use client";

import React, { useEffect, useRef } from "react";
import { Message, Source } from "@/types";
import { MarkdownView } from "./MarkdownView";
import { ComparisonMatrix } from "./ComparisonMatrix";
import { Loader2, Mic } from "lucide-react";

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
          <div className="w-28 h-28 rounded-full bg-blue-100 animate-ping absolute inset-0 opacity-40" />
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 text-white relative z-10">
            <Mic className="w-12 h-12" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Listening...</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Ask Minimi any web research or temporal pricing comparison question.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-3">
      <div className="max-w-md mx-auto space-y-4">
        {messages.length === 0 && !isLoading ? (
          <div className="pt-3 pb-4 select-none">
            {/* Top Greeting Pill */}
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              {/* Colorful Puzzle/Gem icon from screenshot */}
              <svg
                className="w-4 h-4 text-cyan-500 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5z" />
              </svg>
              <span>Good afternoon! Samson</span>
            </div>

            {/* Bold Headline */}
            <h2 className="text-[26px] font-extrabold text-slate-900 text-center tracking-tight mb-5">
              How can I help?
            </h2>

            {/* 2x2 Grid matching screenshot */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Top Left (Pink Graduation Cap) */}
              <button
                onClick={() =>
                  onSelectSuggestion(
                    "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"
                  )
                }
                className="text-left bg-white/75 hover:bg-white/95 active:scale-[0.98] backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/80 transition-all group flex flex-col justify-between min-h-[110px]"
              >
                <div className="text-xl mb-2">🎓</div>
                <div className="text-xs font-semibold text-[#8a4235] leading-snug group-hover:text-[#6a2f24] transition-colors">
                  Practice an interview question with me
                </div>
              </button>

              {/* Card 2: Top Right (Blue Rocket) */}
              <button
                onClick={() =>
                  onSelectSuggestion(
                    "What did I ask you on 3 November? Is your answer still correct today?"
                  )
                }
                className="text-left bg-white/75 hover:bg-white/95 active:scale-[0.98] backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/80 transition-all group flex flex-col justify-between min-h-[110px]"
              >
                <div className="text-xl mb-2">🚀</div>
                <div className="text-xs font-semibold text-[#1d558a] leading-snug group-hover:text-[#133d64] transition-colors">
                  What drill should I try next?
                </div>
              </button>

              {/* Card 3: Bottom Left (Pink Grinning Face) */}
              <button
                onClick={() =>
                  onSelectSuggestion(
                    "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"
                  )
                }
                className="text-left bg-white/75 hover:bg-white/95 active:scale-[0.98] backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/80 transition-all group flex flex-col justify-between min-h-[110px]"
              >
                <div className="text-xl mb-2">😆</div>
                <div className="text-xs font-semibold text-[#244c7d] leading-snug group-hover:text-[#183457] transition-colors">
                  Tips for sounding more confident
                </div>
              </button>

              {/* Card 4: Bottom Right (Golden Spiral / Target) */}
              <button
                onClick={() =>
                  onSelectSuggestion(
                    "Compare Supabase vs Neon vs AWS RDS pricing and features for 50GB storage"
                  )
                }
                className="text-left bg-white/75 hover:bg-white/95 active:scale-[0.98] backdrop-blur-md rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/80 transition-all group flex flex-col justify-between min-h-[110px]"
              >
                <div className="text-xl mb-2">🎯</div>
                <div className="text-xs font-semibold text-[#945228] leading-snug group-hover:text-[#6e3b1c] transition-colors">
                  How&apos;s my progress looking?
                </div>
              </button>
            </div>

            {/* Intro text from screenshot */}
            <p className="text-[11px] text-slate-500 text-center max-w-[250px] mx-auto mt-6 leading-relaxed font-normal">
              I&apos;m Echo, your AI communication coach. I&apos;m in early preview. More
              capabilities coming soon
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
              className={`text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#2563eb] text-white rounded-2xl rounded-br-xs px-4 py-2.5 max-w-[85%] shadow-xs"
                  : "bg-white/90 backdrop-blur-md text-slate-800 rounded-2xl rounded-bl-xs p-4 max-w-[92%] shadow-xs border border-white/80"
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
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-600 text-[10px] uppercase mr-0.5">
                        Sources:
                      </span>
                      {msg.sources.map((s: Source, idx: number) => (
                        <button
                          key={s.id || idx}
                          onClick={() => onCitationClick(idx + 1)}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-600 border border-blue-200/60 hover:bg-blue-100 transition-colors"
                        >
                          [{idx + 1}] {s.domain}
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
          <div className="flex flex-col items-start">
            <div className="bg-white/90 backdrop-blur-md text-slate-800 rounded-2xl rounded-bl-xs p-4 max-w-[92%] shadow-xs border border-white/80 space-y-2.5">
              {activeStatusMessage && (
                <div className="flex items-center gap-2 text-[11px] text-blue-600 bg-blue-50/80 px-2.5 py-1.5 rounded-lg border border-blue-200/50">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{activeStatusMessage}</span>
                </div>
              )}

              {streamingMessageText ? (
                <MarkdownView
                  content={streamingMessageText}
                  onCitationClick={onCitationClick}
                />
              ) : (
                <div className="flex items-center gap-2 text-slate-500 text-xs py-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span>Synthesizing response...</span>
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
