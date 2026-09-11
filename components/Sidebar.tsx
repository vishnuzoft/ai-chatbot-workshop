"use client";

import React from "react";
import { ChatSession } from "@/types/chat";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-72 bg-[#f9f9f9] text-zinc-900 border-r border-zinc-200 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${!isOpen ? "md:hidden" : "md:flex"}`}
      >
        {/* Top Header & New Chat Button */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-sm text-white shadow-xs">
                AI
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-900">AI Assistant</h1>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 md:hidden"
              title="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-sm font-medium text-zinc-900 transition shadow-2xs group"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New chat
            </span>
            <span className="text-[11px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded font-mono">⌘K</span>
          </button>
        </div>

        {/* Chat Sessions History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin">
          <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Recent Conversations
          </div>

          {sessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-zinc-400">
              No conversations yet. Start a new one!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition ${
                    isActive
                      ? "bg-zinc-200/80 text-zinc-900 font-medium shadow-2xs"
                      : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-6">
                    <svg className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-600" : "text-zinc-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="truncate">{session.title || "Untitled Chat"}</span>
                  </div>

                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                    title="Delete chat"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>


      </aside>
    </>
  );
};
