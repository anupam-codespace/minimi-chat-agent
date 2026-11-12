"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Conversation, Message, Source, HistoricalComparison } from "@/types";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ChatArea } from "@/components/ChatArea";
import { InputArea } from "@/components/InputArea";
import { SourceDrawer } from "@/components/SourceDrawer";
import { SettingsModal } from "@/components/SettingsModal";

export default function MinimiResearchApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatusMessage, setActiveStatusMessage] = useState<string | undefined>();
  const [streamingText, setStreamingText] = useState("");
  const [currentSources, setCurrentSources] = useState<Source[]>([]);
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState(false);
  const [highlightedSourceIndex, setHighlightedSourceIndex] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load conversations list
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

  // Load active conversation messages
  const loadConversationDetails = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);

        // Aggregate all sources from messages
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
      setActiveConversation(null);
      setMessages([]);
      setCurrentSources([]);
    }
  }, [activeConversationId, loadConversationDetails]);

  // Handle New Chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setActiveConversation(null);
    setMessages([]);
    setCurrentSources([]);
    setStreamingText("");
    setActiveStatusMessage(undefined);
  };

  // Handle Delete Conversation
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

  // Handle Send Message (Streaming SSE)
  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    setActiveStatusMessage("Contacting Minimi research orchestrator...");
    setStreamingText("");

    // Optimistically append user message
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
                  const unique = combined.filter(
                    (v, i, a) => a.findIndex((t) => t.url === v.url) === i
                  );
                  return unique;
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
          content: `**Request Failed:** ${errMessage}. Please ensure server is running and configuration is valid.`,
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100">
      {/* Sidebar */}
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
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header
          title={activeConversation?.title || "Minimi Research Agent"}
          activeIntent={messages[messages.length - 1]?.intent}
          sourceCount={currentSources.length}
          onOpenSources={() => setIsSourceDrawerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          activeStatusMessage={activeStatusMessage}
          streamingMessageText={streamingText}
          onSelectSuggestion={(prompt) => {
            handleSendMessage(prompt);
          }}
          onCitationClick={handleCitationClick}
        />

        <InputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
        />

        {/* Source & Evidence Inspector Drawer */}
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
      </main>
    </div>
  );
}

