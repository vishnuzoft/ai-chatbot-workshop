"use client";

import React from "react";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  onClearChat: () => void;
  sessionId?: string | null;
  messageCount: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onToggleSidebar,
  onClearChat,
  messageCount,
}) => {
  return (
    <header className="h-14 border-b border-zinc-200 bg-white px-4 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-700 transition"
          title="Toggle Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-zinc-900">
            AI Assistant
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Clear Conversation */}
        {messageCount > 0 && (
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-red-500 transition"
            title="Clear conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
};
