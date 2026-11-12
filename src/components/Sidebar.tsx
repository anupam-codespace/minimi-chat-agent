"use client";

import React from "react";
import { Conversation } from "@/types";
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Sparkles,
  Compass,
  Calendar,
  X,
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
  // Group conversations chronologically
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
        className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
          isActive
            ? "bg-indigo-950/80 text-white font-medium border border-indigo-800/80"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
          <span className="truncate">{c.title}</span>
        </div>
        <button
          onClick={(e) => onDeleteConversation(c.id, e)}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-all"
          title="Delete Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-900 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-doto text-base text-white tracking-wider">Minimi</span>
                <span className="font-doto px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 tracking-wider">
                  PROD
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">AI Web Research Agent</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-500 hover:text-white lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Research Session
          </button>
        </div>

        {/* Test Benchmark Scenarios */}
        <div className="px-3 py-2 border-b border-slate-900">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
            <Compass className="w-3 h-3 text-indigo-400" />
            Evaluation Benchmarks
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectBenchmark(
                  "On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"
                );
                onCloseMobile();
              }}
              className="w-full text-left p-1.5 rounded text-[11px] text-slate-300 hover:bg-slate-900 hover:text-white transition-colors truncate block"
              title="Test 1: CRM Shortlist Since Monday"
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
              className="w-full text-left p-1.5 rounded text-[11px] text-slate-300 hover:bg-slate-900 hover:text-white transition-colors truncate block"
              title="Test 2: 3 November AI Models"
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
              className="w-full text-left p-1.5 rounded text-[11px] text-slate-300 hover:bg-slate-900 hover:text-white transition-colors truncate block"
              title="Test 3: Postgres Hosting Last Tuesday"
            >
              3. Postgres Hosting Last Tuesday
            </button>
          </div>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-xs">
              No conversations yet.
            </div>
          ) : (
            <>
              {todayConvs.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> Today
                  </div>
                  <div className="space-y-0.5">{todayConvs.map(renderConvItem)}</div>
                </div>
              )}

              {weekConvs.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> Previous 7 Days
                  </div>
                  <div className="space-y-0.5">{weekConvs.map(renderConvItem)}</div>
                </div>
              )}

              {olderConvs.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> Older
                  </div>
                  <div className="space-y-0.5">{olderConvs.map(renderConvItem)}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
              RD
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200">Director</span>
              <span className="text-[10px] text-slate-500">Research Workspace</span>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            title="Agent Architecture & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

