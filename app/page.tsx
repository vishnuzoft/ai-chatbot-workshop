"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatSession } from "@/types/chat";
import { Sidebar } from "@/components/Sidebar";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";

const STORAGE_KEY = "workshop_ai_chat_sessions";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize or restore sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      }
    } catch {
      // Ignore storage parse error
    }

    // Default initial session
    const initialSession: ChatSession = {
      id: "session-" + Date.now(),
      title: "New Conversation",
      messages: [],
      backendSessionId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
  }, []);

  // Sync sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Active session object
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // Auto-scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create a new session
  const handleNewChat = () => {
    if (isLoading) handleStop();
    const newSession: ChatSession = {
      id: "session-" + Date.now(),
      title: "New Conversation",
      messages: [],
      backendSessionId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput("");
  };

  // Delete a specific session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading && id === currentSessionId) {
      handleStop();
    }
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const freshSession: ChatSession = {
        id: "session-" + Date.now(),
        title: "New Conversation",
        messages: [],
        backendSessionId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([freshSession]);
      setCurrentSessionId(freshSession.id);
    } else {
      setSessions(remaining);
      if (id === currentSessionId) {
        setCurrentSessionId(remaining[0].id);
      }
    }
  };

  // Clear messages in current session
  const handleClearChat = () => {
    if (isLoading) handleStop();
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [], title: "New Conversation", backendSessionId: null }
          : s
      )
    );
  };

  // Stop generation / cancel SSE request
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) =>
            m.isStreaming ? { ...m, isStreaming: false } : m
          ),
        };
      })
    );
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt || input).trim();
    if (!textToSend || isLoading) return;

    setInput("");

    // TODO
    // 1. Create a user Message object and append it to the current session.
    // 2. Create a placeholder assistant Message with `isStreaming: true`.
    // 3. Call `streamAgentChat()` from services/chatService.ts.
    // 4. Update the assistant message as each token arrives in `onToken()`.
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900">
      {/* Sidebar with chat history & sessions */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Chat View Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 bg-white relative">
        {/* Header */}
        <ChatHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onClearChat={handleClearChat}
          sessionId={currentSession?.backendSessionId || null}
          messageCount={messages.length}
        />

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto flex flex-col scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex-1" />
          ) : (
            <div className="flex-1 pb-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onRetry={(text) => handleSend(text)}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Floating / Fixed Bottom Input Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSend()}
          onStop={handleStop}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
