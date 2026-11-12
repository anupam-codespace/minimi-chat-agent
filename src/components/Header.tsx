"use client";

import React from "react";
import {
  MessageSquare,
  Mic,
  Plus,
  PanelLeft,
  Menu,
  ShieldCheck,
  Settings,
} from "lucide-react";

interface HeaderProps {
  activeTab: "chat" | "voice";
  onTabChange: (tab: "chat" | "voice") => void;
  onResetChat: () => void;
  onToggleSidebar: () => void;
  onOpenSources?: () => void;
  onOpenSettings?: () => void;
  sourceCount?: number;
  isDesktopSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onResetChat,
  onToggleSidebar,
  onOpenSources,
  onOpenSettings,
  sourceCount = 0,
}) => {
  return (
    <header className="h-14 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-3 sm:px-6 z-20 shrink-0 select-none flex items-center justify-between">
      {/* Left: Sidebar Toggle + Brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Toggle button: acts as menu on mobile, sidebar toggle on desktop */}
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          title="Toggle Sidebar"
        >
          <PanelLeft className="w-4 h-4 hidden md:block" />
          <Menu className="w-4 h-4 md:hidden" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-doto font-bold text-base sm:text-lg text-slate-900 tracking-wider">
            Minimi
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            PROD
          </span>
        </div>
      </div>

      {/* Center: Segmented Switch Pill (Chat / Voice) */}
      <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200 shadow-2xs">
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

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sources button */}
        {onOpenSources && (
          <button
            onClick={onOpenSources}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium border border-slate-200 hover:border-blue-200 transition-all"
            title="Inspect Sources & Evidence"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Sources</span>
            <span className="text-[11px] font-mono font-semibold text-blue-600">
              ({sourceCount})
            </span>
          </button>
        )}

        {/* New Chat Button */}
        <button
          onClick={onResetChat}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors"
          title="New Research Session"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
            title="Settings & Telemetry"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
