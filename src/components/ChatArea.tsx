"use client";

import React, { useEffect, useRef } from "react";
import { Message, Source } from "@/types";
import { MarkdownView } from "./MarkdownView";
import { ComparisonMatrix } from "./ComparisonMatrix";
import { Sparkles, Bot, User, Compass, Loader2 } from "lucide-react";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  activeStatusMessage?: string;
  streamingMessageText?: string;
  onSelectSuggestion: (text: string) => void;
  onCitationClick: (sourceNumber: number) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  activeStatusMessage,
  streamingMessageText,
  onSelectSuggestion,
  onCitationClick,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessageText, activeStatusMessage]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.length === 0 && !isLoading ? (
          <div className="py-8 text-center space-y-6">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/80 shadow-xl shadow-indigo-950/50">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-doto font-bold text-white tracking-wide">
                Minimi Production AI Web Research Agent
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Autonomous research agent engineered with multi-provider live search, persistent
                conversation memory, and temporal comparison engines. Never fabricates facts or citations.
              </p>
            </div>

            {/* Test Challenge Benchmark Grid */}
            <div className="text-left bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-3">
                <Compass className="w-4 h-4 text-indigo-400" />
                Hiring Challenge Evaluation Scenarios (Click to test):
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() =>
                    onSelectSuggestion(
                      "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"
                    )
                  }
                  className="text-left p-3 rounded-lg border border-slate-800/80 bg-slate-950/70 hover:border-indigo-600/60 hover:bg-slate-900 transition-all text-xs"
                >
                  <span className="font-semibold text-indigo-300 block mb-1">
                    TEST 1: CRM Shortlist Since Monday
                  </span>
                  <span className="text-slate-400">
                    &ldquo;On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?&rdquo;
                  </span>
                </button>

                <button
                  onClick={() =>
                    onSelectSuggestion(
                      "What did I ask you on 3 November? Is your answer still correct today?"
                    )
                  }
                  className="text-left p-3 rounded-lg border border-slate-800/80 bg-slate-950/70 hover:border-indigo-600/60 hover:bg-slate-900 transition-all text-xs"
                >
                  <span className="font-semibold text-indigo-300 block mb-1">
                    TEST 2: 3 November Query & Current Validity
                  </span>
                  <span className="text-slate-400">
                    &ldquo;What did I ask you on 3 November? Is your answer still correct today?&rdquo;
                  </span>
                </button>

                <button
                  onClick={() =>
                    onSelectSuggestion(
                      "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"
                    )
                  }
                  className="text-left p-3 rounded-lg border border-slate-800/80 bg-slate-950/70 hover:border-indigo-600/60 hover:bg-slate-900 transition-all text-xs"
                >
                  <span className="font-semibold text-indigo-300 block mb-1">
                    TEST 3: Postgres Hosting Last Tuesday
                  </span>
                  <span className="text-slate-400">
                    &ldquo;Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?&rdquo;
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Messages List */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm shadow-md"
                  : "bg-slate-900/80 border border-slate-800 text-slate-100 rounded-bl-sm shadow-lg"
              }`}
            >
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mr-1">
                        Verified Sources:
                      </span>
                      {msg.sources.map((s: Source, idx: number) => (
                        <button
                          key={s.id || idx}
                          onClick={() => onCitationClick(idx + 1)}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/80 text-indigo-300 hover:bg-slate-700 transition-colors"
                        >
                          [{idx + 1}] {s.domain}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {/* Live Streaming State */}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>

            <div className="max-w-[85%] rounded-2xl rounded-bl-sm p-4 text-sm bg-slate-900/80 border border-slate-800 text-slate-100 space-y-3 shadow-lg">
              {activeStatusMessage && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/40">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="font-mono">{activeStatusMessage}</span>
                </div>
              )}

              {streamingMessageText ? (
                <MarkdownView
                  content={streamingMessageText}
                  onCitationClick={onCitationClick}
                />
              ) : (
                <div className="flex items-center gap-1.5 text-slate-500 text-xs py-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>Synthesizing verified research...</span>
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

