"use client";

import React, { useState } from "react";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
  onRetry?: (messageText: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render text with basic line breaks and code block formatting
  const renderFormattedContent = (content: string) => {
    if (!content && message.isStreaming) {
      return (
        <div className="py-1 flex items-center">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-900 animate-pulse" />
        </div>
      );
    }

    // Split code blocks (```code```)
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          value: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: "code",
        value: match[1],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        value: content.substring(lastIndex),
      });
    }

    return (
      <div className="space-y-2 leading-relaxed break-words text-sm md:text-[15px]">
        {parts.map((part, index) => {
          const isLastPart = index === parts.length - 1;

          if (part.type === "code") {
            const firstLineBreak = part.value.indexOf("\n");
            let language = "";
            let code = part.value;
            if (firstLineBreak !== -1) {
              const possibleLang = part.value.substring(0, firstLineBreak).trim();
              if (possibleLang && !possibleLang.includes(" ")) {
                language = possibleLang;
                code = part.value.substring(firstLineBreak + 1);
              }
            }
            return (
              <div
                key={index}
                className="my-3 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 font-mono text-xs"
              >
                {language && (
                  <div className="bg-zinc-800/80 px-3 py-1.5 text-zinc-400 text-[11px] border-b border-zinc-700 flex justify-between items-center">
                    <span>{language}</span>
                  </div>
                )}
                <pre className="p-3.5 overflow-x-auto text-zinc-200">
                  <code>{code.trim()}</code>
                </pre>
              </div>
            );
          }

          return (
            <div key={index} className="whitespace-pre-wrap">
              {part.value}
              {isLastPart && message.isStreaming && (
                <span className="inline-block w-2 h-2 rounded-full bg-zinc-900 ml-1.5 align-middle animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`w-full py-5 px-4 md:px-6 transition-colors ${
        isUser
          ? "bg-white"
          : "bg-[#f9f9f9] border-y border-zinc-100"
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 items-start group">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs ${
            isUser
              ? "bg-zinc-900 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {isUser ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-900">
                {isUser ? "You" : "AI Assistant"}
              </span>
              <span className="text-[11px] text-zinc-400">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Actions for Assistant */}
            {!isUser && !message.isStreaming && message.content && (
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-200 text-zinc-500 transition text-xs flex items-center gap-1"
                title="Copy response"
              >
                {copied ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Content Body */}
          <div className="text-zinc-900 leading-relaxed">
            {renderFormattedContent(message.content)}
          </div>

          {/* Error notice */}
          {message.error && (
            <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center justify-between">
              <span>Failed to receive full stream from backend.</span>
              {onRetry && (
                <button
                  onClick={() => onRetry(message.content)}
                  className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 font-medium transition"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
