"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, Loader2 } from "lucide-react";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onSelectSuggestion?: (text: string) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  isLoading,
  onSelectSuggestion,
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-900 bg-slate-950/90 backdrop-blur-md p-4 shrink-0">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="relative rounded-2xl border border-slate-800 bg-slate-900/70 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all p-2"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Minimi (e.g. 'Has any of the five CRM tools changed pricing since Monday?')..."
            disabled={isLoading}
            className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-44 disabled:opacity-50"
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-800/40">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Autonomous Research & Temporal Comparison</span>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-md shadow-indigo-600/20"
              title="Send Request"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ArrowUp className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Verified citations & no fabricated baselines</span>
        </div>
      </div>
    </div>
  );
};

