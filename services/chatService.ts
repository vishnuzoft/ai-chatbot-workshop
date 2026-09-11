export interface StreamChatOptions {
  message: string;
  sessionId?: string | null;
  apiUrl?: string;
  signal?: AbortSignal;
  onToken: (token: string) => void;
  onSessionId?: (sessionId: string) => void;
}

// Sends user message to the backend and streams the response
export async function streamAgentChat({
  message,
  sessionId = null,
  apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL!,
  signal,
  onToken,
  onSessionId,
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

            // Handle session ID from backend
            if (currentEvent === "session" && data.session_id) {
              onSessionId?.(data.session_id);
            }

            // Handle real-time text token
            if (currentEvent === "delta" && data.content) {
              accumulatedResponse += data.content;
              onToken(data.content);
            }
          } catch {
            // Fallback for raw text streaming
            if (currentEvent === "delta") {
              accumulatedResponse += rawData;
              onToken(rawData);
            }
          }
        }
      }
    }

    return accumulatedResponse;
  } finally {
    reader.releaseLock();
  }
}
