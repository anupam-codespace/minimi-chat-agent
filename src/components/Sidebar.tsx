"use client";

import React from "react";
import { Conversation } from "@/types";
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  X,
  Compass,
  Calendar,
} from "lucide-react";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onSelectBenchmark: (prompt: string) => void;
  onOpenSettings: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onSelectBenchmark,
  onOpenSettings,
  isOpenMobile,
  onCloseMobile,
}) => {
  if (!isOpenMobile) return null;

  const now = new Date().getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const todayConvs: Conversation[] = [];
  const weekConvs: Conversation[] = [];
  const olderConvs: Conversation[] = [];

  for (const c of conversations) {
    const diff = now - new Date(c.updatedAt).getTime();
    if (diff < oneDay) {
      todayConvs.push(c);
    } else if (diff < sevenDays) {
      weekConvs.push(c);
    } else {
      olderConvs.push(c);
    }
  }

  const renderConvItem = (c: Conversation) => {
    const isActive = c.id === activeConversationId;
    return (
      <div
        key={c.id}
        onClick={() => {
          onSelectConversation(c.id);
          onCloseMobile();
        }}
        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
          isActive
            ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
          <span className="truncate">{c.title}</span>
        </div>
        <button
          onClick={(e) => onDeleteConversation(c.id, e)}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all"
          title="Delete Conversation"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onCloseMobile}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-doto font-bold text-sm text-slate-900 tracking-wide">
              Conversation History
            </h3>
          </div>
          <button
            onClick={onCloseMobile}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            New Research Session
          </button>
        </div>

        {/* Hiring Challenge Benchmarks */}
        <div className="px-3 py-2 border-b border-slate-100">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            <Compass className="w-3 h-3 text-blue-500" />
            Benchmark Scenarios
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectBenchmark(
                  "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"
                );
                onCloseMobile();
              }}
              className="w-full text-left p-1.5 rounded-lg text-[11px] text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors truncate block"
            >
              1. CRM Shortlist Since Monday
            </button>
            <button
              onClick={() => {
                onSelectBenchmark(
                  "What did I ask you on 3 November? Is your answer still correct today?"
                );
                onCloseMobile();
              }}
              className="w-full text-left p-1.5 rounded-lg text-[11px] text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors truncate block"
            >
              2. 3 November Pricing Query
            </button>
            <button
              onClick={() => {
                onSelectBenchmark(
                  "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"
                );
                onCloseMobile();
              }}
              className="w-full text-left p-1.5 rounded-lg text-[11px] text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors truncate block"
            >
              3. Postgres Hosting Last Tuesday
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No conversations yet.
            </div>
          ) : (
            <>
              {todayConvs.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 mb-1 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> Today
                  </div>
                  <div className="space-y-0.5">{todayConvs.map(renderConvItem)}</div>
                </div>
              )}
              {weekConvs.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 mb-1 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> Previous 7 Days
                  </div>
                  <div className="space-y-0.5">{weekConvs.map(renderConvItem)}</div>
                </div>
              )}
              {olderConvs.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 mb-1 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> Older
                  </div>
                  <div className="space-y-0.5">{olderConvs.map(renderConvItem)}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800">Samson</span>
              <span className="text-[9px] text-slate-400">Research Workspace</span>
            </div>
          </div>
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Settings & Telemetry"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
