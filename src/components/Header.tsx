"use client";

import React from "react";
import { MessageSquare, Mic, Clock, X, Wifi, Battery } from "lucide-react";

interface HeaderProps {
  activeTab: "chat" | "voice";
  onTabChange: (tab: "chat" | "voice") => void;
  onResetChat: () => void;
  onOpenHistory: () => void;
  onOpenSources?: () => void;
  sourceCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onResetChat,
  onOpenHistory,
}) => {
  return (
    <header className="pt-2.5 pb-2 px-5 z-20 shrink-0 select-none">
      {/* iOS Status Bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-2 px-1">
        <span className="font-doto tracking-tight text-[13px]">9:41</span>

        {/* Dynamic Island Capsule */}
        <div className="w-24 h-5 bg-black rounded-full shadow-inner flex items-center justify-end pr-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
        </div>

        {/* Signal, WiFi, Battery */}
        <div className="flex items-center gap-1.5 text-slate-800 text-[11px]">
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-1 bg-slate-800 rounded-sm" />
            <span className="w-0.5 h-1.5 bg-slate-800 rounded-sm" />
            <span className="w-0.5 h-2 bg-slate-800 rounded-sm" />
            <span className="w-0.5 h-2.5 bg-slate-800 rounded-sm" />
          </div>
          <Wifi className="w-3.5 h-3.5" />
          <div className="flex items-center">
            <div className="w-4 h-2.5 border border-slate-800 rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-800 rounded-2xs" />
            </div>
            <div className="w-0.5 h-1 bg-slate-800 rounded-r-xs" />
          </div>
        </div>
      </div>

      {/* Main Top Navigation Row */}
      <div className="flex items-center justify-between pt-1">
        {/* Left: Close / Reset Button */}
        <button
          onClick={onResetChat}
          className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-xs border border-white/60 transition-all active:scale-95"
          title="New Chat / Reset"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Center: Segmented Switch Pill (Chat / Voice) */}
        <div className="flex items-center bg-slate-200/50 backdrop-blur-sm p-0.5 rounded-full border border-slate-300/40 shadow-2xs">
          <button
            onClick={() => onTabChange("chat")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeTab === "chat"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => onTabChange("voice")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeTab === "voice"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice</span>
          </button>
        </div>

        {/* Right: History Clock Button */}
        <button
          onClick={onOpenHistory}
          className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-xs border border-white/60 transition-all active:scale-95"
          title="Conversation History"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
