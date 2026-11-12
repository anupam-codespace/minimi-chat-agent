"use client";

import React, { useState } from "react";
import { Mic, ArrowUp, Loader2 } from "lucide-react";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onOpenSettings?: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  isLoading,
  onOpenSettings,
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

  return (
    <div className="px-5 pb-5 pt-2 z-20 shrink-0">
      <div className="max-w-md mx-auto">
        {/* Floating Rounded Pill Input */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/90 pl-5 pr-1.5 py-1.5 flex items-center justify-between transition-all focus-within:shadow-[0_8px_35px_rgb(37,99,235,0.15)] focus-within:border-blue-400"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none pr-3"
          />

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
        </form>

        {/* Footer Subtext */}
        <div className="text-center mt-2.5">
          <span className="text-[11px] text-slate-500">
            Experiencing issues?{" "}
            <button
              onClick={onOpenSettings}
              className="text-blue-600 underline font-medium hover:text-blue-700"
            >
              Try it on web
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};
