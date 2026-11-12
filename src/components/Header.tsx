"use client";

import React from "react";
import {
  MessageSquare,
  Mic,
  Clock,
  X,
  Wifi,
  Sparkles,
  Smartphone,
  Monitor,
  ShieldCheck,
  Settings,
} from "lucide-react";

interface HeaderProps {
  activeTab: "chat" | "voice";
  onTabChange: (tab: "chat" | "voice") => void;
  onResetChat: () => void;
  onOpenHistory: () => void;
  onOpenSources?: () => void;
  onOpenSettings?: () => void;
  sourceCount?: number;
  viewMode: "desktop" | "mobile";
  onToggleViewMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onResetChat,
  onOpenHistory,
  onOpenSources,
  onOpenSettings,
  sourceCount = 0,
  viewMode,
  onToggleViewMode,
}) => {
  return (
    <header className="pt-2 pb-2 px-5 z-20 shrink-0 select-none">
      {/* iOS Status Bar (Only in Mobile Preview Mode) */}
      {viewMode === "mobile" && (
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
      )}

      {/* Main Navigation Row */}
      <div className="flex items-center justify-between pt-1">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {viewMode === "desktop" ? (
            <div className="flex items-center gap-2 mr-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-doto font-bold text-sm text-slate-900 tracking-wider">
                Minimi
              </span>
              <span className="font-doto px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                PROD
              </span>
              <button
                onClick={onResetChat}
                className="ml-2 w-7 h-7 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-xs border border-white/60 transition-all active:scale-95"
                title="New Chat / Reset"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onResetChat}
              className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-xs border border-white/60 transition-all active:scale-95"
              title="New Chat / Reset"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

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

        {/* Right Section */}
        <div className="flex items-center gap-1.5">
          {/* Mode toggle (Desktop Studio vs Mobile Mockup) */}
          <button
            onClick={onToggleViewMode}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 text-[11px] font-medium border border-white/80 shadow-xs transition-all"
            title={`Switch to ${viewMode === "desktop" ? "Mobile Mockup" : "Desktop Studio"}`}
          >
            {viewMode === "desktop" ? (
              <>
                <Smartphone className="w-3 h-3 text-slate-500" />
                <span>Phone</span>
              </>
            ) : (
              <>
                <Monitor className="w-3 h-3 text-slate-500" />
                <span>Desktop</span>
              </>
            )}
          </button>

          {/* Sources button (shows on desktop) */}
          {viewMode === "desktop" && onOpenSources && (
            <button
              onClick={onOpenSources}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 text-[11px] font-medium border border-white/80 shadow-xs transition-all"
              title="Inspect Sources & Evidence"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Sources ({sourceCount})</span>
            </button>
          )}

          {/* History Clock Button */}
          <button
            onClick={onOpenHistory}
            className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-xs border border-white/60 transition-all active:scale-95"
            title="Conversation History & Benchmarks"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Settings button on desktop */}
          {viewMode === "desktop" && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-xs border border-white/60 transition-all active:scale-95"
              title="Settings & Telemetry"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
