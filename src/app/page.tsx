"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Conversation, Message, Source, HistoricalComparison } from "@/types";
import { Header } from "@/components/Header";
import { ChatArea } from "@/components/ChatArea";
import { InputArea } from "@/components/InputArea";
import { Sidebar } from "@/components/Sidebar";
import { SourceDrawer } from "@/components/SourceDrawer";
import { SettingsModal } from "@/components/SettingsModal";
import { Maximize2, Minimize2 } from "lucide-react";

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
  const [isFullWidth, setIsFullWidth] = useState(false);

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

  return (
    <div className="min-h-screen w-full bg-slate-200/80 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden relative">
      {/* Desktop expand/collapse toggle pill */}
      <button
        onClick={() => setIsFullWidth(!isFullWidth)}
        className="hidden md:flex items-center gap-1.5 fixed top-4 right-4 z-40 bg-white/80 hover:bg-white text-slate-700 px-3 py-1.5 rounded-full shadow-xs text-xs font-medium border border-slate-200 transition-all"
        title="Toggle view mode"
      >
        {isFullWidth ? (
          <>
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Mobile Mockup</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand Full</span>
          </>
        )}
      </button>

      {/* Main Viewport Container */}
      <div
        className={`w-full h-full transition-all duration-300 relative overflow-hidden flex flex-col ${
          isFullWidth
            ? "max-w-4xl h-[94vh] rounded-3xl shadow-2xl border border-slate-300 bg-white"
            : "max-w-[400px] h-[100dvh] sm:h-[844px] sm:rounded-[48px] sm:border-[10px] sm:border-black sm:shadow-[0_25px_70px_rgba(0,0,0,0.3)] bg-white"
        }`}
      >
        {/* Sky gradient background canvas */}
        <div className="sky-gradient-bg absolute inset-0 z-0 pointer-events-none" />

        {/* Top Header & Status Bar */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onResetChat={handleNewChat}
          onOpenHistory={() => setIsHistoryOpen(true)}
          sourceCount={currentSources.length}
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
        />

        {/* Bottom Floating Pill Input */}
        <InputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

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
