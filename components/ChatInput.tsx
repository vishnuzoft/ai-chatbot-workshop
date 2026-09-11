"use client";

import React, { useRef, useEffect } from "react";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isLoading,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-1">
      <div className="relative flex flex-col w-full rounded-2xl bg-zinc-50 border border-zinc-200 shadow-sm focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-300 transition">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-12 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden disabled:opacity-50 min-h-[52px] max-h-[200px]"
        />

        {/* TODO: Create and integrate your SendButton component here */}
        <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
          {/* Send button goes here */}
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-zinc-500">
        AI can make mistakes. Verify important info.
      </p>
    </div>
  );
};
