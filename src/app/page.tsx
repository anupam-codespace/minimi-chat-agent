"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Conversation, Message, Source, HistoricalComparison } from "@/types";
import { Header } from "@/components/Header";
import { ChatArea } from "@/components/ChatArea";
import { InputArea } from "@/components/InputArea";
import { Sidebar } from "@/components/Sidebar";
import { SourceDrawer } from "@/components/SourceDrawer";
import { SettingsModal } from "@/components/SettingsModal";
import { Monitor, Smartphone } from "lucide-react";

export default function MinimiApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatusMessage, setActiveStatusMessage] = useState<string | undefined>();
  const [streamingText, setStreamingText] = useState("");
  const [currentSources, setCurrentSources] = useState<Source[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "voice">("chat");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState(false);
  const [highlightedSourceIndex, setHighlightedSourceIndex] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load active conversation
  const loadConversationDetails = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);

        const allSources: Source[] = [];
        const seenUrls = new Set<string>();
        for (const m of data.messages || []) {
          if (m.sources) {
            for (const s of m.sources) {
              if (!seenUrls.has(s.url)) {
                seenUrls.add(s.url);
                allSources.push(s);
              }
            }
          }
        }
        setCurrentSources(allSources);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadConversationDetails(activeConversationId);
    } else {
      setMessages([]);
      setCurrentSources([]);
    }
  }, [activeConversationId, loadConversationDetails]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setCurrentSources([]);
    setStreamingText("");
    setActiveStatusMessage(undefined);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (activeConversationId === id) {
          handleNewChat();
        }
        loadConversations();
      }
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    setActiveStatusMessage("Contacting Minimi research orchestrator...");
    setStreamingText("");

    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      conversationId: activeConversationId || "temp",
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          message: text,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process chat message");
      }

      if (!res.body) throw new Error("No response body from server");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";
      let tempComparison: HistoricalComparison | undefined;
      let finalMessage: Message | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));

            if (event.type === "init") {
              if (!activeConversationId) {
                setActiveConversationId(event.conversationId);
                loadConversations();
              }
            } else if (event.type === "status") {
              setActiveStatusMessage(event.statusMessage);
            } else if (event.type === "sources") {
              if (event.sources) {
                setCurrentSources((prev) => {
                  const combined = [...prev, ...event.sources];
                  return combined.filter(
                    (v, i, a) => a.findIndex((t) => t.url === v.url) === i
                  );
                });
              }
            } else if (event.type === "comparison") {
              tempComparison = event.comparison;
            } else if (event.type === "token") {
              accumulatedText += event.token;
              setStreamingText(accumulatedText);
            } else if (event.type === "done") {
              finalMessage = event.message;
            } else if (event.type === "error") {
              accumulatedText += `\n\n**Error:** ${event.errorMessage}`;
              setStreamingText(accumulatedText);
            }
          } catch {
            // ignore non-json keepalive lines
          }
        }
      }

      if (finalMessage) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...filtered,
            tempUserMsg,
            {
              ...finalMessage!,
              comparison: finalMessage!.comparison || tempComparison,
            },
          ];
        });
      }

      loadConversations();
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          conversationId: activeConversationId || "temp",
          role: "assistant",
          content: `**Request Failed:** ${errMessage}.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setActiveStatusMessage(undefined);
      setStreamingText("");
    }
  };

  const handleCitationClick = (index: number) => {
    setIsSourceDrawerOpen(true);
    setHighlightedSourceIndex(index);
    setTimeout(() => {
      const el = document.getElementById(`source-card-${index}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "desktop" ? "mobile" : "desktop"));
  };

  return (
    <div className="min-h-screen w-full bg-slate-200/90 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden relative">
      {/* Floating Top Viewport Switcher */}
      <div className="hidden md:flex items-center gap-1.5 fixed top-4 right-4 z-40 bg-white/90 backdrop-blur-md text-slate-700 px-3 py-1.5 rounded-full shadow-md text-xs font-medium border border-slate-200/80 transition-all">
        <span className="text-[11px] text-slate-400 font-mono mr-1">Preview:</span>
        <button
          onClick={() => setViewMode("desktop")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            viewMode === "desktop"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Desktop Studio</span>
        </button>
        <button
          onClick={() => setViewMode("mobile")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            viewMode === "mobile"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Mockup</span>
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full h-full transition-all duration-300 relative overflow-hidden flex flex-col ${
          viewMode === "desktop"
            ? "max-w-5xl h-[94vh] rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.18)] border border-slate-300/80 bg-white"
            : "max-w-[400px] h-[100dvh] sm:h-[844px] sm:rounded-[48px] sm:border-[10px] sm:border-slate-950 sm:shadow-[0_25px_80px_rgba(0,0,0,0.38)] bg-white"
        }`}
      >
        {/* Pastel sky gradient background canvas matching screenshot */}
        <div className="sky-gradient-bg absolute inset-0 z-0 pointer-events-none" />

        {/* Top Header & Status Bar */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onResetChat={handleNewChat}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSources={() => setIsSourceDrawerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          sourceCount={currentSources.length}
          viewMode={viewMode}
          onToggleViewMode={toggleViewMode}
        />

        {/* Chat / Hero Area */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          activeStatusMessage={activeStatusMessage}
          streamingMessageText={streamingText}
          onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
          onCitationClick={handleCitationClick}
          activeTab={activeTab}
          viewMode={viewMode}
        />

        {/* Bottom Floating Pill Input */}
        <InputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenSettings={() => setIsSettingsOpen(true)}
          viewMode={viewMode}
        />

        {/* iOS Home Indicator Bar (Only in mobile mode) */}
        {viewMode === "mobile" && (
          <div className="w-full flex justify-center pb-2 z-20 shrink-0 select-none">
            <div className="w-32 h-1 bg-slate-900/35 rounded-full" />
          </div>
        )}

        {/* History Drawer */}
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onSelectBenchmark={(prompt) => {
            handleNewChat();
            handleSendMessage(prompt);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isOpenMobile={isHistoryOpen}
          onCloseMobile={() => setIsHistoryOpen(false)}
        />

        {/* Sources Drawer */}
        <SourceDrawer
          isOpen={isSourceDrawerOpen}
          onClose={() => setIsSourceDrawerOpen(false)}
          sources={currentSources}
          highlightedIndex={highlightedSourceIndex}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onRefreshData={() => {
            loadConversations();
            if (activeConversationId) loadConversationDetails(activeConversationId);
          }}
        />
      </div>
    </div>
  );
}
