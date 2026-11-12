"use client";

import React from "react";
import { Menu, ShieldCheck, Settings } from "lucide-react";
import { IntentType } from "@/types";

interface HeaderProps {
  title: string;
  activeIntent?: IntentType;
  sourceCount: number;
  onOpenSources: () => void;
  onOpenSettings: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  activeIntent,
  sourceCount,
  onOpenSources,
  onOpenSettings,
  onToggleMobileMenu,
}) => {
  const getIntentBadge = (intent?: IntentType) => {
    if (!intent) return null;
    const labels: Record<IntentType, { text: string; bg: string; textCol: string }> = {
      temporal_comparison: {
        text: "Temporal Comparison",
        bg: "bg-indigo-950/80 border-indigo-800",
        textCol: "text-indigo-300",
      },
      current_web_research: {
        text: "Live Web Research",
        bg: "bg-emerald-950/80 border-emerald-800",
        textCol: "text-emerald-300",
      },
      historical_retrieval: {
        text: "Historical Retrieval",
        bg: "bg-sky-950/80 border-sky-800",
        textCol: "text-sky-300",
      },
      multi_entity_comparison: {
        text: "Entity Comparison",
        bg: "bg-purple-950/80 border-purple-800",
        textCol: "text-purple-300",
      },
      follow_up_research: {
        text: "Follow-up",
        bg: "bg-slate-800 border-slate-700",
        textCol: "text-slate-300",
      },
      general_conversation: {
        text: "General Assistant",
        bg: "bg-slate-800 border-slate-700",
        textCol: "text-slate-300",
      },
    };

    const config = labels[intent] || labels.general_conversation;
    return (
      <span
        className={`font-doto px-2 py-0.5 rounded-full text-[10px] font-semibold border tracking-wider ${config.bg} ${config.textCol}`}
      >
        {config.text}
      </span>
    );
  };

  return (
    <header className="h-14 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3 overflow-hidden">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 overflow-hidden">
          <h1 className="text-sm font-semibold text-slate-200 truncate">
            {title || "New Research Session"}
          </h1>
          {getIntentBadge(activeIntent)}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenSources}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors"
          title="Inspect Sources & Citations"
        >
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Sources</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-indigo-300">
            {sourceCount}
          </span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          title="Architecture & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

