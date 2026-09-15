import { ToolCallInfo } from "@/types/chat";

export interface StreamChatOptions {
  message: string;
  sessionId?: string | null;
  apiUrl?: string;
  signal?: AbortSignal;
  onToken: (token: string) => void;
  onSessionId?: (sessionId: string) => void;
  onToolCall?: (tool: ToolCallInfo) => void;
}

// Sends user message to the backend and streams the response
export async function streamAgentChat({
  message,
  sessionId = null,
  apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL!,
  signal,
  onToken,
  onSessionId,
  onToolCall,
}: StreamChatOptions): Promise<string> {
  // Step 1: Make HTTP request expecting a stream
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Server returned status: ${response.status}`);
  }

  // Step 2: Initialize stream reader and text decoder
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let accumulatedResponse = "";
  let buffer = "";
  let currentEvent = "message";

  try {
    // Step 3: Read stream chunks continuously until done
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep any incomplete line in buffer

      // Step 4: Parse SSE lines (event: ... and data: ...)
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;

        if (trimmed.startsWith("event:")) {
          currentEvent = trimmed.replace("event:", "").trim();
        } else if (trimmed.startsWith("data:")) {
          const rawData = trimmed.replace("data:", "").trim();
          if (rawData === "[DONE]" || currentEvent === "done") continue;

          try {
            const data = JSON.parse(rawData);

            // Check for done signal
            if (data.type === "done") continue;

            // Handle tool calling
            if (data.type === "tool_call") {
              onToolCall?.({
                name: data.name || "tool",
                args: data.args || data.arguments,
                state: "running",
              });
            } else if (data.type === "tool_result") {
              onToolCall?.({
                name: data.name || "tool",
                args: data.args || data.result,
                state: "done",
              });
            }

            // Handle session ID from backend
            if ((currentEvent === "session" || data.type === "session") && data.session_id) {
              onSessionId?.(data.session_id);
            }

            // Handle real-time text token (backend sends {"type": "delta", "text": "..."})
            const token = data.text ?? data.content;
            if (token !== undefined) {
              accumulatedResponse += token;
              onToken(token);
            }
          } catch {
            // Fallback for raw text streaming
            accumulatedResponse += rawData;
            onToken(rawData);
          }
        }
      }
    }

    console.log("Response:", accumulatedResponse);
    return accumulatedResponse;
  } finally {
    reader.releaseLock();
  }
}
