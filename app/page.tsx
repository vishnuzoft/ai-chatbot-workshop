"use client";

import React, { useState, useEffect, useRef } from "react";
import { Message, ChatSession } from "@/types/chat";
import { streamAgentChat } from "@/services/chatService";
import { Sidebar } from "@/components/Sidebar";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";

const STORAGE_KEY = "workshop_ai_chat_sessions";
const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || "/api/chat";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isAutoScrollEnabled = useRef<boolean>(true);

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

  // Auto-scroll to bottom of messages (instant during streaming, smooth on user action)
  const scrollToBottom = (smooth = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Detect when user manually scrolls up to read earlier history
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    isAutoScrollEnabled.current = isNearBottom;
  };

  useEffect(() => {
    if (isAutoScrollEnabled.current) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
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

    // 1. Prepare User Message
    const userMsg: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend,
      createdAt: Date.now(),
    };

    // 2. Prepare Assistant Placeholder Message for streaming
    const assistantMsgId = "msg-" + (Date.now() + 1);
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      isStreaming: true,
    };

    // Derive chat title if this is the first user message
    const isFirstMessage = messages.length === 0;
    const chatTitle = isFirstMessage
      ? textToSend.length > 30
        ? textToSend.substring(0, 30) + "..."
        : textToSend
      : currentSession.title;

    // Update session with new user and empty streaming assistant message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        return {
          ...s,
          title: chatTitle,
          messages: [...s.messages, userMsg, assistantMsg],
          updatedAt: Date.now(),
        };
      })
    );

    setIsLoading(true);
    isAutoScrollEnabled.current = true;
    requestAnimationFrame(() => scrollToBottom(true));
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 3. Call streaming service
      await streamAgentChat({
        message: textToSend,
        sessionId: currentSession?.backendSessionId || null,
        apiUrl: API_URL,
        signal: abortController.signal,

        // Token callback: append chunk to active assistant message
        onToken: (chunk: string) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== currentSessionId) return s;
              return {
                ...s,
                messages: s.messages.map((m) => {
                  if (m.id === assistantMsgId) {
                    return { ...m, content: m.content + chunk };
                  }
                  return m;
                }),
              };
            })
          );
        },

        // Session callback: retain session_id across turns
        onSessionId: (newSid: string) => {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId ? { ...s, backendSessionId: newSid } : s
            )
          );
        },

        // Tool calling callback: display live tool calling indicator
        onToolCall: (toolCall) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== currentSessionId) return s;
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, toolCall } : m
                ),
              };
            })
          );
        },
      });

      // Stream completed successfully
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, isStreaming: false } : m
            ),
          };
        })
      );
    } catch (error: any) {
      if (error.name === "AbortError") {
        // User stopped generation
      } else {
        console.error("Chat stream failed:", error);
        // Mark message as error
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                    ...m,
                    isStreaming: false,
                    error: true,
                    content:
                      m.content ||
                      `Error connecting to backend (${API_URL}): ${error.message || "Failed to fetch stream"}`,
                  }
                  : m
              ),
            };
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
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
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto flex flex-col scrollbar-thin"
        >
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
